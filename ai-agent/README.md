# Quiz AI Agent

AI Agent service cho Quiz Online. Bản hiện tại cung cấp một luồng chạy được từ
web UI đến FastAPI bằng SSE, có intent orchestrator và contract cho các MCP tool.

## Luồng xử lý

```text
Quiz AI widget
  -> POST /chat/stream
  -> OpenAI Responses API agent loop
  -> model tự chọn backend tool hoặc render_ui tool
  -> MCPToolWrapper / Backend API tools
  -> NestJS Backend API (PostgreSQL full-text search)
  -> SSE: intent -> status -> token -> card -> actions -> done
```

UI không hard-code nội dung theo intent. Model gọi `render_ui` để gửi một surface
gồm các block `notice`, `list`, `table`, `stats`, `form` và action. Frontend chỉ
render schema này. Các action hỗ trợ:

- `navigate`: mở trang tạo, sửa, danh sách quiz hoặc dashboard.
- `prompt`: gửi một prompt tiếp theo để agent thu thập thêm thông tin.

Các thao tác ghi/xóa không chạy ngay từ tin nhắn đầu tiên. Agent trả action để
người dùng xem và xác nhận trước, sau đó mới được phép gọi write tool.

## Chạy thực tế

Backend phải chạy trước để agent lấy dữ liệu thật từ database:

```powershell
cd server
pnpm start:dev
```

Sau đó chạy AI Agent (yêu cầu Python 3.10+):

```powershell
cd ai-agent
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item config\.env.example config\.env
python -m uvicorn services.main:app --reload --port 8000
```

Frontend:

```powershell
cd web
pnpm dev
```

Mặc định widget gọi `http://localhost:8000`. Có thể đổi bằng:

```env
NEXT_PUBLIC_AI_AGENT_URL=http://localhost:8000
```

Agent local mặc định gọi NestJS tại `http://localhost:3333`. Docker Compose
ghi đè thành `http://app:5000`. Nếu backend không chạy,
SSE sẽ trả lỗi kết nối rõ ràng thay vì dữ liệu giả.

AI Agent cần model key thật:

```env
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
LLM_API_MODE=responses
```

`responses` keeps multi-instance memory through `previous_response_id`. A provider
that lacks Responses API support but supports Chat Completions + function calling
can use `LLM_API_MODE=chat_completions`; Redis persists short-term history,
with an in-process fallback only when Redis is unavailable.
Redis now persists the bounded user/assistant history for this mode too; it
expires with the chat session and never stores auth headers or tool payloads.

Conversation state được giữ theo `user_id + session_id` bằng
`previous_response_id`. Khi cấu hình Redis, session, approval token một lần,
rate-limit và audit metadata được chia sẻ giữa instance.

Retrieval MVP dùng PostgreSQL full-text search có sẵn cho title/description và
trả citation đến quiz thật. Chưa thêm embedding hay vector database: chỉ thêm
khi full-text search không đạt metric retrieval.

Knowledge ingestion v1 lưu plain-text source, checksum, version và chunks trong
PostgreSQL. Source đi qua `DRAFT -> REVIEW -> PUBLISHED|QUARANTINED`; chỉ
`PUBLISHED + PUBLIC` mới được `search_knowledge` trả cho agent.

Verification gate giữ final answer sau internal retrieval cho đến khi citation
được tạo. Không có citation thì agent abstain thay vì kết luận từ kết quả rỗng.

Golden dataset mẫu nằm ở `evals/retrieval_golden.json`. Baseline một database
đang chạy dùng file gitignored `evals/retrieval_golden.local.json`, rồi chạy
`python scripts/evaluate_retrieval.py --fixture evals/retrieval_golden.local.json`.
Fixture dùng chung được nạp rõ ràng bằng
`cd ../server && pnpm exec ts-node scripts/seed-ai-eval.ts`, sau đó chạy
`python scripts/evaluate_retrieval.py --backend-url http://localhost:3333`.
CI chỉ dùng fixture gắn với seed ổn định; không commit slug từ database cá nhân.
Gate retrieval giữ `recall_at_k >= 0.90` trước khi thay đổi kiến trúc.

## API và SSE protocol

- `GET /`: health check.
- `GET /tools`: danh mục tool và risk level.
- `GET /ready`: readiness check; production yêu cầu model key và Redis.
- `GET /metrics`: Prometheus metrics cho chat outcome/latency và tool success/error.

Monitoring stack dùng `docker/docker-compose.monitoring.yml`. Chạy sau app
compose và đặt `GRAFANA_ADMIN_PASSWORD` trong shell hoặc secret manager; Grafana
được provision datasource/dashboard, Prometheus scrape `ai-agent:8000/metrics`.

LangGraph là orchestrator mặc định: planner → assistant → ToolNode → assistant/END.
Đặt `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` để Langfuse
trace planner, graph node, LLM call và tool call; event `done` trả `trace_id`
để tìm đúng trace.
- `POST /chat`: phản hồi JSON, hữu ích cho test.
- `POST /chat/stream`: phản hồi `text/event-stream` cho UI.

Request:

```json
{
  "message": "Tạo quiz 10 câu về Python",
  "user_id": "user-id",
  "session_id": "optional-session-id",
  "locale": "vi"
}
```

Các event được định nghĩa trong `services/protocol.py`. Event `actions` chỉ chứa
action đã được UI cho phép; client không thực thi URL hoặc JavaScript tùy ý.

## Kết nối Backend API

`MCPToolWrapper` là gateway/adapter kết nối trực tiếp với NestJS Backend API.
Backend của dự án mặc định chạy ở cổng `5000`.

```env
BACKEND_URL=http://localhost:3333
CORS_ORIGINS=http://localhost:5173
REDIS_URL=redis://localhost:6379/0
AI_RATE_LIMIT_PER_MINUTE=20
```

Khi bật live mode, bearer token từ phiên người dùng cần được forward tới NestJS
và backend vẫn phải kiểm tra quyền. Không đặt database credential có quyền ghi
trong agent process.

## Kết nối MCP server thật

Thay phần thân của `call_backend_api`, `search_quizzes` và `execute_select` bằng
MCP client transport (stdio hoặc streamable HTTP), nhưng giữ nguyên input/output
contract. Nên tách ít nhất hai MCP server:

1. `quiz-api-mcp`: wrapper các endpoint quiz/question/category của NestJS. Write
   tool yêu cầu confirmation id và user authorization.
2. `quiz-analytics-mcp`: kết nối DB bằng tài khoản read-only. Chỉ cho một câu
   `SELECT`, có allowlist bảng/cột, timeout, row limit và audit log.

Danh mục sẵn có gồm `quiz.search`, `quiz.get`, `quiz.create`, `quiz.update`,
`quiz.delete`, `question.create`, `question.update`, `category.list`,
`analytics.quiz` và `database.select`.

## Việc nên làm tiếp theo

- Đo recall/groundedness của PostgreSQL retrieval bằng golden dataset.
- Chỉ thêm embedding + vector retrieval khi metric không đạt.
- Thêm ingestion có version, review và citation metadata cho nguồn tài liệu.
- Thêm OpenTelemetry/Prometheus trước khi scale nhiều agent.

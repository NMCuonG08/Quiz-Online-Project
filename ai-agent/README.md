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
AI_ORCHESTRATION_MODE=agent_first
```

`agent_first` là live path mặc định: executor model tự trả lời hoặc chọn tool
trong một ReAct loop, không phải trả latency cho một planner call bắt buộc trước
mỗi request. Auth, scope, schema, approval, idempotency và budget vẫn do runtime
deterministic kiểm soát. Có thể rollback tức thì bằng
`AI_ORCHESTRATION_MODE=planner_legacy`.

Legacy planner vẫn được giữ trong giai đoạn migration và cho offline intent eval.
Cấu hình nhiều model/API độc lập khi dùng `planner_legacy`:

```env
AI_EXECUTOR_MODEL=gpt-5.6-terra
AI_EXECUTOR_API_KEY=...
AI_EXECUTOR_BASE_URL=https://api.openai.com/v1
AI_EXECUTOR_REASONING_EFFORT=medium

AI_PLANNER_FAST_MODEL=gpt-5.6-luna
AI_PLANNER_FAST_API_KEY=...
AI_PLANNER_FAST_BASE_URL=https://api.openai.com/v1
AI_PLANNER_FAST_REASONING_EFFORT=none

AI_PLANNER_STRONG_MODEL=gpt-5.6-sol
AI_PLANNER_STRONG_API_KEY=...
AI_PLANNER_STRONG_BASE_URL=https://api.openai.com/v1
AI_PLANNER_STRONG_REASONING_EFFORT=medium

AI_PLANNER_CONFIDENCE_THRESHOLD=0.82
AI_PLANNER_ESCALATE_WRITES=true
```

Executor failover is configured independently from the planner tiers. Each
executor attempt is bounded and the router moves to the fallback route instead
of retrying the same provider. Configure a fallback only when it supports the
same tool-calling contract:

```env
AI_EXECUTOR_FALLBACK_MODEL=gpt-4.1-mini
AI_EXECUTOR_FALLBACK_API_KEY=...
AI_EXECUTOR_FALLBACK_BASE_URL=https://api.openai.com/v1
AI_EXECUTOR_FALLBACK_PROVIDER=openai
AI_EXECUTOR_ATTEMPT_TIMEOUT_SECONDS=60
AI_EXECUTOR_FALLBACK_TIMEOUT_SECONDS=60
AI_MODEL_FAILURE_THRESHOLD=2
AI_MODEL_COOLDOWN_SECONDS=30
```

The fallback is attempted before any model-generated write can cross the
runtime approval boundary. A completed read result can be returned through a
degraded response when the final model call is unavailable.

For cross-provider failover, set `AI_EXECUTOR_FALLBACK_PROVIDER=anthropic`,
provide an explicit Claude model and `AI_EXECUTOR_FALLBACK_API_KEY`. The
Anthropic route uses the same LangChain tool-calling interface; it is not
selected automatically merely because an Anthropic key exists.

Trong `planner_legacy`, fast planner xử lý read intent rõ ràng. Request ambiguous,
multi-intent, confidence thấp, write/destructive/admin được strong planner kiểm tra lại.
Mỗi tier có thể dùng OpenAI-compatible base URL/key riêng; nếu không đặt thì
fallback về `OPENAI_MODEL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL` hiện có.

Dependencies của agent được pin để giữ compatibility giữa LangGraph và
Postgres checkpointer. Khi nâng package, chạy lại toàn bộ agent tests và
`python -m pip check` trước khi build image.

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

Khi `AGENT_CHECKPOINTER=postgres`, graph dùng Postgres checkpointer durable với
`AI_CHECKPOINT_DATABASE_URL` để có thể phục hồi state qua restart/redeploy.
Nên cấp một database user riêng chỉ có quyền trên các bảng checkpoint; không
dùng credential có quyền ghi dữ liệu quiz cho agent.

Flow `create_quiz_with_questions` dùng endpoint transaction
`POST /api/quizzes/with-questions` của NestJS. Agent tạo một `Idempotency-Key`
trong approval payload; backend lưu kết quả theo `(user_id, key)` để retry cùng
request trả lại kết quả cũ thay vì tạo quiz/câu hỏi lần hai.
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

## Harness kernel

Runtime hiện có một kernel framework-neutral tại `services/harness/`, gồm:

- typed run/context/usage contracts;
- atomic per-run budgets cho graph step, model call, tool call, token, cost và thời gian;
- typed safe errors cho budget, approval, validation, dependency và cancellation;
- explicit run lifecycle với transition validation;
- ordered event envelope có `run_id`, `event_id`, `sequence` và timestamp.

LangGraph vẫn là orchestrator duy nhất. Đường LangGraph tạo `RunContext`, chặn
model/tool call trước khi chạy, ghi usage vào event `done` và giữ nguyên các
field SSE cũ để frontend tương thích. Budget mặc định có thể điều chỉnh bằng:

```env
AGENT_MAX_MODEL_CALLS=24
AGENT_MAX_TOOL_CALLS=32
AGENT_MAX_SUBAGENT_CALLS=8
AGENT_MAX_TOTAL_TOKENS=100000
AGENT_MAX_COST_USD=5
AGENT_VERSION=quiz-agent-dev
```

Blueprint và thứ tự triển khai nằm ở:

- `docs/quiz-agent-harness-blueprint.md`;
- `docs/quiz-agent-harness-implementation-plan.md`.

Phase 2 đã migrate qua deterministic `ToolRuntime` cho `search_quizzes` và
`create_quiz_with_questions`. Runtime kiểm tra ToolSpec, scope, capability,
input/output schema, approval, idempotency, timeout và giới hạn kích thước
result trước khi trả dữ liệu cho agent. Các tool còn lại vẫn đi qua compatibility
path và sẽ được migrate từng tool trong các phase sau.

Phase 3 đã tách domain thành các capability services tại `services/capabilities/`:

- `DiscoveryCapability`: search, recommend, detail, categories;
- `LearningCapability`: start, resume, history, attempts, result;
- `AuthoringCapability`: quiz/question CRUD, publish và build status;
- `KnowledgeCapability`: search, import và review nguồn;
- `AccountCapability`: identity và permissions;
- `QuestionQualityCapability`: deterministic question validation.

Mỗi capability có descriptor riêng gồm intent, scope, tool manifest và access
mode. `agent_core.py` vẫn là compatibility facade; việc tách module không thay
đổi API hoặc backend route.

Phase 4 đã bổ sung:

- `QuestionQualityCapability.inspect_question()` và `inspect_quiz()` trả quality report theo từng path;
- duplicate question/option checks và answer-cardinality checks trước proposal/write;
- `ContextBuilder` với history/section/total limits, compaction/truncation và trust markers;
- `MemoryStore` namespace theo user/tenant, TTL, giới hạn bucket, search và credential rejection;
- LangGraph dùng context builder và đọc memory namespace hiện tại trước execution.

Memory Phase 4 hiện là process-local boundary; durable memory/run persistence sẽ
được đưa vào phase durable execution sau khi contract ổn định.

Phase 6 đã bổ sung durable run kernel tại `services/harness/durable.py`:

- lưu và đọc lại `RunContext` theo owner/tenant;
- replay event theo `sequence`;
- cancellation request có owner isolation;
- artifact store có ownership và run binding;
- Redis backend khi cấu hình, in-memory fallback cho local development;
- API `GET /runs/{run_id}`, `POST /runs/{run_id}/cancel` và
  `GET /runs/{run_id}/events`.

Queue/worker background, resume sau process crash và checkpoint reconciliation
vẫn là phần tiếp theo của Phase 6.

Phase 7 đã mở rộng observability/evaluation:

- metrics cho run outcome, planner, verification, memory và budget blocks;
- evaluator kiểm tra optional tool sequence, approval và run status;
- scenario corpus validation chống thiếu field và duplicate ID;
- configurable minimum pass rate cho release gate.

Phase 8 đã thêm production hardening:

- `services/hardening.py` kiểm tra production config mà không in secrets;
- `/ready` trả hardening report và fail 503 khi production config không đạt;
- `scripts/check_production_hardening.py` để chạy gate trước deploy;
- [ai-agent-production-hardening.md](../docs/ai-agent-production-hardening.md)
  ghi rõ secret, network, database, recovery, load và rollback checklist.

Các extension sau roadmap đã có tại `services/capabilities/question_pipeline.py`,
`services/memory/store.py`, `services/harness/durable.py` và
`services/harness/queue.py`: full ToolSpec coverage, persistent namespaced
memory, deterministic/optional semantic question review, durable human-review
records, draft-only question pipeline và queue/worker contract. Worker entrypoint
để chạy agent thật trong background cùng checkpoint reconciliation vẫn cần
wiring ở deployment slice tiếp theo.

## Supervisor v1 verification

Local development can enable the controlled authoring graph with:

```env
AI_ORCHESTRATION_MODE=supervisor_v1
```

Use prompts from `evals/supervisor_scenarios.json`. A real multi-agent run must
produce task events for `categories`, `curriculum`, one or more
`question-shard-*` tasks, `quality-review`, `media` and `finalizer`. Inspect the
run timeline at `GET /runs/{run_id}/events`; the final assistant message alone
is not evidence that multiple workers ran.

The run should also contain `artifact` events with checksums. Question shards
must overlap in time in the trace for the parallel case, and the approval
proposal must appear only after the `finalizer` task completes. Unit coverage
for fan-out, repair, task events and artifacts is in
`tests/test_authoring_graph.py`.

Failed background runs can be requeued with:

```text
POST /runs/{run_id}/retry
POST /runs/{run_id}/retry?task_id=question-shard-2
```

When a question shard is specified, completed category, curriculum, base
payload and other question-batch artifacts are loaded from the durable run and
only that shard is regenerated.

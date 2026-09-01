# Quiz AI Agent — production readiness review

Ngày review: **2026-08-28**

## Kết luận

**Chưa nên mở public production đại trà.** Có thể chạy staging hoặc canary
giới hạn sau khi cấu hình Redis bắt buộc, nhưng còn các blocker về độ bền của
workflow ghi, khả năng resume, eval chống prompt injection và load/failure
testing.

Đánh giá hiện tại: **nền tảng tốt cho production hardening, khoảng 6.5/10**.
Điểm này không phải chất lượng câu trả lời; đó là mức sẵn sàng vận hành an toàn
với dữ liệu và side effect thật.

## Những gì đã đạt

- Identity/scope lấy từ NestJS; không tin `user_id` và `scope` do browser gửi.
- Tool được allowlist theo learner/creator/admin; write tool đi qua approval.
- Backend vẫn kiểm tra ownership/RBAC ở boundary, không chỉ dựa vào prompt.
- Input tool có JSON Schema và semantic validation; enum tiếng Việt được normalize.
- Retrieval knowledge chỉ trả source `PUBLISHED + PUBLIC`; có citation gate và abstain.
- Redis state cho session, rate limit, approval một lần, lock hội thoại và trace.
- Có readiness, SSE, bounded history, Prometheus và tùy chọn Langfuse/LangSmith.
- 59/59 test AI-agent pass khi chạy với pytest chỉ bật plugin cần thiết.
- NestJS production build pass.

## Blocker trước public production

### P0/P1 — side effect và recovery

1. `create_quiz_with_questions` đã được chuyển sang endpoint backend transaction
   và rollback khi một question/options lỗi. Các write workflow đơn lẻ khác
   vẫn cần nhận idempotency key xuyên suốt agent → backend.
2. Graph hiện đã có tùy chọn Postgres checkpointer durable qua
   `AGENT_CHECKPOINTER=postgres`; production readiness sẽ fail nếu checkpointer
   không setup được. Cần tiếp tục test resume sau crash và tách job/outbox cho
   operation dài.
3. `create_quiz_with_questions` hiện có idempotency theo `(user_id, key)`;
   update/delete/publish và các write workflow còn lại chưa có cùng cơ chế.
   Retry mạng sau khi backend đã ghi vẫn có thể lặp side effect ở các flow đó.

### P1 — security và trust boundary

1. Đã có cảnh báo untrusted web/knowledge trong prompt, nhưng chưa thấy input
   moderation, output policy hoặc bộ red-team tự động cho prompt injection,
   data exfiltration và malicious document.
2. `/metrics`, `/tools` và root health nên chỉ mở trong private network hoặc
   có ops authentication/rate limit; đặc biệt không expose tool catalog admin
   ra internet nếu không cần.
3. Cần kiểm tra token lifetime/rotation, secret manager, TLS nội bộ và log
   redaction ở môi trường triển khai thật. Không đưa API key vào image/env file
   commit.

### P1 — reliability và cost

1. Default model là alias/config có thể thay đổi; production cần pin model
   snapshot hoặc có change-control + baseline eval.
2. Direct dependencies chính trong `requirements.txt` đã được pin version;
   vẫn nên bổ sung lock/hash và image SBOM trong pipeline.
3. Chưa có token/cost metrics, per-request budget, circuit breaker, retry policy
   theo loại lỗi và alert theo p95/p99/TTFT/error rate.
4. Chưa có load test multi-replica, Redis outage, backend 5xx/timeout, client
   disconnect giữa stream và duplicate approval.
5. Retrieval golden set chỉ có 3 case; chưa đủ để làm release gate cho tiếng
   Việt, paraphrase, empty result, stale source và prompt injection trong source.

### Đã xử lý trong review này

- `ChatRequest` giới hạn `session_id` và validate locale.
- Agent mặc định yêu cầu Redis khi `NODE_ENV=production`; compose production đã
  explicit `AI_REQUIRE_REDIS=true`.
- Backend HTTP client được reuse với connect/read/write/pool timeout bounded và
  graceful close.
- Identity lookup trả 503 có thông điệp an toàn khi backend auth unavailable.
- `/chat` không còn trả nguyên exception nội bộ; log có mã lỗi để tra cứu.
- Bổ sung taxonomy keyword ở `docs/ai-agent-keywords.vi.md`.
- Bổ sung SLO ở `docs/ai-agent-slo.md` và threat model ở
  `docs/ai-agent-threat-model.md`.
- Bổ sung Postgres checkpointer feature flag và readiness gate cho LangGraph.
- Thêm `ai-agent/mcp/quiz_api_server.py` với read-only tool surface; write
  tool không được export qua MCP.
- Thêm hybrid knowledge retrieval có embedding storage và cosine reranking,
  nhưng mặc định tắt qua `KNOWLEDGE_EMBEDDING_ENABLED=false`.
- Thêm script `pnpm knowledge:embeddings` để backfill embedding cho chunk
  public đã tồn tại sau khi bật provider.
- Thêm bounded role registry cho `tutor_retriever`, `quiz_builder` và
  `quality_reviewer`; single-agent vẫn là default cho đến khi có benchmark.
- Sửa production entrypoint dùng `prisma migrate deploy`, loại bỏ
  `db push --accept-data-loss`.

## Release gates đề xuất

### Gate A — correctness

- 100% scenario critical: create/update/delete/publish/start/knowledge review.
- Không có duplicate write khi timeout/retry/duplicate approval.
- Workflow complete quiz phải atomic hoặc có trạng thái compensation được test;
  transaction + idempotency của flow này đã có.
- Citation correctness và groundedness đạt ngưỡng do product đặt ra; retrieval
  recall@k ≥ 0.90 chỉ là baseline hiện tại, không phải đủ cho production.

### Gate B — safety

- Red-team prompt injection trên user message, quiz content, knowledge chunk và
  web result.
- Test cross-user/session/role access, SSRF import URL, secret exfiltration,
  oversized input và malicious tool arguments.
- Có kill switch cho web search và write tools; audit có request/trace ID nhưng
  không chứa token, raw prompt nhạy cảm hoặc full private payload.

### Gate C — operations

- Readiness fail khi model, Redis hoặc backend dependency không đạt policy.
- SLO tối thiểu: p95 first token, p95 completion, tool error rate, approval
  success rate, Redis lock contention, cost/request.
- Load test ở concurrency mục tiêu và chaos test Redis/backend restart.
- Pin dependency/model, image scan, SBOM, rollback/canary và runbook incident.

## Lộ trình ưu tiên

1. Mở rộng atomic/idempotent cho mọi write workflow; thêm durable resume hoặc
   job queue cho operation dài.
2. Viết scenario eval + red-team corpus tiếng Việt; chạy bắt buộc trong CI và
   trước mỗi prompt/model/tool change.
3. Bổ sung budget/cost/SLO/alert, private ops endpoints, timeout/circuit breaker
   và load/failure test.
4. Pin Python dependencies và model snapshot; sau đó mới cân nhắc multi-agent,
   vector DB, programmatic tool calling hoặc tool search.

## Định hướng kiến trúc

```text
User -> API/BFF -> Auth + rate limit
                 -> Planner/router (bounded)
                 -> Read tools -> evidence verifier -> answer + citations
                 -> Write preview -> policy/RBAC -> human approval
                                      -> idempotent command -> backend transaction
                 -> durable trace/checkpoint + metrics/cost/audit
```

Đừng thêm multi-agent chỉ vì thuật ngữ đang phổ biến. Với Quiz AI hiện tại,
độ tin cậy của write workflow, evidence và vận hành sẽ tạo giá trị lớn hơn việc
chia agent sớm.

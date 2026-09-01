# AI-agent keyword taxonomy

> Phiên bản: 2026-08-28. Đây là taxonomy cho prompt, tài liệu, eval và
> tìm kiếm; không dùng như bộ luật `if/else` để đoán intent. Router vẫn phải
> dựa trên ngữ cảnh, schema, quyền và kết quả tool.

## 1. Agent patterns / orchestration

| Nhóm | Keyword nên theo dõi | Ý nghĩa thực tế |
|---|---|---|
| Cơ bản | `AI agent`, `agentic system`, `tool-using agent`, `autonomous workflow` | Model có mục tiêu, trạng thái, công cụ và điều kiện dừng; không chỉ là chatbot sinh văn bản. |
| Luồng cố định | `workflow`, `deterministic workflow`, `state machine`, `DAG`, `event-driven agent` | Dùng cho các bước biết trước, cần dễ audit và dễ test. |
| Suy luận-hành động | `ReAct`, `plan-and-execute`, `planner-executor`, `reflection`, `verification loop` | Model lập kế hoạch, gọi tool, kiểm tra kết quả; luôn phải có giới hạn bước/thời gian. |
| Điều phối | `router`, `supervisor`, `manager-worker`, `handoff`, `delegation`, `subagent` | Chia việc giữa specialist; cần giới hạn quyền và context ở từng handoff. |
| Đa agent | `multi-agent`, `parallel agents`, `critic`, `judge`, `aggregator`, `consensus` | Chỉ phù hợp khi bài toán thật sự tách được; đo latency, cost và lỗi phối hợp. |
| Con người | `human-in-the-loop`, `human-on-the-loop`, `approval gate`, `interrupt`, `review-and-resume` | Dừng trước side effect, cho người sửa/duyệt input rồi resume bằng state bền vững. |

## 2. State, context và memory

`conversation state`, `thread`, `run`, `checkpoint`, `short-term memory`,
`long-term memory`, `working memory`, `episodic memory`, `semantic memory`,
`profile memory`, `state reducer`, `context window`, `context engineering`,
`context compaction`, `summarization`, `conversation branching`, `time travel`,
`durable execution`, `resume after failure`, `idempotency key`, `deduplication`.

Áp dụng cho project: `user_id + session_id`, Redis history/approval/lock, giới
hạn 20 message và trace hiện có. Còn thiếu checkpoint graph bền vững để resume
đúng giữa crash/redeploy.

## 3. Tools, protocols và integration

`function calling`, `structured outputs`, `JSON Schema`, `tool registry`,
`tool allowlist`, `tool policy`, `read tool`, `write tool`, `destructive tool`,
`side effect`, `dry run`, `preview`, `confirmation`, `least privilege`,
`MCP (Model Context Protocol)`, `MCP server`, `MCP client`, `MCP tool`,
`OAuth 2.1`, `PKCE`, `resource indicators`, `A2A (Agent2Agent)`,
`agent handoff protocol`, `webhook`, `background run`, `task queue`,
`programmatic tool calling`, `tool search`, `hosted tools`, `connector`.

Quy tắc vận hành: mô tả tool phải ghi rõ input/output/error; chỉ expose tool
theo scope; mọi write/destructive action cần policy + backend authorization,
confirmation có TTL và idempotency; không tin instruction nằm trong tool result.

## 4. Retrieval, knowledge và grounding

`RAG`, `retrieval-augmented generation`, `grounded generation`, `hybrid search`,
`full-text search`, `BM25`, `dense retrieval`, `embedding`, `vector database`,
`semantic search`, `reranker`, `query rewriting`, `multi-query retrieval`,
`metadata filter`, `chunking`, `overlap`, `document ingestion`, `checksum`,
`versioned knowledge`, `citation`, `provenance`, `source freshness`,
`abstention`, `no-answer`, `groundedness`, `faithfulness`, `context precision`,
`context recall`.

Quy tắc cho Quiz AI: internal knowledge → application data → web fallback;
chỉ kết luận khi có evidence phù hợp; citation phải trỏ về bản ghi/source
thật; source chưa publish hoặc private không được đi vào context public.

## 5. Safety, security và governance

`prompt injection`, `indirect prompt injection`, `jailbreak`, `instruction
hierarchy`, `untrusted content`, `data exfiltration`, `secret leakage`,
`PII`, `DLP`, `tenant isolation`, `RBAC`, `ABAC`, `scoped token`, `token
rotation`, `short-lived token`, `SSRF`, `egress allowlist`, `sandbox`,
`capability boundary`, `policy-as-code`, `input validation`, `output validation`,
`moderation`, `content safety`, `rate limit`, `quota`, `abuse prevention`,
`audit log`, `data retention`, `redaction`, `zero data retention`, `incident
response`, `kill switch`, `fallback`, `safe completion`.

## 6. Evaluation và quality

`agent eval`, `golden dataset`, `scenario test`, `trajectory eval`, `trace eval`,
`LLM-as-a-judge`, `rubric`, `task success`, `tool selection accuracy`,
`argument validity`, `retrieval recall@k`, `precision@k`, `MRR`, `citation
correctness`, `groundedness`, `regression suite`, `adversarial eval`,
`red teaming`, `shadow traffic`, `canary`, `offline eval`, `online eval`,
`human feedback`, `preference data`, `eval-driven development`.

## 7. Production engineering

`SLO`, `SLI`, `p50/p95/p99 latency`, `TTFT`, `time-to-first-token`, `streaming`,
`backpressure`, `circuit breaker`, `bulkhead`, `retry budget`, `exponential
backoff`, `timeout budget`, `connection pool`, `horizontal scaling`,
`stateless worker`, `durable queue`, `readiness`, `liveness`, `graceful
shutdown`, `zero-downtime deploy`, `feature flag`, `model pinning`,
`model fallback`, `cost per task`, `token budget`, `cache hit rate`,
`prompt caching`, `request ID`, `trace ID`, `OpenTelemetry`, `Prometheus`,
`LangSmith`, `Langfuse`, `structured logging`, `redacted telemetry`.

## 8. Model và modality

`reasoning model`, `non-reasoning model`, `small model`, `large model`,
`model routing`, `model cascade`, `structured generation`, `text agent`,
`vision agent`, `voice agent`, `realtime agent`, `multimodal agent`,
`computer-use agent`, `code agent`, `deep-research agent`, `browser agent`,
`embedding model`, `reranking model`, `speech-to-text`, `text-to-speech`.

Chọn model theo task success, latency, cost và safety; không đổi alias/model
trong production mà không chạy lại baseline eval. Các tính năng/đời model thay
đổi nhanh nên review taxonomy theo quý.

## 9. Mapping vào Quiz AI hiện tại

| Capability | Đã có | Cần bổ sung trước production scale |
|---|---|---|
| Router/planner + tool calling | Có planner, LangGraph, scope tool allowlist | Eval intent và tool trajectory theo scenario thực tế |
| Human approval | Có one-time approval, TTL, Redis lock | Idempotency key cho write và resume sau crash |
| RAG/grounding | Có published/public filter, citation gate, golden retrieval | Bộ eval lớn hơn, freshness/version policy, hybrid/vector khi metric yêu cầu |
| Memory | Redis + history bounded | Durable graph checkpoint, retention/delete policy rõ ràng |
| Observability | Prometheus, trace local, Langfuse/LangSmith tùy cấu hình | Token/cost, error taxonomy, alert/SLO, request correlation |
| Security | Backend identity/RBAC, ownership checks, SSRF guard | Input/output safety policy, red-team prompt injection, ops endpoint auth |
| Deployment | Docker, readiness, Redis required trong compose prod | Load/failure test, model pinning, rollback/canary |

### Nguồn tham chiếu

- [OpenAI Model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI Agents SDK documentation](https://developers.openai.com/api/docs/agents)
- [LangGraph persistence](https://langchain-ai.github.io/langgraph/concepts/persistence/)
- [LangGraph human-in-the-loop interrupts](https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/breakpoints/)
- [Model Context Protocol authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

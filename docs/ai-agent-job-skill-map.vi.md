# AI-agent job skill map — 2026

Ngày đối chiếu: **2026-08-28**. Tổng hợp từ các tin tuyển dụng AI/agent
engineer, AI platform và agent infrastructure đang hiển thị gần đây. Đây là
market signal, không phải checklist phải học mọi framework.

## 1. Keyword xuất hiện nhiều nhất

### Tier A — nên thành năng lực chứng minh được

`Python`, `async Python`, `FastAPI`, `REST API`, `SSE`, `WebSocket`, `SQL`,
`Postgres`, `Redis`, `Docker`, `LLM APIs`, `OpenAI`, `Anthropic`, `Gemini`,
`prompt engineering`, `context engineering`, `function calling`, `tool calling`,
`structured outputs`, `JSON Schema`, `LangChain`, `LangGraph`, `RAG`,
`embeddings`, `vector database`, `retrieval evaluation`, `agent evaluation`,
`observability`, `tracing`, `production reliability`, `error handling`,
`testing`, `CI/CD`.

Đây là nhóm xuất hiện xuyên suốt trong các role Senior AI Agent Engineer,
Applied AI Engineer và Agent Infrastructure Engineer.

### Tier B — tạo khác biệt cho portfolio

`MCP`, `MCP server`, `MCP client`, `tool registry`, `tool governance`, `HITL`,
`approval workflow`, `multi-agent orchestration`, `supervisor`, `router`,
`planner-executor`, `hybrid search`, `reranker`, `GraphRAG`, `LangSmith`,
`Langfuse`, `RAGAS`, `DeepEval`, `Promptfoo`, `OpenTelemetry`, `token/cost
observability`, `model routing`, `fallback`, `rate limit`, `audit log`,
`RBAC`, `OAuth/OIDC`, `PII protection`, `Kubernetes`, `Terraform`, `AWS/GCP/Azure`.

### Tier C — nên biết, chưa cần ưu tiên cho Quiz AI

`A2A`, `OpenAI Agents SDK`, `Claude Agent SDK`, `Google ADK`, `PydanticAI`,
`AutoGen`, `CrewAI`, `Semantic Kernel`, `AWS Strands`, `agent sandbox`,
`computer use`, `voice/realtime agent`, `programmatic tool calling`, `tool search`,
`prompt caching`, `fine-tuning`, `RLHF/RLAIF`, `Graph database`.

Lời khuyên: chọn một framework chính để làm sâu. Biết 6 framework nhưng không
có production evidence yếu hơn một hệ thống LangGraph có trace, eval, rollback
và số liệu rõ ràng.

## 2. Nhà tuyển dụng đang thực sự kiểm tra điều gì?

| Năng lực | Bằng chứng họ muốn thấy | Quiz AI hiện tại |
|---|---|---|
| Tool/agent engineering | Tool schema, argument validation, retry/stop policy, tool errors | Đã có khá tốt |
| Orchestration | Graph/state, conditional routing, memory, HITL, bounded autonomy | Có LangGraph/planner/approval; thiếu durable resume |
| RAG | Ingestion, chunking, embeddings/vector/hybrid search, citations, freshness | Có ingestion/full-text/citation; thiếu semantic retrieval |
| Evals | Golden set, trajectory/tool-call eval, regression CI, safety cases | Có 3 retrieval cases; cần mở rộng mạnh |
| Observability | Trace từng node/tool, p95/TTFT, token/cost, failure analysis | Có trace/Prometheus; thiếu token/cost/SLO |
| Production backend | Async API, SSE, Redis/Postgres, idempotency, queues, load test | Nền tảng tốt; write workflow chưa atomic/idempotent |
| Security/governance | RBAC, scoped auth, PII redaction, prompt injection, audit, kill switch | Có RBAC/approval/audit; thiếu red-team policy |
| Platform/deployment | Docker, cloud, K8s/Terraform, CI/CD, rollback/canary | Có Docker/compose/readiness; thiếu deployment evidence |
| Product judgment | Biết lúc nào dùng agent, lúc nào dùng workflow cố định; đo user impact | Cần viết rõ decision record và outcome |

## 3. Thứ tự áp dụng vào Quiz AI để có kinh nghiệm thật

### Project milestone 1 — Production Agent Core

Mục tiêu: biến repo thành case study “agent có side effect an toàn”.

- Hoàn thiện `create_quiz_with_questions` bằng transaction backend.
- Truyền `idempotency_key` từ request → approval → backend write.
- Durable checkpoint hoặc job queue cho workflow dài và resume sau crash.
- Thêm contract test cho duplicate request, timeout sau commit, Redis restart,
  token hết hạn và hai replica xử lý cùng session.

Keyword CV: `LangGraph`, `durable execution`, `HITL`, `idempotent tools`,
`RBAC`, `Redis`, `Postgres`, `FastAPI`, `SSE`, `distributed systems`.

### Project milestone 2 — Evidence-first RAG

- Thêm embeddings + `pgvector` hoặc vector store riêng sau khi đo baseline.
- So sánh full-text, dense và hybrid search; thử reranker.
- Lưu `source_version`, `chunk_id`, provenance và freshness.
- Tạo tối thiểu 50–100 câu hỏi tiếng Việt: paraphrase, typo, empty result,
  conflicting source, stale source, private/public boundary.
- Đo `recall@k`, `MRR`, context precision/recall, citation correctness và
  groundedness.

Keyword CV: `RAG`, `embeddings`, `pgvector`, `hybrid retrieval`, `reranking`,
`provenance`, `grounded generation`, `retrieval eval`.

### Project milestone 3 — Agent Eval & Observability Platform

- Lưu trajectory: input class, tool calls, arguments, results, retries, final
  answer, citations, latency và cost.
- Tách dev set/test set; freeze golden set; chạy regression trong CI.
- Thêm evaluators cho task success, tool selection, schema validity, safety,
  citation và final-answer completeness.
- Dashboard p50/p95/p99, TTFT, completion latency, token/cost per task, tool
  error, approval rate và abstention rate.

Keyword CV: `agent eval`, `trajectory eval`, `LLM-as-a-judge`, `Langfuse`,
`LangSmith`, `OpenTelemetry`, `Prometheus`, `SLO`, `cost optimization`.

### Project milestone 4 — Real MCP integration

- Tách `quiz-api-mcp`: read tools và write tools riêng, schema rõ ràng.
- Write tool chỉ trả preview/pending action; backend mới là nơi enforce auth,
  ownership và transaction.
- Tách `quiz-analytics-mcp` read-only: allowlist bảng/cột, `SELECT` only,
  timeout, row limit, audit.
- Viết README có sequence diagram, threat model và demo client gọi MCP.

Keyword CV: `MCP server`, `MCP client`, `tool registry`, `least privilege`,
`read-only analytics`, `OAuth`, `auditability`, `data lineage`.

### Project milestone 5 — Bounded multi-agent (chỉ sau milestone 1–4)

Thiết kế ba specialist có ranh giới rõ:

```text
Supervisor
├── Quiz Builder      -> draft quiz/questions, không publish
├── Tutor/Retriever   -> read-only evidence + citations
└── Quality Reviewer  -> kiểm tra schema, difficulty, duplicate, grounding
```

Chỉ supervisor được handoff; không cho specialist tự cấp quyền. So sánh với
single-agent baseline về task success, latency, cost và failure rate. Nếu không
tốt hơn, giữ single-agent.

Repo đã có role registry ban đầu trong `ai-agent/services/agent_roles.py`; đây
chỉ là boundary contract, chưa bật multi-agent mặc định.

Keyword CV: `supervisor`, `specialist agents`, `handoff`, `multi-agent eval`,
`bounded autonomy`, `quality gate`.

## 4. Portfolio package nên công bố

1. Architecture diagram: UI → BFF → agent graph → tools/MCP → backend/data.
2. Một video demo có cả happy path và failure path: timeout, denied permission,
   empty retrieval, duplicate approval.
3. Eval report trước/sau với dataset, metric và regression examples.
4. Threat model: prompt injection, SSRF, PII, privilege escalation, replay.
5. Production runbook: deploy, readiness, rollback, Redis outage, model outage.
6. ADR giải thích khi dùng deterministic workflow thay vì agent tự do.

Đó là bằng chứng “đã engineer hệ thống”, mạnh hơn việc chỉ liệt kê
`LangChain/LangGraph/MCP/RAG`.

## 5. Job sources đã đối chiếu

- [Planera — Senior AI Agent Engineer](https://jobs.ashbyhq.com/planera/d68c8a09-a11d-409e-85ca-5d434caf3fc8)
- [Nextdata — Senior AI Platform Engineer](https://jobs.ashbyhq.com/nextdata/5ffeb13d-0266-459f-ba80-094be8818be3)
- [BIO — AI Engineer](https://jobs.ashbyhq.com/bio/80145424-4809-46b2-99b9-8aae501be616)
- [ImagineArt — Agent Infrastructure Engineer](https://jobs.ashbyhq.com/imagineart/8c508ce3-ef15-473e-8a55-42e2f23432d7)
- [WongDoody — Senior AI Engineer](https://job-boards.greenhouse.io/wongdoody/jobs/7567192003)
- [Anaplan — Agentic AI System Architect](https://job-boards.greenhouse.io/anaplan/jobs/8415218002)
- [EPAM — Senior AI Engineer, Agentic and RAG Systems](https://careers.epam.com/en/vacancy/senior-ai-engineer-agentic-and-rag-systems-blty5mp8mok8tyd6a36_en)
- [Backbase — Senior AI Engineer](https://job-boards.greenhouse.io/workatbackbase/jobs/8119030)
- [ServiceNow — Staff Software Engineer, Agent Eval Platform](https://careers.servicenow.com/jobs/744000145843394/staff-software-engineer-agent-eval-platform/)

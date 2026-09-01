# Quiz AI Agent — threat model

Phạm vi: Next.js/BFF → FastAPI agent → LangGraph → tool adapter → NestJS →
PostgreSQL/Redis và knowledge/web content.

## Assets cần bảo vệ

- Access/refresh token và authorization fingerprint.
- User identity, role, permission và private quiz/knowledge.
- Database records và side effects: create/update/delete/publish.
- Approval token, idempotency key và conversation state.
- Prompt, tool schema, trace/audit và chi phí model.

## Threats and controls

| Threat | Ví dụ | Control hiện có | Gap/test cần thêm |
|---|---|---|---|
| Prompt injection | Knowledge chunk yêu cầu bỏ qua system prompt | Tool result được coi là untrusted trong prompt | Red-team user/web/document injection |
| Indirect data exfiltration | Web result dụ agent gửi private quiz | Scope + backend auth | Canary secrets, output DLP, egress policy |
| Privilege escalation | Browser gửi `scope=admin` hoặc user khác | Scope lấy từ NestJS; tool allowlist | Cross-user/role automated test |
| Approval replay | Gửi lại approval token | One-time consume + TTL + identity binding | Race/replay test trên nhiều replica |
| Duplicate side effect | Retry sau timeout | Complete quiz flow có idempotency DB | Mở rộng cho mọi write tool |
| Partial write | Question thứ N lỗi sau quiz create | Complete quiz flow transaction | Failure injection với DB transaction |
| SSRF | Import URL trỏ localhost/private IP | DNS/private-IP checks, redirect error | DNS rebinding/IPv6/proxy test |
| Resource abuse | Prompt lớn, tool loop, web search spam | Input length/rate/step/time limits | Per-user cost budget/circuit breaker |
| Secret leakage | Trace/log chứa token hoặc raw private payload | Hash user, bounded history | Log scan, redaction tests, ops auth |
| Dependency/model drift | Provider/model thay đổi hành vi | Build/type/test gates | Pin versions/model + canary eval |

## Security invariants

1. Client không quyết định identity, scope, ownership hoặc correctness.
2. LLM không trực tiếp ghi database; mọi side effect đi qua backend policy.
3. Untrusted content không được thay đổi instruction hierarchy.
4. Không trả lời factual từ retrieval rỗng/không có citation phù hợp.
5. Mọi write phải có authorization, validation, audit và idempotency.
6. Khi dependency không đáng tin cậy, agent fail closed hoặc abstain.

## Release evidence

Trước canary cần có test result cho từng threat ở trên, trace sample đã redact,
kill-switch đã thử và runbook xử lý model/backend/Redis outage.

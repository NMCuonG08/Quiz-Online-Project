# Quiz AI Agent — initial SLO

Ngày thiết lập: **2026-08-28**

Đây là target ban đầu cho canary. Sau khi có hai tuần traffic thật, dùng p95/p99
thực tế để điều chỉnh; không coi các ngưỡng này là kết quả đã đo.

## Availability

| SLI | Target canary | Ghi chú |
|---|---:|---|
| `/ready` trả healthy | ≥ 99.5% trong giờ phục vụ | Model + Redis policy phải đạt |
| Request hoàn tất không phải lỗi dependency | ≥ 99% | Tách model/backend/Redis error |
| Write duplicate | 0 | Hard safety invariant |
| Unauthorized write | 0 | Hard safety invariant |

## Latency

| SLI | Target ban đầu |
|---|---:|
| Time to first token (TTFT) p95 | ≤ 3s |
| Chat completion p95 | ≤ 15s |
| Tool call p95 | ≤ 2s cho read tool |
| Approval response p95 | ≤ 5s |

## Quality and safety

- Critical task success ≥ 95% trên frozen test set.
- Tool argument/schema validity ≥ 99%.
- Citation correctness và groundedness phải đạt threshold riêng do product
  chốt trên test set; không dùng answer fluency thay cho evidence.
- Prompt injection làm agent thực thi side effect: **0**.
- Private knowledge hoặc user data vượt tenant boundary: **0**.

## Cost and operations

Theo dõi theo `request_id`, `trace_id`, scope, intent và tool (không log token):

- Input/output/cached token.
- Cost per completed task.
- Model call count, tool call count, retry count.
- TTFT, completion latency, p95/p99.
- Approval rate, abstention rate, tool error rate.

## Alert/rollback

- Alert khi availability, error rate, p95 hoặc cost vượt target trong 10 phút.
- Tắt riêng `web_search` và write tools bằng feature flag/kill switch.
- Rollback model/prompt/tool catalog về bản release trước khi debug production.
- Mọi prompt/model/tool change phải chạy regression eval trước deploy.

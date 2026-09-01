# Quiz AI Agent — evaluation runbook

## Offline corpus

Scenario corpus nằm ở `ai-agent/evals/agent_scenarios.json`, bao phủ general,
retrieval, write preview, account, temporal, grounding, admin và security.
Đây là seed corpus; mở rộng lên 50–100 case trước canary, chia dev/test và
freeze test set.

Chạy kiểm tra cấu trúc:

```powershell
python ai-agent/scripts/evaluate_agent_scenarios.py
```

Khi có kết quả agent theo scenario:

```powershell
python ai-agent/scripts/evaluate_agent_scenarios.py `
  --results ai-agent/evals/results.local.json
```

Kết quả tối thiểu cần theo dõi: intent, expected/forbidden tools, citation,
task success, schema validity, permission violation, latency, retries và cost.

## Release policy

- Không thay prompt/model/tool catalog nếu regression critical tăng.
- Test set không được dùng để tune prompt.
- Security scenario fail là release blocker.
- Write duplicate hoặc unauthorized write là release blocker tuyệt đối.
- Mọi model/provider change cần lưu baseline cũ và report so sánh.

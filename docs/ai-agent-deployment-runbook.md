# Quiz AI Agent — deployment runbook

## Pre-deploy

1. Run Prisma generate/validate and `prisma migrate deploy` in the release
   environment.
2. Configure `AI_REQUIRE_REDIS=true` and `AGENT_CHECKPOINTER=postgres`.
3. Prefer a separate least-privilege `AI_CHECKPOINT_DATABASE_URL`; it only
   needs checkpoint tables, not quiz write permissions.
4. Keep `KNOWLEDGE_EMBEDDING_ENABLED=false` until the embedding provider,
   budget and public-data policy are approved. After enabling, run
   `pnpm knowledge:embeddings` once for existing public chunks.
5. Keep write tools and web search behind feature flags/kill switches.

## Health gates

- Agent `/ready` must report model, Redis and checkpoint readiness.
- Backend `/health` must report database and Redis readiness.
- Do not route traffic to a replica that fails either readiness check.
- Check `trace_id`, model calls, tokens, tool errors and p95 before opening
  traffic.

## Rollout

```text
build immutable images
→ run reviewed migrations
→ deploy one canary replica
→ smoke read-only chat/RAG
→ smoke approval/idempotent write
→ observe SLO for 15 minutes
→ gradually shift traffic
```

Rollback application images first. Never roll back a database migration by
`db push` or destructive schema commands. Use a forward migration for data
repair.

## Failure actions

| Signal | Action |
|---|---|
| Model/provider outage | Disable writes/web search; show safe retry message |
| Redis outage | Readiness removes replica from traffic; do not run multi-instance fallback |
| Checkpointer outage | Stop new LangGraph runs; preserve backend reads if policy allows |
| Duplicate write detected | Disable affected tool, inspect idempotency records and audit |
| Groundedness/citation regression | Roll back prompt/model/retrieval flag |
| Cost spike | Reduce rate limit/model tier and inspect token traces |

## CI evidence

The CI workflow must pass server build/typecheck, backend tests, AI-agent tests,
evaluation corpus validation and AI-agent Docker build before CD is triggered.

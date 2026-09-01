# Quiz AI Production Hardening

This runbook defines the executable configuration gate for Quiz AI. It
complements the threat model, SLO and deployment runbooks. A passing unit test
does not prove that backups, network policy or disaster recovery work in a
real environment.

## 1. Automated configuration gate

Run from ai-agent:

~~~powershell
python scripts/check_production_hardening.py --env-file config/.env --production
~~~

The command prints only safe check messages. It never prints API keys, bearer
tokens, passwords or full connection strings.

The gate blocks production when:

- model credentials are missing or look like placeholders;
- Redis is not required or has no URL;
- Postgres LangGraph checkpointing is disabled or has no URL;
- CORS is wildcarded, local-only or empty;
- backend endpoint is missing or not HTTPS/private service transport;
- web search is enabled without credentials;
- model/tool/token budgets are absent or non-positive;
- configured sensitive values contain placeholder markers.

In development, the same checks are non-blocking warnings:

~~~powershell
python scripts/check_production_hardening.py --env-file config/.env
~~~

## 2. Readiness behavior

GET /ready now returns:

- agent dependency readiness;
- hardening_ready;
- a safe hardening report;
- final ready status.

In production, hardening failure returns HTTP 503. In development, missing
production-only values do not change readiness.

## 3. Required secret policy

Use a secret manager or deployment secret store for:

- model API keys;
- backend credentials;
- checkpoint database credentials;
- web search credentials;
- tracing credentials.

Do not commit real values to:

- config/.env;
- docker compose files;
- CI logs;
- traces;
- audit events;
- memory;
- model prompts.

Use a separate least-privilege checkpoint database user. It must not have quiz
write permissions.

## 4. Network policy

Production should use:

- explicit HTTPS frontend origins;
- a private backend service hostname or HTTPS backend;
- Redis on a private network;
- Postgres on a private network;
- no public database ports unless an operational exception is documented;
- egress allowlists for web search and external APIs;
- no unrestricted browser or shell access for the chat agent.

The agent must not allow user input to select arbitrary backend URLs.

## 5. Container policy

Verify in the built image:

~~~text
non-root process
read-only filesystem where practical
no unnecessary shell utilities
no development dependencies
no .env files or source secrets
bounded CPU, memory and process count
healthcheck uses /ready
logs go to the deployment collector
~~~

The current Dockerfile uses a non-root app user. Validate the final image and
runtime policy in the deployment environment, not only in source review.

## 6. Database and Redis policy

Before production:

1. Apply migrations using the deployment migration procedure.
2. Verify checkpoint tables exist.
3. Verify checkpoint user permissions.
4. Verify Redis persistence and eviction settings.
5. Verify Redis TLS/auth when required.
6. Verify backup retention.
7. Test restore into an isolated environment.
8. Confirm application and checkpoint credentials are separate.
9. Confirm tenant/user indexes and retention jobs.
10. Confirm audit retention meets product requirements.

## 7. Recovery drills

Run in staging:

- kill an agent worker during planning;
- kill it during a read tool;
- kill it after a write request but before response;
- replay the run events;
- resume from the last checkpoint;
- verify no duplicate quiz/question/publish side effect;
- cancel a running request;
- expire an approval and retry;
- restore Redis and checkpoint data from backup;
- verify the frontend receives a safe terminal state.

For authenticated background runs, also verify that POST /runs issues only a
short-lived delegated agent token, that the Redis job contains only an opaque
credential reference, and that an expired reference fails the run safely.

Record:

~~~text
drill id
environment
start/end time
failure injected
expected behavior
observed behavior
data-loss result
duplicate-side-effect result
follow-up owner
~~~

## 8. Load and SLO verification

Measure with production-like models and tools:

- chat completion rate;
- p50/p95/p99 latency;
- time to first event;
- queue wait;
- model/tool timeout rate;
- token and cost per run;
- Redis latency;
- checkpoint latency;
- concurrent sessions;
- approval wait duration;
- error budget consumption.

Do not use a model mock as the only load test. Use mocks for capacity isolation,
then run a smaller provider-backed canary.

## 9. Release checklist

A release is eligible only when:

- automated hardening gate passes;
- agent scenario gate passes;
- prompt-injection tests pass;
- no forbidden tool path is open;
- approval replay tests pass;
- user/tenant isolation tests pass;
- backup restore has a recent evidence record;
- recovery drill has a recent evidence record;
- load/SLO report is attached;
- rollback image/tag is available;
- secrets are injected outside source;
- on-call owner and alert routes are known.

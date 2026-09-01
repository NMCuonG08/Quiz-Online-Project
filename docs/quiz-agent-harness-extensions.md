# Quiz Agent Extensions

This document records the extension layer built after the core phases. It describes
what is implemented in source and what still requires environment-level wiring.

## Implemented

### Complete tool runtime coverage

All tools in the catalog now have a ToolSpec generated from the catalog schema.
The runtime path enforces:

~~~text
tool registration
scope and capability
input normalization
input schema
approval
idempotency
handler timeout
output size
optional output schema
safe result envelope
~~~

Proposal and approval execution use the same runtime entrypoint. Legacy handlers
remain behind the runtime as compatibility adapters.

### Persistent memory

MemoryStore supports:

- user and tenant namespaces;
- Redis persistence when REDIS_URL is configured;
- bounded in-process fallback for local development;
- TTL;
- per-namespace item limits;
- scoped search;
- deletion and namespace clearing;
- credential-like content rejection.

The model receives selected memory as untrusted data. Memory does not grant
permission and does not override runtime policy.

### Question generation and review

QuestionGenerationPipeline provides:

~~~text
draft payload
  -> deterministic quality report
  -> semantic heuristic review
  -> optional injected LLM judge
  -> draft, pending_review, approved or rejected
  -> durable human-review record
~~~

QuestionQualityCapability validates question text, supported type, option text,
option duplicates, answer cardinality and duplicate questions.

No pipeline method publishes directly. Persistence must still pass the existing
approval and backend transaction boundaries.

### Human review API

The agent service exposes:

~~~text
GET  /reviews/{review_id}
POST /reviews/{review_id}/decision
~~~

Review access is owner-scoped and creator/admin gated. A review decision is
single-transition from pending to approved or rejected.

### Durable queue and worker contract

RunJob, DurableRunQueue and RunWorker provide:

- local async queue;
- Redis pending queue when a Redis client is supplied;
- claim;
- lease/processing record;
- acknowledgement;
- retry with attempt limit;
- cancellation-compatible job payload;
- expired local lease requeue;
- generic async worker handler.

The queue is a reusable runtime contract. The application still needs a worker
entrypoint that loads a persisted RunContext and invokes the appropriate agent
runner for background execution.

The worker must receive an opaque credential reference, not a bearer token. A
short-lived delegated backend credential is issued by the protected NestJS
agent-token endpoint and stored only behind that reference in the credential
broker. The Redis job payload never contains the raw token.

Background wiring is available through:

~~~text
POST /runs
python scripts/run_worker.py
~~

The worker requires Redis so the queue, run store and credential broker are
shared across API and worker processes.

NestJS issues the delegated token through POST /api/auth/agent-token. The token
has type agent, audience quiz-ai and a short configurable lifetime controlled by
AGENT_TOKEN_EXPIRES_IN. The Python API stores it only behind an opaque
credential_ref; the RunJob JSON contains no raw token.

## Not claimed as complete

The following require real staging or production evidence:

- Redis failover;
- Postgres checkpoint restore;
- worker process kill and resume in a staging drill;
- exactly-once side-effect reconciliation;
- queue throughput under load;
- backup/restore;
- disaster recovery;
- provider-backed semantic judge quality in a controlled eval run;
- production review UI integration;
- multi-replica cancellation latency.

These are covered by the production hardening runbook but cannot be honestly
proved by local unit tests alone.

## Verification

The local suite covers:

- all existing agent contracts;
- full tool runtime compatibility;
- persistent-memory behavior on the local backend;
- review lifecycle;
- question pipeline;
- queue retry and acknowledgement;
- hardening configuration;
- observability/evaluation contracts.

Run:

~~~powershell
cd ai-agent
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD='1'
python -m pytest -q
~~~

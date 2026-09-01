# Quiz Agent Harness Implementation Plan

This plan is the controlled build order for the Quiz Agent blueprint. The goal
is to improve reliability without rewriting the current system or replacing
LangGraph.

## 1. Rules

1. Preserve POST /chat, POST /chat/stream, GET /ready and GET /metrics.
2. Preserve existing SSE event names and backend routes.
3. Keep LangGraph as the single primary agent loop.
4. Build one vertical slice at a time.
5. Every slice needs contracts, implementation, tests, failure tests,
   observability and documentation.
6. Do not claim an improvement without comparing the same model, prompt, tools,
   fixture and scenario set.
7. Safety comes before autonomy.

## 2. Baseline

The current system already has:

- semantic InteractionPlan;
- fast and strong planner escalation;
- LangGraph planner, assistant and ToolNode;
- role and intent-specific tool filtering;
- backend-authenticated identity and scope;
- one-time write approvals;
- ownership and backend RBAC checks;
- idempotent quiz write route;
- Redis history, locks and rate limits;
- optional Postgres graph checkpoint;
- SSE status, token, UI, citation, trace and done events;
- Prometheus-compatible metrics;
- retrieval and agent scenario fixtures.

Baseline command:

~~~text
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest -q
~~~

The pytest plugin switch avoids a slow unrelated installed plugin during
collection. It is not an application setting.

## 3. Phase 0: contract freeze

Status: complete.

Deliverables:

- architecture overview;
- detailed harness blueprint;
- this implementation plan;
- current-to-target mapping;
- baseline test result.

Exit gate:

- documentation exists;
- user changes are preserved;
- current tests remain green;
- documentation caused no runtime change.

## 4. Phase 1: harness kernel

Goal: make run identity, budgets, events and outcomes explicit.

Status: implemented.

New files:

~~~text
ai-agent/services/harness/__init__.py
ai-agent/services/harness/contracts.py
ai-agent/services/harness/budgets.py
ai-agent/services/harness/errors.py
ai-agent/services/harness/events.py
ai-agent/services/harness/lifecycle.py
ai-agent/tests/test_harness_contracts.py
ai-agent/tests/test_harness_budgets.py
ai-agent/tests/test_harness_events.py
ai-agent/tests/test_harness_lifecycle.py
~~~

Contracts:

- RunRequest;
- RunContext;
- RunUsage;
- BudgetPolicy;
- ToolExecutionResult;
- VerificationResult;
- EvidenceRef;
- ArtifactRef;
- RunOutcome.

Rules:

- use Pydantic;
- no FastAPI imports;
- no Redis imports;
- no LangGraph-specific types;
- safe serialization;
- stable error codes;
- explicit versions for persisted objects.

Budget tracker:

~~~text
start
consume_step
consume_model_call
consume_tool_call
consume_subagent_call
record_tokens
record_cost
assert_can_continue
snapshot
~~~

Track graph steps, model calls, tool calls, sub-agent calls, tokens, cost,
elapsed time and retries.

Lifecycle states:

~~~text
created
planning
context_building
executing
waiting_for_approval
verifying
responding
completed
paused
retrying
cancelled
expired
failed
~~~

Wiring:

- create one RunContext at the beginning of the LangGraph path;
- record run ID and trace ID;
- consume model, tool and graph budgets;
- add event ID, run ID and sequence as additive event fields;
- keep the current public payload compatible.

Exit gate:

- all LangGraph runs have a run ID;
- budget exhaustion stops safely;
- usage snapshot exists;
- illegal lifecycle transitions are rejected;
- all current tests remain green.

## 5. Phase 2: deterministic tool runtime

Goal: create one enforcement path between a model decision and the backend.

Status: implemented for the complete tool catalog; the first migration was
proven with search_quizzes and create_quiz_with_questions before expanding.

New files:

~~~text
ai-agent/services/harness/tool_specs.py
ai-agent/services/harness/tool_runtime.py
ai-agent/services/policies/tool_policy.py
ai-agent/services/policies/approval_policy.py
ai-agent/tests/test_tool_runtime.py
ai-agent/tests/test_tool_policy.py
~~~

Tool specification:

~~~text
name
capability
read_or_write
risk
input_schema
output_schema
required_permissions
requires_approval
timeout
retry_policy
idempotency_mode
result_size_limit
audit_mode
~~~

Execution order:

~~~text
resolve spec
  -> check capability and role
  -> validate and normalize arguments
  -> check ownership
  -> check approval
  -> enforce budget and timeout
  -> apply idempotency
  -> call backend
  -> validate result
  -> extract evidence
  -> redact sensitive values
  -> audit
  -> return typed result
~~~

First migrate one read tool and one write tool:

1. search_quizzes;
2. create_quiz_with_questions.

Exit gate:

- no LangGraph or legacy path bypasses the tool runtime;
- denied, malformed and unauthorized calls never reach the backend;
- approval cannot be replayed;
- uncertain side effects reconcile instead of blindly retrying.

## 6. Phase 3: Quiz capabilities

Goal: remove domain workflow ownership from the large agent façade.

Status: implemented.

New capability modules:

~~~text
discovery
learning
authoring
question_quality
knowledge
account
~~~

Extraction order:

1. Discovery: search, recommend, detail and categories.
2. Learning: start, resume, result, history and progress.
3. Authoring: draft, update, delete and publish.
4. Knowledge: search, import, review and visibility.
5. Account: identity and effective permissions.
6. Question quality: generation and validation.

Each capability owns:

~~~text
supported intents
allowed roles
tool manifest
input contract
output contract
risk policy
evidence policy
approval policy
tests
~~~

Exit gate:

- the façade delegates rather than translating domain arguments;
- tool names and backend routes remain compatible;
- read, write, ownership and evidence tests exist for every capability.

## 7. Phase 4: question quality pipeline

Goal: prevent invalid or unsupported generated questions from being published.

Status: implemented.

Pipeline:

~~~text
requirements
  -> learning objective
  -> approved source retrieval when needed
  -> draft generation
  -> schema validation
  -> answer-cardinality validation
  -> duplicate check
  -> ambiguity check
  -> difficulty check
  -> explanation check
  -> source verification
  -> preview
  -> approval
  -> inactive persistence
~~~

Validate question text, type, options, correct-answer count, uniqueness,
points, time, explanation, difficulty, category, sources, safety and duplicates.

Exit gate:

- invalid cardinality is rejected;
- unsupported claims are blocked or marked for review;
- failed review remains a draft;
- publish readiness is required before publish.

## 8. Phase 5: context, memory and evidence

Goal: keep long runs coherent and prevent retrieved data from becoming policy.

Status: implemented as a bounded context builder and namespaced memory boundary
with Redis persistence plus local fallback.

Context order:

1. immutable runtime policy;
2. trusted identity and permissions;
3. validated interaction plan;
4. current user goal;
5. workflow state and unfinished plan;
6. allowed tools;
7. verified evidence;
8. relevant memory;
9. bounded recent history;
10. output contract.

Add:

- tool-result limits;
- message limits;
- deduplication;
- truncation;
- artifact offloading;
- compaction;
- pinned goal and constraints;
- deferred tool descriptions;
- untrusted-data markers;
- context usage metrics.

Memory types:

~~~text
conversation
semantic
episodic
procedural
reviewed knowledge
~~~

Every memory item needs owner, namespace, source, confidence, timestamps,
expiry and deletion behavior. Never persist credentials, bearer tokens or
unreviewed instructions.

Exit gate:

- long-history scenarios stay within limits;
- evidence survives compaction;
- memory cannot cross user or tenant namespaces.

## 9. Phase 6: durable and asynchronous runs

Goal: support work longer than one HTTP request.

Status: durable run store, replay, cancellation, artifact policy, secure
delegated credentials, queue/worker contract, enqueue API and worker entrypoint
implemented. Staging recovery evidence and Redis/checkpoint failover drills
remain environment/deployment work.

Components:

~~~text
run store
checkpoint store
queue
worker
cancellation channel
artifact store
replay loader
~~~

Operations:

~~~text
start
get
pause
cancel
resume
retry failed step
fork
replay
download artifact
~~~

Exit gate:

- a killed worker resumes from checkpoint;
- duplicate quiz creation and publish are impossible under retry;
- cancellation is persisted;
- artifacts are owned and access-controlled.

## 10. Phase 7: observability and evaluation gates

Track:

Status: implemented for runtime metrics, optional trajectory/approval/run-status
checks and scenario corpus validation. Production release evidence still needs
to be generated from the deployment environment.

- run outcome;
- intent and clarification;
- planner escalation;
- graph steps;
- model calls, tokens and cost;
- tool success, failure and retry;
- approval results;
- verification failures;
- abstention;
- compaction;
- latency;
- checkpoint failures;
- duplicate-side-effect prevention.

Each scenario defines:

~~~text
input
trusted user and scope
page context
expected intent
allowed tools
forbidden tools
expected tool sequence
approval expectation
evidence expectation
terminal outcome
~~~

A release fails on forbidden tool use, unauthorized write, approval replay,
cross-user data, missing required evidence, duplicate side effect or unsafe
budget exhaustion.

## 11. Phase 8: production hardening

Only after earlier phases pass:

Status: executable production configuration checks, readiness integration and
hardening runbook implemented. Infrastructure drills remain environment-only.

- dependency and license review;
- least-privilege credentials;
- secret rotation;
- backup and restore test;
- migration test;
- load test;
- prompt-injection suite;
- sandbox review;
- PII redaction audit;
- disaster recovery exercise;
- rollback test;
- SLO and alerting.

## 12. Exact next coding milestone

Continue Phase 6 with the background worker slice:

~~~text
durable queue
worker lifecycle
resume and cancellation propagation
checkpoint reconciliation

tests:
  test_run_queue.py
  test_worker_recovery.py
  test_cancellation_propagation.py

wiring:
  keep the current synchronous path compatible
  add background execution behind the durable run store and queue
  preserve current API, tool names and SSE fields
~~~

Phase 3 is the capability boundary on which the question-quality pipeline,
memory, verification and durable-run work can safely depend. Do not extract
every future concern in the same change.

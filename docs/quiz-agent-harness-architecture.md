# Quiz Agent Harness Architecture

Status: implemented through Phase 6 durable-run kernel; background worker and later phases remain planned.

For the implementation-grade component blueprint, see
quiz-agent-harness-blueprint.md. For the gated coding sequence, see
quiz-agent-harness-implementation-plan.md.

This document defines the architecture for turning Quiz AI into a reliable Quiz
Agent. It is specific to this repository. It does not require replacing
LangGraph.

## 1. Product intent

Quiz AI is not only a chatbot. It is an agent that can help users discover,
take, understand, create, validate, manage and publish quizzes while respecting
account permissions and the real state of the Quiz Online system.

The harness must guarantee:

1. The agent never claims a system operation succeeded without a backend result.
2. The agent never treats a browser-supplied role, ID or URL as authorization.
3. Read operations may be automated; mutations require preview and explicit
   approval.
4. Answers based on application data include evidence or abstain.
5. Failed or long runs can stop, resume, retry safely or ask the user for help.
6. The frontend receives typed events and server-owned UI actions.
7. Harness changes can be evaluated with the same model and task set.

## 2. What harness means here

The LLM is the probabilistic decision component. The harness is the deterministic
and stateful system around it:

~~~text
Ingress: auth, tenant, rate limit, request/session normalization
Planner: semantic intent, entities, risk, route, clarification
Context: history, memory, knowledge, page context, plan, tool scope
Orchestrator: LangGraph state machine, loop, budget, checkpoint
Capabilities: quiz, question, attempt, knowledge, account, UI
Control: RBAC, approval, validation, idempotency, recovery
Evidence: citations, verification, audit, traces, metrics, evaluations
Egress: typed response, SSE events, UI surfaces, artifacts
                              |
                              v
                             LLM
~~~

LangGraph remains the orchestration core. It is not responsible for every
concern in this diagram.

## 3. Design principles

### Semantic decisions, deterministic enforcement

The model may propose an intent, plan, tool and arguments. Deterministic code
must enforce identity, role, permission, tool scope, schemas, ownership,
approval, idempotency, timeout, budgets and evidence.

The model is never the final authority for security or mutation permission.

### One public agent, many internal capabilities

Users see one Quiz Agent. Internally it has focused capabilities:

~~~text
Quiz Agent
├── Discovery
├── Learning
├── Authoring
├── Question Quality
├── Knowledge
└── Account
~~~

Each capability has its own tools, output contract, risk policy and tests.

### Preview before side effect

Every mutation follows:

~~~text
Resolve target
  -> validate proposed change
  -> render preview
  -> user approval
  -> re-check identity, permission and ownership
  -> execute idempotently
  -> verify backend result
  -> render result
~~~

### Bounded autonomy

Every run has explicit maximums for graph steps, model calls, tool calls,
wall-clock time, tokens, cost, sub-agent calls and repeated failures.

## 4. Target code boundaries

~~~text
ai-agent/
├── services/
│   ├── agent_core.py              compatibility facade
│   ├── langgraph_runner.py        orchestration adapter
│   ├── protocol.py                HTTP, SSE and UI contracts
│   ├── intent_schema.py           planner contracts
│   ├── agent_roles.py             role/tool policy
│   ├── tool_catalog.py            tool metadata
│   ├── tools.py                   backend gateway
│   ├── state_store.py             session and short-lived state
│   ├── observability.py           metrics
│   ├── tracing.py                 trace exporters
│   └── ui_policy.py               server-owned UI actions
├── harness/
│   ├── contracts.py               Run, budgets, events, outcomes
│   ├── lifecycle.py               run lifecycle and cancellation
│   ├── budgets.py                 step, time, token and cost limits
│   ├── context.py                 assembly and compaction
│   ├── tool_runtime.py            policy, timeout, retry and audit
│   ├── verification.py            output and evidence gates
│   └── errors.py                  typed runtime errors
├── capabilities/
│   ├── discovery.py
│   ├── learning.py
│   ├── authoring.py
│   ├── question_quality.py
│   ├── knowledge.py
│   └── account.py
├── memory/
├── policies/
├── evals/
└── tests/
~~~

This is a target boundary, not a request to create every file at once.
Existing services remain compatible while responsibilities are extracted one
vertical slice at a time.

## 5. Run model

Every request is an agent run.

~~~text
Run
├── run_id                 execution identity
├── thread_id              conversation/checkpoint identity
├── user_id                trusted backend identity
├── tenant_id              future tenant boundary
├── agent_version          code, prompt and policy version
├── model_profile          planner, executor and fallback models
├── request                normalized input and page context
├── plan                   validated semantic interaction plan
├── state                  typed mutable execution state
├── budgets                limits and current consumption
├── events                 append-only lifecycle events
├── tool_calls             calls and outcomes
├── artifacts              generated files and surfaces
├── evidence               citations and verification records
└── outcome                completed, paused, failed or cancelled
~~~

Run lifecycle:

~~~text
CREATED -> AUTHENTICATED -> PLANNING -> EXECUTING -> VERIFYING -> COMPLETED
                                      |
                                      +-> WAITING_FOR_APPROVAL -> EXECUTING

Any state may become PAUSED, CANCELLED, EXPIRED, RETRYING or FAILED.
~~~

The lifecycle must be persisted for runs that can survive a restart.

## 6. Core contracts

### Interaction plan

The existing InteractionPlan is the correct foundation. It contains primary
intent, secondary intents, confidence, ambiguity, clarification, risk, route,
entities and missing fields.

The planner proposes this object. The runtime validates it and intersects its
tool set with trusted scope policy.

### Tool contract

Every tool eventually needs:

~~~text
name, description, input_schema, output_schema, capability
read_or_write, risk_level, required_permissions, requires_approval
idempotency_mode, timeout, retry_policy, result_size_limit, audit_policy
~~~

The LLM-visible schema is not enough. The runtime needs the same metadata for
enforcement.

### Event contract

The public event vocabulary should cover:

~~~text
connected, run_started, status, plan_created, clarification_required
tool_call_started, tool_approval_required, tool_call_completed, tool_call_failed
subagent_started, subagent_completed, verification_started, verification_failed
ui, citations, token, checkpoint_saved, done, error
~~~

Events should carry event_id, run_id, sequence, timestamp, type and payload.
The frontend renders events but never decides permissions or backend success.

## 7. Runtime layers

### Ingress

1. Validate request size and shape.
2. Resolve identity from the backend bearer token.
3. Derive effective scope from trusted permissions.
4. Normalize session and request IDs.
5. Apply rate limits.
6. Attach route, selected quiz and page context.
7. Create run and trace IDs.
8. Establish a per-session lock.
9. Load bounded history.
10. Reject malformed or unauthorized requests before model invocation.

### Planner

The planner is separate from the executor.

~~~text
Fast semantic planner
  ├── clear read request -> accept
  └── low confidence, ambiguous, write or admin -> strong planner
~~~

The planner returns respond, tool, clarify, approval or abstain. It never
directly mutates the backend.

### Context

Context priority:

1. Immutable safety/runtime policy.
2. Trusted identity and permissions.
3. Current interaction plan.
4. Current user request.
5. Current state and plan.
6. Verified tool results.
7. Relevant memory and knowledge.
8. Recent conversation.
9. Low-priority history.

The context layer must support bounded history, tool-result limits,
deduplication, compaction, artifact offloading, on-demand tool descriptions,
skill loading, source labels and untrusted-data markers.

### Agent loop

The loop can be ReAct, plan-and-execute, graph-based, supervisor-based or
event-driven. It must always have termination, cancellation, retry, fallback,
loop detection and checkpoint behavior.

### Tools

Tool execution is:

~~~text
validate input
  -> authorize
  -> check ownership
  -> check approval
  -> enforce timeout and budget
  -> apply idempotency
  -> call backend
  -> validate output
  -> redact sensitive data
  -> audit
  -> return model-safe result
~~~

Errors must be classified as retryable, non-retryable, authorization,
validation, approval-required, user-action-required, dependency-unavailable or
fatal.

### Memory and knowledge

Distinguish conversation, semantic, episodic and procedural memory from reviewed
domain knowledge. Every memory write needs namespace, source, confidence,
timestamp, expiry/review policy and deletion behavior.

Unreviewed documents and tool results are untrusted data. They cannot change
runtime policy or permissions.

### Planning and sub-agents

Use sub-agents only where work can be isolated. Each sub-agent needs its own
model, tools, context, permissions, budget, output schema, parent run ID and
failure policy.

Supported patterns are sequential, parallel, supervisor, handoff and debate.
Multi-agent is not automatically better than one well-designed agent.

### Verification

Generation is separate from verification:

~~~text
model result
  -> schema validation
  -> business-rule validation
  -> evidence/citation validation
  -> optional critic/reviewer
  -> repair or reject
~~~

## 8. Quiz-specific capabilities

### Discovery

Search, recommend, detail and category listing must use real backend data.
Recommendations must distinguish topic matches from popularity fallback and
must expose citation metadata.

### Learning

Start, resume, result and history operations must use backend-owned attempt
state. The agent must never fabricate score, attempt ID or completion status.

### Authoring

~~~text
collect fields
  -> resolve category
  -> create inactive draft
  -> generate or attach questions
  -> validate question quality
  -> preview
  -> Accept
  -> transactional backend write
  -> verify resource identity
~~~

### Question quality

~~~text
learning objective
  -> draft generation
  -> schema validation
  -> answer-cardinality validation
  -> ambiguity check
  -> duplicate check
  -> difficulty check
  -> explanation check
  -> source verification
  -> review or save as draft
~~~

### Knowledge

~~~text
DRAFT -> REVIEW -> PUBLISHED
              └-> QUARANTINED
~~~

Only approved and visible sources are eligible for general learner answers.

## 9. Safety and reliability

The harness must provide:

- input, tool-call, tool-result and output guardrails;
- prompt-injection defense;
- secret and credential isolation;
- tenant and user data isolation;
- tool permissions and human approval;
- timeout, retry and circuit-breaker behavior;
- idempotency for side effects;
- checkpoint, resume, pause and cancellation;
- rate, token, cost and concurrency limits;
- audit records;
- redacted logs and traces.

A timeout after a possible side effect must not blindly retry. It needs
idempotency or a read-after-timeout reconciliation step.

## 10. Persistence

~~~text
Redis or equivalent:
  session history, approval tokens, locks, rate limits, short-lived events

Postgres checkpointer:
  LangGraph state, thread checkpoints, resumable graph execution

Application database:
  quizzes, questions, attempts, knowledge and audit records

Object storage:
  uploaded files, screenshots, reports and generated artifacts

Queue:
  long-running runs, retries, scheduled jobs and notifications
~~~

Checkpoint credentials and quiz-write credentials must remain separate.

## 11. Observability and evaluation

Every run should be traceable by run_id and trace_id, with spans for request,
planner, context, model, tool, backend request, sub-agent, verification,
approval, checkpoint and final response.

Metrics should cover task outcome, intent, clarification, tool success/error,
retry/fallback, verification failure, approval, steps, latency, tokens, cost,
grounded-answer rate, abstention and duplicate-side-effect prevention.

Evaluation scenarios should define input, trusted scope, page context, expected
intent, allowed tools, expected tool sequence, forbidden tools, approval
behavior, evidence behavior and expected outcome.

Harness comparisons must hold model, prompt, tools, data, sampling and task set
constant.

## 12. Current-to-target mapping

| Current component | Target responsibility |
|---|---|
| services/main.py | ingress and API/SSE adapter |
| services/agent_core.py | compatibility façade |
| services/langgraph_runner.py | planner and orchestration adapter |
| services/intent_schema.py | planner contract |
| services/agent_roles.py | role and capability policy |
| services/tool_catalog.py | tool registry metadata |
| services/tools.py | backend tool adapters |
| services/state_store.py | sessions, approvals, locks and short-lived state |
| services/protocol.py | public request/UI/event contracts |
| services/ui_policy.py | server-owned presentation policy |
| services/observability.py | runtime metrics |
| server/ | system of record and authorization |

The current implementation already has valuable foundations: semantic planning,
scoped tools, one-time approvals, backend identity, idempotent quiz writes,
bounded history, citations, trace events, readiness checks and retrieval
fixtures.

## 13. Incremental delivery plan

### Phase 0: baseline and contract freeze

Keep the current API and behavior green. Existing agent tests must remain green.

### Phase 1: harness kernel

Status: implemented.

Add framework-neutral contracts for RunContext, BudgetPolicy, RunEvent,
ToolExecutionResult, VerificationResult and TypedAgentError. Move limits and
outcomes behind these contracts while keeping LangGraph as the executor.

### Phase 2: deterministic tool runtime

Status: implemented for the two representative tools; remaining tools migrate incrementally.

Extract discovery, learning, authoring, question quality and knowledge behind
typed capability services. Keep tool names and backend routes stable.

### Phase 3: quiz capability boundary

Status: implemented through the capability services.

Extract discovery, learning, authoring, question quality, knowledge and
account behind typed capability services while keeping public tool contracts.

### Phase 4: question quality pipeline

Status: implemented as a deterministic quality gate.

Separate question generation, deterministic validation, source verification,
review and persistence. Generated content remains draft content until accepted.

### Phase 5: context and memory

Status: implemented as a bounded context builder and process-local namespaced memory boundary.

Add explicit context assembly, tool-result limits, compaction and safe memory
namespaces.

### Phase 6: durable runs

Status: durable run store, replay, cancellation, artifact ownership and queue/worker
contract implemented; production worker entrypoint and checkpoint reconciliation remain.

Add queue-backed long-running runs, cancellation, resume, artifacts and replay.

### Phase 7: controlled improvement

Status: runtime metrics, scenario trajectory checks and configurable evaluation
thresholds are implemented; real provider-backed canary evidence remains an
operational requirement.

Expand scenario coverage and make task success, cost, latency, grounding and
safety release gates.

## 14. Definition of done

The Quiz Agent is ready for serious use when tests and traces demonstrate that it
can:

1. Find and cite a real quiz.
2. Recommend without confusing recommendation with creation.
3. Start and resume an owned learner attempt.
4. Explain results from backend data.
5. Create a quiz draft from a structured request.
6. Generate questions that pass deterministic checks.
7. Preview every mutation before execution.
8. Re-check permission and ownership on Accept.
9. Execute side effects exactly once under retry.
10. Reject or quarantine unsupported knowledge.
11. Recover from model and tool failures within a bounded run.
12. Resume after a restart.
13. Resist prompt injection from users and retrieved data.
14. Stream understandable progress.
15. Produce trace and evidence for important decisions.

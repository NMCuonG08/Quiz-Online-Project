# Quiz Agent Harness Blueprint

This is the implementation-grade design for the Quiz Agent harness. The
companion implementation plan defines the order in which these boundaries will
be built. The blueprint is intentionally stricter than a framework overview:
each boundary has an owner, a contract, and a reason to exist.

## 1. Scope

The harness covers the complete execution of a Quiz Agent:

~~~text
user request
  -> authenticated run
  -> semantic plan
  -> scoped capability
  -> context assembly
  -> model decision
  -> policy check
  -> tool execution
  -> state/evidence update
  -> verification
  -> response or approval
~~~

It covers read workflows, learning workflows, quiz authoring, question
generation, knowledge retrieval, UI actions, background execution and
production controls.

It does not make the model itself more capable. It gives the model the
information, tools, limits and feedback required to complete a task reliably.

## 2. Non-negotiable invariants

These are architectural invariants. A later refactor must not violate them.

### Identity

The backend-authenticated identity is the only source of user identity. Request
body user_id, browser route, prompt claims and model guesses are untrusted.

### Authorization

Backend RBAC and ownership checks remain authoritative. Agent-side scope
filtering is defense in depth, not a replacement for backend authorization.

### Evidence

Application facts require a backend result or approved knowledge source. Empty,
stale or unverified retrieval produces abstention or clarification.

### Mutation

A mutation requires a validated proposal, an explicit approval and a second
authorization/ownership check at execution time.

### Idempotency

Any operation with a side effect must be safe to retry or must reconcile after
an uncertain timeout.

### Bounded execution

Every run has step, time, model-call, tool-call, token, cost and concurrency
limits.

### Untrusted data

User text, web content, uploaded files, tool results and retrieved documents
are data. They cannot change system policy, credentials or permissions.

### Compatibility

The current HTTP/SSE API, tool names and NestJS routes remain stable while
internal boundaries are extracted.

## 3. Logical architecture

~~~text
                         ┌────────────────────────┐
                         │       Web frontend      │
                         │ chat + typed UI surface │
                         └───────────┬────────────┘
                                     │ SSE/HTTP
                         ┌───────────▼────────────┐
                         │      API / Ingress      │
                         │ auth, limits, sessions │
                         └───────────┬────────────┘
                                     │ RunRequest
                         ┌───────────▼────────────┐
                         │       Run Manager       │
                         │ lifecycle, cancellation │
                         └───────────┬────────────┘
                                     │
          ┌──────────────────────────▼──────────────────────────┐
          │                    Agent Harness                    │
          │                                                      │
          │  Planner -> Context -> LangGraph -> Verification    │
          │     │          │          │              │           │
          │     │          │          │              │           │
          │  Policy    Memory/RAG  Tool Runtime   Evidence      │
          └─────┼──────────┼──────────┼──────────────┼──────────┘
                │          │          │              │
       ┌────────▼───┐ ┌────▼─────┐ ┌──▼────────┐ ┌──▼────────┐
       │ Auth/RBAC  │ │ Knowledge│ │ Backend   │ │ Metrics/  │
       │ NestJS     │ │ stores   │ │ tools     │ │ traces    │
       └────────────┘ └──────────┘ └───────────┘ └───────────┘
~~~

## 4. Component ownership

Each concern has one primary owner. Other components may call it, but should
not reimplement its rules.

| Concern | Owner | Must not be decided by |
|---|---|---|
| Identity | Ingress + NestJS | Model, browser, prompt |
| Effective role | Ingress + NestJS permissions | Model |
| Intent | Planner | Regex, UI route |
| Allowed tools | Policy layer | Model |
| Workflow order | LangGraph/capability | Free-form model text |
| Tool arguments | Tool schema + domain validator | Backend string parsing alone |
| Ownership | Backend and tool adapter | Approval UI |
| Approval | Approval store + policy | Assistant message |
| Evidence | Retrieval/evidence layer | Model confidence |
| Quiz validity | Quiz domain validator | LLM output alone |
| Session state | Run/state store | Python local variable |
| UI URL | UI policy registry | Model |
| Retry safety | Tool runtime + idempotency | Generic retry loop |
| Final response | Response policy | Raw tool output |

## 5. Runtime objects

### RunRequest

~~~text
RunRequest
├── request_id
├── user_message
├── trusted_user_id
├── trusted_scope
├── tenant_id
├── session_id
├── locale
├── page_context
├── authorization_fingerprint
└── received_at
~~~

The bearer token itself should not be placed in model context or persisted in
run history. The runtime may keep a fingerprint for approval binding and audit.

### RunContext

~~~text
RunContext
├── run_id
├── thread_id
├── request
├── agent_version
├── model_profile
├── plan
├── state
├── budgets
├── capabilities
├── permissions
├── evidence
├── artifacts
├── cancellation
└── trace metadata
~~~

### RunUsage

~~~text
RunUsage
├── graph_steps
├── model_calls
├── tool_calls
├── subagent_calls
├── input_tokens
├── output_tokens
├── cached_tokens
├── estimated_cost
├── elapsed_seconds
└── retries
~~~

### ToolExecutionResult

~~~text
ToolExecutionResult
├── ok
├── tool_name
├── call_id
├── normalized_input
├── output
├── error
├── retryable
├── approval_required
├── evidence
├── artifact_refs
├── idempotency_key
├── started_at
└── completed_at
~~~

### VerificationResult

~~~text
VerificationResult
├── passed
├── checks
├── failures
├── evidence_refs
├── repairable
├── user_action_required
└── reviewer_notes
~~~

## 6. State machines

### Run state machine

~~~text
CREATED
  -> AUTHENTICATING
  -> PLANNING
  -> CONTEXT_BUILDING
  -> EXECUTING
  -> VERIFYING
  -> RESPONDING
  -> COMPLETED

PLANNING -> CLARIFICATION_REQUIRED -> WAITING_FOR_USER
EXECUTING -> APPROVAL_REQUIRED -> WAITING_FOR_APPROVAL
EXECUTING -> PAUSED
EXECUTING -> RETRYING
Any state -> CANCELLED
Any non-terminal state -> FAILED
~~~

A terminal run must not silently resume. Resume creates a new attempt linked to
the previous run or explicitly continues from a persisted checkpoint.

### Approval state machine

~~~text
PROPOSED
  -> VALIDATED
  -> PENDING
  -> ACCEPTED
  -> REAUTHORIZED
  -> EXECUTED
  -> VERIFIED

PENDING -> REJECTED
PENDING -> EXPIRED
ACCEPTED -> REAUTHORIZED_FAILED
EXECUTED -> RECONCILIATION_REQUIRED
~~~

Approval binds to normalized arguments, user identity, scope, session,
resource ownership and expiry. An Accept action cannot be reused.

### Quiz authoring state machine

~~~text
REQUESTED
  -> REQUIREMENTS_COLLECTED
  -> CATEGORY_RESOLVED
  -> DRAFT_GENERATED
  -> QUESTIONS_VALIDATED
  -> PREVIEWED
  -> APPROVED
  -> CREATED_INACTIVE
  -> PUBLISH_VALIDATED
  -> PUBLISHED
~~~

Failure may return to DRAFT_GENERATED or QUESTIONS_VALIDATED. It must never
jump directly from model output to PUBLISHED.

### Knowledge state machine

~~~text
DRAFT -> REVIEW -> PUBLISHED
              └-> QUARANTINED
~~~

Only PUBLISHED and visibility-eligible content can support learner answers.

### Tool state machine

~~~text
DISCOVERED
  -> SELECTED
  -> ARGUMENTS_VALIDATED
  -> POLICY_CHECKED
  -> APPROVAL_CHECKED
  -> EXECUTING
  -> RESULT_VALIDATED
  -> RECORDED
~~~

Possible exits include denied, approval-required, timed-out, retriable,
reconciled and failed.

## 7. Planner contract

The planner is semantic, structured and independent from backend execution.

Input:

~~~text
current user message
bounded recent history
page context
trusted scope
available capability hints
~~~

Output:

~~~text
primary intent
secondary intents
confidence
ambiguity
clarification question
risk
route
normalized entities
missing fields
~~~

Planner output is untrusted until validated by the InteractionPlan schema and
intersected with server-owned policy.

Planner route meanings:

| Route | Meaning |
|---|---|
| respond | No backend action is required |
| tool | A read or safe tool workflow may run |
| clarify | Required input is missing or ambiguous |
| approval | A mutation proposal must be shown |
| abstain | Evidence or permissions are insufficient |

The planner must not create action URLs, assign permissions or declare backend
success.

## 8. Capability contract

A capability is a domain-level unit, not just a collection of tools.

~~~text
Capability
├── capability_id
├── supported_intents
├── allowed_roles
├── tool_manifest
├── input_contract
├── output_contract
├── risk_policy
├── evidence_policy
├── approval_policy
├── workflow
└── scenario tests
~~~

Target capabilities:

| Capability | Reads | Writes | Evidence |
|---|---|---|---|
| Discovery | quiz search, detail, categories | none | quiz citation |
| Learning | attempts, history, results | start attempt | backend attempt |
| Authoring | owned quiz/question state | create/update/delete | backend result |
| Question quality | source and draft data | draft only | source/validation records |
| Knowledge | published sources | import/review | source metadata |
| Account | identity and permissions | none | backend identity |

Capabilities should expose domain operations. The LLM should not know backend
URL details or database field translations.

## 9. Context assembly contract

The context builder receives RunContext and produces a model-specific request.

Required stages:

1. Add immutable runtime and safety instructions.
2. Add trusted identity and effective permissions in a non-user-controlled
   section.
3. Add the validated interaction plan.
4. Add the current user goal.
5. Add current workflow state and unfinished plan steps.
6. Add only tools allowed for the current capability and role.
7. Add relevant verified evidence.
8. Retrieve relevant memory and knowledge.
9. Add bounded recent conversation.
10. Apply size limits and compaction.
11. Mark every external result as untrusted data.
12. Add output schema and termination rules.

Context policies:

- Never include bearer tokens.
- Never include unbounded raw tool output.
- Never include every tool description by default.
- Never let retrieved text overwrite policy.
- Preserve current goal and constraints during compaction.
- Keep source and timestamp metadata with evidence.
- Keep model-facing context separate from audit payloads.

## 10. Tool runtime contract

The tool runtime is the only path from an agent decision to an external side
effect.

~~~text
ToolCall
  -> find ToolSpec
  -> check capability manifest
  -> check role permission
  -> validate arguments
  -> normalize aliases/enums
  -> resolve target
  -> check ownership
  -> check approval
  -> enforce budget
  -> execute with timeout
  -> classify failure
  -> validate result
  -> capture evidence
  -> redact result
  -> persist audit
  -> return ToolExecutionResult
~~~

Read tools should be safe to retry where possible. Write tools require:

- idempotency key;
- transaction or compensating behavior;
- backend authorization;
- post-write verification;
- user-visible result.

## 11. Verification contract

Every capability defines its own verification checks.

### Discovery checks

- result belongs to the requesting visibility scope;
- query match and fallback mode are distinct;
- citation points to a valid public resource;
- empty result cannot become a positive claim.

### Learning checks

- attempt belongs to the authenticated user;
- result references a real session;
- score and completion status come from backend data.

### Authoring checks

- category exists and is accessible;
- question types and options are valid;
- correct-answer cardinality matches type;
- no forbidden duplicate or empty content;
- draft is inactive before publish;
- publish readiness passes before publish.

### Knowledge checks

- source state is eligible;
- source visibility permits the current user;
- claims have source references;
- prompt injection in source is ignored.

### Output checks

- response schema is valid;
- no unsupported action is emitted;
- no private data leaks;
- citation requirements are satisfied;
- abstention is used when evidence is insufficient.

## 12. Recovery contract

Every error must become a typed outcome, not an unstructured exception.

~~~text
ValidationError
AuthorizationError
OwnershipError
ApprovalRequired
DependencyUnavailable
RateLimited
ModelTimeout
ToolTimeout
ContextLimit
BudgetExceeded
PromptInjectionDetected
VerificationFailed
IdempotencyConflict
ReconciliationRequired
Cancelled
Fatal
~~~

Recovery rules:

| Error | Default behavior |
|---|---|
| ValidationError | Repair once, then ask or fail |
| AuthorizationError | Stop and explain permission boundary |
| OwnershipError | Stop without revealing private details |
| ApprovalRequired | Pause and render approval |
| DependencyUnavailable | Retry with backoff, then user-safe error |
| ModelTimeout | Retry within budget or fallback |
| ToolTimeout | Reconcile before retrying side effects |
| ContextLimit | Compact and retry once |
| BudgetExceeded | Stop with bounded-run message |
| PromptInjectionDetected | Withhold or quarantine untrusted result |
| VerificationFailed | Repair, review or reject |
| IdempotencyConflict | Return original operation result |
| Cancelled | Persist cancellation and stop |
| Fatal | Fail with request ID, keep internal details in logs |

## 13. Security boundary

~~~text
Untrusted:
  user message
  browser fields
  uploaded documents
  web pages
  retrieved text
  tool output
  model output

Trusted:
  backend-authenticated identity
  backend permissions
  server-owned policy
  validated schemas
  backend transaction result
  approval store binding
  audit record
~~~

The harness must prevent data flow from an untrusted source into:

- authorization decisions;
- credential values;
- arbitrary URLs;
- executable commands;
- SQL outside an allowlist;
- cross-tenant memory;
- publish/delete decisions;
- system policy.

## 14. Storage model

The minimum durable records are:

~~~text
agent_runs
agent_run_events
agent_checkpoints
agent_tool_calls
agent_approvals
agent_memories
agent_evidence
agent_artifacts
agent_eval_results
~~~

The application database remains the owner of:

~~~text
users
roles
permissions
quizzes
questions
quiz_sessions
knowledge_sources
audit_events
~~~

The harness may reference these entities but must not duplicate them as a
second source of truth.

## 15. Observability model

Every run gets:

~~~text
request_id
run_id
thread_id
trace_id
agent_version
model_profile
~~~

Required spans:

~~~text
ingress
identity
planner
context
model
tool
backend
approval
subagent
verification
checkpoint
response
~~~

Required audit facts:

- who initiated the run;
- what intent was selected;
- what tools were offered and called;
- what arguments were normalized;
- what permissions were checked;
- what approval was accepted;
- what backend resource changed;
- what evidence supported the response;
- why the run stopped.

Credentials, authorization headers and sensitive payloads must be redacted.

## 16. Evaluation model

Each release should run scenarios across:

~~~text
general conversation
quiz discovery
recommendation
quiz detail
learning start/resume/result/history
quiz authoring
question generation
question validation
publish readiness
knowledge grounding
permissions
approval
prompt injection
tool failure
model timeout
context overflow
multi-turn state
~~~

A scenario records:

~~~text
input
trusted user/scope
page context
expected intent
allowed tools
forbidden tools
expected tool sequence
approval expectation
evidence expectation
expected outcome
~~~

Quality gates:

- no forbidden tool calls;
- correct identity boundary;
- no unauthorized write;
- valid approval behavior;
- valid citations;
- valid final schema;
- bounded steps/cost/time;
- safe recovery from injected failures.

## 17. Dependency rules

The following imports are allowed conceptually:

~~~text
API/Ingress
  -> Run Manager
  -> Harness contracts/policies
  -> Capabilities
  -> Tool Runtime
  -> Backend adapters

LangGraph adapter
  -> Harness contracts
  -> Capabilities
  -> Tool Runtime

Capabilities
  -> Domain contracts
  -> Tool Runtime interface
  -> Verification interface

Tool adapters
  -> Backend HTTP/MCP clients
  -> Domain normalization

Policies
  -> contracts only
  -> never UI or model provider implementation
~~~

Forbidden dependencies:

- backend adapters importing FastAPI request objects;
- tools deciding frontend route URLs;
- UI policy calling the LLM;
- model adapters deciding user permissions;
- capabilities reaching directly into Redis internals;
- tests depending on a personal database fixture;
- sub-agents bypassing the parent run budget;
- generic utilities importing agent business rules.

## 18. Current gaps to close

The existing implementation already covers many invariants. The main structural
gaps are:

1. agent_core.py owns too many responsibilities;
2. run budgets are spread across configuration and closures rather than one
   typed runtime object;
3. tool metadata and tool enforcement are partly separate;
4. quiz generation/quality is not yet a distinct domain capability;
5. long-term memory is smaller than the full conversation/knowledge model;
6. context compaction and artifact offloading are not a first-class boundary;
7. durable checkpointing exists but long-running job orchestration is limited;
8. verification is present for grounding and build status but needs a common
   contract;
9. the event vocabulary is useful but should gain run IDs, sequence and
   lifecycle semantics;
10. the scenario evaluator should grow into trajectory and policy testing.

These are extraction and strengthening tasks, not a reason to replace LangGraph.

## 19. Architectural decision

The project will use:

~~~text
LangGraph
  as the single primary orchestration loop

Pydantic models
  as contracts for state, plans, tools and outputs

NestJS
  as the system of record and authorization authority

Redis/Postgres
  for session, approval, checkpoint and durable runtime state

Typed capabilities
  for quiz-specific workflows

Deterministic verification
  before final response or publish

SSE events
  as the compatibility-preserving frontend protocol
~~~

No second competing agent loop will be added until the current run model and
budgets are explicit.


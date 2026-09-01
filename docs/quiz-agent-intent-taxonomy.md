# Quiz Agent Intent Taxonomy

## 1. Atomic dialogue primitives

- `request`: new standalone request.
- `correction`: replaces a previous interpretation (`à`, `ý tôi là`, `không phải`).
- `continuation`: continues a pending workflow (`tiếp tục`, `làm tiếp`).
- `confirmation`: approves a proposed action.
- `rejection`: rejects a proposal or interpretation.
- `selection`: chooses one item/category/resource.
- `clarification_answer`: supplies fields requested by the agent.
- `cancel`: stops a run or pending workflow.
- `help`: asks about capabilities.

Reference modes are `standalone`, `previous_turn`, `pending_workflow`, and
`explicit_resource`. Selection strategies are `none`, `exact`, `best_match`,
`only_option`, `first_available`, and `user_choice`.

## 2. Resource and operation axes

Resources: conversation, quiz, attempt, question, category, knowledge, account,
admin, time, system.

Operations: respond, help, search, recommend, detail, list, create, update,
delete, publish, unpublish, start, resume, result, history, submit-review,
review, inspect, abstain.

## 3. Leaf business intents

### Conversation

- `conversation_general`
- `capability_help`

### Quiz discovery

- `quiz_search`
- `quiz_recommend`
- `quiz_detail`

### Quiz authoring

- `quiz_owned`
- `quiz_create`
- `quiz_update`
- `quiz_delete`
- `quiz_publish`
- `quiz_unpublish`

### Learning and attempts

- `quiz_start`
- `quiz_resume`
- `quiz_result`
- `quiz_history`
- `quiz_attempts`
- `quiz_in_progress`

### Questions

- `question_list`
- `question_create`
- `question_update`
- `question_delete`
- `question_duplicate`
- `question_reorder`

### Categories

- `category_list`
- `category_recommend`
- `category_create`
- `category_update`
- `category_delete`

### Knowledge

- `knowledge_search`
- `knowledge_import`
- `knowledge_list`
- `knowledge_submit_review`
- `knowledge_review`

### Account and admin

- `account_identity`
- `account_permissions`
- `admin_dashboard`
- `admin_audit`

### System and safety

- `temporal`
- `auth_required`
- `no_evidence`
- `unsupported`

## 4. Execution contract

Each leaf intent has one catalog entry containing resource, operation, allowed
scopes, example, and reachable tools. Planner output also contains dialogue
act, reference mode, previous-turn reference, selection strategy, entities,
missing fields, risk, and route.

The server repairs high-risk contextual phrases deterministically before tool
scoping. Scope and identity always come from NestJS. Write intents remain
proposal-only until one-time approval is consumed.

## 5. Coverage gates

- Every leaf intent belongs to exactly one domain.
- Every leaf intent has metadata and an evaluation scenario.
- Every catalog tool is reachable from at least one leaf intent.
- `plan_interaction` remains an internal server-owned tool.
- Dialogue act, reference mode, and selection strategy are independently
  evaluated for contextual scenarios.

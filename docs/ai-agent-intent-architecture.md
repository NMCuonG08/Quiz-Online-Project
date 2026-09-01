# Quiz AI — semantic intent architecture

## Principle

Intent extraction is performed by LLM structured output using the current
message, recent conversation, page context and verified scope. Regex/keyword
rules must not decide intent. Deterministic code is limited to security/tool
boundaries and deciding when a fast plan must be verified by a stronger model.

## User-centered intent taxonomy

| User role | Intent | User goal | Typical route |
|---|---|---|---|
| Any | `conversation_general` | Greeting, thanks, casual conversation | Respond |
| Any | `capability_help` | Ask what Quiz AI can do | Respond |
| Learner | `quiz_search` | Find quiz matching a topic/query | Search tool |
| Learner | `quiz_recommend` | Ask for suitable/popular quiz recommendations | Topic search → general fallback |
| Any | `quiz_detail` | Inspect one quiz | Get tool + citation |
| Creator | `quiz_create` | Author a new quiz/draft | Collect fields → approval |
| Creator | `quiz_update` | Change an owned quiz | Resolve target → approval |
| Creator | `quiz_delete` | Delete an owned quiz | Confirmation → destructive approval |
| Creator | `quiz_publish` | Publish completed quiz | Validate build → approval |
| Creator | `quiz_unpublish` | Unpublish quiz | Approval |
| Learner | `quiz_start` | Start a quiz attempt | Approval/start tool |
| Learner | `quiz_resume` | Continue an unfinished attempt | Read state → start/resume |
| Learner | `quiz_result` | Inspect result for an attempt | Result tool |
| Learner | `quiz_history` | Review learning history/progress | History tools |
| Creator | `question_list` | View questions in owned quiz | Read tool |
| Creator | `question_create` | Add question/options | Approval |
| Creator | `question_update` | Edit question/options | Approval |
| Creator | `question_delete` | Delete question | Confirmation → approval |
| Creator | `question_duplicate` | Copy a question | Approval |
| Creator | `question_reorder` | Reorder quiz questions | Approval |
| Any | `category_list` | Browse categories | Read tool |
| Admin | `category_create` | Create category | Admin approval |
| Admin | `category_update` | Edit category | Admin approval |
| Admin | `category_delete` | Delete category | Admin destructive approval |
| Any | `knowledge_search` | Ask from published knowledge | Retrieval + citation |
| Creator | `knowledge_import` | Import URL/file/manual knowledge | Approval/import |
| Creator | `knowledge_list` | Inspect owned sources/status | Read tool |
| Creator | `knowledge_submit_review` | Submit draft for review | Approval |
| Admin | `knowledge_review` | Publish/quarantine source | Admin approval |
| Any | `account_identity` | Ask who am I/account profile | Verified identity tool |
| Any | `account_permissions` | Ask what account can do | Verified permission tools |
| Admin | `admin_dashboard` | View platform statistics | Admin read tool |
| Admin | `admin_audit` | Inspect audit events | Admin read tool |
| Any | `temporal` | Ask current date/time/relative date | Server-time tool |
| Any | `auth_required` | Request requires login | Login policy |
| Any | `no_evidence` | Request cannot be grounded | Abstain |
| Any | `unsupported` | Outside available product capability | Clarify/respond safely |

## Structured plan

Every planner returns:

```text
intent + secondary_intents
confidence + ambiguity
needs_clarification + clarification_question
risk + route
entities(topic/query/quiz/question/category/source/session)
missing_fields
```

This supports multi-intent utterances and conversation carry-over without
hard-coded phrase matching.

## Multi-model routing

```text
Fast planner (cheap/low latency)
  ├─ clear read, high confidence, no ambiguity → execute
  └─ low confidence / ambiguous / multi-intent / write / destructive / admin
       → Strong planner independently verifies and corrects
```

Recommended OpenAI defaults:

- Fast planner: `gpt-5.6-luna`.
- Executor: `gpt-5.6-terra`.
- Strong planner/verifier: `gpt-5.6-sol`.

All tiers have independent model, API key and base URL configuration, so an
OpenAI-compatible provider can be used per tier. Do not route solely from the
model's self-reported confidence; confidence is only one escalation signal.

## Example that previously failed

> “Tôi đang muốn làm quiz về chủ đề IT, recommend cho tôi được không?”

Expected semantic plan:

```json
{
  "intent": "quiz_recommend",
  "confidence": 0.95,
  "ambiguity": "none",
  "risk": "read",
  "route": "tool",
  "entities": { "topic": "IT", "query": "IT" }
}
```

It must never render the quiz creation form. It searches topic matches first;
when no exact result exists, it returns a clearly labeled general/popular
fallback with citations from real quiz records.

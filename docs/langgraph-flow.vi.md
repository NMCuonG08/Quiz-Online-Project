# Luồng LangGraph của Quiz AI Agent

Tài liệu này mô tả luồng đang chạy trong code hiện tại, tập trung vào đường
`AGENT_ORCHESTRATOR=langgraph`.

## 1. Tóm tắt kiến trúc

```mermaid
flowchart TD
    U[Người dùng] --> UI[Web AI Chat]
    UI --> BFF[Next.js BFF / proxy]
    BFF --> API[FastAPI: /chat hoặc /chat/stream]
    API --> AUTH[Đọc identity + permissions từ NestJS]
    AUTH --> RL[Rate limit + session lock]
    RL --> APPROVAL{Input là __approve__:token?}

    APPROVAL -->|Có| EXEC_APPROVAL[Kiểm tra approval token\n+execute write với idempotency key]
    APPROVAL -->|Không| PLANNER[Semantic Planner]

    PLANNER --> SPECIAL{Nhánh deterministic\ntrước graph?}
    SPECIAL -->|clarify| RESPONSE[Token + UI + citations + done]
    SPECIAL -->|search/recommend| DISCOVERY[Tool trực tiếp + format kết quả]
    SPECIAL -->|category selector| CATEGORY[Đọc categories + chọn category]
    SPECIAL -->|còn lại| GRAPH[LangGraph executor]

    GRAPH --> POST[Deterministic hậu xử lý]
    POST --> RESPONSE
    DISCOVERY --> RESPONSE
    CATEGORY --> RESPONSE
    EXEC_APPROVAL --> RESPONSE

    RESPONSE --> STORE[History + run store + trace + metrics]
```

Các thành phần chính:

| Thành phần | Vai trò |
|---|---|
| `AIAgentCore` | Facade điều phối request, session, planner, graph, approval và event stream. |
| `LangGraphQuizRunner.plan()` | Gọi planner nhanh/strong và trả về `InteractionPlan` đã validate. |
| `LangGraphQuizRunner.invoke()` | Tạo và chạy graph `router -> assistant/general_response -> tools`. |
| `ToolNode` | Chạy các tool do executor model yêu cầu. |
| `dispatch()` | Cầu nối từ `ToolNode` tới budget, cancellation, trace và tool runtime. |
| `ToolRuntime` | Boundary deterministic cho allowlist, RBAC scope, schema, timeout, approval và output contract. |
| `RunStore` / `AgentStateStore` | Lưu run durable, event, trace, history, approval token và checkpoint liên quan. |

## 2. Luồng request từ ngoài vào

Entry point chính nằm ở `ai-agent/services/main.py`:

1. Client gọi `/chat` hoặc `/chat/stream`.
2. FastAPI lấy `Authorization`; không tin role, user id hoặc scope do browser gửi.
3. `resolve_identity()` gọi NestJS `/api/auth/me` và `/api/auth/me/permissions`.
4. Server suy ra scope:
   - `admin` nếu là admin hoặc có quyền `all`;
   - `creator` nếu có `quiz.create`;
   - còn lại là `learner`.
5. Agent áp dụng rate limit và khóa theo `(user_id, session_id)`.
6. Nếu input bắt đầu bằng `__approve__:` thì request đi thẳng vào `_approve()`;
   nếu không thì đi vào `_stream_langgraph()`.

```mermaid
sequenceDiagram
    participant C as Client
    participant API as FastAPI
    participant N as NestJS Auth
    participant Core as AIAgentCore
    participant State as State/Run Store

    C->>API: POST /chat/stream + Authorization
    API->>N: GET /api/auth/me
    N-->>API: user identity + roles
    API->>N: GET /api/auth/me/permissions
    N-->>API: effective permissions
    API->>Core: stream_message(message, trusted user/scope)
    Core->>State: rate limit + session lock
    Core-->>C: SSE connected
```

## 3. Planner: chạy trước LangGraph executor

Planner không phải là node trong `StateGraph`. Đây là một model call độc lập
được thực hiện trước `LangGraphQuizRunner.invoke()`.

```mermaid
flowchart TD
    P0[User input + route + scope + 6 message gần nhất]
    P0 --> FAST[Fast planner\nplan_interaction tool bắt buộc]
    FAST --> VALIDATE[Extract + Pydantic validate\nInteractionPlan]
    VALIDATE --> ESC{Cần escalate?}

    ESC -->|Không| PLAN[Fast plan]
    ESC -->|Có| STRONG[Strong planner / verifier]
    STRONG --> STRONG_OK{Strong planner thành công?}
    STRONG_OK -->|Có| PLAN2[Strong plan]
    STRONG_OK -->|Không, fast có| PLAN
    STRONG_OK -->|Không, fast lỗi| FALLBACK[Fallback:\nunsupported + clarification]

    PLAN --> POLICY[Server materialize policy]
    PLAN2 --> POLICY
    FALLBACK --> POLICY
```

Planner sẽ escalate khi có ít nhất một điều kiện:

- confidence thấp hơn ngưỡng, mặc định `0.82`;
- ambiguity cao;
- cần clarification;
- có secondary intent;
- intent/risk là write, destructive hoặc admin khi bật
  `planner_escalate_writes`.

`InteractionPlan` gồm intent, entities, confidence, ambiguity, risk, route,
missing fields và câu hỏi clarification. Plan chỉ là đề xuất chưa được tin
tưởng tuyệt đối; server vẫn hydrate form, áp dụng category context và giới hạn
tool theo intent + scope.

## 4. Các nhánh deterministic trước graph

Sau khi plan hợp lệ, code không phải lúc nào cũng gọi executor graph.

```mermaid
flowchart TD
    PLAN[Validated InteractionPlan]
    PLAN --> CLARIFY{needs_clarification?}
    CLARIFY -->|Có| C[Trả câu hỏi làm rõ\n+policy UI nếu có\n+END]
    CLARIFY -->|Không| CAT{category selector đặc biệt?}
    CAT -->|Có| CAT_TOOL[list_categories]
    CAT_TOOL --> CAT_PICK[Chọn category từ dữ liệu thật]
    CAT_PICK --> CAT_RESP[Trả text + UI + done]
    CAT -->|Không| DISC{quiz_search hoặc\nquiz_recommend?}
    DISC -->|Có| D_TOOL[search_quizzes hoặc recommend_quizzes]
    D_TOOL --> D_RESP[Format kết quả + citations + done]
    DISC -->|Không| EXEC[LangGraph executor]
```

Lý do của các nhánh này là các workflow đã biết trước nên được xử lý trực
tiếp, giảm một vòng model và giữ kết quả dễ audit hơn.

## 5. Graph LangGraph thực tế

Graph được tạo trong `LangGraphQuizRunner.invoke()` bằng
`StateGraph(MessagesState)`.

```mermaid
flowchart LR
    START((START)) --> ROUTER[router]

    ROUTER -->|conversation_general\nhoặc capability_help| GENERAL[general_response\nLLM không có tool schema]
    GENERAL --> END1((END))

    ROUTER -->|Các intent khác| ASSISTANT[assistant\nexecutor LLM + allowed tools]
    ASSISTANT -->|Không có tool call| END2((END))
    ASSISTANT -->|Có tool call| TOOLS[tools\nToolNode]
    TOOLS -->|approval / budget / cancel| END3((END))
    TOOLS -->|Được phép tiếp tục| ASSISTANT
```

### Node và edge

| Node/edge | Hành vi trong code |
|---|---|
| `START -> router` | Tất cả request executor bắt đầu tại router. |
| `router` | Dùng `interaction_intent` đã được planner xác định; không tự phân loại lại. |
| `router -> general_response` | Dành cho `conversation_general` và `capability_help`; gọi executor LLM không bind tools. |
| `router -> assistant` | Các intent cần tool hoặc agent reasoning. |
| `assistant` | Gọi executor LLM với message context và tool schemas đã allowlist. |
| `assistant -> END` | Model trả câu trả lời cuối, không có tool call. |
| `assistant -> tools` | Model sinh một hoặc nhiều tool calls. `tools_condition` quyết định edge này. |
| `tools` | `ToolNode` chạy wrapper tool; wrapper chuyển request vào `dispatch()`. |
| `tools -> assistant` | Chỉ khi không có approval request, budget block hoặc cancellation. Model nhận tool result để tiếp tục vòng ReAct. |
| `tools -> END` | Dừng sau tool khi cần approval, vượt budget hoặc run bị cancel. |

### Message context đưa vào graph

Trước `compiled.ainvoke()`, `ContextBuilder` tạo context snapshot gồm:

1. system/runtime policy;
2. bounded conversation history;
3. trusted interaction plan;
4. page context như route, quiz/source đang chọn;
5. memory liên quan;
6. evidence/citations đã thu thập;
7. user message hiện tại.

Sau đó snapshot được chuyển thành:

```text
SystemMessage(system_message)
HumanMessage/AIMessage(history...)
HumanMessage(current_user_message)
```

Graph dùng `MessagesState`, còn budget, approval, citations, cancellation,
surface UI và run lifecycle được giữ ở closure của `_stream_langgraph()` và
được cập nhật qua callback/`dispatch()`.

## 6. Chi tiết vòng ToolNode

Mỗi tool call từ executor đi qua `dispatch(name, args)`.

```mermaid
flowchart TD
    CALL[ToolNode nhận tool call]
    CALL --> CANCEL{Run đã cancel?}
    CANCEL -->|Có| STOP_CANCEL[Trả RUN_CANCELLED\ntrace + dừng graph]
    CANCEL -->|Không| BUDGET[consume_tool_call]
    BUDGET --> BUDGET_OK{Còn budget?}
    BUDGET_OK -->|Không| STOP_BUDGET[budget_blocked\ntrace + dừng graph]
    BUDGET_OK -->|Có| LOOP{Tool tra cứu bị lặp rỗng?}
    LOOP -->|Có| STOP_LOOP[empty_repeat_blocked\nhoặc empty_streak_stop]
    LOOP -->|Không| TRACE[trace start + status SSE]
    TRACE --> EXEC[_execute_tool]
    EXEC --> RUNTIME{Tool có ToolSpec?}
    RUNTIME -->|Có| RT[ToolRuntime]
    RUNTIME -->|Không| LEGACY[Legacy tool path]
    RT --> POLICY[Allowlist + scope + approval contract]
    POLICY --> NORMALIZE[Normalize + validate arguments]
    NORMALIZE --> HANDLER[Handler với timeout]
    HANDLER --> OUTPUT[Validate size + output contract]
    LEGACY --> OUTPUT2[Validate/authorize/execute legacy handler]
    OUTPUT --> RESULT[Tool result + surface + citations]
    OUTPUT2 --> RESULT
    RESULT --> TRACE2[trace success/error + metrics]
    TRACE2 --> MODEL[ToolMessage về assistant LLM]
```

Các lớp bảo vệ chính:

- allowlist theo `scope` và `INTENT_ALLOWED_TOOLS`;
- xác thực schema input/output;
- timeout theo từng `ToolSpec`;
- giới hạn kích thước kết quả;
- idempotency key cho write execute;
- audit và metrics;
- chặn gọi lặp cùng tool/cùng args khi kết quả rỗng;
- không cho web result hoặc knowledge result thay đổi policy/permission.

## 7. Read flow và write flow

### Read flow

Ví dụ: người dùng hỏi danh sách quiz.

```mermaid
flowchart LR
    Q[User hỏi tìm quiz] --> P[Planner: quiz_search]
    P --> T[search_quizzes]
    T --> BACKEND[NestJS / database]
    BACKEND --> TM[ToolMessage]
    TM --> A[assistant tiếp tục hoặc trả lời]
    A --> V[Verifying]
    V --> R[Token + UI/citations + done]
```

Với truy vấn `quiz_search`/`quiz_recommend`, implementation hiện tại thường
chạy tool trực tiếp sau planner rồi format câu trả lời, không đi qua
`assistant` graph.

### Write flow

Write không được thực thi ngay khi model gọi tool.

```mermaid
flowchart TD
    W[User yêu cầu tạo/sửa/xóa/publish]
    W --> P[Planner mạnh hơn nếu cần]
    P --> A[assistant]
    A --> T[ToolNode -> dispatch]
    T --> PROP[Tool propose phase]
    PROP --> CHECK[Auth/RBAC/ownership/validation]
    CHECK --> AP[Trả approval_required + UI button]
    AP --> END[Graph END]
    END --> WAIT[run status: waiting_for_approval]
    WAIT --> USER[User bấm Accept]
    USER --> TOKEN[Client gửi __approve__:token]
    TOKEN --> VERIFY[consume approval token + kiểm tra\nuser/scope/auth fingerprint/TTL]
    VERIFY --> EXEC[execute phase + idempotency key]
    EXEC --> BACKEND[Backend transaction]
    BACKEND --> SUCCESS[write_executed + kết quả thật]
```

Điểm cần nhớ:

- `ToolNode` chỉ tạo proposal cho write tool.
- Approval hiện tại không dùng `langgraph.types.interrupt()`.
- Request approve đi vào `_approve()` bên ngoài graph.
- Chỉ sau khi token hợp lệ, `_execute_tool(..., phase="execute", approval_verified=True)`
  mới được gọi.
- Kết quả thành công phải đến từ backend; agent không tự tuyên bố mutation đã thành công.

## 8. Workflow đặc biệt: tạo quiz hoàn chỉnh

`quiz_create` có hậu xử lý deterministic trong `_stream_langgraph()`:

```mermaid
flowchart TD
    P[Plan quiz_create]
    P --> F{Đủ field quiz?}
    F -->|Không| GRAPH[Executor graph hỏi thêm hoặc xử lý]
    F -->|Có| CAT[list_categories nếu graph chưa gọi]
    CAT --> MATCH{Category name khớp id thật?}
    MATCH -->|Không| MISMATCH[Trả UI chọn category]
    MATCH -->|Có| PROPOSAL[Build create_quiz proposal]
    PROPOSAL --> APPROVAL[dispatch create_quiz\napproval proposal]
    APPROVAL --> WAIT[waiting_for_approval]
```

Điều này bảo đảm model không tự bịa `category_id` và không dừng sớm sau khi
chỉ đọc danh sách categories.

## 9. Lifecycle, event và persistence

Mỗi LangGraph run có:

- `trace_id`/`run_id`;
- `thread_id` hash từ `user_id:session_id` để phục vụ checkpoint;
- `RunContext` với plan, status, budgets và usage;
- event sequence cho SSE và replay;
- trace node/event/tool;
- chat history giới hạn 20 message;
- optional Postgres checkpointer nếu cấu hình `AGENT_CHECKPOINTER=postgres`.

```mermaid
stateDiagram-v2
    [*] --> authenticating
    authenticating --> planning
    planning --> context_building
    context_building --> executing
    executing --> verifying
    executing --> waiting_for_approval
    executing --> cancelled
    executing --> failed
    executing --> expired
    verifying --> responding
    responding --> completed
    waiting_for_approval --> executing: approve
    waiting_for_approval --> expired: token hết hạn
    waiting_for_approval --> cancelled
    waiting_for_approval --> failed
```

Các event thường phát ra qua SSE gồm `connected`, `run_started`, `status`,
`trace`, `token`, `ui`, `citations`, `done` và `error`.

## 10. Safety limits mặc định

Các giá trị mặc định được nạp trong `ai-agent/services/main.py`:

| Giới hạn | Mặc định |
|---|---:|
| Graph steps / recursion limit | 12 |
| Executor graph timeout | 90 giây |
| Planner fast timeout | 8 giây |
| Planner strong timeout | 25 giây |
| Tổng model calls | 24 |
| Tổng tool calls | 32 |
| Tổng tokens | 100.000 |
| Estimated cost | 5 USD |
| Empty retrieval streak | 2 |

Khi chạm budget, cancellation hoặc approval stop, `dispatch()` trả kết quả
an toàn và guarded edge đưa graph tới `END`. Run context vẫn được cập nhật để
UI/API có thể xem status và usage.

## 11. Ví dụ trace ngắn

### Câu hỏi đọc dữ liệu

```text
planner:classified intent=quiz_detail
router:handoff tool/assistant
assistant:start
ToolNode:start tool=get_quiz
ToolNode:success tool=get_quiz
assistant: model trả lời
graph:completed
done
```

### Yêu cầu tạo quiz

```text
planner:classified intent=quiz_create
ToolNode:start tool=list_categories
ToolNode:success tool=list_categories
orchestrator:auto_propose tool=create_quiz
ToolNode:success tool=create_quiz   # proposal, chưa execute
graph:approval_stop
run_status=waiting_for_approval
```

### Sau khi người dùng Accept

```text
approval token verified
execute phase
backend transaction
write_executed
done intent=approved_write
```

## 12. Source code tham chiếu

- [`ai-agent/services/main.py`](../ai-agent/services/main.py) — FastAPI entrypoint, auth và cấu hình.
- [`ai-agent/services/agent_core.py`](../ai-agent/services/agent_core.py) — request lifecycle, planner integration, dispatch, approval và event stream.
- [`ai-agent/services/langgraph_runner.py`](../ai-agent/services/langgraph_runner.py) — planner và `StateGraph` executor.
- [`ai-agent/services/intent_schema.py`](../ai-agent/services/intent_schema.py) — `InteractionPlan`, intent và allowed tools.
- [`ai-agent/services/harness/tool_runtime.py`](../ai-agent/services/harness/tool_runtime.py) — deterministic tool boundary.
- [`ai-agent/services/policies/tool_policy.py`](../ai-agent/services/policies/tool_policy.py) — scope/allowlist policy.
- [`ai-agent/services/policies/approval_policy.py`](../ai-agent/services/policies/approval_policy.py) — approval contract.
- [`ai-agent/services/harness/budgets.py`](../ai-agent/services/harness/budgets.py) — graph/model/tool/token/cost budget.


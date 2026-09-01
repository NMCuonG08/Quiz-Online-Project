import asyncio
import unittest
import httpx
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import ANY, AsyncMock
from langchain_core.messages import AIMessage
from zoneinfo import ZoneInfo

from services.agent_core import (
    AIAgentCore,
    GROUNDED_RETRIEVAL_TOOLS,
    RETRY_GUARDED_TOOLS,
    SCOPE_TOOLS,
    INTENT_ALLOWED_TOOLS,
    WRITE_TOOLS,
    runtime_system_prompt,
)
from services.web_search import WebSearchProvider
from services.state_store import AgentStateStore
from services.tools import MCPToolWrapper
from services.evaluation import RetrievalCase, evaluate_retrieval
from services.observability import AgentMetrics
from services.protocol import ChatRequest
from services.ui_policy import UiPolicyResolver
from services.langgraph_runner import LangGraphQuizRunner
from services.intent_schema import ALL_INTENTS, INTENT_DOMAINS, INTENT_METADATA, InteractionPlan
from services.tool_catalog import TOOLS


class ApprovalContractTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.core = AIAgentCore({})
        self.state = self.core._session("session-1", "user-1")
        self.core.tools.append_chat_history = AsyncMock(return_value={})

    async def test_write_creates_pending_one_time_approval(self):
        result, surface, _ = await self.core._execute_tool(
            "delete_quiz", {"quiz_id": "quiz-1", "confirmed": True},
            "Bearer token", "user-1", "creator",
        )
        self.assertTrue(result["approval_required"])
        self.assertEqual(surface.actions[0].kind, "approve")
        self.core.tools.delete_quiz = AsyncMock(return_value={"id": "quiz-1"})
        events = [event async for event in self.core._approve(
            surface.actions[0].value, "Bearer token", "user-1", "creator",
        )]
        self.assertEqual(events[-1]["intent"], "approved_write")
        self.core.tools.delete_quiz.assert_awaited_once_with(
            "quiz-1", "Bearer token", idempotency_key=ANY,
        )
        replay = [event async for event in self.core._approve(
            surface.actions[0].value, "Bearer token", "user-1", "creator",
        )]
        self.assertEqual(replay[0]["type"], "error")

    async def test_approval_rejects_different_user_or_token(self):
        _, surface, _ = await self.core._execute_tool(
            "delete_quiz", {"quiz_id": "quiz-1", "confirmed": True},
            "Bearer token", "user-1", "creator",
        )
        events = [event async for event in self.core._approve(
            surface.actions[0].value, "Bearer other", "user-2", "creator",
        )]
        self.assertEqual(events[0]["type"], "error")
        self.core.tools.delete_quiz = AsyncMock(return_value={"id": "quiz-1"})
        events = [event async for event in self.core._approve(
            surface.actions[0].value, "Bearer token", "user-1", "creator",
        )]
        self.assertEqual(events[-1]["intent"], "approved_write")

    async def test_delete_requires_explicit_confirmation_before_approval(self):
        with self.assertRaisesRegex(ValueError, "DELETE_CONFIRMATION_REQUIRED"):
            await self.core._execute_tool(
                "delete_quiz", {"quiz_id": "quiz-1", "confirmed": False},
                "Bearer token", "user-1", "creator",
            )

    async def test_create_quiz_approval_keeps_resource_id_and_followup_actions(self):
        self.core.tools.list_categories = AsyncMock(return_value={
            "items": [{"id": "category-1", "name": "Lập trình"}],
        })
        _, surface, _ = await self.core._execute_tool(
            "create_quiz", {
                "title": "Python", "slug": "python", "category_id": "category-1",
                "difficulty_level": "beginner", "quiz_type": "multiple_choice", "time_limit": 600,
            },
            "Bearer token", "user-1", "creator",
        )
        self.assertEqual(surface.title, "Xác nhận tạo quiz")
        self.assertEqual(surface.actions[0].label, "Tạo quiz")
        self.assertEqual(surface.blocks[0].type, "list")
        summary = {item.label: item.value for item in surface.blocks[0].items}
        self.assertEqual(summary["Danh mục"], "Lập trình")
        self.assertEqual(summary["Độ khó"], "Dễ")
        self.assertEqual(summary["Loại quiz"], "Nhiều đáp án")
        self.assertEqual(summary["Thời gian"], "10 phút")
        self.assertNotIn("category-1", str(surface.model_dump()))
        self.core.tools.create_quiz = AsyncMock(return_value={"id": "quiz-1", "title": "Python"})
        events = [event async for event in self.core._approve(
            surface.actions[0].value, "Bearer token", "user-1", "creator", "session-1",
        )]
        self.assertEqual(
            next(event["delta"] for event in events if event["type"] == "token"),
            "Tạo quiz thành công.",
        )
        result_surface = next(event["surface"] for event in events if event["type"] == "ui")
        self.assertEqual(result_surface["actions"][0]["kind"], "prompt")
        self.assertIn("quiz-1", str(result_surface))
        memory = await self.core.state_store.get_chat_messages("user-1", "session-1")
        self.assertIn("quiz-1", memory[-1]["content"])
        payload = self.core.tools.create_quiz.await_args.args[0]
        self.assertEqual(payload["difficulty_level"], "EASY")
        self.assertEqual(payload["quiz_type"], "MULTIPLE_CHOICE")

    async def test_stream_persists_render_metadata_for_reload(self):
        async def fake_events(*_args, **_kwargs):
            yield {"type": "token", "delta": "Đề xuất đã sẵn sàng."}
            yield {"type": "ui", "surface": {
                "title": "Xác nhận tạo quiz", "description": "Kiểm tra thông tin",
                "blocks": [],
                "actions": [{
                    "id": "approve", "label": "Tạo quiz", "kind": "approve",
                    "value": "approval-token", "variant": "primary",
                }],
            }}
            yield {"type": "trace", "trace_id": "trace-1", "node": "graph", "event": "approval_stop"}
            yield {"type": "done", "intent": "quiz_create", "agent": "test-model", "tool": "create_quiz"}

        self.core._stream_message_events = fake_events
        events = [event async for event in self.core.stream_message(
            "Tạo quiz Python", "user-1", "Bearer token", "session-1", scope="creator",
        )]

        self.assertEqual(events[-1]["type"], "done")
        messages = self.core.tools.append_chat_history.await_args.args[2]
        self.assertEqual(messages[0], {"role": "user", "content": "Tạo quiz Python"})
        metadata = messages[1]["metadata"]
        self.assertEqual(metadata["surface"]["actions"][0]["value"], "approval-token")
        self.assertEqual(metadata["tool"], "create_quiz")
        self.assertEqual(metadata["trace_id"], "trace-1")
        self.assertIn("approval_expires_at", metadata)

    async def test_approval_persistence_hides_transport_message_and_marks_token_resolved(self):
        async def fake_events(*_args, **_kwargs):
            yield {"type": "token", "delta": "Quiz đã được tạo."}
            yield {"type": "done", "intent": "approved_write", "agent": "test-model", "tool": "create_quiz"}

        self.core._stream_message_events = fake_events
        _ = [event async for event in self.core.stream_message(
            "__approve__:approval-token", "user-1", "Bearer token", "session-1", scope="creator",
        )]

        messages = self.core.tools.append_chat_history.await_args.args[2]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["role"], "assistant")
        self.assertEqual(messages[0]["metadata"]["resolved_approval_token"], "approval-token")
        self.assertTrue(messages[0]["metadata"]["approval_succeeded"])
        self.assertNotIn("__approve__", str(messages))

    def test_every_write_tool_has_a_valid_result_surface(self):
        for name in WRITE_TOOLS:
            surface = self.core._build_write_result_surface(
                name,
                {"quiz_id": "quiz-1", "slug": "python", "title": "Python"},
                {"id": "resource-1", "quiz_id": "quiz-1", "slug": "python", "title": "Python"},
                "creator",
                "resource-1",
                "Python",
            )
            self.assertTrue(surface.title, name)
            self.assertTrue(surface.blocks, name)
            for action in surface.actions:
                if action.kind == "navigate":
                    self.assertTrue(action.value.startswith("/"), name)

    def test_backend_validation_errors_are_human_readable(self):
        request = httpx.Request("POST", "http://backend.test/api/questions")
        response = httpx.Response(400, request=request, json={
            "error": {
                "message": "Dữ liệu gửi lên không hợp lệ.",
                "details": [{"field": "option_text", "message": "Giá trị không hợp lệ"}],
            },
        })
        error = httpx.HTTPStatusError("bad request", request=request, response=response)
        message = self.core._safe_tool_error(error)
        self.assertEqual(
            message,
            "Dữ liệu gửi lên không hợp lệ. option_text: Giá trị không hợp lệ",
        )
        self.assertNotIn("BACKEND_HTTP", message)

    async def test_legacy_pending_approval_is_normalized_before_execution(self):
        await self.core.state_store.create_approval("legacy-token", {
            "name": "create_quiz",
            "args": {
                "title": "Python", "slug": "python", "category_id": "category-1",
                "difficulty_level": "beginner", "quiz_type": "multiple_choice", "time_limit": 600,
            },
            "user_id": "user-1",
            "scope": "creator",
            "authorization_fingerprint": self.core.state_store.authorization_fingerprint("Bearer token"),
        })
        self.core.tools.create_quiz = AsyncMock(return_value={"id": "quiz-legacy", "title": "Python"})

        events = [event async for event in self.core._approve(
            "legacy-token", "Bearer token", "user-1", "creator", "session-1",
        )]

        self.assertEqual(events[-1]["intent"], "approved_write")
        payload = self.core.tools.create_quiz.await_args.args[0]
        self.assertEqual(payload["difficulty_level"], "EASY")
        self.assertEqual(payload["quiz_type"], "MULTIPLE_CHOICE")

    async def test_vietnamese_quiz_enums_are_normalized_before_execution(self):
        self.core.tools.create_quiz = AsyncMock(return_value={"id": "quiz-vi", "title": "AI for beginner"})

        result = await self.core._execute_write("create_quiz", {
            "title": "AI for beginner", "slug": "ai-for-beginner", "category_id": "category-1",
            "difficulty_level": "Dễ", "quiz_type": "Trắc nghiệm", "time_limit": 600,
        }, "Bearer token")

        self.assertEqual(result["id"], "quiz-vi")
        payload = self.core.tools.create_quiz.await_args.args[0]
        self.assertEqual(payload["difficulty_level"], "EASY")
        self.assertEqual(payload["quiz_type"], "MULTIPLE_CHOICE")
        question = self.core._normalize_write_args("create_question", {
            "difficulty_level": "Trung bình", "question_type": "Đúng / Sai",
        })
        self.assertEqual(question["difficulty_level"], "MEDIUM")
        self.assertEqual(question["question_type"], "TRUE_FALSE")

    async def test_question_option_aliases_are_normalized_and_rendered_for_review(self):
        _, surface, _ = await self.core._execute_tool("create_question", {
            "quiz_id": "quiz-1", "question_text": "AI là gì?",
            "question_type": "single_choice",
            "options": [
                {"content": "Trí tuệ nhân tạo", "is_correct": True, "sort_order": 1},
                {"text": "Một hệ điều hành", "is_correct": False, "sort_order": 2},
            ],
        }, "Bearer token", "user-1", "creator")

        options_block = next(block for block in surface.blocks if block.id == "question-options")
        self.assertEqual(options_block.rows[0][1], "Trí tuệ nhân tạo")
        self.assertEqual(options_block.rows[0][2], "Đúng")

    async def test_question_without_option_text_is_rejected_before_approval(self):
        with self.assertRaisesRegex(ValueError, "TOOL_ARGUMENT_INVALID"):
            await self.core._execute_tool("create_question", {
                "quiz_id": "quiz-1", "question_text": "AI là gì?",
                "question_type": "SINGLE_CHOICE",
                "options": [
                    {"is_correct": True, "sort_order": 1},
                    {"is_correct": False, "sort_order": 2},
                ],
            }, "Bearer token", "user-1", "creator")

        self.core.tools.create_question = AsyncMock(return_value={"id": "should-not-run"})
        with self.assertRaisesRegex(ValueError, "TOOL_ARGUMENT_INVALID"):
            await self.core._execute_write("create_question", {
                "quiz_id": "quiz-1", "question_text": "AI là gì?",
                "question_type": "SINGLE_CHOICE",
                "options": [
                    {"is_correct": True, "sort_order": 1},
                    {"is_correct": False, "sort_order": 2},
                ],
            }, "Bearer token")
        self.core.tools.create_question.assert_not_awaited()

    async def test_complete_quiz_tool_creates_draft_then_questions(self):
        self.core.tools.create_quiz_with_questions = AsyncMock(return_value={
            "id": "quiz-1", "title": "Python", "questions_created": 2,
            "question_ids": ["q-1", "q-2"], "is_active": False,
        })
        result = await self.core._execute_write("create_quiz_with_questions", {
            "title": "Python", "slug": "python", "category_id": "category-1",
            "difficulty_level": "EASY", "time_limit": 600, "quiz_type": "MULTIPLE_CHOICE",
            "questions": [
                {"question_text": "Q1", "question_type": "SINGLE_CHOICE", "options": [
                    {"option_text": "A", "is_correct": True, "sort_order": 1},
                    {"option_text": "B", "is_correct": False, "sort_order": 2},
                ]},
                {"question_text": "Q2", "question_type": "SINGLE_CHOICE", "options": [
                    {"option_text": "A", "is_correct": False, "sort_order": 1},
                    {"option_text": "B", "is_correct": True, "sort_order": 2},
                ]},
            ],
        }, "Bearer token")
        self.assertEqual(result["id"], "quiz-1")
        self.assertEqual(result["questions_created"], 2)
        self.assertFalse(result["is_active"])
        self.core.tools.create_quiz_with_questions.assert_awaited_once()


class ScopeContractTests(unittest.TestCase):
    def test_learner_cannot_receive_write_tools(self):
        self.assertFalse(SCOPE_TOOLS["learner"] & {"create_quiz", "delete_quiz", "create_question"})

    def test_creator_can_receive_write_tools(self):
        self.assertIn("create_quiz", SCOPE_TOOLS["creator"])

    def test_web_search_is_read_only_for_all_scopes(self):
        for scope in SCOPE_TOOLS.values():
            self.assertIn("web_search", scope)

    def test_published_knowledge_search_is_available_to_all_scopes(self):
        for scope in SCOPE_TOOLS.values():
            self.assertIn("search_knowledge", scope)

    def test_only_internal_retrieval_requires_grounded_citation(self):
        self.assertEqual(
            GROUNDED_RETRIEVAL_TOOLS,
            {"search_quizzes", "get_quiz", "search_knowledge"},
        )

    def test_chat_completions_tool_schema_is_openai_compatible(self):
        tools = AIAgentCore({"llm_api_mode": "chat_completions"})._chat_tools({"search_quizzes"})
        self.assertEqual(tools[0]["type"], "function")
        self.assertEqual(tools[0]["function"]["name"], "search_quizzes")
        self.assertIn("parameters", tools[0]["function"])

    def test_interaction_planning_is_available_to_all_scopes(self):
        for scope in SCOPE_TOOLS.values():
            self.assertIn("plan_interaction", scope)

    def test_current_time_tool_is_available_to_all_scopes(self):
        for scope in SCOPE_TOOLS.values():
            self.assertIn("get_current_time", scope)

    def test_runtime_prompt_uses_server_time_and_forbids_unsolicited_dates(self):
        prompt = runtime_system_prompt(datetime(2030, 2, 3, 4, 5, tzinfo=ZoneInfo("Asia/Ho_Chi_Minh")))
        self.assertIn("03/02/2030", prompt)
        self.assertIn("Không tự nêu ngày hoặc giờ", prompt)


class UiPolicyContractTests(unittest.TestCase):
    def setUp(self):
        self.policy = UiPolicyResolver()

    def test_creator_quiz_create_gets_server_owned_form_and_route(self):
        surface = self.policy.resolve(
            {"intent": "quiz_create", "missing_fields": ["title", "time_limit"]},
            "creator",
            {"route": "/user/quizzes"},
        )
        self.assertEqual(surface.actions[0].value, "/user/quizzes/add")
        self.assertEqual(surface.blocks[0].type, "form")

    def test_completed_quiz_form_does_not_render_again(self):
        plan = {
            "intent": "quiz_create",
            "missing_fields": ["title", "category", "difficulty", "time_limit", "quiz_type"],
            "entities": {},
        }
        hydrated = AIAgentCore._hydrate_form_submission(
            plan,
            "Dùng thông tin sau để tiếp tục tạo quiz: Tên quiz: a; "
            "Chủ đề / category: a; Độ khó: EASY; Thời gian (giây): 12; "
            "Loại quiz: MULTIPLE_CHOICE",
        )
        surface = self.policy.resolve(hydrated, "creator", {"route": "/user/quizzes"})
        self.assertEqual(hydrated["missing_fields"], [])
        self.assertEqual(surface.title, "Đã đủ thông tin tạo quiz")
        self.assertEqual(surface.blocks[0].type, "notice")

    def test_complete_quiz_plan_builds_create_proposal_from_real_category(self):
        proposal = AIAgentCore._build_quiz_create_proposal(
            {
                "entities": {
                    "title": "Python cơ bản",
                    "category": "Lập trình",
                    "difficulty_level": "EASY",
                    "time_limit": 12,
                    "quiz_type": "MULTIPLE",
                }
            },
            {"list_categories": {"items": [{"id": "cat-1", "name": "Lập trình", "slug": "lap-trinh"}]}},
        )
        self.assertEqual(proposal["category_id"], "cat-1")
        self.assertEqual(proposal["quiz_type"], "MULTIPLE_CHOICE")
        self.assertEqual(proposal["slug"], "python-co-ban")

    def test_category_selection_request_is_detected_in_vietnamese(self):
        self.assertTrue(AIAgentCore._is_category_selection_request(
            "Có các catrgoy nào bạn chọn 1 cái phù hợp nhất là được"
        ))

    def test_owned_quiz_followup_is_not_reclassified_as_search(self):
        repaired = AIAgentCore._repair_owned_quiz_followup(
            {"intent": "quiz_history", "confidence": 0.95},
            "à quiz tôi đã tạo cơ",
        )
        self.assertEqual(repaired["intent"], "quiz_owned")
        self.assertEqual(repaired["risk"], "read")

    def test_learning_followups_have_distinct_intents(self):
        attempts = AIAgentCore._repair_learning_and_category_intent(
            {}, "Cho tôi xem các lần làm quiz của tôi"
        )
        in_progress = AIAgentCore._repair_learning_and_category_intent(
            {}, "Tôi còn quiz nào đang làm dở không?"
        )
        categories = AIAgentCore._repair_learning_and_category_intent(
            {}, "Có category nào, chọn một cái phù hợp nhất"
        )
        self.assertEqual(attempts["intent"], "quiz_attempts")
        self.assertEqual(in_progress["intent"], "quiz_in_progress")
        self.assertEqual(categories["intent"], "category_recommend")

    def test_single_available_category_is_selected_for_completed_form(self):
        proposal = AIAgentCore._build_quiz_create_proposal(
            {
                "entities": {
                    "title": "Quiz thử",
                    "category": "a",
                    "difficulty_level": "EASY",
                    "time_limit": 12,
                    "quiz_type": "MULTIPLE_CHOICE",
                }
            },
            {"list_categories": {"items": [{"id": "cat-only", "name": "AI Evaluation"}]}},
        )
        self.assertEqual(proposal["category_id"], "cat-only")

    def test_learner_quiz_create_gets_login_instead_of_creator_route(self):
        surface = self.policy.resolve({"intent": "quiz_create"}, "learner", {"route": "/"})
        self.assertEqual(surface.actions[0].value, "/auth/login")

    def test_authenticated_learner_quiz_create_opens_manager_instead_of_login(self):
        surface = self.policy.resolve({"intent": "quiz_create"}, "learner", {"route": "/", "is_authenticated": True})
        self.assertEqual(surface.actions[0].value, "/user/quizzes")

    def test_authenticated_learner_inside_manager_reports_missing_permission(self):
        surface = self.policy.resolve({"intent": "quiz_create"}, "learner", {"route": "/user/quizzes/add", "is_authenticated": True})
        self.assertEqual(surface.title, "Thiếu quyền tạo quiz")
        self.assertNotEqual(surface.actions[0].value, "/auth/login")

    def test_page_context_rejects_external_route(self):
        with self.assertRaises(ValueError):
            ChatRequest(message="hello", context={"route": "https://evil.example"})

    def test_chat_request_bounds_session_and_locale(self):
        with self.assertRaises(ValueError):
            ChatRequest(message="hello", session_id="x" * 129)
        with self.assertRaises(ValueError):
            ChatRequest(message="hello", locale="vi_VN")

    def test_special_policy_surface_has_server_owned_action(self):
        surface = self.policy.resolve({"intent": "quiz_create"}, "learner", {"route": "/"})
        self.assertEqual([action.id for action in surface.actions], ["open_login", "browse_quizzes"])


class LangGraphContractTests(unittest.TestCase):
    def test_agent_first_is_default_with_legacy_rollback(self):
        self.assertEqual(AIAgentCore({}).orchestration_mode, "agent_first")
        self.assertEqual(
            AIAgentCore({"orchestration_mode": "planner_legacy"}).orchestration_mode,
            "planner_legacy",
        )

    def test_unknown_orchestration_mode_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "AI_ORCHESTRATION_MODE"):
            AIAgentCore({"orchestration_mode": "unknown"})

    def test_taxonomy_domains_partition_every_leaf_intent(self):
        members = [intent for intents in INTENT_DOMAINS.values() for intent in intents]
        self.assertEqual(set(members), set(ALL_INTENTS))
        self.assertEqual(len(members), len(set(members)))
        self.assertEqual(set(INTENT_METADATA), set(ALL_INTENTS))

    def test_plan_schema_exposes_dialogue_and_reference_axes(self):
        schema = InteractionPlan.model_json_schema()["properties"]
        self.assertIn("dialogue_act", schema)
        self.assertIn("reference_mode", schema)
        self.assertIn("selection_strategy", schema)
        self.assertIn("resource", schema)
        self.assertIn("operation", schema)

    def test_every_catalog_tool_is_reachable_from_an_intent(self):
        catalog_names = {str(item.get("name")) for item in TOOLS}
        reachable = set().union(*INTENT_ALLOWED_TOOLS.values())
        # plan_interaction is added by AIAgentCore after intent scoping as a
        # server-owned internal policy call, so it is intentionally absent
        # from the public per-intent executor map.
        self.assertEqual(catalog_names - (reachable | {"plan_interaction"}), set())

    def test_graph_tool_node_keeps_existing_tool_coverage(self):
        async def dispatch(_name, _args):
            return "{}"

        runner = LangGraphQuizRunner("test-model", "test-key", "https://example.test/v1")
        tools = runner._build_tools(SCOPE_TOOLS["creator"], dispatch)
        names = {item.name for item in tools}
        self.assertTrue({
            "search_quizzes", "search_knowledge", "create_quiz", "update_quiz",
            "delete_quiz", "create_question", "update_question", "delete_question",
            "render_ui", "plan_interaction", "start_quiz", "get_in_progress_quizzes",
            "get_all_attempts", "duplicate_question", "reorder_questions",
            "list_knowledge_sources", "import_knowledge_url", "submit_knowledge_review",
            "recommend_quizzes", "get_quiz_result", "publish_quiz", "unpublish_quiz",
            "get_current_time",
            "get_current_user", "get_my_permissions",
            "create_quiz_with_questions", "get_quiz_build_status",
        }.issubset(names))

    def test_admin_graph_tools_include_knowledge_review(self):
        async def dispatch(_name, _args):
            return "{}"

        runner = LangGraphQuizRunner("test-model", "test-key", "https://example.test/v1")
        names = {item.name for item in runner._build_tools(SCOPE_TOOLS["admin"], dispatch)}
        self.assertIn("review_knowledge", names)
        self.assertIn("create_category", names)
        self.assertIn("list_audit_events", names)
        creator_names = {item.name for item in runner._build_tools(SCOPE_TOOLS["creator"], dispatch)}
        self.assertNotIn("review_knowledge", creator_names)
        self.assertNotIn("create_category", creator_names)
        self.assertNotIn("list_audit_events", creator_names)

    def test_create_question_schema_requires_option_text(self):
        async def dispatch(_name, _args):
            return "{}"

        runner = LangGraphQuizRunner("test-model", "test-key", "https://example.test/v1")
        tools = runner._build_tools(SCOPE_TOOLS["creator"], dispatch)
        create_question = next(item for item in tools if item.name == "create_question")
        schema = create_question.args_schema.model_json_schema()
        option_schema = schema["$defs"]["QuestionOptionInput"]
        self.assertIn("option_text", option_schema["required"])
        self.assertEqual(option_schema["properties"]["option_text"]["minLength"], 1)

    def test_catalog_and_langgraph_tool_constraints_match(self):
        async def dispatch(_name, _args):
            return "{}"

        def resolve(schema, root):
            if "$ref" in schema:
                node = root
                for part in schema["$ref"].split("/")[1:]:
                    node = node[part]
                return node
            if "anyOf" in schema:
                return next((item for item in schema["anyOf"] if item.get("type") != "null"), schema)
            return schema

        def constraints(schema, root=None, path=""):
            root = root or schema
            schema = resolve(schema, root)
            result = {}
            if "enum" in schema:
                result[f"{path}#enum"] = tuple(schema["enum"])
            for key in ("minimum", "maximum", "minItems", "minLength"):
                if key in schema:
                    result[f"{path}#{key}"] = schema[key]
            required = set(schema.get("required", []))
            for name, child in schema.get("properties", {}).items():
                child_path = f"{path}.{name}" if path else name
                result[f"{child_path}#required"] = name in required
                result.update(constraints(child, root, child_path))
            if schema.get("type") == "array" and "items" in schema:
                result.update(constraints(schema["items"], root, f"{path}[]"))
            return result

        catalog = {item["name"]: item["parameters"] for item in TOOLS}
        runner = LangGraphQuizRunner("test-model", "test-key", "https://example.test/v1")
        graph = {
            item.name: item.args_schema.model_json_schema()
            for item in runner._build_tools(SCOPE_TOOLS["admin"], dispatch)
        }
        self.assertEqual(set(catalog), set(graph))
        for name in catalog:
            self.assertEqual(constraints(catalog[name]), constraints(graph[name]), name)

    def test_common_semantic_contracts_reject_ambiguous_or_unsafe_args(self):
        core = AIAgentCore({})
        with self.assertRaisesRegex(ValueError, "QUIZ_IDENTIFIER_INVALID"):
            core._validate_tool_semantics("get_quiz", {})
        with self.assertRaisesRegex(ValueError, "QUIZ_IDENTIFIER_INVALID"):
            core._validate_tool_semantics("start_quiz", {"quiz_id": "id", "quiz_slug": "slug"})
        with self.assertRaisesRegex(ValueError, "QUESTION_ORDERS_DUPLICATE"):
            core._validate_tool_semantics("reorder_questions", {
                "question_orders": [{"id": "q-1"}, {"id": "q-1"}],
            })
        with self.assertRaisesRegex(ValueError, "KNOWLEDGE_REJECTION_REASON_REQUIRED"):
            core._validate_tool_semantics("review_knowledge", {"status": "QUARANTINED"})

    def test_catalog_validation_rejects_out_of_range_values(self):
        core = AIAgentCore({})
        with self.assertRaisesRegex(ValueError, "TOOL_ARGUMENT_INVALID"):
            core._validate_tool_arguments("search_quizzes", {"query": "AI", "limit": 21})
        with self.assertRaisesRegex(ValueError, "TOOL_ARGUMENT_INVALID"):
            core._validate_tool_arguments("create_quiz", {
                "title": "AI", "slug": "ai", "category_id": "category-1",
                "difficulty_level": "EASY", "time_limit": 0,
                "quiz_type": "MULTIPLE_CHOICE",
            })

    def test_graph_step_limit_defaults_to_twelve(self):
        core = AIAgentCore({})
        self.assertEqual(core.max_graph_steps, 12)
        self.assertEqual(core.graph_timeout_seconds, 90)
        self.assertEqual(core.max_empty_tool_streak, 2)

    def test_graph_runner_receives_postgres_url_for_durable_checkpointing(self):
        core = AIAgentCore({"openai_api_key": "test-key", "checkpoint_database_url": "postgresql://checkpoint"})
        self.assertEqual(core.graph_runner.postgres_url, "postgresql://checkpoint")

    def test_only_retrieval_tools_are_guarded_against_empty_retries(self):
        self.assertEqual(RETRY_GUARDED_TOOLS, {
            "search_quizzes", "get_quiz", "search_knowledge", "web_search",
        })

    def test_write_or_ambiguous_plan_escalates_to_strong_model(self):
        runner = LangGraphQuizRunner(
            "executor", "test-key", "https://example.test/v1",
            planner_fast_model="fast", planner_strong_model="strong",
        )
        self.assertTrue(runner._should_escalate(InteractionPlan(
            intent="quiz_create", confidence=0.99, ambiguity="none",
            risk="write", route="approval",
        )))
        self.assertTrue(runner._should_escalate(InteractionPlan(
            intent="quiz_recommend", confidence=0.7, ambiguity="high",
            risk="read", route="tool",
        )))

    def test_clear_read_plan_stays_on_fast_model(self):
        runner = LangGraphQuizRunner(
            "executor", "test-key", "https://example.test/v1",
            planner_fast_model="fast", planner_strong_model="strong",
        )
        self.assertFalse(runner._should_escalate(InteractionPlan(
            intent="quiz_recommend", confidence=0.96, ambiguity="none",
            risk="read", route="tool",
        )))

    def test_general_intent_is_supported_by_planner_contract(self):
        surface = UiPolicyResolver().resolve({"intent": "conversation_general"}, "learner", {"route": "/"})
        self.assertIsNone(surface)

    def test_discovery_intent_cannot_expose_write_tools(self):
        allowed = AIAgentCore._tools_for_intent("quiz_recommend", SCOPE_TOOLS["creator"])
        self.assertNotIn("create_quiz", allowed)
        self.assertNotIn("delete_quiz", allowed)
        self.assertIn("search_quizzes", allowed)
        self.assertIn("recommend_quizzes", allowed)
        self.assertNotIn("get_quiz_history", allowed)

    def test_discovery_policy_does_not_render_create_form(self):
        surface = UiPolicyResolver().resolve(
            {"intent": "quiz_recommend"}, "creator", {"route": "/user/quizzes"},
        )
        self.assertIsNotNone(surface)
        self.assertFalse(any(block.type == "form" for block in surface.blocks))
        self.assertEqual(surface.actions[0].value, "/quiz")


class PlannerModelRoutingTests(unittest.IsolatedAsyncioTestCase):
    def test_planner_extracts_json_when_provider_omits_tool_calls(self):
        runner = LangGraphQuizRunner(
            "executor", "test-key", "https://example.test/v1",
        )
        message = AIMessage(content='```json\n{"intent":"quiz_search","confidence":0.9,"entities":{"query":"Python"}}\n```')
        plan = runner._extract_plan(message)
        self.assertIsNotNone(plan)
        self.assertEqual(plan.intent, "quiz_search")
        self.assertEqual(plan.entities.query, "Python")

    async def test_planner_returns_safe_clarification_when_both_tiers_fail(self):
        runner = LangGraphQuizRunner(
            "executor", "test-key", "https://example.test/v1",
            planner_fast_model="fast", planner_strong_model="strong",
        )
        runner._plan_once = AsyncMock(side_effect=RuntimeError("no tool call"))

        result = await runner.plan(
            "Làm gì đó", "/", "learner", {}, history=[],
        )

        self.assertEqual(result["intent"], "unsupported")
        self.assertTrue(result["needs_clarification"])
        self.assertEqual(runner._plan_once.await_count, 2)

    async def test_strong_planner_corrects_fast_write_misclassification(self):
        runner = LangGraphQuizRunner(
            "executor", "test-key", "https://example.test/v1",
            planner_fast_model="fast", planner_strong_model="strong",
        )
        runner._plan_once = AsyncMock(side_effect=[
            InteractionPlan(
                intent="quiz_create", confidence=0.97, ambiguity="none",
                risk="write", route="approval",
            ),
            InteractionPlan(
                intent="quiz_recommend", confidence=0.96, ambiguity="none",
                risk="read", route="tool",
                entities={"topic": "IT", "query": "IT"},
            ),
        ])

        result = await runner.plan(
            "Tôi muốn làm quiz về chủ đề IT, recommend cho tôi được không?",
            "/quiz", "learner", {}, history=[],
        )

        self.assertEqual(result["intent"], "quiz_recommend")
        self.assertEqual(result["entities"]["topic"], "IT")
        self.assertEqual(runner._plan_once.await_count, 2)

    async def test_clear_read_plan_uses_only_fast_model(self):
        runner = LangGraphQuizRunner(
            "executor", "test-key", "https://example.test/v1",
            planner_fast_model="fast", planner_strong_model="strong",
        )
        runner._plan_once = AsyncMock(return_value=InteractionPlan(
            intent="quiz_recommend", confidence=0.97, ambiguity="none",
            risk="read", route="tool", entities={"topic": "Python"},
        ))

        result = await runner.plan(
            "Gợi ý quiz Python", "/quiz", "learner", {}, history=[],
        )

        self.assertEqual(result["intent"], "quiz_recommend")
        self.assertEqual(runner._plan_once.await_count, 1)


class AgentFirstOrchestrationTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.core = AIAgentCore({
            "openai_api_key": "test-key",
            "orchestration_mode": "agent_first",
        })
        self.core.memory = SimpleNamespace(
            search=AsyncMock(return_value=[]),
            close=AsyncMock(return_value=None),
        )
        self.core.graph_runner.plan = AsyncMock(
            side_effect=AssertionError("agent-first must not call planner")
        )
        self.core.graph_runner.invoke = AsyncMock(
            return_value=AIMessage(content="Xin chào từ agent.")
        )

    async def asyncTearDown(self):
        await self.core.close()

    async def test_live_path_skips_planner_and_exposes_scope_tools_to_agent(self):
        events = [event async for event in self.core._stream_message_events(
            "Xin chào", "user-1", None, "session-1", scope="learner",
        )]

        self.core.graph_runner.plan.assert_not_awaited()
        self.core.graph_runner.invoke.assert_awaited_once()
        call = self.core.graph_runner.invoke.await_args
        self.assertIn("plan_interaction", call.args[3])
        self.assertTrue(call.kwargs["agent_first"])
        self.assertIsNone(call.kwargs["interaction_plan"])
        self.assertEqual(
            next(event for event in events if event["type"] == "done")["intent"],
            "model_routed",
        )

    async def test_destructive_tool_requires_confirmation_from_current_message(self):
        async def invoke_with_unsafe_delete(*args, **_kwargs):
            dispatch = args[4]
            result = await dispatch(
                "delete_quiz", {"quiz_id": "quiz-1", "confirmed": True}
            )
            self.assertIn("DELETE_CONFIRMATION_REQUIRED", result)
            return AIMessage(content="Bạn cần xác nhận xóa rõ ràng.")

        self.core.graph_runner.invoke = AsyncMock(side_effect=invoke_with_unsafe_delete)
        events = [event async for event in self.core._stream_message_events(
            "Xóa quiz quiz-1", "user-1", "Bearer token", "session-2",
            scope="creator",
        )]

        self.assertFalse(any(event["type"] == "ui" for event in events))
        trace_events = [event for event in events if event["type"] == "trace"]
        self.assertTrue(any(
            event.get("event") == "confirmation_required" for event in trace_events
        ))

    async def test_agent_first_general_response_uses_one_model_call(self):
        class FakeModel:
            model_name = "fake-model"

            def __init__(self):
                self.calls = 0
                self.bind_options = {}

            def bind_tools(self, _tools, **kwargs):
                self.bind_options = kwargs
                return self

            async def ainvoke(self, _messages, config=None):
                self.calls += 1
                return AIMessage(content="Một model call.")

        runner = LangGraphQuizRunner(
            "executor", "test-key", "https://example.test/v1",
        )
        fake_model = FakeModel()
        runner.llm = fake_model
        runner._get_checkpointer = AsyncMock(return_value=None)

        async def dispatch(_name, _args):
            return "{}"

        result = await runner.invoke(
            "system", [], "Xin chào", set(), dispatch, lambda: False,
            {"metadata": {"local_trace_id": "trace-1", "scope": "learner"}},
            "model_routed", agent_first=True,
        )

        self.assertEqual(result.content, "Một model call.")
        self.assertEqual(fake_model.calls, 1)
        self.assertFalse(fake_model.bind_options["parallel_tool_calls"])

    async def test_agent_first_runs_one_react_tool_loop(self):
        class FakeToolModel:
            model_name = "fake-model"

            def __init__(self):
                self.calls = 0

            def bind_tools(self, _tools, **_kwargs):
                return self

            async def ainvoke(self, _messages, config=None):
                self.calls += 1
                if self.calls == 1:
                    return AIMessage(content="", tool_calls=[{
                        "name": "get_current_time",
                        "args": {},
                        "id": "call-1",
                        "type": "tool_call",
                    }])
                return AIMessage(content="Đây là thời gian từ server.")

        runner = LangGraphQuizRunner(
            "executor", "test-key", "https://example.test/v1",
        )
        fake_model = FakeToolModel()
        runner.llm = fake_model
        runner._get_checkpointer = AsyncMock(return_value=None)
        dispatch = AsyncMock(return_value='{"ok":true}')

        result = await runner.invoke(
            "system", [], "Mấy giờ rồi?", {"get_current_time"},
            dispatch, lambda: False,
            {"metadata": {"local_trace_id": "trace-2", "scope": "learner"}},
            "model_routed", agent_first=True,
        )

        self.assertEqual(result.content, "Đây là thời gian từ server.")
        self.assertEqual(fake_model.calls, 2)
        dispatch.assert_awaited_once_with("get_current_time", {})


class StructuredFormExecutionTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.core = AIAgentCore({
            "orchestration_mode": "agent_first",
        })
        self.core.graph_runner = SimpleNamespace(
            plan=AsyncMock(side_effect=AssertionError("structured form must not call planner")),
            invoke=AsyncMock(side_effect=AssertionError("structured form must not call executor")),
            close=AsyncMock(return_value=None),
        )

    async def asyncTearDown(self):
        await self.core.close()

    async def test_complete_quiz_form_creates_proposal_without_model(self):
        approval_surface = self.core._build_write_result_surface(
            "create_quiz",
            {"title": "Python cơ bản"},
            {"approval_required": True},
            "creator",
            "",
            "create_quiz",
        )
        self.core._execute_tool = AsyncMock(side_effect=[
            ({"items": [{"id": "cat-1", "name": "Lập trình"}]}, None, []),
            ({"approval_required": True, "operation": "create_quiz"}, approval_surface, []),
        ])

        events = [event async for event in self.core._stream_message_events(
            "Thông tin tạo quiz từ form",
            "user-1",
            "Bearer token",
            "session-form",
            scope="creator",
            context={
                "route": "/user/quizzes",
                "_form_submission": {
                    "form_id": "quiz-create-form",
                    "values": {
                        "title": "Python cơ bản",
                        "category": "Lập trình",
                        "difficulty": "EASY",
                        "time_limit": "300",
                        "quiz_type": "MULTIPLE_CHOICE",
                        "description": "Quiz nhập từ form",
                        "instructions": "Làm bài",
                    },
                },
            },
        )]

        self.core.graph_runner.plan.assert_not_awaited()
        self.core.graph_runner.invoke.assert_not_awaited()
        self.assertEqual(
            [call.args[0] for call in self.core._execute_tool.await_args_list],
            ["list_categories", "create_quiz"],
        )
        create_args = self.core._execute_tool.await_args_list[1].args[1]
        self.assertEqual(create_args["category_id"], "cat-1")
        self.assertEqual(create_args["description"], "Quiz nhập từ form")
        self.assertEqual(create_args["instructions"], "Làm bài")
        self.assertEqual(next(event for event in events if event["type"] == "done")["model_calls"], 0)


class WebSearchContractTests(unittest.IsolatedAsyncioTestCase):
    async def test_search_is_disabled_without_explicit_configuration(self):
        provider = WebSearchProvider()
        provider.provider = "disabled"
        provider.api_key = None
        with self.assertRaisesRegex(RuntimeError, "WEB_SEARCH_DISABLED"):
            await provider.search("Python")


class TemporalToolContractTests(unittest.IsolatedAsyncioTestCase):
    async def test_current_time_tool_is_server_generated(self):
        result, surface, citations = await AIAgentCore({})._execute_tool(
            "get_current_time", {}, None, "user-1", "learner"
        )
        self.assertIsNone(surface)
        self.assertEqual(citations, [])
        self.assertIn("current_date", result)
        self.assertEqual(result["timezone"], "Asia/Ho_Chi_Minh")


class ToolBackendRouteContractTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tools = MCPToolWrapper({"backend_url": "http://backend.test"})
        self.tools.call_backend_api = AsyncMock(return_value={"data": {"id": "result-1"}})
        self.tools._ensure_owned_quiz = AsyncMock(return_value=None)
        self.tools._ensure_owned_question = AsyncMock(return_value=None)

    async def test_question_writes_preserve_backend_field_contracts(self):
        payload = {
            "quiz_id": "quiz-1", "question_text": "AI là gì?", "question_type": "SINGLE_CHOICE",
            "options": [{"option_text": "A", "is_correct": True, "sort_order": 1}],
        }
        await self.tools.create_question(payload, "Bearer token")
        self.tools.call_backend_api.assert_awaited_with(
            "POST", "/api/questions", body=payload, authorization="Bearer token",
        )

    async def test_reorder_and_duplicate_translate_only_backend_casing(self):
        orders = [{"id": "question-1", "sort_order": 0}]
        await self.tools.reorder_questions("quiz-1", orders, "Bearer token")
        self.tools.call_backend_api.assert_awaited_with(
            "PATCH", "/api/questions/quiz/quiz-1/reorder",
            body={"questionOrders": orders}, authorization="Bearer token",
        )
        self.tools.call_backend_api.reset_mock()
        await self.tools.duplicate_question("question-1", "quiz-2", "Bearer token")
        self.tools.call_backend_api.assert_awaited_with(
            "POST", "/api/questions/question-1/duplicate",
            body={"newQuizId": "quiz-2"}, authorization="Bearer token",
        )

    async def test_start_and_knowledge_routes_match_backend_dtos(self):
        await self.tools.start_quiz("quiz-1", "", "Bearer token")
        self.tools.call_backend_api.assert_awaited_with(
            "POST", "/api/quiz-sessions", body={"quiz_id": "quiz-1"}, authorization="Bearer token",
        )
        self.tools.call_backend_api.reset_mock()
        await self.tools.review_knowledge("source-1", "QUARANTINED", "Thiếu nguồn", "Bearer token")
        self.tools.call_backend_api.assert_awaited_with(
            "POST", "/api/knowledge/sources/source-1/review",
            body={"status": "QUARANTINED", "rejection_reason": "Thiếu nguồn"},
            authorization="Bearer token",
        )

    async def test_publish_readiness_rejects_invalid_question_options(self):
        self.tools.get_quiz = AsyncMock(return_value={"id": "quiz-1", "title": "AI"})
        self.tools.list_questions = AsyncMock(return_value=[{
            "id": "question-1", "question_text": "AI là gì?",
            "question_type": "SINGLE_CHOICE",
            "options": [
                {"option_text": "A", "is_correct": False},
                {"option_text": "B", "is_correct": False},
            ],
        }])

        status = await self.tools.get_quiz_build_status("quiz-1", "Bearer token")

        self.assertFalse(status["ready_to_publish"])
        self.assertIn("Câu hỏi 1 cần đúng 1 đáp án đúng", status["issues"])

    async def test_topic_recommendation_falls_back_to_popular_with_explicit_mode(self):
        self.tools.call_backend_api = AsyncMock(side_effect=[
            {"data": {"items": [], "pagination": {"total": 0}}},
            {"data": {"items": [{"title": "Python Basics", "slug": "python-basics"}]}},
        ])

        result, citations = await self.tools.recommend_quizzes_with_citations(5, "IT")

        self.assertEqual(result["mode"], "general_fallback")
        self.assertEqual(result["requested_topic"], "IT")
        self.assertEqual(citations[0]["title"], "Python Basics")


class RetrievalCitationContractTests(unittest.TestCase):
    def test_quiz_citations_only_expose_public_quiz_routes(self):
        citations = MCPToolWrapper.quiz_citations({
            "data": [
                {"title": "Python basics", "slug": "python-basics", "description": "Variables"},
                {"title": "Incomplete"},
            ],
        })
        self.assertEqual(citations, [{
            "title": "Python basics",
            "url": "/quiz/python-basics",
            "snippet": "Variables",
        }])

    def test_knowledge_citations_keep_source_metadata_without_fabricated_link(self):
        citations = MCPToolWrapper.knowledge_citations([{
            "source_title": "Hướng dẫn Python",
            "source_uri": None,
            "content": "Biến dùng để lưu giá trị.",
        }])
        self.assertEqual(citations, [{
            "title": "Hướng dẫn Python",
            "url": "",
            "snippet": "Biến dùng để lưu giá trị.",
        }])

    def test_retrieval_eval_reports_recall_and_precision(self):
        cases = (case for case in [
            RetrievalCase("python cơ bản", frozenset({"python-co-ban"})),
            RetrievalCase("quiz không tồn tại", frozenset()),
        ])
        metrics = evaluate_retrieval(cases, {
            "python cơ bản": {"items": [{"slug": "python-co-ban"}]},
            "quiz không tồn tại": {"items": []},
        })
        self.assertEqual(metrics["recall_at_k"], 1.0)
        self.assertEqual(metrics["precision_at_k"], 1.0)
        self.assertEqual(metrics["cases"], 2)


class StateStoreContractTests(unittest.IsolatedAsyncioTestCase):
    async def test_memory_store_keeps_session_and_consumes_approval_once(self):
        store = AgentStateStore()
        await store.set_previous_response_id("user-1", "session-1", "response-1")
        self.assertEqual(await store.get_previous_response_id("user-1", "session-1"), "response-1")
        await store.create_approval("token-1", {"name": "delete_quiz"})
        self.assertEqual((await store.consume_approval("token-1"))["name"], "delete_quiz")
        self.assertIsNone(await store.consume_approval("token-1"))

    async def test_memory_rate_limit_is_bounded(self):
        store = AgentStateStore()
        self.assertTrue(await store.allow_request("user-1", "session-1", 2))
        self.assertTrue(await store.allow_request("user-1", "session-1", 2))
        self.assertFalse(await store.allow_request("user-1", "session-1", 2))

    async def test_memory_graph_trace_is_conversation_scoped(self):
        store = AgentStateStore()
        await store.append_graph_trace("trace-1", "user-1", "session-1", "router", "handoff", "assistant")
        visible = await store.get_graph_trace("trace-1", "user-1", "session-1")
        self.assertEqual(visible[0]["node"], "router")
        self.assertEqual(visible[0]["tool"], "assistant")
        self.assertEqual(await store.get_graph_trace("trace-1", "user-2", "session-1"), [])

    async def test_authenticated_rate_limit_cannot_be_bypassed_by_new_session(self):
        store = AgentStateStore()
        self.assertTrue(await store.allow_request("user-1", "session-1", 1))
        self.assertFalse(await store.allow_request("user-1", "session-2", 1))

    async def test_chat_history_is_session_bound_and_bounded(self):
        store = AgentStateStore(chat_history_max_messages=2)
        await store.set_chat_messages("user-1", "session-1", [
            {"role": "user", "content": "first"},
            {"role": "assistant", "content": "second"},
            {"role": "user", "content": "third"},
            {"role": "tool", "content": "must not persist"},
        ])
        self.assertEqual(
            await store.get_chat_messages("user-1", "session-1"),
            [{"role": "assistant", "content": "second"}, {"role": "user", "content": "third"}],
        )

        self.assertEqual(await store.get_chat_messages("user-1", "session-2"), [])


class ObservabilityContractTests(unittest.TestCase):
    def test_prometheus_metrics_include_chat_and_tool_counters(self):
        metrics = AgentMetrics()
        metrics.record_chat("learner", "completed", 0.25)
        metrics.record_tool("search_quizzes", "success")
        output = metrics.prometheus()
        self.assertIn('quiz_ai_chat_requests_total{scope="learner",outcome="completed"} 1', output)
        self.assertIn('quiz_ai_tool_calls_total{tool="search_quizzes",outcome="success"} 1', output)

    def test_prometheus_metrics_escape_label_values(self):
        metrics = AgentMetrics()
        metrics.record_tool('quoted"tool', "error")
        self.assertIn('tool="quoted\\"tool"', metrics.prometheus())

    def test_prometheus_metrics_include_model_usage(self):
        metrics = AgentMetrics()
        metrics.record_model(
            "test-model", "success", 0.4,
            {"input_tokens": 100, "output_tokens": 25, "cached_tokens": 10},
        )
        output = metrics.prometheus()
        self.assertIn('quiz_ai_model_calls_total{model="test-model",outcome="success"} 1', output)
        self.assertIn('quiz_ai_model_tokens_total{model="test-model",type="input"} 100', output)
        self.assertIn('quiz_ai_model_tokens_total{model="test-model",type="output"} 25', output)
        self.assertIn('quiz_ai_model_tokens_total{model="test-model",type="cached"} 10', output)

    def test_prometheus_metrics_include_run_quality_and_budget_signals(self):
        metrics = AgentMetrics()
        metrics.record_run("completed")
        metrics.record_planner("quiz_search")
        metrics.record_verification("question_schema", False)
        metrics.record_memory("search", "success")
        metrics.record_budget("tool_calls")
        output = metrics.prometheus()
        self.assertIn('quiz_ai_run_outcomes_total{status="completed"} 1', output)
        self.assertIn('quiz_ai_planner_decisions_total{intent="quiz_search",outcome="selected"} 1', output)
        self.assertIn('quiz_ai_verification_checks_total{check="question_schema",outcome="failed"} 1', output)
        self.assertIn('quiz_ai_memory_operations_total{operation="search",outcome="success"} 1', output)
        self.assertIn('quiz_ai_budget_events_total{resource="tool_calls"} 1', output)


if __name__ == "__main__":
    unittest.main()

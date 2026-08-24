import asyncio
import unittest
from datetime import datetime
from unittest.mock import AsyncMock
from zoneinfo import ZoneInfo

from services.agent_core import (
    AIAgentCore,
    GROUNDED_RETRIEVAL_TOOLS,
    RETRY_GUARDED_TOOLS,
    SCOPE_TOOLS,
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
        self.core.tools.delete_quiz.assert_awaited_once_with("quiz-1", "Bearer token")
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
        _, surface, _ = await self.core._execute_tool(
            "create_quiz", {"title": "Python", "slug": "python", "category_id": "category-1"},
            "Bearer token", "user-1", "creator",
        )
        self.core.tools.create_quiz = AsyncMock(return_value={"id": "quiz-1", "title": "Python"})
        events = [event async for event in self.core._approve(
            surface.actions[0].value, "Bearer token", "user-1", "creator", "session-1",
        )]
        self.assertIn("quiz-1", next(event["delta"] for event in events if event["type"] == "token"))
        result_surface = next(event["surface"] for event in events if event["type"] == "ui")
        self.assertEqual(result_surface["actions"][0]["kind"], "prompt")
        memory = await self.core.state_store.get_chat_messages("user-1", "session-1")
        self.assertIn("quiz-1", memory[-1]["content"])

    async def test_complete_quiz_tool_creates_draft_then_questions(self):
        self.core.tools.create_quiz = AsyncMock(return_value={"id": "quiz-1", "title": "Python"})
        self.core.tools.create_question = AsyncMock(side_effect=[{"id": "q-1"}, {"id": "q-2"}])
        result = await self.core._execute_write("create_quiz_with_questions", {
            "title": "Python", "slug": "python", "category_id": "category-1",
            "difficulty_level": "EASY", "time_limit": 600, "quiz_type": "MULTIPLE_CHOICE",
            "questions": [
                {"question_text": "Q1", "question_type": "SINGLE_CHOICE", "options": []},
                {"question_text": "Q2", "question_type": "SINGLE_CHOICE", "options": []},
            ],
        }, "Bearer token")
        self.assertEqual(result["id"], "quiz-1")
        self.assertEqual(result["questions_created"], 2)
        self.assertFalse(result["is_active"])


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

    def test_special_policy_surface_has_server_owned_action(self):
        surface = self.policy.resolve({"intent": "quiz_create"}, "learner", {"route": "/"})
        self.assertEqual([action.id for action in surface.actions], ["open_login", "browse_quizzes"])


class LangGraphContractTests(unittest.TestCase):
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

    def test_graph_step_limit_defaults_to_twelve(self):
        core = AIAgentCore({})
        self.assertEqual(core.max_graph_steps, 12)
        self.assertEqual(core.graph_timeout_seconds, 90)
        self.assertEqual(core.max_empty_tool_streak, 2)

    def test_only_retrieval_tools_are_guarded_against_empty_retries(self):
        self.assertEqual(RETRY_GUARDED_TOOLS, {
            "search_quizzes", "get_quiz", "search_knowledge", "web_search",
        })

    def test_general_intent_is_supported_by_planner_contract(self):
        surface = UiPolicyResolver().resolve({"intent": "general"}, "learner", {"route": "/"})
        self.assertIsNone(surface)


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
            "get_current_time", {}, None, "guest", "learner"
        )
        self.assertIsNone(surface)
        self.assertEqual(citations, [])
        self.assertIn("current_date", result)
        self.assertEqual(result["timezone"], "Asia/Ho_Chi_Minh")


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


if __name__ == "__main__":
    unittest.main()

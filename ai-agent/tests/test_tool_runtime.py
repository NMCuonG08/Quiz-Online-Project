import asyncio
import unittest
from unittest.mock import AsyncMock

from services.agent_core import AIAgentCore
from services.harness.errors import (
    ApprovalRequired,
    HarnessError,
    ReconciliationRequired,
    ToolDenied,
    ToolTimeout,
    ValidationFailed,
)
from services.harness.tool_runtime import ToolHandlerResult, ToolRuntime
from services.harness.tool_specs import TOOL_SPECS


class ToolRuntimeContractTests(unittest.IsolatedAsyncioTestCase):
    async def test_denied_tool_is_rejected_before_handler(self):
        handler = AsyncMock(return_value={"items": []})
        runtime = ToolRuntime(TOOL_SPECS)

        with self.assertRaises(ToolDenied):
            await runtime.execute(
                "search_quizzes",
                {"query": "Python"},
                scope="learner",
                allowed_tools={"render_ui"},
                handler=handler,
            )

        handler.assert_not_awaited()

    async def test_invalid_arguments_are_rejected_before_handler(self):
        handler = AsyncMock(return_value={"items": []})
        runtime = ToolRuntime(TOOL_SPECS)

        with self.assertRaises(ValidationFailed):
            await runtime.execute(
                "search_quizzes",
                {"query": "Python", "limit": 21},
                scope="learner",
                allowed_tools={"search_quizzes"},
                handler=handler,
            )

        handler.assert_not_awaited()

    async def test_read_tool_normalizes_input_and_returns_typed_execution(self):
        handler = AsyncMock(return_value=ToolHandlerResult(
            output={"items": [{"slug": "python"}]},
            citations=[{"title": "Python", "url": "/quiz/python", "snippet": ""}],
        ))
        runtime = ToolRuntime(TOOL_SPECS)

        result = await runtime.execute(
            "search_quizzes",
            {"query": "  Python  ", "limit": 5},
            scope="learner",
            allowed_tools={"search_quizzes"},
            normalize=lambda args: {
                **args,
                "query": args["query"].strip(),
            },
            handler=handler,
        )

        handler.assert_awaited_once_with({"query": "Python", "limit": 5})
        self.assertTrue(result.execution.ok)
        self.assertEqual(result.execution.tool_name, "search_quizzes")
        self.assertEqual(result.execution.output["items"][0]["slug"], "python")
        self.assertEqual(result.citations[0]["url"], "/quiz/python")

    async def test_write_proposal_must_return_approval_contract(self):
        runtime = ToolRuntime(TOOL_SPECS)

        with self.assertRaises(HarnessError):
            await runtime.execute(
                "create_quiz_with_questions",
                self._create_args(),
                scope="creator",
                allowed_tools={"create_quiz_with_questions"},
                handler=AsyncMock(return_value={"id": "quiz-1"}),
            )

    async def test_write_execution_requires_verified_approval_and_idempotency(self):
        runtime = ToolRuntime(TOOL_SPECS)
        handler = AsyncMock(return_value={"id": "quiz-1"})

        with self.assertRaises(ApprovalRequired):
            await runtime.execute(
                "create_quiz_with_questions",
                self._create_args(),
                scope="creator",
                allowed_tools={"create_quiz_with_questions"},
                phase="execute",
                idempotency_key="idem-1",
                handler=handler,
            )

        with self.assertRaises(ReconciliationRequired):
            await runtime.execute(
                "create_quiz_with_questions",
                self._create_args(),
                scope="creator",
                allowed_tools={"create_quiz_with_questions"},
                phase="execute",
                approval_verified=True,
                handler=handler,
            )

        result = await runtime.execute(
            "create_quiz_with_questions",
            self._create_args(),
            scope="creator",
            allowed_tools={"create_quiz_with_questions"},
            phase="execute",
            approval_verified=True,
            idempotency_key="idem-1",
            handler=handler,
        )

        self.assertEqual(result.execution.output["id"], "quiz-1")
        self.assertEqual(result.execution.idempotency_key, "idem-1")

    async def test_write_proposal_requires_approval_marker(self):
        runtime = ToolRuntime(TOOL_SPECS)

        with self.assertRaises(HarnessError):
            await runtime.execute(
                "create_quiz_with_questions",
                self._create_args(),
                scope="creator",
                allowed_tools={"create_quiz_with_questions"},
                handler=AsyncMock(return_value={"id": "quiz-1"}),
            )

        result = await runtime.execute(
            "create_quiz_with_questions",
            self._create_args(),
            scope="creator",
            allowed_tools={"create_quiz_with_questions"},
            handler=AsyncMock(return_value=ToolHandlerResult(
                output={"approval_required": True, "operation": "create_quiz_with_questions"},
            )),
        )

        self.assertTrue(result.execution.approval_required)

    async def test_timeout_is_typed_and_retryable(self):
        async def slow_handler(_args):
            await asyncio.sleep(0.05)
            return {"items": []}

        runtime = ToolRuntime({
            "search_quizzes": TOOL_SPECS["search_quizzes"].model_copy(
                update={"timeout_seconds": 0.001},
            ),
        })

        with self.assertRaises(ToolTimeout) as raised:
            await runtime.execute(
                "search_quizzes",
                {"query": "Python"},
                scope="learner",
                allowed_tools={"search_quizzes"},
                handler=slow_handler,
            )

        self.assertTrue(raised.exception.retryable)

    async def test_result_size_limit_is_enforced(self):
        spec = TOOL_SPECS["search_quizzes"].model_copy(update={"result_size_limit": 10})
        runtime = ToolRuntime({"search_quizzes": spec})

        with self.assertRaises(ValidationFailed):
            await runtime.execute(
                "search_quizzes",
                {"query": "Python"},
                scope="learner",
                allowed_tools={"search_quizzes"},
                handler=AsyncMock(return_value={"items": ["this is too large"]}),
            )

    @staticmethod
    def _create_args():
        return {
            "title": "Python",
            "slug": "python",
            "category_id": "category-1",
            "difficulty_level": "EASY",
            "time_limit": 300,
            "quiz_type": "SINGLE_CHOICE",
            "questions": [{
                "question_text": "Python là gì?",
                "question_type": "SINGLE_CHOICE",
                "options": [{
                    "option_text": "Ngôn ngữ lập trình",
                    "is_correct": True,
                    "sort_order": 0,
                }],
            }],
        }


class MigratedToolIntegrationTests(unittest.IsolatedAsyncioTestCase):
    async def test_search_quizzes_uses_runtime_and_normalizes_query(self):
        core = AIAgentCore({})
        core.tools.search_quizzes_with_citations = AsyncMock(return_value=(
            {"items": [{"slug": "python"}]},
            [{"title": "Python", "url": "/quiz/python", "snippet": ""}],
        ))

        result, _, citations = await core._execute_tool(
            "search_quizzes",
            {"query": "  Python  ", "limit": 5},
            None,
            "user-1",
            "learner",
        )

        core.tools.search_quizzes_with_citations.assert_awaited_once_with("Python", 5)
        self.assertEqual(result["items"][0]["slug"], "python")
        self.assertEqual(citations[0]["url"], "/quiz/python")

    async def test_create_quiz_proposal_uses_runtime_and_scope(self):
        core = AIAgentCore({})
        core.tools.list_categories = AsyncMock(return_value={
            "items": [{"id": "category-1", "name": "Lập trình"}],
        })

        result, surface, _ = await core._execute_tool(
            "create_quiz_with_questions",
            {
                "title": "Python",
                "slug": "python",
                "category_id": "category-1",
                "difficulty_level": "EASY",
                "time_limit": 300,
                "quiz_type": "SINGLE_CHOICE",
                "questions": [{
                    "question_text": "Python là gì?",
                    "question_type": "SINGLE_CHOICE",
                    "options": [{
                        "option_text": "Ngôn ngữ lập trình",
                        "is_correct": True,
                        "sort_order": 0,
                    }, {
                        "option_text": "Hệ điều hành",
                        "is_correct": False,
                        "sort_order": 1,
                    }],
                }],
            },
            "Bearer token",
            "user-1",
            "creator",
        )

        self.assertTrue(result["approval_required"])
        self.assertIsNotNone(surface)
        self.assertEqual(surface.actions[0].kind, "approve")

    async def test_create_quiz_cannot_be_proposed_for_learner(self):
        core = AIAgentCore({})

        with self.assertRaises(ToolDenied):
            await core._execute_tool(
                "create_quiz_with_questions",
                self._creator_args(),
                "Bearer token",
                "user-1",
                "learner",
            )

    @staticmethod
    def _creator_args():
        return {
            "title": "Python",
            "slug": "python",
            "category_id": "category-1",
            "difficulty_level": "EASY",
            "time_limit": 300,
            "quiz_type": "SINGLE_CHOICE",
            "questions": [{
                "question_text": "Python là gì?",
                "question_type": "SINGLE_CHOICE",
                "options": [{
                    "option_text": "Ngôn ngữ lập trình",
                    "is_correct": True,
                    "sort_order": 0,
                }],
            }],
        }


if __name__ == "__main__":
    unittest.main()

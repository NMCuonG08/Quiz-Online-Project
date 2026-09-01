import unittest
from unittest.mock import AsyncMock

from services.capabilities import (
    AccountCapability,
    AuthoringCapability,
    CapabilityContext,
    DiscoveryCapability,
    KnowledgeCapability,
    LearningCapability,
    QuestionQualityCapability,
)
from services.tools import MCPToolWrapper


class CapabilityContractTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tools = MCPToolWrapper({"backend_url": "http://backend.test"})
        self.context = CapabilityContext(
            user_id="user-1",
            scope="creator",
            authorization="Bearer token",
            session_id="session-1",
        )

    def test_capability_descriptors_are_explicit_and_non_empty(self):
        capabilities = [
            DiscoveryCapability,
            LearningCapability,
            AuthoringCapability,
            KnowledgeCapability,
            AccountCapability,
            QuestionQualityCapability,
        ]

        for capability in capabilities:
            descriptor = capability.descriptor
            self.assertTrue(descriptor.capability_id)
            self.assertTrue(descriptor.supported_intents)
            self.assertTrue(descriptor.allowed_scopes)
            self.assertTrue(descriptor.tools)

    async def test_discovery_preserves_data_and_citations(self):
        self.tools.search_quizzes_with_citations = AsyncMock(return_value=(
            {"items": [{"slug": "python"}]},
            [{"title": "Python", "url": "/quiz/python", "snippet": ""}],
        ))

        result = await DiscoveryCapability(self.tools).search(
            self.context, "Python", 5
        )

        self.tools.search_quizzes_with_citations.assert_awaited_once_with("Python", 5)
        self.assertEqual(result.data["items"][0]["slug"], "python")
        self.assertEqual(result.citations[0]["url"], "/quiz/python")

    async def test_learning_requires_authentication_before_backend(self):
        tools = MCPToolWrapper({"backend_url": "http://backend.test"})
        tools.get_quiz_history = AsyncMock()
        context = CapabilityContext(user_id="user-1", scope="learner")

        with self.assertRaisesRegex(PermissionError, "AUTH_REQUIRED"):
            await LearningCapability(tools).history(context)

        tools.get_quiz_history.assert_not_awaited()

    async def test_learning_history_delegates_trusted_auth(self):
        self.tools.get_quiz_history = AsyncMock(return_value={"items": []})

        result = await LearningCapability(self.tools).history(self.context, 20)

        self.tools.get_quiz_history.assert_awaited_once_with("Bearer token", 20)
        self.assertEqual(result.data, {"items": []})

    async def test_authoring_forces_inactive_quiz_draft(self):
        self.tools.create_quiz_with_questions = AsyncMock(return_value={
            "id": "quiz-1", "is_active": False,
        })
        payload = {
            "title": "Python",
            "is_active": True,
            "questions": [],
        }

        result = await AuthoringCapability(self.tools).create_quiz_with_questions(
            self.context, payload, "idem-1"
        )

        sent_payload = self.tools.create_quiz_with_questions.await_args.args[0]
        self.assertFalse(sent_payload["is_active"])
        self.assertEqual(sent_payload["description"], "")
        self.assertEqual(result.data["id"], "quiz-1")

    async def test_knowledge_search_keeps_citations(self):
        self.tools.search_knowledge = AsyncMock(return_value=(
            [{"source_title": "Python", "content": "..." }],
            [{"title": "Python", "url": "", "snippet": "..."}],
        ))

        result = await KnowledgeCapability(self.tools).search(
            self.context, "Python", 3
        )

        self.tools.search_knowledge.assert_awaited_once_with("Python", 3)
        self.assertEqual(result.citations[0]["title"], "Python")

    async def test_account_uses_backend_verified_credentials(self):
        self.tools.get_current_user = AsyncMock(return_value={"id": "user-1"})

        result = await AccountCapability(self.tools).current_user(self.context)

        self.tools.get_current_user.assert_awaited_once_with("Bearer token")
        self.assertEqual(result.data["id"], "user-1")

    async def test_question_quality_preserves_existing_domain_errors(self):
        with self.assertRaisesRegex(ValueError, "QUESTION_OPTIONS_REQUIRED"):
            QuestionQualityCapability.validate_question_payload({
                "question_type": "SINGLE_CHOICE",
                "options": [{
                    "option_text": "A",
                    "is_correct": True,
                }],
            })

        with self.assertRaisesRegex(ValueError, "QUESTION_CORRECT_OPTION_INVALID"):
            QuestionQualityCapability.validate_question_payload({
                "question_type": "SINGLE_CHOICE",
                "options": [
                    {"option_text": "A", "is_correct": False},
                    {"option_text": "B", "is_correct": False},
                ],
            })

    async def test_authoring_question_reads_use_same_context_boundary(self):
        self.tools.list_questions = AsyncMock(return_value={"items": []})

        result = await AuthoringCapability(self.tools).questions(
            self.context, "quiz-1"
        )

        self.tools.list_questions.assert_awaited_once_with("quiz-1", "Bearer token")
        self.assertEqual(result.data, {"items": []})


if __name__ == "__main__":
    unittest.main()

import unittest
from unittest.mock import AsyncMock

from services.capabilities.question_pipeline import (
    QuestionGenerationPipeline,
    QuestionSemanticReviewer,
)
from services.harness import DurableRunStore


def valid_payload():
    return {
        "title": "Python",
        "questions": [{
            "question_text": "Python là gì?",
            "question_type": "SINGLE_CHOICE",
            "options": [
                {"option_text": "Ngôn ngữ lập trình", "is_correct": True},
                {"option_text": "Hệ điều hành", "is_correct": False},
            ],
        }],
    }


class QuestionPipelineTests(unittest.IsolatedAsyncioTestCase):
    async def test_valid_draft_enters_human_review_and_can_be_approved(self):
        runs = DurableRunStore()
        from services.harness import RunContext, RunRequest
        context = RunContext(
            run_id="run-1",
            thread_id="thread-1",
            request=RunRequest(
                request_id="req-1",
                user_message="generate",
                trusted_user_id="user-1",
                session_id="session-1",
                scope="creator",
            ),
        )
        await runs.create_run(context)
        pipeline = QuestionGenerationPipeline(reviews=runs)

        draft = await pipeline.prepare_draft(
            valid_payload(),
            owner_id="user-1",
            run_id="run-1",
        )

        self.assertEqual(draft.status, "pending_review")
        self.assertIsNotNone(draft.review_id)
        review = await runs.decide_review(
            draft.review_id,
            owner_id="user-1",
            decision="approved",
            reviewer_id="user-1",
        )
        self.assertEqual(review.status, "approved")
        resolved = await pipeline.sync_review_status(draft)
        self.assertTrue(pipeline.can_persist(resolved))

    async def test_invalid_draft_is_rejected_without_review_record(self):
        runs = DurableRunStore()
        pipeline = QuestionGenerationPipeline(reviews=runs)
        payload = valid_payload()
        payload["questions"][0]["options"][0]["is_correct"] = False

        draft = await pipeline.prepare_draft(
            payload,
            owner_id="user-1",
            run_id="run-does-not-exist",
        )

        self.assertEqual(draft.status, "rejected")
        self.assertIsNone(draft.review_id)
        self.assertFalse(pipeline.can_persist(draft))

    async def test_grounded_question_without_support_requires_review(self):
        reviewer = QuestionSemanticReviewer()
        result = await reviewer.review(
            valid_payload()["questions"][0],
            sources=["Một chủ đề hoàn toàn khác"],
            require_grounding=True,
        )

        self.assertEqual(result.status, "needs_human_review")
        self.assertTrue(any(item.code == "SOURCE_SUPPORT_WEAK" for item in result.findings))

    async def test_llm_judge_is_optional_and_structured(self):
        judge = AsyncMock(return_value={
            "findings": [{
                "code": "AMBIGUOUS",
                "severity": "review",
                "message": "Cần reviewer kiểm tra câu hỏi.",
            }],
        })
        reviewer = QuestionSemanticReviewer(judge=judge)

        result = await reviewer.review(valid_payload()["questions"][0])

        judge.assert_awaited_once()
        self.assertEqual(result.reviewer, "llm")
        self.assertEqual(result.status, "needs_human_review")


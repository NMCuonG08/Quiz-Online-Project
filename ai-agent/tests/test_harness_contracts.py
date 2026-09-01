import unittest
from datetime import datetime, timezone

from pydantic import ValidationError

from services.harness import (
    ArtifactRef,
    BudgetPolicy,
    EvidenceRef,
    RunContext,
    RunRequest,
    ToolExecutionResult,
    VerificationCheck,
    VerificationResult,
)


class HarnessContractTests(unittest.TestCase):
    def test_run_context_serializes_nested_runtime_contracts(self):
        request = RunRequest(
            request_id="req-1",
            user_message="Tạo quiz Python",
            trusted_user_id="user-1",
            session_id="session-1",
            scope="creator",
            route="/user/quizzes",
        )
        context = RunContext(
            run_id="run-1",
            thread_id="thread-1",
            request=request,
            capabilities=["authoring"],
            permissions=["quiz.create"],
        )

        payload = context.model_dump(mode="json")

        self.assertEqual(payload["request"]["trusted_user_id"], "user-1")
        self.assertEqual(payload["status"], "created")
        self.assertEqual(payload["usage"]["total_tokens"], 0)
        self.assertEqual(payload["budgets"]["max_tool_calls"], 32)

    def test_request_rejects_external_route(self):
        with self.assertRaises(ValidationError):
            RunRequest(
                request_id="req-1",
                user_message="hello",
                trusted_user_id="user-1",
                session_id="session-1",
                scope="learner",
                route="https://evil.example",
            )

    def test_evidence_and_artifact_contracts_bound_data(self):
        evidence = EvidenceRef(
            source_kind="backend",
            source_id="quiz-1",
            title="Python cơ bản",
            uri="/quiz/python-co-ban",
            retrieved_at=datetime.now(timezone.utc),
        )
        artifact = ArtifactRef(
            artifact_id="artifact-1",
            artifact_type="quiz_preview",
            owner_id="user-1",
            content_type="application/json",
        )
        result = ToolExecutionResult(
            ok=True,
            tool_name="get_quiz",
            output={"id": "quiz-1"},
            evidence=[evidence],
            artifacts=[artifact],
        )
        verification = VerificationResult(
            passed=True,
            checks=[VerificationCheck(name="schema", passed=True)],
            evidence=[evidence],
        )

        self.assertEqual(result.evidence[0].source_id, "quiz-1")
        self.assertEqual(result.artifacts[0].owner_id, "user-1")
        self.assertTrue(verification.model_dump()["passed"])

    def test_extra_contract_fields_are_rejected(self):
        with self.assertRaises(ValidationError):
            BudgetPolicy(unknown_limit=10)


import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from services import main


class ChatApiContractTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)

    def test_chat_uses_backend_identity_not_browser_user_id(self):
        process_message = AsyncMock(return_value={"answer": "ok", "surfaces": [], "session_id": "session-1"})
        with (
            patch.object(main.agent, "process_message", process_message),
            patch.object(main.agent, "allow_request", AsyncMock(return_value=True)),
            patch("services.main.resolve_identity", AsyncMock(return_value=("trusted-user", "creator"))),
        ):
            response = self.client.post("/chat", json={
                "message": "xem quiz của tôi",
                "user_id": "attacker-controlled-id",
                "session_id": "session-1",
                "scope": "creator",
            }, headers={"Authorization": "Bearer token"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(process_message.await_args.args[1], "trusted-user")
        self.assertEqual(process_message.await_args.args[5], "creator")

    def test_chat_returns_429_when_rate_limited(self):
        with (
            patch.object(main.agent, "allow_request", AsyncMock(return_value=False)),
            patch("services.main.resolve_identity", AsyncMock(return_value=("trusted-user", "learner"))),
        ):
            response = self.client.post("/chat", json={
                "message": "tìm quiz",
                "session_id": "rate-limited-session",
                "scope": "learner",
            })

        self.assertEqual(response.status_code, 429)

    def test_chat_does_not_expose_internal_exception_details(self):
        with (
            patch.object(main.agent, "allow_request", AsyncMock(return_value=True)),
            patch.object(main.agent, "process_message", AsyncMock(side_effect=RuntimeError("secret-db-detail"))),
            patch("services.main.resolve_identity", AsyncMock(return_value=("trusted-user", "learner"))),
        ):
            response = self.client.post("/chat", json={"message": "hello"}, headers={"Authorization": "Bearer token"})

        self.assertEqual(response.status_code, 500)
        self.assertNotIn("secret-db-detail", response.text)

    def test_stream_rejects_privileged_scope_without_bearer_token(self):
        response = self.client.post("/chat/stream", json={
            "message": "tạo quiz",
            "session_id": "anonymous-admin-attempt",
            "scope": "admin",
        })
        self.assertEqual(response.status_code, 401)

    def test_stream_rejects_learner_without_bearer_token(self):
        response = self.client.post("/chat/stream", json={
            "message": "tìm quiz",
            "session_id": "anonymous-learner-attempt",
            "scope": "learner",
        })
        self.assertEqual(response.status_code, 401)

    def test_ready_requires_all_configured_dependencies(self):
        with patch.object(main.agent, "readiness", AsyncMock(return_value={
            "model_configured": True, "redis_ready": True, "ready": True,
        })):
            response = self.client.get("/ready")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ready"])

        with patch.object(main.agent, "readiness", AsyncMock(return_value={
            "model_configured": False, "redis_ready": True, "ready": False,
        })):
            response = self.client.get("/ready")
        self.assertEqual(response.status_code, 503)

    def test_metrics_endpoint_exposes_prometheus_content(self):
        main.metrics.record_tool("search_quizzes", "success")
        response = self.client.get("/metrics")
        self.assertEqual(response.status_code, 200)
        self.assertIn("quiz_ai_tool_calls_total", response.text)

    def test_concrete_chat_completions_url_is_normalized_to_api_root(self):
        self.assertEqual(
            main.normalize_openai_base_url("https://provider.example/v1/chat/completions"),
            "https://provider.example/v1",
        )

    def test_run_status_is_owner_scoped(self):
        run = type("Run", (), {
            "model_dump": lambda self, mode=None: {
                "run_id": "run-1", "status": "completed",
            },
        })()
        with (
            patch("services.main.resolve_run_identity", AsyncMock(return_value=("trusted-user", "learner"))),
            patch.object(main.agent, "get_run", AsyncMock(return_value=run)),
        ):
            response = self.client.get("/runs/run-1", headers={"Authorization": "Bearer token"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["run"]["status"], "completed")

    def test_cancel_run_returns_not_found_for_other_owner(self):
        with (
            patch("services.main.resolve_run_identity", AsyncMock(return_value=("trusted-user", "learner"))),
            patch.object(main.agent, "cancel_run", AsyncMock(return_value=False)),
        ):
            response = self.client.post("/runs/run-1/cancel", headers={"Authorization": "Bearer token"})

        self.assertEqual(response.status_code, 404)

    def test_run_events_replay_is_available_after_sequence(self):
        with (
            patch("services.main.resolve_run_identity", AsyncMock(return_value=("trusted-user", "learner"))),
            patch.object(main.agent, "replay_run_events", AsyncMock(return_value=[
                {"type": "done", "sequence": 2},
            ])),
        ):
            response = self.client.get(
                "/runs/run-1/events?after_sequence=1&limit=10",
                headers={"Authorization": "Bearer token"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["events"][0]["sequence"], 2)

    def test_background_run_enqueue_uses_trusted_identity(self):
        enqueue = AsyncMock(return_value={
            "run_id": "run-1", "job_id": "job-1", "status": "queued",
        })
        with (
            patch("services.main.resolve_identity", AsyncMock(return_value=("trusted-user", "creator"))),
            patch.object(main.agent, "allow_request", AsyncMock(return_value=True)),
            patch.object(main.agent, "enqueue_background_run", enqueue),
        ):
            response = self.client.post(
                "/runs",
                json={"message": "Tạo quiz Python", "user_id": "attacker"},
                headers={"Authorization": "Bearer token"},
            )

        self.assertEqual(response.status_code, 202)
        self.assertEqual(enqueue.await_args.args[1], "trusted-user")


if __name__ == "__main__":
    unittest.main()

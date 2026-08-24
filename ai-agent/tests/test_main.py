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

    def test_stream_rejects_privileged_scope_without_bearer_token(self):
        response = self.client.post("/chat/stream", json={
            "message": "tạo quiz",
            "session_id": "anonymous-admin-attempt",
            "scope": "admin",
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


if __name__ == "__main__":
    unittest.main()

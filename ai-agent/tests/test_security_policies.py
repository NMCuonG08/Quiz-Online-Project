import unittest

from services.harness.tool_specs import ToolSpec
from services.policies import (
    OutputGuardViolation,
    PolicyEngine,
    PolicyInput,
    StreamingOutputGuard,
    arguments_hash,
)


def spec(name: str = "create_quiz", access: str = "write", idempotency: str = "required") -> ToolSpec:
    return ToolSpec(
        name=name,
        capability="authoring",
        access=access,
        risk="write" if access == "write" else "read",
        input_schema={"type": "object"},
        allowed_scopes=frozenset({"creator", "admin"}),
        requires_approval=access == "write",
        idempotency=idempotency,
    )


class PolicyEngineTests(unittest.TestCase):
    def setUp(self):
        self.engine = PolicyEngine()

    def test_write_proposal_requires_approval_but_does_not_execute(self):
        decision = self.engine.evaluate(PolicyInput(
            tool=spec(),
            phase="propose",
            scope="creator",
            allowed_tools={"create_quiz"},
            actor_id="user-1",
        ))
        self.assertEqual(decision.decision, "require_approval")
        self.assertEqual(decision.policy_id, "quiz-agent.runtime")
        self.assertEqual(decision.action, "create_quiz")

    def test_write_execution_without_approval_requires_approval_first(self):
        decision = self.engine.evaluate(PolicyInput(
            tool=spec(),
            phase="execute",
            scope="creator",
            allowed_tools={"create_quiz"},
            actor_id="user-1",
        ))
        self.assertEqual(decision.decision, "require_approval")

    def test_approved_write_without_idempotency_is_denied(self):
        decision = self.engine.evaluate(PolicyInput(
            tool=spec(),
            phase="execute",
            scope="creator",
            allowed_tools={"create_quiz"},
            approval_verified=True,
            actor_id="user-1",
        ))
        self.assertEqual(decision.decision, "deny")
        self.assertIn("idempotency", decision.reason)

    def test_invalid_scope_and_empty_capability_manifest_fail_closed(self):
        invalid_scope = self.engine.evaluate(PolicyInput(
            tool=spec("search", "read", "none"),
            phase="propose",
            scope="superadmin",
            allowed_tools={"search"},
            actor_id="user-1",
        ))
        empty_manifest = self.engine.evaluate(PolicyInput(
            tool=spec("search", "read", "none"),
            phase="propose",
            scope="creator",
            allowed_tools=set(),
            actor_id="user-1",
        ))
        self.assertEqual(invalid_scope.decision, "deny")
        self.assertEqual(empty_manifest.decision, "deny")

    def test_resource_owner_and_tenant_are_checked(self):
        owner_denied = self.engine.evaluate(PolicyInput(
            tool=spec("search", "read", "none"),
            phase="propose",
            scope="creator",
            allowed_tools={"search"},
            actor_id="user-1",
            tenant_id="tenant-a",
            resource={"owner_id": "user-2", "tenant_id": "tenant-a"},
        ))
        tenant_denied = self.engine.evaluate(PolicyInput(
            tool=spec("search", "read", "none"),
            phase="propose",
            scope="creator",
            allowed_tools={"search"},
            actor_id="user-1",
            tenant_id="tenant-a",
            resource={"owner_id": "user-1", "tenant_id": "tenant-b"},
        ))
        self.assertEqual(owner_denied.decision, "deny")
        self.assertEqual(tenant_denied.decision, "deny")

    def test_arguments_hash_changes_when_arguments_change(self):
        first = arguments_hash("delete_quiz", {"quiz_id": "quiz-1"})
        second = arguments_hash("delete_quiz", {"quiz_id": "quiz-2"})
        self.assertNotEqual(first, second)


class StreamingOutputGuardTests(unittest.TestCase):
    def test_buffers_until_a_safe_boundary(self):
        guard = StreamingOutputGuard()
        self.assertEqual(guard.feed("Xin chào"), [])
        self.assertEqual(guard.feed(" bạn."), ["Xin chào bạn."])

    def test_blocks_secret_split_across_chunks(self):
        guard = StreamingOutputGuard()
        guard.feed("Bearer ")
        with self.assertRaises(OutputGuardViolation):
            guard.feed("abcdefghijklmnop")

    def test_redacts_high_confidence_pii_in_citations(self):
        guard = StreamingOutputGuard()
        self.assertEqual(
            guard.sanitize_metadata_text("Liên hệ demo@example.com hoặc 0912345678"),
            "Liên hệ [email đã ẩn] hoặc [số điện thoại đã ẩn]",
        )

    def test_chunked_stream_stops_before_secret_reaches_client(self):
        guard = StreamingOutputGuard()
        emitted = []
        emitted.extend(guard.feed("Đây là phần an toàn. "))
        with self.assertRaises(OutputGuardViolation):
            guard.feed("Bearer ")
            guard.feed("abcdefghijklmnop")
        self.assertEqual(emitted, ["Đây là phần an toàn. "])


if __name__ == "__main__":
    unittest.main()

import unittest

from services.agent_roles import assert_role_tool, role_for


class AgentRoleContractTests(unittest.TestCase):
    def test_reviewer_is_read_only(self):
        reviewer = role_for("quality_reviewer")
        self.assertFalse(reviewer.can_side_effect)
        with self.assertRaises(PermissionError):
            assert_role_tool("quality_reviewer", "delete_quiz")

    def test_builder_has_bounded_draft_tools(self):
        assert_role_tool("quiz_builder", "create_quiz_with_questions")
        with self.assertRaises(PermissionError):
            assert_role_tool("quiz_builder", "publish_quiz")

    def test_unknown_role_is_rejected(self):
        with self.assertRaises(ValueError):
            role_for("untrusted_role")

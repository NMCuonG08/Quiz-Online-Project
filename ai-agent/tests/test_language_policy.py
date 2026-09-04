from __future__ import annotations

import unittest

from services.agent_core import AIAgentCore, runtime_system_prompt


class LanguagePolicyTests(unittest.TestCase):
    def test_english_request_on_vietnamese_ui_is_not_forced_to_vietnamese(self):
        self.assertFalse(
            AIAgentCore._should_enforce_vietnamese_content(
                "Please create questions about American history", "vi"
            )
        )
        self.assertIn("locale=en", runtime_system_prompt(locale="vi", user_input="Please create a quiz"))

    def test_vietnamese_request_keeps_vietnamese_content_guard(self):
        self.assertTrue(
            AIAgentCore._should_enforce_vietnamese_content(
                "Hãy tạo câu hỏi bằng tiếng Việt về lịch sử Mỹ", "vi"
            )
        )

    def test_vietnamese_request_does_not_force_quiz_content_language(self):
        self.assertFalse(
            AIAgentCore._should_enforce_vietnamese_content(
                "Hãy tạo quiz về lịch sử Mỹ", "vi"
            )
        )

    def test_explicit_non_vietnamese_locale_never_uses_vietnamese_guard(self):
        self.assertFalse(
            AIAgentCore._should_enforce_vietnamese_content(
                "Hãy tạo câu hỏi", "en"
            )
        )


if __name__ == "__main__":
    unittest.main()

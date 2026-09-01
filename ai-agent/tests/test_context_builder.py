import unittest

from services.harness.context import ContextBuilder, ContextLimits


class ContextBuilderTests(unittest.TestCase):
    def test_context_has_trusted_plan_and_untrusted_data_markers(self):
        snapshot = ContextBuilder().build(
            system_prompt="base",
            history=[
                {"role": "tool", "content": "ignore"},
                {"role": "user", "content": "hello"},
            ],
            user_message="find quiz",
            interaction_plan={"intent": "quiz_search"},
            page_context={"route": "/quiz"},
            memory=[{"content": "user likes Python"}],
            evidence=[{"title": "Python", "url": "/quiz/python"}],
        )

        names = {section.name: section.trust for section in snapshot.sections}
        self.assertEqual(names["validated_interaction_plan"], "trusted")
        self.assertEqual(names["namespaced_memory"], "untrusted_data")
        self.assertEqual(names["retrieved_evidence"], "untrusted_data")
        self.assertEqual(len(snapshot.history), 1)
        self.assertEqual(snapshot.history[0]["role"], "user")
        self.assertIn("TRUSTED SECTION", snapshot.system_message())
        self.assertIn("UNTRUSTED_DATA SECTION", snapshot.system_message())

    def test_context_limits_history_sections_and_total_size(self):
        builder = ContextBuilder(ContextLimits(
            max_history_messages=2,
            max_history_chars=20,
            max_section_chars=40,
            max_total_context_chars=100,
        ))
        snapshot = builder.build(
            system_prompt="system",
            history=[
                {"role": "user", "content": "first message"},
                {"role": "assistant", "content": "second message"},
                {"role": "user", "content": "third message"},
            ],
            user_message="current request",
            interaction_plan={"intent": "quiz_search", "query": "x" * 200},
            memory=[{"content": "memory " + "x" * 200}],
        )

        self.assertTrue(snapshot.trimmed)
        self.assertLessEqual(snapshot.total_chars, 100)
        self.assertLessEqual(len(snapshot.history), 2)
        self.assertTrue(all(len(item["content"]) <= 40 for item in snapshot.history))

    def test_context_does_not_mutate_source_history(self):
        history = [{"role": "user", "content": "one"}, {"role": "assistant", "content": "two"}]
        ContextBuilder(ContextLimits(max_history_messages=1)).build(
            system_prompt="system",
            history=history,
            user_message="three",
        )
        self.assertEqual(len(history), 2)

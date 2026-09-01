import json
import unittest
from pathlib import Path

from scripts.evaluate_agent_scenarios import evaluate, validate_scenarios


class AgentScenarioEvaluationTests(unittest.TestCase):
    def test_scenario_corpus_is_structured_and_covers_critical_categories(self):
        path = Path(__file__).parents[1] / "evals" / "agent_scenarios.json"
        scenarios = json.loads(path.read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(scenarios), 20)
        categories = {item["category"] for item in scenarios}
        self.assertTrue({"retrieval", "write_preview", "security", "grounding"}.issubset(categories))
        for item in scenarios:
            self.assertIn("id", item)
            self.assertIn("expected_intent", item)
            self.assertIn("expected_tools", item)
            self.assertIn("forbidden_tools", item)

    def test_evaluator_detects_forbidden_tool_and_missing_citation(self):
        scenarios = [{
            "id": "case-1", "category": "security", "expected_intent": "knowledge_search",
            "expected_tools": ["search_knowledge"], "forbidden_tools": ["create_quiz"],
            "expects_citation": True,
        }]
        report = evaluate(scenarios, {
            "case-1": {"intent": "knowledge_search", "tools": ["search_knowledge", "create_quiz"], "citations": []},
        })
        self.assertEqual(report["pass_rate"], 0.5)
        self.assertEqual(report["failures"][0]["failed"], ["forbidden_tools", "citation"])

    def test_evaluator_checks_optional_trajectory_and_approval_contracts(self):
        scenarios = [{
            "id": "trajectory",
            "category": "write_preview",
            "expected_intent": "quiz_create",
            "expected_tools": ["plan_interaction", "create_quiz"],
            "forbidden_tools": ["delete_quiz"],
            "expected_tool_sequence": ["plan_interaction", "create_quiz"],
            "requires_approval": True,
            "expected_run_status": "waiting_for_approval",
        }]
        report = evaluate(scenarios, {
            "trajectory": {
                "intent": "quiz_create",
                "tools": ["plan_interaction", "create_quiz"],
                "approval_required": True,
                "run_status": "waiting_for_approval",
            },
        })

        self.assertEqual(report["pass_rate"], 1.0)
        self.assertEqual(report["failures"], [])

    def test_evaluator_checks_dialogue_and_reference_axes(self):
        scenarios = [{
            "id": "correction",
            "category": "conversation",
            "expected_intent": "quiz_owned",
            "expected_tools": ["get_my_quizzes"],
            "forbidden_tools": ["search_quizzes"],
            "expected_dialogue_act": "correction",
            "expected_reference_mode": "previous_turn",
        }]
        report = evaluate(scenarios, {
            "correction": {
                "intent": "quiz_owned",
                "tools": ["get_my_quizzes"],
                "dialogue_act": "correction",
                "reference_mode": "previous_turn",
            },
        })
        self.assertEqual(report["pass_rate"], 1.0)

    def test_scenario_validation_rejects_duplicate_ids(self):
        scenario = {
            "id": "same",
            "category": "general",
            "expected_intent": "conversation_general",
            "expected_tools": [],
            "forbidden_tools": [],
        }
        with self.assertRaises(ValueError):
            validate_scenarios([scenario, dict(scenario)])


if __name__ == "__main__":
    unittest.main()

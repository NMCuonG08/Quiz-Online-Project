from __future__ import annotations

import asyncio
import json
import unittest

from services.orchestration.authoring_graph import AuthoringSupervisorGraph, _normalize_generated_question


class AuthoringSupervisorGraphTests(unittest.IsolatedAsyncioTestCase):
    def test_generated_vietnamese_enums_are_normalized_before_quality_gate(self):
        normalized = _normalize_generated_question({
            "question_type": "nhiều đáp án",
            "difficulty_level": "trung bình",
            "options": [{"option_text": "Đúng", "is_correct": True}],
        })
        self.assertEqual(normalized["question_type"], "MULTIPLE_CHOICE")
        self.assertEqual(normalized["difficulty_level"], "MEDIUM")

    def _plan(self) -> dict:
        return {
            "intent": "quiz_create",
            "entities": {
                "title": "History",
                "category": "History",
                "difficulty_level": "EASY",
                "time_limit": 600,
                "quiz_type": "SINGLE_CHOICE",
                "question_count": 2,
            },
        }

    async def test_fanout_aggregates_slots_before_finalizer(self):
        active = 0
        peak = 0
        calls: list[str] = []
        task_events: list[tuple[str, str, str]] = []
        artifacts: list[tuple[str, str]] = []

        async def invoke(role, _prompt, payload):
            nonlocal active, peak
            if role == "curriculum":
                return {"blueprint": [
                    {"slot": 1, "objective": "A", "difficulty_level": "EASY", "question_type": "SINGLE_CHOICE"},
                    {"slot": 2, "objective": "B", "difficulty_level": "EASY", "question_type": "SINGLE_CHOICE"},
                ]}
            active += 1
            peak = max(peak, active)
            await asyncio.sleep(0.01)
            active -= 1
            calls.append(payload["task"]["task_id"])
            return {"questions": [{
                "question_text": f"Question {payload['task']['slots'][0]}",
                "question_type": "SINGLE_CHOICE",
                "options": [
                    {"option_text": "Correct", "is_correct": True, "sort_order": 1},
                    {"option_text": "Wrong", "is_correct": False, "sort_order": 2},
                ],
                "points": 1,
                "explanation": "Reason",
                "sort_order": payload["task"]["slots"][0],
            }]}

        async def dispatch(name, _args):
            if name == "list_categories":
                return json.dumps({"ok": True, "result": {"items": [{"id": "cat-1", "name": "History"}]}})
            return json.dumps({"ok": True, "result": {"approval_required": True}})

        async def images(_query, _limit):
            return []

        async def trace(_node, _event, _tool):
            return None

        async def task_event(task_id, role, status, _metadata):
            task_events.append((task_id, role, status))

        async def artifact_store(task_id, artifact_type, _payload):
            artifacts.append((task_id, artifact_type))
            return f"artifact:{task_id}"

        graph = AuthoringSupervisorGraph(
            invoke_worker=invoke,
            dispatch=dispatch,
            search_images=images,
            build_base_payload=lambda _categories: {
                "title": "History", "slug": "history", "category_id": "cat-1",
                "difficulty_level": "EASY", "time_limit": 600,
                "quiz_type": "SINGLE_CHOICE", "description": "", "instructions": "",
            },
            trace=trace,
            max_questions_per_worker=1,
            task_event=task_event,
            artifact_store=artifact_store,
        )
        payload = await graph.run(user_input="Create a history quiz", plan=self._plan())

        self.assertEqual(peak, 2)
        self.assertEqual(set(calls), {"question-shard-1", "question-shard-2"})
        self.assertEqual([item["sort_order"] for item in payload["questions"]], [1, 2])
        self.assertIn(("question-shard-1", "quiz_builder", "completed"), task_events)
        self.assertIn(("question-shard-2", "quiz_builder", "completed"), task_events)
        self.assertIn(("finalizer", "quiz_proposal"), artifacts)

    async def test_invalid_output_is_repaired_before_finalizer(self):
        repair_seen = False

        async def invoke(role, _prompt, payload):
            nonlocal repair_seen
            if role == "curriculum":
                return {"blueprint": [{
                    "slot": 1, "objective": "A", "difficulty_level": "EASY", "question_type": "SINGLE_CHOICE",
                }]}
            if "quality_report" in payload:
                repair_seen = True
                return {"questions": [{
                    "question_text": "Repaired question",
                    "question_type": "SINGLE_CHOICE",
                    "options": [
                        {"option_text": "Correct", "is_correct": True, "sort_order": 1},
                        {"option_text": "Wrong", "is_correct": False, "sort_order": 2},
                    ],
                    "points": 1, "explanation": "Reason", "sort_order": 1,
                }]}
            return {"questions": [{
                "question_text": "", "question_type": "SINGLE_CHOICE", "options": [], "sort_order": 1,
            }]}

        async def dispatch(name, _args):
            if name == "list_categories":
                return json.dumps({"ok": True, "result": {"items": [{"id": "cat-1", "name": "History"}]}})
            return json.dumps({"ok": True, "result": {"approval_required": True}})

        async def trace(_node, _event, _tool):
            return None

        graph = AuthoringSupervisorGraph(
            invoke_worker=invoke,
            dispatch=dispatch,
            search_images=lambda _query, _limit: asyncio.sleep(0, result=[]),
            build_base_payload=lambda _categories: {
                "title": "History", "slug": "history", "category_id": "cat-1",
                "difficulty_level": "EASY", "time_limit": 600,
                "quiz_type": "SINGLE_CHOICE", "description": "", "instructions": "",
            },
            trace=trace,
            max_revisions=1,
        )
        payload = await graph.run(user_input="Create a history quiz", plan=self._plan())

        self.assertTrue(repair_seen)
        self.assertEqual(payload["questions"][0]["question_text"], "Repaired question")

    async def test_resume_retries_one_question_shard_and_keeps_completed_artifacts(self):
        generated: list[str] = []

        async def invoke(role, _prompt, payload):
            if role == "curriculum":
                raise AssertionError("curriculum should be loaded from durable state")
            generated.append(payload["task"]["task_id"])
            return {"questions": [{
                "question_text": "Regenerated question",
                "question_type": "SINGLE_CHOICE",
                "options": [
                    {"option_text": "Correct", "is_correct": True, "sort_order": 1},
                    {"option_text": "Wrong", "is_correct": False, "sort_order": 2},
                ],
                "points": 1, "explanation": "Reason", "sort_order": payload["task"]["slots"][0],
            }]}

        async def dispatch(name, _args):
            if name == "list_categories":
                raise AssertionError("categories should be loaded from durable state")
            return json.dumps({"ok": True, "result": {"approval_required": True}})

        async def trace(_node, _event, _tool):
            return None

        graph = AuthoringSupervisorGraph(
            invoke_worker=invoke,
            dispatch=dispatch,
            search_images=lambda _query, _limit: asyncio.sleep(0, result=[]),
            build_base_payload=lambda _categories: {
                "title": "History", "slug": "history", "category_id": "cat-1",
                "difficulty_level": "EASY", "time_limit": 600,
                "quiz_type": "SINGLE_CHOICE", "description": "", "instructions": "",
            },
            trace=trace,
            max_questions_per_worker=1,
        )
        payload = await graph.run(
            user_input="Create a history quiz",
            plan=self._plan(),
            retry_task_id="question-shard-1",
            resume_state={
                "categories": {"items": [{"id": "cat-1", "name": "History"}]},
                "base_payload": {
                    "title": "History", "slug": "history", "category_id": "cat-1",
                    "difficulty_level": "EASY", "time_limit": 600,
                    "quiz_type": "SINGLE_CHOICE", "description": "", "instructions": "",
                },
                "curriculum": {"blueprint": [
                    {"slot": 1, "objective": "A", "difficulty_level": "EASY", "question_type": "SINGLE_CHOICE"},
                    {"slot": 2, "objective": "B", "difficulty_level": "EASY", "question_type": "SINGLE_CHOICE"},
                ]},
                "question_batches": [{
                    "task_id": "question-shard-2",
                    "questions": [{
                        "question_text": "Completed question",
                        "question_type": "SINGLE_CHOICE",
                        "options": [
                            {"option_text": "Correct", "is_correct": True, "sort_order": 1},
                            {"option_text": "Wrong", "is_correct": False, "sort_order": 2},
                        ],
                        "points": 1, "explanation": "Reason", "sort_order": 2,
                    }],
                }],
            },
        )

        self.assertEqual(generated, ["question-shard-1"])
        self.assertEqual(
            {question["question_text"] for question in payload["questions"]},
            {"Regenerated question", "Completed question"},
        )


if __name__ == "__main__":
    unittest.main()

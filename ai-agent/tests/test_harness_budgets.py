import unittest

from services.harness import BudgetExceeded, BudgetPolicy, BudgetTracker


class FakeClock:
    def __init__(self, value: float = 100.0):
        self.value = value

    def __call__(self) -> float:
        return self.value


class HarnessBudgetTests(unittest.TestCase):
    def test_exact_limit_is_allowed_and_next_operation_is_atomic(self):
        tracker = BudgetTracker(
            BudgetPolicy(
                max_graph_steps=2,
                max_model_calls=2,
                max_tool_calls=2,
                max_subagent_calls=1,
                max_total_tokens=10,
                max_cost_usd=1,
                max_elapsed_seconds=60,
            )
        )
        tracker.start()
        tracker.consume_step(2)
        tracker.consume_model_call(2)
        tracker.consume_tool_call(2)
        tracker.consume_subagent_call()
        tracker.record_tokens(input_tokens=6, output_tokens=4)
        tracker.record_cost(1)

        with self.assertRaises(BudgetExceeded):
            tracker.consume_tool_call()
        with self.assertRaises(BudgetExceeded):
            tracker.consume_step()

        usage = tracker.snapshot()
        self.assertEqual(usage.graph_steps, 2)
        self.assertEqual(usage.tool_calls, 2)
        self.assertEqual(usage.total_tokens, 10)
        self.assertEqual(usage.estimated_cost_usd, 1)

    def test_negative_or_invalid_increments_are_rejected(self):
        tracker = BudgetTracker(BudgetPolicy(max_elapsed_seconds=60))
        tracker.start()

        with self.assertRaises(ValueError):
            tracker.consume_step(-1)
        with self.assertRaises(ValueError):
            tracker.record_tokens(input_tokens=True)
        with self.assertRaises(ValueError):
            tracker.record_cost(float("nan"))

    def test_elapsed_limit_is_enforced_before_commit(self):
        clock = FakeClock()
        tracker = BudgetTracker(
            BudgetPolicy(max_elapsed_seconds=5, max_graph_steps=2),
            clock=clock,
        )
        tracker.start()
        clock.value = 106

        with self.assertRaises(BudgetExceeded):
            tracker.consume_step()

        self.assertEqual(tracker.snapshot().graph_steps, 0)

    def test_remaining_and_snapshot_are_isolated(self):
        tracker = BudgetTracker(BudgetPolicy(max_tool_calls=3, max_elapsed_seconds=60))
        tracker.start()
        tracker.consume_tool_call()
        snapshot = tracker.snapshot()
        snapshot.tool_calls = 99

        self.assertEqual(tracker.snapshot().tool_calls, 1)
        self.assertEqual(tracker.remaining()["tool_calls"], 2)

    def test_model_step_reservation_is_atomic_across_two_limits(self):
        tracker = BudgetTracker(
            BudgetPolicy(max_graph_steps=3, max_model_calls=1, max_elapsed_seconds=60)
        )
        tracker.start()
        tracker.consume_model_step()

        with self.assertRaises(BudgetExceeded):
            tracker.consume_model_step()

        usage = tracker.snapshot()
        self.assertEqual(usage.graph_steps, 1)
        self.assertEqual(usage.model_calls, 1)

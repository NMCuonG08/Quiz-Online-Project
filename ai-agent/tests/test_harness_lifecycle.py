import unittest

from services.harness import HarnessError, RunLifecycle


class HarnessLifecycleTests(unittest.TestCase):
    def test_happy_path_and_history_are_explicit(self):
        lifecycle = RunLifecycle()
        lifecycle.transition("authenticating")
        lifecycle.transition("planning")
        lifecycle.transition("context_building")
        lifecycle.transition("executing")
        lifecycle.transition("verifying")
        lifecycle.transition("responding")
        lifecycle.transition("completed")

        self.assertEqual(lifecycle.status, "completed")
        self.assertEqual(len(lifecycle.history), 7)
        self.assertEqual(lifecycle.outcome_status(), "completed")

    def test_illegal_transition_and_terminal_state_are_rejected(self):
        lifecycle = RunLifecycle()

        with self.assertRaises(HarnessError):
            lifecycle.transition("completed")

        lifecycle.transition("planning")
        lifecycle.transition("failed")

        with self.assertRaises(HarnessError):
            lifecycle.transition("executing")

        self.assertEqual(lifecycle.outcome_status(), "failed")

    def test_approval_and_pause_paths_are_supported(self):
        lifecycle = RunLifecycle()
        lifecycle.transition("planning")
        lifecycle.transition("executing")
        lifecycle.transition("waiting_for_approval")
        lifecycle.transition("executing")
        lifecycle.transition("paused")
        lifecycle.transition("executing")
        lifecycle.transition("failed")

        self.assertEqual(lifecycle.status, "failed")
        self.assertEqual(
            [item.to_status for item in lifecycle.history],
            [
                "planning",
                "executing",
                "waiting_for_approval",
                "executing",
                "paused",
                "executing",
                "failed",
            ],
        )

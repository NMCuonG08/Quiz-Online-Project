import unittest
from datetime import datetime, timezone

from services.harness import EventSequencer, HarnessEvent


class HarnessEventTests(unittest.TestCase):
    def test_events_have_ordered_additive_metadata_and_flat_payload(self):
        sequencer = EventSequencer(
            "run-1",
            clock=lambda: datetime(2030, 1, 2, tzinfo=timezone.utc),
        )

        first = sequencer.emit("status", {"label": "Đang xử lý"})
        second = sequencer.emit("done", {"intent": "quiz_search"})

        self.assertEqual(first["run_id"], "run-1")
        self.assertEqual(first["sequence"], 1)
        self.assertEqual(second["sequence"], 2)
        self.assertEqual(first["label"], "Đang xử lý")
        self.assertEqual(second["intent"], "quiz_search")
        self.assertEqual(first["timestamp"], "2030-01-02T00:00:00+00:00")
        HarnessEvent.model_validate({
            "type": "status",
            "event_id": first["event_id"],
            "run_id": "run-1",
            "sequence": 1,
            "timestamp": first["timestamp"],
            "payload": {"label": "Đang xử lý"},
        })

    def test_reserved_metadata_cannot_be_overwritten(self):
        sequencer = EventSequencer("run-1")

        with self.assertRaises(ValueError):
            sequencer.emit("status", {"run_id": "attacker-run"})

        with self.assertRaises(ValueError):
            sequencer.emit("status", {"type": "spoofed"})


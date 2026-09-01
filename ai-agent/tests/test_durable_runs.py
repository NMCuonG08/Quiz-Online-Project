import unittest
from datetime import datetime, timezone
from uuid import uuid4

from services.harness import (
    ArtifactRef,
    DurableRunStore,
    EventSequencer,
    ReviewRecord,
    RunContext,
    RunRequest,
)


def make_context(user_id="user-1", tenant_id=None):
    request = RunRequest(
        request_id="request-1",
        user_message="Tạo quiz Python",
        trusted_user_id=user_id,
        session_id="session-1",
        scope="creator",
        route="/user/quizzes",
    )
    return RunContext(
        run_id=str(uuid4()),
        thread_id="thread-1",
        request=request,
        metadata={"tenant_id": tenant_id} if tenant_id else {},
    )


class DurableRunStoreTests(unittest.IsolatedAsyncioTestCase):
    async def test_run_is_persisted_and_owner_scoped(self):
        store = DurableRunStore(ttl_seconds=3600)
        context = make_context()
        await store.create_run(context)

        own = await store.get_run(context.run_id, owner_id="user-1")
        other = await store.get_run(context.run_id, owner_id="user-2")

        self.assertEqual(own.run_id, context.run_id)
        self.assertIsNone(other)

        context.status = "executing"
        self.assertTrue(await store.update_run(context))
        updated = await store.get_run(context.run_id, owner_id="user-1")
        self.assertEqual(updated.status, "executing")

    async def test_events_replay_after_sequence_and_owner_isolation(self):
        store = DurableRunStore(ttl_seconds=3600)
        context = make_context()
        await store.create_run(context)
        sequencer = EventSequencer(context.run_id)

        await store.append_event(
            sequencer.emit("status", {"label": "planning"}),
            owner_id="user-1",
        )
        await store.append_event(
            sequencer.emit("done", {"run_status": "completed"}),
            owner_id="user-1",
        )

        events = await store.replay_events(
            context.run_id, owner_id="user-1", after_sequence=1,
        )
        hidden = await store.replay_events(
            context.run_id, owner_id="user-2",
        )

        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["type"], "done")
        self.assertEqual(hidden, [])

    async def test_cancel_request_is_owner_scoped_and_clearable(self):
        store = DurableRunStore(ttl_seconds=3600)
        context = make_context()
        await store.create_run(context)

        self.assertFalse(await store.is_cancel_requested(
            context.run_id, owner_id="user-1",
        ))
        self.assertFalse(await store.request_cancel(
            context.run_id, owner_id="user-2",
        ))
        self.assertTrue(await store.request_cancel(
            context.run_id, owner_id="user-1",
        ))
        self.assertTrue(await store.is_cancel_requested(
            context.run_id, owner_id="user-1",
        ))
        self.assertTrue(await store.clear_cancel(
            context.run_id, owner_id="user-1",
        ))
        self.assertFalse(await store.is_cancel_requested(
            context.run_id, owner_id="user-1",
        ))

    async def test_artifact_requires_matching_run_owner_and_can_be_deleted(self):
        store = DurableRunStore(ttl_seconds=3600)
        context = make_context()
        await store.create_run(context)
        artifact = ArtifactRef(
            artifact_id="artifact-1",
            artifact_type="quiz_preview",
            owner_id="user-1",
            uri="memory://artifact-1",
            content_type="application/json",
        )

        stored = await store.put_artifact(
            artifact,
            run_id=context.run_id,
            owner_id="user-1",
            content='{"title":"Python"}',
        )
        self.assertEqual(stored.ref.artifact_id, "artifact-1")
        self.assertIsNotNone(await store.get_artifact(
            "artifact-1", owner_id="user-1",
        ))
        self.assertIsNone(await store.get_artifact(
            "artifact-1", owner_id="user-2",
        ))
        self.assertFalse(await store.delete_artifact(
            "artifact-1", owner_id="user-2",
        ))
        self.assertTrue(await store.delete_artifact(
            "artifact-1", owner_id="user-1",
        ))

    async def test_artifact_cannot_claim_another_owner(self):
        store = DurableRunStore()
        context = make_context()
        await store.create_run(context)
        artifact = ArtifactRef(
            artifact_id="artifact-2",
            artifact_type="report",
            owner_id="user-2",
        )

        with self.assertRaises(PermissionError):
            await store.put_artifact(
                artifact,
                run_id=context.run_id,
                owner_id="user-1",
                content="private",
            )

    async def test_reviews_are_listed_by_owner_and_status(self):
        store = DurableRunStore(ttl_seconds=3600)
        context = make_context()
        await store.create_run(context)
        review = ReviewRecord(
            review_id="review-1",
            run_id=context.run_id,
            owner_id="user-1",
            resource_type="quiz_draft",
            resource_payload={"title": "Python"},
        )
        await store.create_review(review, owner_id="user-1")

        pending = await store.list_reviews(owner_id="user-1", status="pending")
        hidden = await store.list_reviews(owner_id="user-2", status="pending")
        self.assertEqual([item.review_id for item in pending], ["review-1"])
        self.assertEqual(hidden, [])

        await store.decide_review(
            "review-1",
            owner_id="user-1",
            decision="approved",
            reviewer_id="user-1",
        )
        self.assertEqual(
            [item.review_id for item in await store.list_reviews(owner_id="user-1", status="approved")],
            ["review-1"],
        )


if __name__ == "__main__":
    unittest.main()

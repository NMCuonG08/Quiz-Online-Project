import unittest
from datetime import datetime, timezone

from services.background_worker import BackgroundAgentWorker
from services.harness import (
    DurableRunQueue,
    DurableRunStore,
    RunContext,
    RunJob,
    RunRequest,
)
from services.harness.credentials import DelegatedCredentialBroker


class FakeAgent:
    def __init__(self):
        self.calls = []

    async def stream_message(self, *args):
        self.calls.append(args)
        yield {"type": "done"}

    async def mark_run_terminal(self, *args, **kwargs):
        self.calls.append(("terminal", args, kwargs))
        return True


def make_context():
    return RunContext(
        run_id="run-worker-1",
        thread_id="thread-1",
        request=RunRequest(
            request_id="request-1",
            user_message="Xem quiz",
            trusted_user_id="user-1",
            session_id="session-1",
            scope="learner",
        ),
    )


class BackgroundWorkerTests(unittest.IsolatedAsyncioTestCase):
    async def test_worker_uses_credential_ref_and_never_job_token(self):
        store = DurableRunStore()
        context = make_context()
        await store.create_run(context)
        broker = DelegatedCredentialBroker()
        reference = await broker.put(
            "delegated-secret-token",
            owner_id="user-1",
        )
        queue = DurableRunQueue()
        agent = FakeAgent()
        worker = BackgroundAgentWorker(agent, queue, store, broker)

        job = RunJob(
            run_id=context.run_id,
            owner_id="user-1",
            credential_ref=reference.reference,
            payload={
                "message": "Xem quiz",
                "session_id": "session-1",
                "scope": "learner",
            },
        )
        serialized = job.model_dump_json()
        self.assertNotIn("delegated-secret-token", serialized)
        await worker.handle(job)

        self.assertEqual(agent.calls[0][1], "user-1")
        self.assertEqual(agent.calls[0][2], "delegated-secret-token")
        self.assertIsNone(await broker.get(reference.reference, owner_id="user-1"))

    async def test_worker_fails_safely_when_credential_expires(self):
        store = DurableRunStore()
        context = make_context()
        await store.create_run(context)
        broker = DelegatedCredentialBroker()
        queue = DurableRunQueue()
        agent = FakeAgent()
        worker = BackgroundAgentWorker(agent, queue, store, broker)

        job = RunJob(
            run_id=context.run_id,
            owner_id="user-1",
            credential_ref="0" * 64,
            payload={"message": "Xem quiz"},
        )
        await worker.handle(job)

        self.assertEqual(agent.calls[0][0], "terminal")
        self.assertEqual(agent.calls[0][2]["status"], "failed")


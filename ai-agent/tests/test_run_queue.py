import asyncio
import unittest

from services.harness import DurableRunQueue, RunJob, RunWorker


class RunQueueTests(unittest.IsolatedAsyncioTestCase):
    async def test_local_queue_claim_ack(self):
        queue = DurableRunQueue()
        job = RunJob(run_id="run-1", owner_id="user-1", payload={"task": "quiz"})

        await queue.enqueue(job)
        claimed = await queue.claim()

        self.assertEqual(claimed.job_id, job.job_id)
        self.assertTrue(await queue.ack(claimed))
        self.assertIsNone(await queue.claim())

    async def test_worker_retries_then_acks_success(self):
        queue = DurableRunQueue()
        attempts = []

        async def handler(job):
            attempts.append(job.attempts)
            if len(attempts) == 1:
                raise RuntimeError("temporary")

        worker = RunWorker(queue, handler)
        await queue.enqueue(RunJob(
            run_id="run-1", owner_id="user-1", max_attempts=3,
        ))

        self.assertTrue(await worker.run_once())
        self.assertEqual(attempts, [0])
        self.assertTrue(await worker.run_once())
        self.assertEqual(attempts, [0, 1])
        self.assertIsNone(await queue.claim())

    async def test_worker_drops_job_after_max_attempts(self):
        queue = DurableRunQueue()
        async def handler(_job):
            raise RuntimeError("permanent")

        worker = RunWorker(queue, handler)
        await queue.enqueue(RunJob(
            run_id="run-1", owner_id="user-1", max_attempts=1,
        ))

        self.assertTrue(await worker.run_once())
        self.assertIsNone(await queue.claim())

    async def test_expired_local_lease_is_requeued(self):
        queue = DurableRunQueue(lease_ttl_seconds=1)
        job = RunJob(run_id="run-1", owner_id="user-1", max_attempts=3)
        await queue.enqueue(job)
        claimed = await queue.claim()
        await asyncio.sleep(1.05)

        self.assertEqual(await queue.requeue_expired_leases(), 1)
        recovered = await queue.claim()
        self.assertEqual(recovered.attempts, 1)

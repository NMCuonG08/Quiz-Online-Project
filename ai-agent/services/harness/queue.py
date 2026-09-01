from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Optional
from uuid import uuid4

from pydantic import Field

from .contracts import HarnessModel


class RunJob(HarnessModel):
    job_id: str = Field(default_factory=lambda: str(uuid4()), min_length=1, max_length=128)
    run_id: str = Field(min_length=1, max_length=128)
    owner_id: str = Field(min_length=1, max_length=128)
    tenant_id: Optional[str] = None
    credential_ref: Optional[str] = Field(default=None, min_length=32, max_length=128)
    payload: dict[str, Any] = Field(default_factory=dict)
    attempts: int = Field(default=0, ge=0)
    max_attempts: int = Field(default=3, ge=1, le=20)
    created_at: float = Field(default_factory=time.time)
    available_at: float = Field(default_factory=time.time)


@dataclass
class DurableRunQueue:
    redis: Any = None
    key_prefix: str = "quiz-ai:queue:"
    lease_ttl_seconds: int = 300

    def __post_init__(self) -> None:
        self._local: asyncio.Queue[RunJob] = asyncio.Queue()
        self._processing: dict[str, tuple[float, RunJob]] = {}

    async def enqueue(self, job: RunJob) -> str:
        if self.redis is None:
            await self._local.put(job)
            return job.job_id
        await self.redis.rpush(self._queue_key(), job.model_dump_json())
        return job.job_id

    async def claim(self, timeout_seconds: int = 0) -> Optional[RunJob]:
        if self.redis is None:
            try:
                if timeout_seconds:
                    job = await asyncio.wait_for(
                        self._local.get(), timeout=timeout_seconds,
                    )
                else:
                    job = self._local.get_nowait()
            except (asyncio.QueueEmpty, asyncio.TimeoutError):
                return None
            self._processing[job.job_id] = (time.time() + self.lease_ttl_seconds, job)
            return job

        result = await self.redis.blpop(self._queue_key(), timeout=timeout_seconds)
        if not result:
            return None
        _, raw = result
        job = RunJob.model_validate(json.loads(raw))
        await self.redis.set(
            self._processing_key(job.job_id),
            job.model_dump_json(),
        )
        await self.redis.zadd(
            self._lease_key(), {job.job_id: time.time() + self.lease_ttl_seconds}
        )
        return job

    async def ack(self, job: RunJob) -> bool:
        if self.redis is None:
            return self._processing.pop(job.job_id, None) is not None
        deleted = await self.redis.delete(self._processing_key(job.job_id))
        await self.redis.zrem(self._lease_key(), job.job_id)
        return bool(deleted)

    async def retry(self, job: RunJob, *, delay_seconds: float = 0.0) -> bool:
        await self.ack(job)
        next_attempts = job.attempts + 1
        if next_attempts >= job.max_attempts:
            return False
        retry_job = job.model_copy(update={
            "attempts": next_attempts,
            "available_at": time.time() + max(0.0, delay_seconds),
        })
        if delay_seconds > 0:
            await asyncio.sleep(delay_seconds)
        await self.enqueue(retry_job)
        return True

    async def requeue_expired_leases(self) -> int:
        if self.redis is not None:
            now = time.time()
            job_ids = await self.redis.zrangebyscore(self._lease_key(), "-inf", now)
            recovered = 0
            for raw_job_id in job_ids:
                job_id = raw_job_id.decode() if isinstance(raw_job_id, bytes) else str(raw_job_id)
                raw_job = await self.redis.get(self._processing_key(job_id))
                await self.redis.zrem(self._lease_key(), job_id)
                await self.redis.delete(self._processing_key(job_id))
                if raw_job:
                    await self.retry(RunJob.model_validate(json.loads(raw_job)))
                    recovered += 1
            return recovered
        expired: list[RunJob] = []
        now = time.time()
        for job_id, (expires_at, job) in list(self._processing.items()):
            if expires_at <= now:
                self._processing.pop(job_id, None)
                expired.append(job)
        for job in expired:
            await self.retry(job)
        return len(expired)

    def _queue_key(self) -> str:
        return f"{self.key_prefix}pending"

    def _processing_key(self, job_id: str) -> str:
        return f"{self.key_prefix}processing:{job_id}"

    def _lease_key(self) -> str:
        return f"{self.key_prefix}leases"


WorkerHandler = Callable[[RunJob], Awaitable[None]]


class RunWorker:
    def __init__(
        self,
        queue: DurableRunQueue,
        handler: WorkerHandler,
    ) -> None:
        self.queue = queue
        self.handler = handler
        self._stopping = False

    async def run_once(self, timeout_seconds: int = 0) -> bool:
        job = await self.queue.claim(timeout_seconds)
        if job is None:
            return False
        try:
            await self.handler(job)
        except asyncio.CancelledError:
            await self.queue.retry(job)
            raise
        except Exception:
            await self.queue.retry(job)
        else:
            await self.queue.ack(job)
        return True

    async def serve(self, *, poll_timeout_seconds: int = 1) -> None:
        self._stopping = False
        while not self._stopping:
            await self.run_once(poll_timeout_seconds)
            await self.queue.requeue_expired_leases()

    def stop(self) -> None:
        self._stopping = True

from __future__ import annotations

import logging
from typing import Any

from .harness.credentials import DelegatedCredentialBroker
from .harness.durable import DurableRunStore
from .harness.queue import RunJob, RunWorker


logger = logging.getLogger(__name__)


class BackgroundAgentWorker:
    """Consumes queued Quiz Agent runs using only delegated credentials."""

    def __init__(
        self,
        agent: Any,
        queue: Any,
        run_store: DurableRunStore,
        credentials: DelegatedCredentialBroker,
    ) -> None:
        self.agent = agent
        self.queue = queue
        self.run_store = run_store
        self.credentials = credentials

    async def handle(self, job: RunJob) -> None:
        run = await self.run_store.get_run(job.run_id, owner_id=job.owner_id, tenant_id=job.tenant_id)
        if run is None:
            raise RuntimeError("RUN_NOT_FOUND_OR_FORBIDDEN")
        if run.status in {"completed", "cancelled", "expired", "failed"}:
            await self.queue.ack(job)
            return

        reference = str(job.credential_ref or "")
        try:
            token = await self.credentials.get(reference, owner_id=job.owner_id)
            if not token:
                await self.agent.mark_run_terminal(
                    job.run_id,
                    job.owner_id,
                    status="failed",
                    safe_message="Phiên ủy quyền cho background run đã hết hạn.",
                    tenant_id=job.tenant_id,
                )
                return

            payload = dict(job.payload)
            context = dict(payload.get("context") or {})
            context["run_id"] = job.run_id
            context["tenant_id"] = job.tenant_id
            async for _event in self.agent.stream_message(
                str(payload.get("message") or ""),
                job.owner_id,
                token,
                str(payload.get("session_id") or "default"),
                str(payload.get("locale") or "vi"),
                str(payload.get("scope") or "learner"),
                context,
            ):
                pass
        except Exception as exc:
            # Do not leave a durable run in `created` when a worker attempt
            # fails. The queue may retry, but the user must have an honest
            # terminal state and a safe message to act on.
            logger.exception(
                "background_run_failed run_id=%s job_id=%s attempt=%s",
                job.run_id,
                job.job_id,
                job.attempts + 1,
            )
            try:
                await self.agent.mark_run_terminal(
                    job.run_id,
                    job.owner_id,
                    status="failed",
                    safe_message="Background agent gặp lỗi khi thực thi. Vui lòng thử lại.",
                    tenant_id=job.tenant_id,
                )
            except Exception:
                logger.exception("background_run_failure_persist_failed run_id=%s", job.run_id)
            raise
        finally:
            if reference:
                await self.credentials.revoke(reference, owner_id=job.owner_id)

    def worker(self) -> RunWorker:
        return RunWorker(self.queue, self.handle)

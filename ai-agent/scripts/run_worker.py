from __future__ import annotations

import asyncio
import logging
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

from services.background_worker import BackgroundAgentWorker
from services.harness.queue import DurableRunQueue
from services.main import agent


logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("quiz-ai-worker")


async def run() -> None:
    redis_client = await agent.run_store.redis_client()
    if redis_client is None:
        raise RuntimeError("AGENT_WORKER_REQUIRES_REDIS")
    queue = DurableRunQueue(
        redis=redis_client,
        key_prefix=os.getenv("AGENT_QUEUE_KEY_PREFIX", "quiz-ai:queue:"),
        lease_ttl_seconds=int(os.getenv("AGENT_QUEUE_LEASE_TTL_SECONDS", "300")),
    )
    service = BackgroundAgentWorker(
        agent,
        queue,
        agent.run_store,
        agent.credential_broker,
    )
    worker = service.worker()
    try:
        await worker.serve(
            poll_timeout_seconds=int(os.getenv("AGENT_WORKER_POLL_TIMEOUT_SECONDS", "2"))
        )
    finally:
        await agent.close()


if __name__ == "__main__":
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "config", ".env"))
    asyncio.run(run())

from __future__ import annotations

import hashlib
import json
import logging
import time
from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from .contracts import ArtifactRef, HarnessModel, RunContext
from .events import HarnessEvent


try:
    from redis.asyncio import Redis
except ImportError:  # pragma: no cover
    Redis = None  # type: ignore[assignment,misc]


logger = logging.getLogger(__name__)


class StoredArtifact(HarnessModel):
    ref: ArtifactRef
    run_id: str = Field(min_length=1, max_length=128)
    content: Optional[str] = Field(default=None, max_length=2_000_000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewRecord(HarnessModel):
    review_id: str = Field(min_length=1, max_length=128)
    run_id: str = Field(min_length=1, max_length=128)
    owner_id: str = Field(min_length=1, max_length=128)
    tenant_id: Optional[str] = None
    resource_type: str = Field(min_length=1, max_length=64)
    resource_payload: dict[str, Any]
    status: str = Field(default="pending", max_length=32)
    reviewer_id: Optional[str] = None
    decision_notes: str = Field(default="", max_length=4000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    decided_at: Optional[datetime] = None


class DurableRunStore:
    """Owner-scoped durable run, event, cancellation and artifact store.

    Redis is used when configured and reachable. The bounded in-process store is
    a development fallback; both backends apply the same ownership checks.
    """

    def __init__(
        self,
        redis_url: Optional[str] = None,
        *,
        key_prefix: str = "quiz-ai:run:",
        ttl_seconds: int = 60 * 60 * 24 * 7,
        max_events_per_run: int = 2_000,
        max_artifact_chars: int = 2_000_000,
    ) -> None:
        if ttl_seconds < 1:
            raise ValueError("ttl_seconds must be positive")
        if max_events_per_run < 1:
            raise ValueError("max_events_per_run must be positive")
        if max_artifact_chars < 1:
            raise ValueError("max_artifact_chars must be positive")
        self.redis_url = redis_url
        self.key_prefix = key_prefix
        self.ttl_seconds = ttl_seconds
        self.max_events_per_run = max_events_per_run
        self.max_artifact_chars = max_artifact_chars
        self._redis: Optional[Any] = None
        self._redis_attempted = False
        self._runs: dict[str, tuple[float, str, dict[str, Any]]] = {}
        self._events: dict[str, tuple[float, str, list[dict[str, Any]]]] = {}
        self._cancel_requests: dict[str, tuple[float, str]] = {}
        self._artifacts: dict[str, tuple[float, str, StoredArtifact]] = {}
        self._reviews: dict[str, tuple[float, str, ReviewRecord]] = {}

    @staticmethod
    def owner_key(owner_id: str, tenant_id: Optional[str] = None) -> str:
        return hashlib.sha256(
            f"{tenant_id or '-'}:{owner_id}".encode("utf-8")
        ).hexdigest()

    async def _client(self) -> Optional[Any]:
        if not self.redis_url or self._redis_attempted:
            return self._redis
        self._redis_attempted = True
        if Redis is None:
            logger.warning("Redis package unavailable; durable runs use local fallback.")
            return None
        try:
            client = Redis.from_url(self.redis_url, decode_responses=True)
            await client.ping()
            self._redis = client
        except Exception:
            logger.exception("Durable run Redis unavailable; using local fallback.")
        return self._redis

    async def is_available(self) -> bool:
        if not self.redis_url:
            return False
        return await self._client() is not None

    async def redis_client(self) -> Optional[Any]:
        """Expose the already-tested Redis connection for queue composition."""
        return await self._client()

    async def create_run(self, context: RunContext) -> RunContext:
        owner = self.owner_key(
            context.request.trusted_user_id,
            str(context.metadata.get("tenant_id") or "") or None,
        )
        payload = context.model_dump(mode="json")
        expires_at = time.time() + self.ttl_seconds
        client = await self._client()
        if client is not None:
            key = self._run_key(context.run_id)
            existing = await client.get(key)
            if existing:
                existing_payload = json.loads(existing)
                if existing_payload.get("request", {}).get("trusted_user_id") != context.request.trusted_user_id:
                    raise PermissionError("RUN_ID_COLLISION")
                return RunContext.model_validate(existing_payload)
            await client.set(key, json.dumps(payload, ensure_ascii=False), ex=self.ttl_seconds)
            await client.set(self._owner_key(context.run_id), owner, ex=self.ttl_seconds)
            return context

        existing = self._runs.get(context.run_id)
        if existing and existing[0] > time.time():
            if existing[1] != owner:
                raise PermissionError("RUN_ID_COLLISION")
            return RunContext.model_validate(existing[2])
        self._runs[context.run_id] = (expires_at, owner, payload)
        return context

    async def get_run(
        self,
        run_id: str,
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
    ) -> Optional[RunContext]:
        owner = self.owner_key(owner_id, tenant_id)
        client = await self._client()
        if client is not None:
            stored_owner = await client.get(self._owner_key(run_id))
            if stored_owner != owner:
                return None
            raw = await client.get(self._run_key(run_id))
            return RunContext.model_validate(json.loads(raw)) if raw else None

        item = self._runs.get(run_id)
        if not item or item[0] <= time.time() or item[1] != owner:
            if item and item[0] <= time.time():
                self._runs.pop(run_id, None)
            return None
        return RunContext.model_validate(item[2])

    async def update_run(
        self,
        context: RunContext,
        *,
        owner_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> bool:
        trusted_owner = owner_id or context.request.trusted_user_id
        owner = self.owner_key(trusted_owner, tenant_id)
        payload = context.model_dump(mode="json")
        client = await self._client()
        if client is not None:
            stored_owner = await client.get(self._owner_key(context.run_id))
            if stored_owner != owner:
                return False
            await client.set(
                self._run_key(context.run_id),
                json.dumps(payload, ensure_ascii=False),
                ex=self.ttl_seconds,
            )
            return True

        item = self._runs.get(context.run_id)
        if not item or item[0] <= time.time() or item[1] != owner:
            return False
        self._runs[context.run_id] = (time.time() + self.ttl_seconds, owner, payload)
        return True

    async def append_event(
        self,
        event: HarnessEvent | dict[str, Any],
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
    ) -> bool:
        event_model = self._event_model(event)
        run = await self.get_run(
            event_model.run_id, owner_id=owner_id, tenant_id=tenant_id,
        )
        if run is None:
            return False
        owner = self.owner_key(owner_id, tenant_id)
        payload = event_model.public_dict()
        client = await self._client()
        if client is not None:
            key = self._events_key(event_model.run_id)
            await client.rpush(key, json.dumps(payload, ensure_ascii=False))
            await client.ltrim(key, -self.max_events_per_run, -1)
            await client.expire(key, self.ttl_seconds)
            await client.set(
                self._events_owner_key(event_model.run_id), owner, ex=self.ttl_seconds
            )
            return True

        expires_at = time.time() + self.ttl_seconds
        stored = self._events.get(event_model.run_id)
        if not stored or stored[0] <= time.time() or stored[1] != owner:
            self._events[event_model.run_id] = (expires_at, owner, [payload])
        else:
            stored[2].append(payload)
            stored[2][:] = stored[2][-self.max_events_per_run:]
        return True

    async def append_events(
        self,
        events: list[HarnessEvent | dict[str, Any]],
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
    ) -> int:
        count = 0
        for event in events:
            if await self.append_event(event, owner_id=owner_id, tenant_id=tenant_id):
                count += 1
        return count

    async def replay_events(
        self,
        run_id: str,
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
        after_sequence: int = 0,
        limit: int = 500,
    ) -> list[dict[str, Any]]:
        if limit < 1:
            return []
        run = await self.get_run(run_id, owner_id=owner_id, tenant_id=tenant_id)
        if run is None:
            return []
        owner = self.owner_key(owner_id, tenant_id)
        client = await self._client()
        if client is not None:
            stored_owner = await client.get(self._events_owner_key(run_id))
            if stored_owner != owner:
                return []
            raw_events = await client.lrange(self._events_key(run_id), 0, -1)
            events = [json.loads(item) for item in raw_events]
        else:
            stored = self._events.get(run_id)
            if not stored or stored[0] <= time.time() or stored[1] != owner:
                return []
            events = list(stored[2])
        return [
            event for event in events
            if int(event.get("sequence") or 0) > after_sequence
        ][:limit]

    async def request_cancel(
        self,
        run_id: str,
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
    ) -> bool:
        run = await self.get_run(run_id, owner_id=owner_id, tenant_id=tenant_id)
        if run is None:
            return False
        owner = self.owner_key(owner_id, tenant_id)
        client = await self._client()
        # A queued run has not started executing yet. Mark it terminal now so
        # the UI can release the composer immediately and the worker can ack
        # the queued job without invoking the model.
        if run.status == "created":
            run.status = "cancelled"
            run.metadata["safe_message"] = "Tác vụ nền đã được hủy trước khi bắt đầu."
            if client is not None:
                await client.set(
                    self._run_key(run_id),
                    json.dumps(run.model_dump(mode="json"), ensure_ascii=False),
                    ex=self.ttl_seconds,
                )
                await client.set(self._cancel_key(run_id), owner, ex=self.ttl_seconds)
            else:
                self._runs[run_id] = (time.time() + self.ttl_seconds, owner, run.model_dump(mode="json"))
                self._cancel_requests[run_id] = (time.time() + self.ttl_seconds, owner)
            return True
        if client is not None:
            await client.set(
                self._cancel_key(run_id),
                owner,
                ex=self.ttl_seconds,
            )
        else:
            self._cancel_requests[run_id] = (time.time() + self.ttl_seconds, owner)
        return True

    async def is_cancel_requested(
        self,
        run_id: str,
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
    ) -> bool:
        owner = self.owner_key(owner_id, tenant_id)
        client = await self._client()
        if client is not None:
            return await client.get(self._cancel_key(run_id)) == owner
        item = self._cancel_requests.get(run_id)
        if not item or item[0] <= time.time():
            self._cancel_requests.pop(run_id, None)
            return False
        return item[1] == owner

    async def clear_cancel(
        self,
        run_id: str,
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
    ) -> bool:
        if not await self.is_cancel_requested(
            run_id, owner_id=owner_id, tenant_id=tenant_id
        ):
            return False
        client = await self._client()
        if client is not None:
            await client.delete(self._cancel_key(run_id))
        else:
            self._cancel_requests.pop(run_id, None)
        return True

    async def put_artifact(
        self,
        artifact: ArtifactRef,
        *,
        run_id: str,
        owner_id: str,
        content: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> StoredArtifact:
        if artifact.owner_id != owner_id:
            raise PermissionError("ARTIFACT_OWNER_MISMATCH")
        if content is not None and len(content) > self.max_artifact_chars:
            raise ValueError("ARTIFACT_TOO_LARGE")
        if await self.get_run(run_id, owner_id=owner_id, tenant_id=tenant_id) is None:
            raise PermissionError("RUN_NOT_FOUND_OR_FORBIDDEN")
        stored = StoredArtifact(ref=artifact, run_id=run_id, content=content)
        owner = self.owner_key(owner_id, tenant_id)
        expires_at = time.time() + self.ttl_seconds
        client = await self._client()
        payload = stored.model_dump(mode="json")
        if client is not None:
            await client.set(
                self._artifact_key(artifact.artifact_id),
                json.dumps(payload, ensure_ascii=False),
                ex=self.ttl_seconds,
            )
            await client.set(
                self._artifact_owner_key(artifact.artifact_id), owner, ex=self.ttl_seconds
            )
        else:
            self._artifacts[artifact.artifact_id] = (expires_at, owner, stored)
        return stored

    async def get_artifact(
        self,
        artifact_id: str,
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
    ) -> Optional[StoredArtifact]:
        owner = self.owner_key(owner_id, tenant_id)
        client = await self._client()
        if client is not None:
            if await client.get(self._artifact_owner_key(artifact_id)) != owner:
                return None
            raw = await client.get(self._artifact_key(artifact_id))
            return StoredArtifact.model_validate(json.loads(raw)) if raw else None
        item = self._artifacts.get(artifact_id)
        if not item or item[0] <= time.time() or item[1] != owner:
            return None
        return item[2]

    async def delete_artifact(
        self,
        artifact_id: str,
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
    ) -> bool:
        if await self.get_artifact(
            artifact_id, owner_id=owner_id, tenant_id=tenant_id
        ) is None:
            return False
        client = await self._client()
        if client is not None:
            await client.delete(
                self._artifact_key(artifact_id),
                self._artifact_owner_key(artifact_id),
            )
        else:
            self._artifacts.pop(artifact_id, None)
        return True

    async def create_review(
        self,
        record: ReviewRecord,
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
    ) -> ReviewRecord:
        if record.owner_id != owner_id or record.tenant_id != tenant_id:
            raise PermissionError("REVIEW_OWNER_MISMATCH")
        if await self.get_run(record.run_id, owner_id=owner_id, tenant_id=tenant_id) is None:
            raise PermissionError("RUN_NOT_FOUND_OR_FORBIDDEN")
        owner = self.owner_key(owner_id, tenant_id)
        expires_at = time.time() + self.ttl_seconds
        client = await self._client()
        payload = record.model_dump(mode="json")
        if client is not None:
            await client.set(
                self._review_key(record.review_id),
                json.dumps(payload, ensure_ascii=False),
                ex=self.ttl_seconds,
            )
            await client.set(
                self._review_owner_key(record.review_id), owner, ex=self.ttl_seconds
            )
            await client.sadd(self._review_index_key(owner), record.review_id)
            await client.expire(self._review_index_key(owner), self.ttl_seconds)
        else:
            self._reviews[record.review_id] = (expires_at, owner, record)
        return record

    async def list_reviews(
        self,
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> list[ReviewRecord]:
        """List owner-scoped reviews without exposing another user's queue."""
        owner = self.owner_key(owner_id, tenant_id)
        client = await self._client()
        if client is not None:
            review_ids = await client.smembers(self._review_index_key(owner))
            records: list[ReviewRecord] = []
            for raw_id in review_ids:
                review_id = raw_id.decode() if isinstance(raw_id, bytes) else str(raw_id)
                record = await self.get_review(
                    review_id, owner_id=owner_id, tenant_id=tenant_id,
                )
                if record is not None and (status is None or record.status == status):
                    records.append(record)
            return sorted(records, key=lambda item: item.created_at, reverse=True)

        records = []
        for expires_at, stored_owner, record in list(self._reviews.values()):
            if expires_at <= time.time() or stored_owner != owner:
                continue
            if status is None or record.status == status:
                records.append(record)
        return sorted(records, key=lambda item: item.created_at, reverse=True)

    async def get_review(
        self,
        review_id: str,
        *,
        owner_id: str,
        tenant_id: Optional[str] = None,
    ) -> Optional[ReviewRecord]:
        owner = self.owner_key(owner_id, tenant_id)
        client = await self._client()
        if client is not None:
            if await client.get(self._review_owner_key(review_id)) != owner:
                return None
            raw = await client.get(self._review_key(review_id))
            return ReviewRecord.model_validate(json.loads(raw)) if raw else None
        item = self._reviews.get(review_id)
        if not item or item[0] <= time.time() or item[1] != owner:
            return None
        return item[2]

    async def decide_review(
        self,
        review_id: str,
        *,
        owner_id: str,
        decision: str,
        reviewer_id: str,
        notes: str = "",
        tenant_id: Optional[str] = None,
    ) -> Optional[ReviewRecord]:
        if decision not in {"approved", "rejected"}:
            raise ValueError("REVIEW_DECISION_INVALID")
        record = await self.get_review(
            review_id, owner_id=owner_id, tenant_id=tenant_id,
        )
        if record is None or record.status != "pending":
            return None
        updated = record.model_copy(update={
            "status": decision,
            "reviewer_id": reviewer_id,
            "decision_notes": notes,
            "decided_at": datetime.now(timezone.utc),
        })
        owner = self.owner_key(owner_id, tenant_id)
        client = await self._client()
        if client is not None:
            await client.set(
                self._review_key(review_id),
                json.dumps(updated.model_dump(mode="json"), ensure_ascii=False),
                ex=self.ttl_seconds,
            )
        else:
            self._reviews[review_id] = (time.time() + self.ttl_seconds, owner, updated)
        return updated

    async def close(self) -> None:
        if self._redis is not None:
            await self._redis.aclose()

    def _run_key(self, run_id: str) -> str:
        return f"{self.key_prefix}{run_id}"

    def _owner_key(self, run_id: str) -> str:
        return f"{self.key_prefix}{run_id}:owner"

    def _events_key(self, run_id: str) -> str:
        return f"{self.key_prefix}{run_id}:events"

    def _events_owner_key(self, run_id: str) -> str:
        return f"{self.key_prefix}{run_id}:events:owner"

    def _cancel_key(self, run_id: str) -> str:
        return f"{self.key_prefix}{run_id}:cancel"

    def _artifact_key(self, artifact_id: str) -> str:
        return f"{self.key_prefix}artifact:{artifact_id}"

    def _artifact_owner_key(self, artifact_id: str) -> str:
        return f"{self.key_prefix}artifact:{artifact_id}:owner"

    def _review_key(self, review_id: str) -> str:
        return f"{self.key_prefix}review:{review_id}"

    def _review_owner_key(self, review_id: str) -> str:
        return f"{self.key_prefix}review:{review_id}:owner"

    def _review_index_key(self, owner: str) -> str:
        return f"{self.key_prefix}reviews:owner:{owner}"

    @staticmethod
    def _event_model(event: HarnessEvent | dict[str, Any]) -> HarnessEvent:
        if isinstance(event, HarnessEvent):
            return event
        reserved = {"type", "event_id", "run_id", "sequence", "timestamp"}
        payload = {key: value for key, value in event.items() if key not in reserved}
        return HarnessEvent(
            type=str(event["type"]),
            event_id=str(event["event_id"]),
            run_id=str(event["run_id"]),
            sequence=int(event["sequence"]),
            timestamp=event["timestamp"],
            payload=payload,
        )

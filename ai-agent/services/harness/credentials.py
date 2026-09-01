from __future__ import annotations

import hashlib
import json
import time
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

try:
    from redis.asyncio import Redis
except ImportError:  # pragma: no cover
    Redis = None  # type: ignore[assignment,misc]


class CredentialReference(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reference: str = Field(min_length=32, max_length=128)
    owner_id: str = Field(min_length=1, max_length=128)
    expires_at: float = Field(gt=0)


class DelegatedCredentialBroker:
    """Stores short-lived delegated credentials behind an opaque reference.

    Raw credentials never enter RunJob or event payloads. Redis mode is intended
    for a trusted, authenticated private Redis; a KMS-backed broker is preferred
    for deployments with stronger at-rest requirements.
    """

    def __init__(
        self,
        redis_url: Optional[str] = None,
        *,
        key_prefix: str = "quiz-ai:credential:",
        max_ttl_seconds: int = 600,
    ) -> None:
        self.redis_url = redis_url
        self.key_prefix = key_prefix
        self.max_ttl_seconds = max(60, max_ttl_seconds)
        self._redis: Optional[Any] = None
        self._redis_attempted = False
        self._local: dict[str, tuple[float, str, str]] = {}

    async def _client(self) -> Optional[Any]:
        if not self.redis_url or self._redis_attempted:
            return self._redis
        self._redis_attempted = True
        if Redis is None:
            return None
        try:
            client = Redis.from_url(self.redis_url, decode_responses=True)
            await client.ping()
            self._redis = client
        except Exception:
            self._redis = None
        return self._redis

    async def put(
        self,
        token: str,
        *,
        owner_id: str,
        ttl_seconds: int = 600,
    ) -> CredentialReference:
        if not token or not owner_id:
            raise ValueError("credential and owner are required")
        ttl = max(60, min(ttl_seconds, self.max_ttl_seconds))
        reference = uuid4().hex + uuid4().hex
        expires_at = time.time() + ttl
        record = {
            "owner_id": owner_id,
            "token": token,
            "expires_at": expires_at,
        }
        client = await self._client()
        if client is not None:
            await client.set(
                self._key(reference),
                json.dumps(record, ensure_ascii=False),
                ex=ttl,
            )
        else:
            self._local[reference] = (expires_at, owner_id, token)
        return CredentialReference(
            reference=reference,
            owner_id=owner_id,
            expires_at=expires_at,
        )

    async def get(self, reference: str, *, owner_id: str) -> Optional[str]:
        if not reference or not owner_id:
            return None
        client = await self._client()
        if client is not None:
            raw = await client.get(self._key(reference))
            if not raw:
                return None
            try:
                record = json.loads(raw)
            except (TypeError, ValueError):
                return None
            if record.get("owner_id") != owner_id or float(record.get("expires_at", 0)) <= time.time():
                return None
            return str(record.get("token") or "") or None

        item = self._local.get(reference)
        if not item:
            return None
        if item[0] <= time.time():
            self._local.pop(reference, None)
            return None
        if item[1] != owner_id:
            return None
        return item[2]

    async def revoke(self, reference: str, *, owner_id: str) -> bool:
        token = await self.get(reference, owner_id=owner_id)
        if token is None:
            return False
        client = await self._client()
        if client is not None:
            return bool(await client.delete(self._key(reference)))
        return self._local.pop(reference, None) is not None

    async def close(self) -> None:
        if self._redis is not None and hasattr(self._redis, "aclose"):
            await self._redis.aclose()

    def _key(self, reference: str) -> str:
        digest = hashlib.sha256(reference.encode("utf-8")).hexdigest()
        return f"{self.key_prefix}{digest}"

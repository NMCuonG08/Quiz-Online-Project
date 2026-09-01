from __future__ import annotations

import asyncio
import hashlib
import json
import re
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator

try:
    from redis.asyncio import Redis
except ImportError:  # pragma: no cover
    Redis = None  # type: ignore[assignment,misc]


_MEMORY_SECRET_PATTERNS = (
    re.compile(r"(?i)\bbearer\s+[a-z0-9._~+/=-]{12,}"),
    re.compile(r"(?i)\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\s*[:=]"),
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_value.lower().split())


class MemoryNamespace(BaseModel):
    model_config = ConfigDict(extra="forbid")

    owner_id: str = Field(min_length=1, max_length=128)
    name: str = Field(min_length=1, max_length=128)
    tenant_id: Optional[str] = Field(default=None, max_length=128)


class MemoryItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    memory_id: str = Field(default_factory=lambda: str(uuid4()), max_length=128)
    namespace: MemoryNamespace
    content: str = Field(min_length=1, max_length=8_000)
    source: str = Field(min_length=1, max_length=64)
    confidence: float = Field(default=1.0, ge=0, le=1)
    sensitivity: str = Field(default="normal", max_length=32)
    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)
    expires_at: Optional[datetime] = None

    @field_validator("content")
    @classmethod
    def reject_credentials(cls, value: str) -> str:
        if any(pattern.search(value) for pattern in _MEMORY_SECRET_PATTERNS):
            raise ValueError("memory content looks like a credential")
        return value


@dataclass(frozen=True)
class MemoryStore:
    """Namespaced, process-local memory boundary for Phase 4.

    Persistence can be added behind this contract later. Namespace and safety
    rules must remain identical for Redis/Postgres implementations.
    """

    max_items_per_namespace: int = 200
    ttl_seconds: int = 60 * 60 * 24 * 30
    redis_url: Optional[str] = None
    key_prefix: str = "quiz-ai:memory:"
    _items: dict[str, list[MemoryItem]] = field(default_factory=dict, init=False, repr=False, compare=False)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, init=False, repr=False, compare=False)
    _redis: Optional[object] = field(default=None, init=False, repr=False, compare=False)
    _redis_attempted: bool = field(default=False, init=False, repr=False, compare=False)

    def __post_init__(self) -> None:
        if self.max_items_per_namespace < 1:
            raise ValueError("max_items_per_namespace must be positive")
        if self.ttl_seconds < 1:
            raise ValueError("ttl_seconds must be positive")

    async def _client(self) -> Optional[object]:
        if not self.redis_url or self._redis_attempted:
            return self._redis
        object.__setattr__(self, "_redis_attempted", True)
        if Redis is None:
            return None
        try:
            client = Redis.from_url(self.redis_url, decode_responses=True)
            await client.ping()
            object.__setattr__(self, "_redis", client)
        except Exception:
            object.__setattr__(self, "_redis", None)
        return self._redis

    async def put(
        self,
        *,
        owner_id: str,
        name: str,
        content: str,
        source: str,
        confidence: float = 1.0,
        tenant_id: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> MemoryItem:
        namespace = MemoryNamespace(owner_id=owner_id, name=name, tenant_id=tenant_id)
        item = MemoryItem(
            namespace=namespace,
            content=content,
            source=source,
            confidence=confidence,
            expires_at=expires_at or datetime.fromtimestamp(
                time.time() + self.ttl_seconds, timezone.utc
            ),
        )
        key = self._key(namespace)
        client = await self._client()
        if client is not None:
            await client.rpush(self._redis_key(key), item.model_dump_json())
            await client.ltrim(self._redis_key(key), -self.max_items_per_namespace, -1)
            await client.expire(self._redis_key(key), self.ttl_seconds)
            return item
        async with self._lock:
            bucket = self._items.setdefault(key, [])
            bucket[:] = [existing for existing in bucket if not self._expired(existing)]
            bucket.append(item)
            if len(bucket) > self.max_items_per_namespace:
                del bucket[:-self.max_items_per_namespace]
        return item

    async def search(
        self,
        *,
        owner_id: str,
        name: str,
        query: str = "",
        tenant_id: Optional[str] = None,
        limit: int = 10,
    ) -> list[MemoryItem]:
        namespace = MemoryNamespace(owner_id=owner_id, name=name, tenant_id=tenant_id)
        key = self._key(namespace)
        query_terms = set(_normalize(query).split())
        client = await self._client()
        if client is not None:
            raw_items = await client.lrange(self._redis_key(key), 0, -1)
            valid = []
            for raw in raw_items:
                try:
                    item = MemoryItem.model_validate(json.loads(raw))
                except (TypeError, ValueError):
                    continue
                if not self._expired(item):
                    valid.append(item)
            return self._rank(valid, query_terms, limit)
        async with self._lock:
            bucket = self._items.get(key, [])
            valid = [item for item in bucket if not self._expired(item)]
            self._items[key] = valid
            return self._rank(valid, query_terms, limit)

    async def delete(self, *, owner_id: str, name: str, memory_id: str, tenant_id: Optional[str] = None) -> bool:
        namespace = MemoryNamespace(owner_id=owner_id, name=name, tenant_id=tenant_id)
        key = self._key(namespace)
        client = await self._client()
        if client is not None:
            items = await self.search(owner_id=owner_id, name=name, tenant_id=tenant_id)
            filtered = [item for item in items if item.memory_id != memory_id]
            if len(filtered) == len(items):
                return False
            await client.delete(self._redis_key(key))
            if filtered:
                await client.rpush(
                    self._redis_key(key),
                    *[item.model_dump_json() for item in reversed(filtered)],
                )
                await client.expire(self._redis_key(key), self.ttl_seconds)
            return True
        async with self._lock:
            bucket = self._items.get(key, [])
            before = len(bucket)
            bucket[:] = [item for item in bucket if item.memory_id != memory_id]
            return len(bucket) != before

    async def clear_namespace(
        self, *, owner_id: str, name: str, tenant_id: Optional[str] = None,
    ) -> int:
        namespace = MemoryNamespace(owner_id=owner_id, name=name, tenant_id=tenant_id)
        key = self._key(namespace)
        client = await self._client()
        if client is not None:
            removed = await client.delete(self._redis_key(key))
            return int(removed or 0)
        async with self._lock:
            removed = len(self._items.get(key, []))
            self._items.pop(key, None)
            return removed

    @staticmethod
    def _key(namespace: MemoryNamespace) -> str:
        return f"{namespace.tenant_id or '-'}:{namespace.owner_id}:{namespace.name}"

    def _redis_key(self, value: str) -> str:
        return f"{self.key_prefix}{hashlib.sha256(value.encode('utf-8')).hexdigest()}"

    @staticmethod
    def _rank(
        items: list[MemoryItem], query_terms: set[str], limit: int,
    ) -> list[MemoryItem]:
        safe_limit = max(1, min(limit, 100))
        if not query_terms:
            return list(reversed(items[-safe_limit:]))
        scored = [
            (len(query_terms.intersection(set(_normalize(item.content).split()))), item)
            for item in items
        ]
        scored = [(score, item) for score, item in scored if score > 0]
        scored.sort(key=lambda pair: (pair[0], pair[1].updated_at), reverse=True)
        return [item for _, item in scored[:safe_limit]]

    @staticmethod
    def _expired(item: MemoryItem) -> bool:
        return item.expires_at is not None and item.expires_at <= _utc_now()

    async def close(self) -> None:
        client = self._redis
        if client is not None and hasattr(client, "aclose"):
            await client.aclose()

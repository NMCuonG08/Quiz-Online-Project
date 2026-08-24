from __future__ import annotations

import hashlib
import json
import logging
import time
from typing import Any, Optional

try:
    from redis.asyncio import Redis
except ImportError:  # Allows local development before optional Redis dependency is installed.
    Redis = None  # type: ignore[assignment,misc]


logger = logging.getLogger(__name__)


class AgentStateStore:
    """Redis-backed state with a bounded in-process fallback for local development."""

    def __init__(
        self,
        redis_url: Optional[str] = None,
        session_ttl_seconds: int = 60 * 60 * 24 * 7,
        approval_ttl_seconds: int = 300,
        audit_ttl_seconds: int = 60 * 60 * 24 * 30,
        chat_history_max_messages: int = 20,
        key_prefix: str = "quiz-ai:",
    ) -> None:
        self.redis_url = redis_url
        self.session_ttl_seconds = session_ttl_seconds
        self.approval_ttl_seconds = approval_ttl_seconds
        self.audit_ttl_seconds = audit_ttl_seconds
        self.chat_history_max_messages = max(2, chat_history_max_messages)
        self.key_prefix = key_prefix
        self._redis: Optional[Any] = None
        self._redis_attempted = False
        self._sessions: dict[str, tuple[float, str]] = {}
        self._approvals: dict[str, tuple[float, dict[str, Any]]] = {}
        self._rate_limits: dict[str, tuple[float, int]] = {}
        self._chat_histories: dict[str, tuple[float, list[dict[str, str]]]] = {}
        self._graph_traces: dict[str, tuple[float, str, list[dict[str, Any]]]] = {}

    @staticmethod
    def authorization_fingerprint(authorization: Optional[str]) -> str:
        return hashlib.sha256((authorization or "").encode("utf-8")).hexdigest()

    @staticmethod
    def _subject_key(user_id: str, session_id: str) -> str:
        return hashlib.sha256(f"{user_id}:{session_id}".encode("utf-8")).hexdigest()

    async def _client(self) -> Optional[Any]:
        if not self.redis_url or self._redis_attempted:
            return self._redis
        self._redis_attempted = True
        if Redis is None:
            logger.warning("Redis configured for AI Agent but redis package is unavailable; using local state.")
            return None
        try:
            client = Redis.from_url(self.redis_url, decode_responses=True)
            await client.ping()
            self._redis = client
        except Exception:
            logger.exception("AI Agent cannot reach Redis; using local state.")
        return self._redis

    async def is_available(self) -> bool:
        if not self.redis_url:
            return False
        return await self._client() is not None

    async def get_previous_response_id(self, user_id: str, session_id: str) -> Optional[str]:
        key = self._subject_key(user_id, session_id)
        client = await self._client()
        if client is not None:
            try:
                return await client.get(f"{self.key_prefix}session:{key}")
            except Exception:
                logger.exception("AI Agent Redis session read failed.")
        item = self._sessions.get(key)
        if not item or item[0] <= time.time():
            self._sessions.pop(key, None)
            return None
        return item[1]

    async def set_previous_response_id(self, user_id: str, session_id: str, response_id: str) -> None:
        key = self._subject_key(user_id, session_id)
        self._sessions[key] = (time.time() + self.session_ttl_seconds, response_id)
        client = await self._client()
        if client is not None:
            try:
                await client.set(f"{self.key_prefix}session:{key}", response_id, ex=self.session_ttl_seconds)
            except Exception:
                logger.exception("AI Agent Redis session write failed.")

    @staticmethod
    def _safe_chat_messages(messages: list[dict[str, Any]], limit: int) -> list[dict[str, str]]:
        safe: list[dict[str, str]] = []
        for message in messages:
            role = message.get("role")
            content = message.get("content")
            if role not in {"user", "assistant"} or not isinstance(content, str):
                continue
            safe.append({"role": role, "content": content[:8000]})
        return safe[-limit:]

    async def get_chat_messages(self, user_id: str, session_id: str) -> list[dict[str, str]]:
        key = self._subject_key(user_id, session_id)
        client = await self._client()
        if client is not None:
            try:
                raw = await client.get(f"{self.key_prefix}chat:{key}")
                if raw:
                    payload = json.loads(raw)
                    if isinstance(payload, list):
                        return self._safe_chat_messages(payload, self.chat_history_max_messages)
            except Exception:
                logger.exception("AI Agent Redis chat history read failed.")
        item = self._chat_histories.get(key)
        if not item or item[0] <= time.time():
            self._chat_histories.pop(key, None)
            return []
        return list(item[1])

    async def set_chat_messages(
        self, user_id: str, session_id: str, messages: list[dict[str, Any]]
    ) -> None:
        key = self._subject_key(user_id, session_id)
        safe_messages = self._safe_chat_messages(messages, self.chat_history_max_messages)
        self._chat_histories[key] = (time.time() + self.session_ttl_seconds, safe_messages)
        client = await self._client()
        if client is not None:
            try:
                await client.set(
                    f"{self.key_prefix}chat:{key}",
                    json.dumps(safe_messages, ensure_ascii=False),
                    ex=self.session_ttl_seconds,
                )
            except Exception:
                logger.exception("AI Agent Redis chat history write failed.")

    async def create_approval(self, token: str, payload: dict[str, Any]) -> None:
        expires_at = time.time() + self.approval_ttl_seconds
        self._approvals[token] = (expires_at, payload)
        client = await self._client()
        if client is not None:
            try:
                await client.set(
                    f"{self.key_prefix}approval:{token}",
                    json.dumps(payload, ensure_ascii=False, default=str),
                    ex=self.approval_ttl_seconds,
                )
            except Exception:
                logger.exception("AI Agent Redis approval write failed.")

    async def consume_approval(self, token: str) -> Optional[dict[str, Any]]:
        memory_item = self._approvals.pop(token, None)
        client = await self._client()
        if client is not None:
            try:
                raw = await client.getdel(f"{self.key_prefix}approval:{token}")
                return json.loads(raw) if raw else None
            except Exception:
                logger.exception("AI Agent Redis approval consume failed.")
        if not memory_item or memory_item[0] <= time.time():
            return None
        return memory_item[1]

    async def consume_approval_if_valid(
        self, token: str, user_id: str, scope: str, authorization_fingerprint: str
    ) -> Optional[dict[str, Any]]:
        """Atomically consume only when approval identity matches."""
        client = await self._client()
        if client is not None:
            try:
                key = f"{self.key_prefix}approval:{token}"
                script = """
                local raw = redis.call("GET", KEYS[1])
                if not raw then return nil end
                local value = cjson.decode(raw)
                if value["user_id"] ~= ARGV[1] or value["scope"] ~= ARGV[2] or value["authorization_fingerprint"] ~= ARGV[3] then return nil end
                redis.call("DEL", KEYS[1])
                return raw
                """
                raw = await client.eval(script, 1, key, user_id, scope, authorization_fingerprint)
                if raw:
                    self._approvals.pop(token, None)
                    return json.loads(raw)
                return None
            except Exception:
                logger.exception("AI Agent Redis approval validation failed.")
        item = self._approvals.get(token)
        if not item or item[0] <= time.time():
            self._approvals.pop(token, None)
            return None
        payload = item[1]
        if (
            payload.get("user_id") != user_id
            or payload.get("scope") != scope
            or payload.get("authorization_fingerprint") != authorization_fingerprint
        ):
            return None
        self._approvals.pop(token, None)
        return payload

    async def allow_request(self, user_id: str, session_id: str, limit: int, window_seconds: int = 60) -> bool:
        if limit <= 0:
            return True
        # Authenticated users cannot evade limits by opening new chat sessions.
        rate_subject = user_id if user_id != "guest" else f"guest:{session_id}"
        subject = hashlib.sha256(rate_subject.encode("utf-8")).hexdigest()
        window = int(time.time() // window_seconds)
        key = f"{self.key_prefix}rate:{subject}:{window}"
        client = await self._client()
        if client is not None:
            try:
                count = await client.incr(key)
                if count == 1:
                    await client.expire(key, window_seconds)
                return count <= limit
            except Exception:
                logger.exception("AI Agent Redis rate-limit write failed.")
        memory_key = f"{subject}:{window}"
        expires_at, count = self._rate_limits.get(memory_key, (time.time() + window_seconds, 0))
        if expires_at <= time.time():
            expires_at, count = time.time() + window_seconds, 0
        count += 1
        self._rate_limits[memory_key] = (expires_at, count)
        return count <= limit

    async def acquire_session_lock(
        self, user_id: str, session_id: str, ttl_seconds: int
    ) -> tuple[Optional[Any], str]:
        """Acquire a best-effort Redis lock for one conversation across replicas."""
        client = await self._client()
        if client is None:
            return None, "unavailable"
        try:
            subject = self._subject_key(user_id, session_id)
            lock = client.lock(
                f"{self.key_prefix}lock:session:{subject}",
                timeout=max(1, ttl_seconds),
                blocking_timeout=0,
            )
            if await lock.acquire(blocking=True, blocking_timeout=0):
                return lock, "acquired"
            return None, "contended"
        except Exception:
            logger.exception("AI Agent Redis session lock unavailable.")
            return None, "unavailable"

    async def release_session_lock(self, lock: Optional[Any]) -> None:
        if lock is None:
            return
        try:
            await lock.release()
        except Exception:
            logger.warning("AI Agent Redis session lock release failed.")

    async def append_graph_trace(
        self,
        trace_id: str,
        user_id: str,
        session_id: str,
        node: str,
        event: str,
        tool: str = "",
    ) -> dict[str, Any]:
        """Persist safe graph steps so a completed SSE trace can be inspected later."""
        subject = self._subject_key(user_id, session_id)
        record = {
            "at": int(time.time() * 1000),
            "node": node[:80],
            "event": event[:80],
            "tool": tool[:120],
        }
        expires_at = time.time() + self.audit_ttl_seconds
        memory = self._graph_traces.get(trace_id)
        if memory is None or memory[0] <= time.time() or memory[1] != subject:
            self._graph_traces[trace_id] = (expires_at, subject, [record])
        else:
            memory[2].append(record)
            memory[2][:] = memory[2][-1000:]
        client = await self._client()
        if client is not None:
            try:
                key = f"{self.key_prefix}trace:{trace_id}"
                await client.rpush(key, json.dumps(record, ensure_ascii=True, sort_keys=True))
                await client.ltrim(key, -1000, -1)
                await client.expire(key, self.audit_ttl_seconds)
                await client.set(
                    f"{self.key_prefix}trace-owner:{trace_id}", subject, ex=self.audit_ttl_seconds
                )
            except Exception:
                logger.exception("AI Agent Redis graph trace write failed.")
        return record

    async def get_graph_trace(
        self, trace_id: str, user_id: str, session_id: str
    ) -> list[dict[str, Any]]:
        """Return only steps belonging to the requesting conversation."""
        subject = self._subject_key(user_id, session_id)
        client = await self._client()
        if client is not None:
            try:
                owner = await client.get(f"{self.key_prefix}trace-owner:{trace_id}")
                if owner != subject:
                    return []
                raw_steps = await client.lrange(f"{self.key_prefix}trace:{trace_id}", 0, -1)
                return [json.loads(step) for step in raw_steps]
            except Exception:
                logger.exception("AI Agent Redis graph trace read failed.")
        memory = self._graph_traces.get(trace_id)
        if not memory or memory[0] <= time.time() or memory[1] != subject:
            return []
        return list(memory[2])

    async def audit(self, user_id: str, scope: str, event: str, tool: Optional[str] = None) -> None:
        record = {
            "at": int(time.time()),
            "user": hashlib.sha256(user_id.encode("utf-8")).hexdigest()[:16],
            "scope": scope,
            "event": event,
            "tool": tool,
        }
        logger.info("ai_audit %s", json.dumps(record, ensure_ascii=True, sort_keys=True))
        client = await self._client()
        if client is not None:
            try:
                key = f"{self.key_prefix}audit"
                await client.lpush(key, json.dumps(record, ensure_ascii=True, sort_keys=True))
                await client.ltrim(key, 0, 9999)
                await client.expire(key, self.audit_ttl_seconds)
            except Exception:
                logger.exception("AI Agent Redis audit write failed.")

    async def close(self) -> None:
        if self._redis is not None:
            await self._redis.aclose()

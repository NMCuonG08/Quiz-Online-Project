import unittest
from datetime import datetime, timedelta, timezone

from pydantic import ValidationError

from services.memory import MemoryStore


class MemoryStoreTests(unittest.IsolatedAsyncioTestCase):
    async def test_namespace_and_tenant_isolation(self):
        store = MemoryStore(max_items_per_namespace=2, ttl_seconds=3600)
        item = await store.put(
            owner_id="user-1",
            tenant_id="tenant-a",
            name="quiz-agent",
            content="User đang học Python",
            source="user",
        )
        await store.put(
            owner_id="user-2",
            tenant_id="tenant-a",
            name="quiz-agent",
            content="User học Java",
            source="user",
        )

        own = await store.search(
            owner_id="user-1", tenant_id="tenant-a", name="quiz-agent", query="Python",
        )
        other_user = await store.search(
            owner_id="user-2", tenant_id="tenant-a", name="quiz-agent", query="Python",
        )
        other_tenant = await store.search(
            owner_id="user-1", tenant_id="tenant-b", name="quiz-agent", query="Python",
        )

        self.assertEqual([result.memory_id for result in own], [item.memory_id])
        self.assertEqual(other_user, [])
        self.assertEqual(other_tenant, [])

    async def test_secret_like_memory_is_rejected(self):
        store = MemoryStore()

        with self.assertRaises(ValidationError):
            await store.put(
                owner_id="user-1",
                name="quiz-agent",
                content="Bearer abcdefghijklmnop",
                source="agent",
            )

    async def test_expired_items_are_not_returned(self):
        store = MemoryStore()
        expired = await store.put(
            owner_id="user-1",
            name="quiz-agent",
            content="temporary fact",
            source="user",
            expires_at=datetime.now(timezone.utc) - timedelta(seconds=1),
        )

        result = await store.search(
            owner_id="user-1", name="quiz-agent", query="temporary",
        )

        self.assertEqual(result, [])
        self.assertFalse(await store.delete(
            owner_id="user-1", name="quiz-agent", memory_id=expired.memory_id,
        ))

    async def test_namespace_is_capped_and_delete_is_scoped(self):
        store = MemoryStore(max_items_per_namespace=2)
        first = await store.put(
            owner_id="user-1", name="quiz-agent", content="one", source="user",
        )
        await store.put(
            owner_id="user-1", name="quiz-agent", content="two", source="user",
        )
        await store.put(
            owner_id="user-1", name="quiz-agent", content="three", source="user",
        )

        result = await store.search(owner_id="user-1", name="quiz-agent")
        self.assertEqual(len(result), 2)
        self.assertFalse(await store.delete(
            owner_id="user-2", name="quiz-agent", memory_id=first.memory_id,
        ))


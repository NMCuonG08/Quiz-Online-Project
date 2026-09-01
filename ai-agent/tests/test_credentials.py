import unittest

from services.harness.credentials import DelegatedCredentialBroker


class CredentialBrokerTests(unittest.IsolatedAsyncioTestCase):
    async def test_credential_reference_is_opaque_and_owner_scoped(self):
        broker = DelegatedCredentialBroker()
        reference = await broker.put("secret-token", owner_id="user-1", ttl_seconds=60)

        self.assertNotEqual(reference.reference, "secret-token")
        self.assertEqual(await broker.get(reference.reference, owner_id="user-1"), "secret-token")
        self.assertIsNone(await broker.get(reference.reference, owner_id="user-2"))
        self.assertTrue(await broker.revoke(reference.reference, owner_id="user-1"))
        self.assertIsNone(await broker.get(reference.reference, owner_id="user-1"))


from __future__ import annotations

import unittest
from unittest.mock import AsyncMock

from services.agent_core import AIAgentCore


class FailedRequestHistoryTests(unittest.IsolatedAsyncioTestCase):
    async def test_stream_exception_persists_prompt_and_error_message(self):
        core = AIAgentCore({})
        core.tools.append_chat_history = AsyncMock()

        async def failing_stream(*_args, **_kwargs):
            raise RuntimeError("GRAPH_TIMEOUT: Agent vượt quá deadline 90s. Hãy thử lại.")
            yield  # Make this an async generator for the stream contract.

        core._stream_message_events = failing_stream
        try:
            with self.assertRaises(RuntimeError):
                async for _event in core.stream_message(
                    "Hãy đọc danh mục và tạo quiz",
                    user_id="user-1",
                    authorization="Bearer test-token",
                    session_id="session-1",
                    scope="creator",
                ):
                    pass
        finally:
            await core.close()

        core.tools.append_chat_history.assert_awaited_once()
        persisted = core.tools.append_chat_history.await_args.args[2]
        self.assertEqual(persisted[0]["role"], "user")
        self.assertEqual(persisted[0]["content"], "Hãy đọc danh mục và tạo quiz")
        self.assertEqual(persisted[1]["role"], "assistant")
        self.assertIn("GRAPH_TIMEOUT", persisted[1]["content"])
        self.assertTrue(persisted[1]["metadata"]["error"])


if __name__ == "__main__":
    unittest.main()

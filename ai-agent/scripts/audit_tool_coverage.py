"""Read-only tool audit. Run from ai-agent: python scripts/audit_tool_coverage.py.

Uses mock backend calls; never sends messages, modifies users or calls an LLM.
Prints evidence rather than treating known defects as passing assertions.
"""
import asyncio
import json
from pathlib import Path
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.agent_core import AIAgentCore, SCOPE_TOOLS, WRITE_TOOLS
from services.harness.tool_specs import TOOL_SPECS
from services.intent_schema import INTENT_ALLOWED_TOOLS, READ_ONLY_INTENTS
from services.langgraph_runner import LangGraphQuizRunner
from services.tool_catalog import TOOLS


async def audit():
    async def dispatch(name, args):
        return json.dumps({"tool": name, "args": args})

    names = {item["name"] for item in TOOLS}
    output = {"catalog_count": len(names), "write_count": len(WRITE_TOOLS),
              "output_schema_count": sum(s.output_schema is not None for s in TOOL_SPECS.values())}
    output["scopes"] = {}
    for scope, allowed in SCOPE_TOOLS.items():
        actual = {item.name for item in LangGraphQuizRunner._build_tools(allowed, dispatch)}
        output["scopes"][scope] = {"expected": len(allowed), "langgraph": len(actual),
                                    "missing": sorted(allowed - actual)}
    output["read_intents_with_write_tools"] = {
        intent: sorted(INTENT_ALLOWED_TOOLS.get(intent, set()) & WRITE_TOOLS)
        for intent in READ_ONLY_INTENTS
        if INTENT_ALLOWED_TOOLS.get(intent, set()) & WRITE_TOOLS
    }
    core = AIAgentCore({"agent_orchestrator": "legacy"})
    core.tools.append_chat_history = AsyncMock(return_value={})
    core.client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(
        create=AsyncMock(return_value=SimpleNamespace(choices=[SimpleNamespace(
            message=SimpleNamespace(content="ok", tool_calls=[]),
        )])),
    )))
    try:
        output["delete_category"] = {}
        for label, args in [("schema_valid", {"category_id": "category-1"}),
                            ("with_confirmation", {"category_id": "category-1", "confirmed": True})]:
            try:
                await core._execute_tool("delete_category", args, "Bearer audit", "audit-user", "admin")
                output["delete_category"][label] = "accepted"
            except Exception as exc:
                output["delete_category"][label] = str(exc)
        try:
            _ = [event async for event in core._stream_chat_completions(
                core._session("audit", "audit-user"), "Xin chao", "Bearer audit",
                "audit-user", "audit", "learner", {"locale": "vi"})]
            output["legacy_chat"] = "completed"
        except Exception as exc:
            output["legacy_chat"] = f"{type(exc).__name__}: {exc}"
        _, surface, _ = await core._execute_tool(
            "send_friend_request", {"friend_id": "00000000-0000-4000-8000-000000000002"},
            "Bearer before-refresh", "audit-user", "learner")
        core.tools.send_friend_request = AsyncMock(return_value={"id": "friendship-1"})
        output["approval_after_refresh"] = [event async for event in core._approve(
            surface.actions[0].value, "Bearer after-refresh", "audit-user", "learner")]
        output["approval_after_refresh_backend_called"] = core.tools.send_friend_request.await_count
        output["negated_confirmation"] = {
            text: core._has_explicit_confirmation(text)
            for text in ["Tôi không đồng ý xóa", "Do not confirm deletion"]
        }
    finally:
        await core.close()
    print(json.dumps(output, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    asyncio.run(audit())

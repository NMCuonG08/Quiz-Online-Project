from __future__ import annotations

from ..tools import MCPToolWrapper
from .base import CapabilityContext, CapabilityDescriptor, CapabilityResult


class AccountCapability:
    """Backend-verified identity and permission information."""

    descriptor = CapabilityDescriptor(
        capability_id="account",
        supported_intents=frozenset({"account_identity", "account_permissions"}),
        allowed_scopes=frozenset({"learner", "creator", "admin"}),
        tools=frozenset({"get_current_user", "get_my_permissions"}),
        access="read",
    )

    def __init__(self, tools: MCPToolWrapper) -> None:
        self.tools = tools

    async def current_user(self, context: CapabilityContext) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.get_current_user(
            context.require_authorization(),
        ))

    async def permissions(self, context: CapabilityContext) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.get_my_permissions(
            context.require_authorization(),
        ))

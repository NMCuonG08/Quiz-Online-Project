from __future__ import annotations

from ..tools import MCPToolWrapper
from .base import CapabilityContext, CapabilityDescriptor, CapabilityResult


class LearningCapability:
    """Learner-owned attempt, history and result operations."""

    descriptor = CapabilityDescriptor(
        capability_id="learning",
        supported_intents=frozenset({"quiz_start", "quiz_resume", "quiz_result", "quiz_history"}),
        allowed_scopes=frozenset({"learner", "creator", "admin"}),
        tools=frozenset({"start_quiz", "get_in_progress_quizzes", "get_quiz_result", "get_quiz_history", "get_all_attempts"}),
        access="read_write",
    )

    def __init__(self, tools: MCPToolWrapper) -> None:
        self.tools = tools

    async def history(
        self, context: CapabilityContext, limit: int = 10,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.get_quiz_history(
            context.require_authorization(), limit,
        ))

    async def in_progress(self, context: CapabilityContext) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.get_in_progress_quizzes(
            context.require_authorization(),
        ))

    async def all_attempts(
        self, context: CapabilityContext, limit: int = 20,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.get_all_attempts(
            context.require_authorization(), limit,
        ))

    async def result(
        self, context: CapabilityContext, session_id: str,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.get_quiz_result(
            session_id, context.require_authorization(),
        ))

    async def start(
        self, context: CapabilityContext, quiz_id: str, quiz_slug: str,
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.start_quiz(
            quiz_id,
            quiz_slug,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

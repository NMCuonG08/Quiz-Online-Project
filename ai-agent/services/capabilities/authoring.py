from __future__ import annotations

from typing import Any

from ..tools import MCPToolWrapper
from .base import CapabilityContext, CapabilityDescriptor, CapabilityResult


class AuthoringCapability:
    """Creator-owned quiz/question authoring operations."""

    descriptor = CapabilityDescriptor(
        capability_id="authoring",
        supported_intents=frozenset({
            "quiz_create", "quiz_update", "quiz_delete", "quiz_publish", "quiz_unpublish", "quiz_owned",
            "question_list", "question_create", "question_update", "question_delete",
            "question_duplicate", "question_reorder",
        }),
        allowed_scopes=frozenset({"creator", "admin"}),
        tools=frozenset({
            "get_my_quizzes", "list_questions", "get_quiz_build_status", "create_quiz",
            "create_quiz_with_questions", "update_quiz", "delete_quiz", "publish_quiz",
            "unpublish_quiz", "create_question", "update_question", "delete_question",
            "duplicate_question", "reorder_questions",
        }),
        access="read_write",
    )

    def __init__(self, tools: MCPToolWrapper) -> None:
        self.tools = tools

    async def my_quizzes(
        self, context: CapabilityContext, limit: int = 10,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.get_my_quizzes(
            context.require_authorization(), limit,
        ))

    async def questions(
        self, context: CapabilityContext, quiz_id: str,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.list_questions(
            quiz_id, context.require_authorization(),
        ))

    async def build_status(
        self, context: CapabilityContext, quiz_id: str,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.get_quiz_build_status(
            quiz_id, context.require_authorization(),
        ))

    async def create_quiz_with_questions(
        self,
        context: CapabilityContext,
        payload: dict[str, Any],
        idempotency_key: str,
    ) -> CapabilityResult:
        normalized = dict(payload)
        normalized["is_active"] = False
        normalized.setdefault("description", "")
        normalized.setdefault("max_attempts", 0)
        normalized.setdefault("passing_score", 0)
        normalized.setdefault("instructions", "")
        return CapabilityResult(data=await self.tools.create_quiz_with_questions(
            normalized,
            context.require_authorization(),
            idempotency_key,
        ))

    async def create_quiz(
        self,
        context: CapabilityContext,
        payload: dict[str, Any],
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.create_quiz(
            payload,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def publish_quiz(
        self, context: CapabilityContext, quiz_id: str, idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.update_quiz(
            quiz_id,
            {"is_active": True},
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def unpublish_quiz(
        self, context: CapabilityContext, quiz_id: str, idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.update_quiz(
            quiz_id,
            {"is_active": False},
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def update_quiz(
        self,
        context: CapabilityContext,
        quiz_id: str,
        changes: dict[str, Any],
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.update_quiz(
            quiz_id,
            changes,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def delete_quiz(
        self,
        context: CapabilityContext,
        quiz_id: str,
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.delete_quiz(
            quiz_id,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def create_question(
        self,
        context: CapabilityContext,
        payload: dict[str, Any],
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.create_question(
            payload,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def update_question(
        self,
        context: CapabilityContext,
        question_id: str,
        changes: dict[str, Any],
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.update_question(
            question_id,
            changes,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def delete_question(
        self,
        context: CapabilityContext,
        question_id: str,
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.delete_question(
            question_id,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def duplicate_question(
        self,
        context: CapabilityContext,
        question_id: str,
        new_quiz_id: str,
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.duplicate_question(
            question_id,
            new_quiz_id,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def reorder_questions(
        self,
        context: CapabilityContext,
        quiz_id: str,
        question_orders: list[dict[str, Any]],
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.reorder_questions(
            quiz_id,
            question_orders,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

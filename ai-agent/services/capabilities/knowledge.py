from __future__ import annotations

from typing import Any

from ..tools import MCPToolWrapper
from .base import CapabilityContext, CapabilityDescriptor, CapabilityResult


class KnowledgeCapability:
    """Published-knowledge retrieval and reviewed-source operations."""

    descriptor = CapabilityDescriptor(
        capability_id="knowledge",
        supported_intents=frozenset({
            "knowledge_search", "knowledge_import", "knowledge_list",
            "knowledge_submit_review", "knowledge_review",
        }),
        allowed_scopes=frozenset({"learner", "creator", "admin"}),
        tools=frozenset({
            "search_knowledge", "list_knowledge_sources", "import_knowledge_url",
            "submit_knowledge_review", "review_knowledge",
        }),
        access="read_write",
    )

    def __init__(self, tools: MCPToolWrapper) -> None:
        self.tools = tools

    async def search(
        self, _context: CapabilityContext, query: str, limit: int = 5,
    ) -> CapabilityResult:
        data, citations = await self.tools.search_knowledge(query, limit)
        return CapabilityResult(data=data, citations=citations)

    async def sources(self, context: CapabilityContext) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.list_knowledge_sources(
            context.require_authorization(),
        ))

    async def import_url(
        self,
        context: CapabilityContext,
        url: str,
        title: str,
        visibility: str,
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.import_knowledge_url(
            url,
            title,
            visibility,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def submit_review(
        self,
        context: CapabilityContext,
        source_id: str,
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.submit_knowledge_review(
            source_id,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

    async def review(
        self,
        context: CapabilityContext,
        source_id: str,
        status: str,
        rejection_reason: str = "",
        idempotency_key: str | None = None,
    ) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.review_knowledge(
            source_id,
            status,
            rejection_reason,
            context.require_authorization(),
            idempotency_key=idempotency_key,
        ))

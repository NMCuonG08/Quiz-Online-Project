from __future__ import annotations

from typing import Any

from ..tools import MCPToolWrapper
from .base import CapabilityContext, CapabilityDescriptor, CapabilityResult


class DiscoveryCapability:
    """Read-only quiz discovery and catalog operations."""

    descriptor = CapabilityDescriptor(
        capability_id="discovery",
        supported_intents=frozenset({"quiz_search", "quiz_recommend", "quiz_detail", "category_list"}),
        allowed_scopes=frozenset({"learner", "creator", "admin"}),
        tools=frozenset({"search_quizzes", "recommend_quizzes", "get_quiz", "list_categories"}),
        access="read",
    )

    def __init__(self, tools: MCPToolWrapper) -> None:
        self.tools = tools

    async def search(
        self, _context: CapabilityContext, query: str, limit: int = 10,
    ) -> CapabilityResult:
        data, citations = await self.tools.search_quizzes_with_citations(query, limit)
        return CapabilityResult(data=data, citations=citations)

    async def recommend(
        self, _context: CapabilityContext, query: str = "", limit: int = 10,
    ) -> CapabilityResult:
        data, citations = await self.tools.recommend_quizzes_with_citations(limit, query)
        return CapabilityResult(data=data, citations=citations)

    async def detail(
        self, _context: CapabilityContext, quiz_id: str = "", slug: str = "",
    ) -> CapabilityResult:
        data, citations = await self.tools.get_quiz_with_citation(quiz_id, slug)
        return CapabilityResult(data=data, citations=citations)

    async def categories(self, _context: CapabilityContext) -> CapabilityResult:
        return CapabilityResult(data=await self.tools.list_categories())

    @staticmethod
    def result_items(result: Any) -> list[dict[str, Any]]:
        if isinstance(result, dict):
            items = result.get("items", result.get("data", []))
        else:
            items = result
        return [item for item in items if isinstance(item, dict)] if isinstance(items, list) else []

from __future__ import annotations

import os
from typing import Any

import httpx


class WebSearchProvider:
    """Optional web-search adapter. It is disabled until a provider key is configured."""

    def __init__(self) -> None:
        self.provider = os.getenv("WEB_SEARCH_PROVIDER", "disabled").lower()
        self.api_key = os.getenv("WEB_SEARCH_API_KEY")

    @property
    def enabled(self) -> bool:
        return self.provider == "tavily" and bool(self.api_key)

    async def search(self, query: str, limit: int = 5) -> list[dict[str, str]]:
        if not self.enabled:
            raise RuntimeError("WEB_SEARCH_DISABLED: Web search chưa được cấu hình.")
        if not query.strip():
            raise ValueError("Câu truy vấn web search không được trống")

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": self.api_key,
                    "query": query,
                    "max_results": max(1, min(limit, 10)),
                    "search_depth": "basic",
                    "include_answer": False,
                },
            )
            response.raise_for_status()

        payload: dict[str, Any] = response.json()
        return [
            {
                "title": str(item.get("title") or item.get("url") or "Nguồn web"),
                "url": str(item.get("url") or ""),
                "snippet": str(item.get("content") or "")[:800],
            }
            for item in payload.get("results", [])
            if item.get("url")
        ]

from __future__ import annotations

import os
from typing import Any
from urllib.parse import urlparse

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

    async def search_images(self, query: str, limit: int = 8) -> list[dict[str, str]]:
        """Retrieve public image URLs from Tavily; never generate or upload media."""
        if not self.enabled:
            raise RuntimeError("WEB_SEARCH_DISABLED: Image search chưa được cấu hình.")
        if not query.strip():
            raise ValueError("Câu truy vấn image search không được trống")

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": self.api_key,
                    "query": query,
                    "max_results": max(1, min(limit, 10)),
                    "search_depth": "basic",
                    "include_answer": False,
                    "include_images": True,
                    "include_image_descriptions": True,
                },
            )
            response.raise_for_status()

        payload: dict[str, Any] = response.json()
        images: list[Any] = payload.get("images", [])
        results: list[dict[str, str]] = []
        for item in images[: max(1, min(limit, 10))]:
            if isinstance(item, dict):
                url = str(item.get("url") or "").strip()
                description = str(item.get("description") or "").strip()
            else:
                url = str(item or "").strip()
                description = ""
            parsed = urlparse(url)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                continue
            results.append({
                "title": description[:200] or f"Image result for {query[:120]}",
                "url": url,
                "image_url": url,
                "snippet": description[:800],
            })
        return results

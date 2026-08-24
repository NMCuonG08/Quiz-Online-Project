from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable


@dataclass(frozen=True)
class RetrievalCase:
    query: str
    expected_slugs: frozenset[str]


def evaluate_retrieval(
    cases: Iterable[RetrievalCase],
    results_by_query: dict[str, Any],
) -> dict[str, float | int]:
    """Evaluate DB retrieval without requiring an LLM or live database."""
    cases = list(cases)
    total = hits = returned = relevant_returned = 0
    for case in cases:
        result = results_by_query.get(case.query, [])
        items = result.get("items", result.get("data", [])) if isinstance(result, dict) else result
        if isinstance(items, dict):
            items = [items]
        items = items if isinstance(items, list) else []
        slugs = [str(item.get("slug")) for item in items if isinstance(item, dict) and item.get("slug")]
        expected = set(case.expected_slugs)
        total += len(expected)
        hits += len(expected.intersection(slugs))
        returned += len(slugs)
        relevant_returned += len(expected.intersection(slugs))

    return {
        "cases": len(cases),
        "recall_at_k": hits / total if total else 0.0,
        "precision_at_k": relevant_returned / returned if returned else 0.0,
    }

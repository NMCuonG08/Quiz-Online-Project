from __future__ import annotations

import asyncio
import argparse
import json
import os
import sys
from pathlib import Path

import httpx

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from services.evaluation import RetrievalCase, evaluate_retrieval
from services.tools import MCPToolWrapper


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate retrieval against a golden dataset.")
    parser.add_argument(
        "--fixture",
        default=os.getenv("RETRIEVAL_EVAL_FIXTURE", str(PROJECT_ROOT / "evals" / "retrieval_golden.json")),
        help="Path to JSON cases. Use a .local.json file for an environment-specific baseline.",
    )
    parser.add_argument(
        "--backend-url",
        default=os.getenv("BACKEND_URL", "http://localhost:3333"),
        help="NestJS base URL.",
    )
    return parser.parse_args()


async def main() -> int:
    args = arguments()
    fixture_path = Path(args.fixture).resolve()
    rows = json.loads(fixture_path.read_text(encoding="utf-8"))
    cases = [
        RetrievalCase(str(row["query"]), frozenset(map(str, row.get("expected_slugs", []))))
        for row in rows
    ]
    client = MCPToolWrapper({"backend_url": args.backend_url})
    results: dict[str, object] = {}
    try:
        for case in cases:
            results[case.query] = await client.search_quizzes(case.query, limit=10)
    except httpx.RequestError:
        print(json.dumps({
            "error": "BACKEND_UNAVAILABLE",
            "backend_url": args.backend_url,
            "message": "Start NestJS before running the live retrieval baseline.",
        }, ensure_ascii=False))
        return 2

    metrics = evaluate_retrieval(cases, results)
    print(json.dumps({"fixture": str(fixture_path), **metrics}, ensure_ascii=False))
    # Retrieval quality gate for this small corpus. Tune only from measured baseline.
    return 0 if metrics["recall_at_k"] >= 0.90 else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))

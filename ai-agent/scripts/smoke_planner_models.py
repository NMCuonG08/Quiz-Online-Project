from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from services.main import agent


PROMPTS = [
    "Gợi ý cho tôi quiz Python phù hợp để học tối nay",
    "Tạo một quiz mới gồm 10 câu về Python và xuất bản nó",
]


async def main() -> None:
    for index, prompt in enumerate(PROMPTS, start=1):
        calls: list[dict[str, object]] = []

        def observe(model: str, outcome: str, duration: float, usage: dict[str, object]) -> None:
            calls.append({
                "model": model,
                "outcome": outcome,
                "duration_seconds": round(duration, 3),
                "input_tokens": usage.get("input_tokens", usage.get("prompt_tokens", 0)),
                "output_tokens": usage.get("output_tokens", usage.get("completion_tokens", 0)),
            })

        plan = await agent.graph_runner.plan(
            prompt,
            "/quiz",
            "creator" if index == 2 else "learner",
            {},
            history=[],
            record_model=observe,
        )
        print(json.dumps({
            "prompt": prompt,
            "intent": plan["intent"],
            "confidence": plan["confidence"],
            "risk": plan["risk"],
            "route": plan["route"],
            "models": calls,
        }, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())

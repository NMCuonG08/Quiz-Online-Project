from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from uuid import uuid4

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from services.main import agent


PROMPTS = [
    "Xin chào, bạn có thể giúp gì cho tôi?",
    "Tôi muốn làm quiz về chủ đề IT, recommend cho tôi được không?",
    "Tìm quiz Python cơ bản cho người mới.",
]


async def run_prompt(prompt: str) -> dict[str, object]:
    answer = ""
    done: dict[str, object] = {}
    citations: list[dict[str, object]] = []
    surface: dict[str, object] | None = None
    errors: list[str] = []
    async for event in agent.stream_message(
        prompt,
        user_id="smoke-read-user",
        authorization=None,
        session_id=f"smoke-{uuid4().hex}",
        locale="vi",
        scope="learner",
        context={"route": "/quiz", "is_authenticated": False},
    ):
        if event.get("type") == "token":
            answer += str(event.get("delta") or "")
        elif event.get("type") == "done":
            done = event
        elif event.get("type") == "citations":
            citations = list(event.get("items") or [])
        elif event.get("type") == "ui":
            surface = event.get("surface")
        elif event.get("type") == "error":
            errors.append(str(event.get("message") or "unknown error"))
    blocks = surface.get("blocks", []) if isinstance(surface, dict) else []
    return {
        "prompt": prompt,
        "intent": done.get("intent"),
        "models": done.get("agent"),
        "tools": done.get("tools", []),
        "answer": answer[:500],
        "citation_count": len(citations),
        "surface_title": surface.get("title") if isinstance(surface, dict) else None,
        "has_form": any(block.get("type") == "form" for block in blocks if isinstance(block, dict)),
        "errors": errors,
    }


async def main() -> None:
    for prompt in PROMPTS:
        try:
            print(json.dumps(await run_prompt(prompt), ensure_ascii=False))
        except Exception as exc:
            print(json.dumps({
                "prompt": prompt,
                "fatal_error": type(exc).__name__,
                "message": str(exc)[:300],
            }, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())

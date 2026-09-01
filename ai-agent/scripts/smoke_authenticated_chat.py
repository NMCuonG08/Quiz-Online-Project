from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from uuid import uuid4

import httpx
import psycopg


BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:3333").rstrip("/")
AGENT_URL = os.getenv("AI_SMOKE_AGENT_URL", "http://127.0.0.1:8000").rstrip("/")


def unwrap(payload: object) -> dict:
    return payload.get("data", payload) if isinstance(payload, dict) else {}


async def main() -> None:
    suffix = uuid4().hex[:12]
    email = f"agent-smoke-{suffix}@example.test"
    user_id = ""
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            signup = await client.post(f"{BACKEND_URL}/api/auth/register", json={
                "email": email,
                "username": f"agent-smoke-{suffix}",
                "password": "SmokePassword123!",
                "full_name": "AI Agent Smoke Test",
            })
            signup.raise_for_status()
            account = unwrap(signup.json())
            token = str(account.get("accessToken") or account.get("token") or "")
            user = account.get("user") if isinstance(account.get("user"), dict) else {}
            user_id = str(user.get("id") or "")
            if not token or not user_id:
                raise RuntimeError("signup did not return access token and user id")

            results = []
            for index, message in enumerate([
                "Tôi muốn làm quiz về chủ đề IT, recommend cho tôi được không?",
                "Tạo một quiz mới gồm 10 câu về Python và xuất bản nó.",
            ]):
                response = await client.post(
                    f"{AGENT_URL}/chat",
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "message": message,
                        "session_id": f"http-smoke-{suffix}-{index}",
                        "locale": "vi",
                        "scope": "admin",
                        "context": {"route": "/quiz"},
                    },
                )
                response.raise_for_status()
                data = unwrap(response.json())
                results.append({
                    "prompt": message,
                    "http_status": response.status_code,
                    "answer": str(data.get("answer") or "")[:500],
                    "surface_titles": [
                        surface.get("title") for surface in data.get("surfaces", [])
                        if isinstance(surface, dict)
                    ],
                    "has_create_form": any(
                        block.get("type") == "form"
                        for surface in data.get("surfaces", []) if isinstance(surface, dict)
                        for block in surface.get("blocks", []) if isinstance(block, dict)
                    ),
                })
            print(json.dumps(results, ensure_ascii=False))
    finally:
        database_url = os.getenv("AI_SMOKE_DATABASE_URL")
        if user_id and database_url:
            with psycopg.connect(database_url) as connection:
                with connection.cursor() as cursor:
                    cursor.execute('DELETE FROM user_roles WHERE "userId" = %s', (user_id,))
                    cursor.execute('DELETE FROM users WHERE id = %s', (user_id,))
                connection.commit()
            print(json.dumps({"cleanup": "deleted temporary smoke user"}))


if __name__ == "__main__":
    asyncio.run(main())

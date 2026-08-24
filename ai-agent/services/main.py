from __future__ import annotations

import json
import os
import time
import uuid

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse

from .agent_core import AIAgentCore
from .protocol import ChatRequest
from .observability import AgentMetrics
from .tool_catalog import TOOLS

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "config", ".env"))

app = FastAPI(title="Quiz AI Agent", version="1.0.0")
origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Session-Id"],
)

metrics = AgentMetrics()
agent = AIAgentCore(
    {
        "backend_url": os.getenv("BACKEND_URL", "http://localhost:3333"),
        "openai_api_key": os.getenv("OPENAI_API_KEY"),
        "openai_base_url": os.getenv("OPENAI_BASE_URL"),
        "llm_api_mode": os.getenv("LLM_API_MODE", "responses"),
        "agent_orchestrator": os.getenv("AGENT_ORCHESTRATOR", "langgraph"),
        "max_graph_steps": int(os.getenv("AGENT_MAX_GRAPH_STEPS", "12")),
        "graph_timeout_seconds": int(os.getenv("AGENT_GRAPH_TIMEOUT_SECONDS", "90")),
        "max_empty_tool_streak": int(os.getenv("AGENT_MAX_EMPTY_TOOL_STREAK", "2")),
        "chat_history_max_messages": int(os.getenv("AI_CHAT_HISTORY_MAX_MESSAGES", "20")),
        "redis_url": os.getenv("AI_REDIS_URL") or os.getenv("REDIS_URL"),
        "rate_limit_per_minute": int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "20")),
        "require_redis": os.getenv("AI_REQUIRE_REDIS", "false").lower() == "true",
        "metrics": metrics,
    }
)


async def resolve_identity(
    request: ChatRequest, authorization: str | None
) -> tuple[str, str]:
    """Trust identity/role from NestJS, never from browser request fields."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Đăng nhập để sử dụng Quiz AI.")

    backend_url = agent.tools.backend_url
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{backend_url}/api/auth/me",
            headers={"Authorization": authorization, "Accept": "application/json"},
        )
    if response.status_code in {401, 403}:
        raise HTTPException(status_code=response.status_code, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn.")
    response.raise_for_status()
    payload = response.json()
    user = payload.get("data", payload)
    user_id = str(user.get("id") or "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Backend không trả về định danh người dùng.")
    roles = {str(role).lower() for role in (user.get("roles") or [])}
    permissions: set[str] = set()
    async with httpx.AsyncClient(timeout=10) as client:
        permissions_response = await client.get(
            f"{backend_url}/api/auth/me/permissions",
            headers={"Authorization": authorization, "Accept": "application/json"},
        )
    if permissions_response.status_code == 401:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn.")
    if not permissions_response.is_success:
        raise HTTPException(
            status_code=503,
            detail=f"Không đọc được quyền tài khoản từ backend ({permissions_response.status_code}).",
        )
    permissions_payload = permissions_response.json()
    raw_permissions = permissions_payload.get("data", permissions_payload)
    permissions = {str(permission).lower() for permission in (raw_permissions or [])}

    # Scope is derived from the signed token, never from browser route/scope.
    if user.get("isAdmin") or "admin" in roles or "all" in permissions:
        return user_id, "admin"
    if "quiz.create" in permissions:
        return user_id, "creator"
    return user_id, "learner"


def encode_sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "quiz-ai-agent",
        "stream": "/chat/stream",
        "model": agent.model,
        "api_mode": agent.api_mode,
        "orchestrator": agent.orchestrator,
        "model_configured": agent.client is not None,
    }


@app.get("/tools")
async def tools():
    return {
        "tools": [
            {"name": tool["name"], "description": tool["description"]}
            for tool in TOOLS
        ]
    }


@app.get("/ready")
async def ready():
    status = await agent.readiness()
    if not status["ready"]:
        raise HTTPException(status_code=503, detail=status)
    return status


@app.get("/metrics", response_class=PlainTextResponse)
async def get_metrics() -> str:
    return metrics.prometheus()


@app.post("/chat")
async def chat_endpoint(
    request: ChatRequest,
    authorization: str | None = Header(default=None),
):
    session_id = request.session_id or str(uuid.uuid4())
    started_at = time.perf_counter()
    outcome = "error"
    try:
        user_id, scope = await resolve_identity(request, authorization)
        if not await agent.allow_request(user_id, session_id):
            raise HTTPException(status_code=429, detail="Quá nhiều yêu cầu AI. Hãy thử lại sau một phút.")
        context = request.context.model_dump()
        context["is_authenticated"] = bool(authorization)
        response = await agent.process_message(
            request.message,
            user_id,
            authorization,
            session_id,
            request.locale,
            scope,
            context,
        )
        outcome = "completed"
        return response
    except HTTPException:
        outcome = "rejected"
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        metrics.record_chat(request.scope, outcome, time.perf_counter() - started_at)


@app.post("/chat/stream")
async def chat_stream_endpoint(
    request: ChatRequest,
    authorization: str | None = Header(default=None),
):
    session_id = request.session_id or str(uuid.uuid4())
    started_at = time.perf_counter()
    try:
        user_id, scope = await resolve_identity(request, authorization)
        if not await agent.allow_request(user_id, session_id):
            raise HTTPException(status_code=429, detail="Quá nhiều yêu cầu AI. Hãy thử lại sau một phút.")
        context = request.context.model_dump()
        context["is_authenticated"] = bool(authorization)
    except HTTPException:
        metrics.record_chat(request.scope, "rejected", time.perf_counter() - started_at)
        raise

    async def event_stream():
        stream_started_at = time.perf_counter()
        outcome = "error"
        yield encode_sse("connected", {"type": "connected", "session_id": session_id})
        try:
            async for event in agent.stream_message(
                request.message,
                user_id,
                authorization,
                session_id,
                request.locale,
                scope,
                context,
            ):
                yield encode_sse(event["type"], event)
            outcome = "completed"
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            message = (
                "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
                if status in {401, 403}
                else f"Backend trả về lỗi {status}."
            )
            yield encode_sse("error", {"type": "error", "message": message})
        except httpx.RequestError:
            yield encode_sse(
                "error",
                {
                    "type": "error",
                    "message": "Không kết nối được Backend API. Hãy kiểm tra BACKEND_URL và NestJS server.",
                },
            )
        except RuntimeError as exc:
            yield encode_sse("error", {"type": "error", "message": str(exc)})
        except Exception:
            yield encode_sse(
                "error",
                {"type": "error", "message": "Agent chưa thể xử lý yêu cầu. Vui lòng thử lại."},
            )
        finally:
            metrics.record_chat(scope, outcome, time.perf_counter() - stream_started_at)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Session-Id": session_id,
        },
    )


@app.on_event("shutdown")
async def shutdown_agent() -> None:
    await agent.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))

from __future__ import annotations

import asyncio
import json
import logging
import os
import secrets
import time
import uuid

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse

from .agent_core import AIAgentCore
from .protocol import ChatRequest, ReviewDecisionRequest
from .observability import AgentMetrics
from .tool_catalog import TOOLS
from .hardening import evaluate_production_hardening

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "config", ".env"))
logger = logging.getLogger(__name__)

if os.name == "nt" and hasattr(asyncio, "WindowsSelectorEventLoopPolicy"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


def normalize_openai_base_url(value: str | None) -> str | None:
    """Accept either an API root or a concrete OpenAI-compatible endpoint."""
    if not value:
        return None
    normalized = value.rstrip("/")
    for suffix in ("/chat/completions", "/responses"):
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)]
            break
    return normalized

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
executor_provider = os.getenv("AI_EXECUTOR_PROVIDER", "openai").strip().lower()
executor_api_key = (
    os.getenv("AI_EXECUTOR_API_KEY")
    or (os.getenv("ANTHROPIC_API_KEY") if executor_provider in {"anthropic", "claude"} else os.getenv("OPENAI_API_KEY"))
)
executor_base_url = normalize_openai_base_url(
    os.getenv("AI_EXECUTOR_BASE_URL") or os.getenv("OPENAI_BASE_URL")
)
fallback_provider = os.getenv("AI_EXECUTOR_FALLBACK_PROVIDER", "openai").strip().lower()
fallback_model = os.getenv("AI_EXECUTOR_FALLBACK_MODEL") or (
    os.getenv("OPENAI_MODEL") if fallback_provider not in {"anthropic", "claude"} else ""
)
fallback_api_key = os.getenv("AI_EXECUTOR_FALLBACK_API_KEY") or (
    os.getenv("ANTHROPIC_API_KEY")
    if fallback_provider in {"anthropic", "claude"}
    else executor_api_key
)
fallback_base_url = normalize_openai_base_url(
    os.getenv("AI_EXECUTOR_FALLBACK_BASE_URL")
    or (os.getenv("OPENAI_BASE_URL") if fallback_provider not in {"anthropic", "claude"} else None)
)
agent = AIAgentCore(
    {
        "backend_url": os.getenv("BACKEND_URL", "http://localhost:3333"),
        "openai_api_key": executor_api_key,
        "openai_base_url": executor_base_url,
        "executor_model": os.getenv("AI_EXECUTOR_MODEL") or os.getenv("OPENAI_MODEL"),
        "planner_fast_model": os.getenv("AI_PLANNER_FAST_MODEL") or os.getenv("OPENAI_MODEL"),
        "planner_fast_api_key": os.getenv("AI_PLANNER_FAST_API_KEY") or executor_api_key,
        "planner_fast_base_url": normalize_openai_base_url(
            os.getenv("AI_PLANNER_FAST_BASE_URL") or executor_base_url
        ),
        "planner_strong_model": os.getenv("AI_PLANNER_STRONG_MODEL") or os.getenv("OPENAI_MODEL"),
        "planner_strong_api_key": os.getenv("AI_PLANNER_STRONG_API_KEY") or executor_api_key,
        "planner_strong_base_url": normalize_openai_base_url(
            os.getenv("AI_PLANNER_STRONG_BASE_URL") or executor_base_url
        ),
        "executor_reasoning_effort": os.getenv("AI_EXECUTOR_REASONING_EFFORT"),
        "executor_provider": executor_provider,
        "executor_fallback_model": fallback_model,
        "executor_fallback_provider": fallback_provider,
        "executor_fallback_api_key": fallback_api_key,
        "executor_fallback_base_url": fallback_base_url,
        "executor_attempt_timeout_seconds": float(
            os.getenv("AI_EXECUTOR_ATTEMPT_TIMEOUT_SECONDS", "60")
        ),
        "executor_fallback_timeout_seconds": float(
            os.getenv("AI_EXECUTOR_FALLBACK_TIMEOUT_SECONDS", "60")
        ),
        "model_failure_threshold": int(os.getenv("AI_MODEL_FAILURE_THRESHOLD", "2")),
        "model_cooldown_seconds": float(os.getenv("AI_MODEL_COOLDOWN_SECONDS", "30")),
        "planner_fast_reasoning_effort": os.getenv("AI_PLANNER_FAST_REASONING_EFFORT"),
        "planner_strong_reasoning_effort": os.getenv("AI_PLANNER_STRONG_REASONING_EFFORT"),
        "executor_timeout_seconds": float(os.getenv("AI_EXECUTOR_TIMEOUT_SECONDS", "60")),
        "planner_fast_timeout_seconds": float(os.getenv("AI_PLANNER_FAST_TIMEOUT_SECONDS", "8")),
        "planner_strong_timeout_seconds": float(os.getenv("AI_PLANNER_STRONG_TIMEOUT_SECONDS", "25")),
        "model_max_retries": int(os.getenv("AI_MODEL_MAX_RETRIES", "0")),
        "langgraph_use_responses_api": os.getenv("AI_LANGGRAPH_USE_RESPONSES_API", "false").lower() == "true",
        "planner_confidence_threshold": float(os.getenv("AI_PLANNER_CONFIDENCE_THRESHOLD", "0.82")),
        "planner_escalate_writes": os.getenv("AI_PLANNER_ESCALATE_WRITES", "true").lower() == "true",
        "llm_api_mode": os.getenv("LLM_API_MODE", "responses"),
        "agent_orchestrator": os.getenv("AGENT_ORCHESTRATOR", "langgraph"),
        "orchestration_mode": os.getenv("AI_ORCHESTRATION_MODE", "agent_first"),
        "supervisor_max_questions_per_worker": int(os.getenv("AI_SUPERVISOR_MAX_QUESTIONS_PER_WORKER", "4")),
        "supervisor_media_concurrency": int(os.getenv("AI_SUPERVISOR_MEDIA_CONCURRENCY", "4")),
        "supervisor_media_timeout_seconds": float(os.getenv("AI_SUPERVISOR_MEDIA_TIMEOUT_SECONDS", "6")),
        "supervisor_default_question_count": int(os.getenv("AI_SUPERVISOR_DEFAULT_QUESTION_COUNT", "8")),
        "supervisor_max_revisions": int(os.getenv("AI_SUPERVISOR_MAX_REVISIONS", "2")),
        "max_graph_steps": int(os.getenv("AGENT_MAX_GRAPH_STEPS", "12")),
        "graph_timeout_seconds": int(os.getenv("AGENT_GRAPH_TIMEOUT_SECONDS", "90")),
        "auto_image_timeout_seconds": float(os.getenv("AI_AUTO_IMAGE_TIMEOUT_SECONDS", "8")),
        "max_empty_tool_streak": int(os.getenv("AGENT_MAX_EMPTY_TOOL_STREAK", "2")),
        "max_model_calls": int(os.getenv("AGENT_MAX_MODEL_CALLS", "24")),
        "max_tool_calls": int(os.getenv("AGENT_MAX_TOOL_CALLS", "32")),
        "max_subagent_calls": int(os.getenv("AGENT_MAX_SUBAGENT_CALLS", "8")),
        "max_total_tokens": int(os.getenv("AGENT_MAX_TOTAL_TOKENS", "100000")),
        "max_cost_usd": float(os.getenv("AGENT_MAX_COST_USD", "5")),
        "agent_version": os.getenv("AGENT_VERSION", "quiz-agent-dev"),
        "chat_history_max_messages": int(os.getenv("AI_CHAT_HISTORY_MAX_MESSAGES", "20")),
        "redis_url": os.getenv("AI_REDIS_URL") or os.getenv("REDIS_URL"),
        "checkpoint_database_url": os.getenv("AI_CHECKPOINT_DATABASE_URL") or os.getenv("DATABASE_URL"),
        "require_checkpoint": os.getenv("AGENT_CHECKPOINTER", "disabled").lower() == "postgres",
        "run_ttl_seconds": int(os.getenv("AGENT_RUN_TTL_SECONDS", str(60 * 60 * 24 * 7))),
        "max_events_per_run": int(os.getenv("AGENT_MAX_EVENTS_PER_RUN", "2000")),
        "rate_limit_per_minute": int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "20")),
        "require_redis": os.getenv(
            "AI_REQUIRE_REDIS",
            "true" if os.getenv("NODE_ENV", "development").lower() == "production" else "false",
        ).lower() == "true",
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
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0)) as client:
            response = await client.get(
                f"{backend_url}/api/auth/me",
                headers={"Authorization": authorization, "Accept": "application/json"},
            )
    except httpx.RequestError as exc:
        logger.warning("ai_identity_backend_unavailable error=%s", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Backend xác thực tạm thời không sẵn sàng.") from exc
    if response.status_code in {401, 403}:
        raise HTTPException(status_code=response.status_code, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn.")
    if not response.is_success:
        logger.warning("ai_identity_backend_http_error status=%s", response.status_code)
        raise HTTPException(status_code=503, detail="Backend xác thực tạm thời không sẵn sàng.")
    payload = response.json()
    user = payload.get("data", payload)
    user_id = str(user.get("id") or "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Backend không trả về định danh người dùng.")
    roles = {str(role).lower() for role in (user.get("roles") or [])}
    permissions: set[str] = set()
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0)) as client:
            permissions_response = await client.get(
                f"{backend_url}/api/auth/me/permissions",
                headers={"Authorization": authorization, "Accept": "application/json"},
            )
    except httpx.RequestError as exc:
        logger.warning("ai_permissions_backend_unavailable error=%s", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Backend quyền tài khoản tạm thời không sẵn sàng.") from exc
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


async def resolve_run_identity(authorization: str | None) -> tuple[str, str]:
    """Resolve identity for run-control endpoints without trusting path/body data."""
    return await resolve_identity(ChatRequest(message="run control"), authorization)


def encode_sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def build_request_context(
    request: ChatRequest, authorization: str | None,
) -> dict[str, object]:
    context: dict[str, object] = request.context.model_dump()
    context["is_authenticated"] = bool(authorization)
    context["locale"] = request.locale
    if request.form_submission is not None:
        context["_form_submission"] = request.form_submission.model_dump()
    return context


def require_ops_access(request: Request) -> None:
    """Protect operational metadata while keeping a minimal health probe public."""
    if os.getenv("NODE_ENV", "development").lower() != "production":
        return
    expected = os.getenv("AI_OPS_TOKEN", "")
    provided = request.headers.get("X-AI-Ops-Token", "")
    if not expected or not secrets.compare_digest(provided, expected):
        raise HTTPException(status_code=404, detail="Not found")


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "quiz-ai-agent",
    }


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/tools")
async def tools(request: Request):
    require_ops_access(request)
    return {
        "tools": [
            {"name": tool["name"], "description": tool["description"]}
            for tool in TOOLS
        ]
    }


@app.get("/ready")
async def ready(request: Request):
    require_ops_access(request)
    status = await agent.readiness()
    hardening = evaluate_production_hardening()
    status["hardening_ready"] = hardening.ready
    status["hardening"] = hardening.model_dump(mode="json")
    status["ready"] = bool(status["ready"] and hardening.ready)
    if not status["ready"]:
        raise HTTPException(status_code=503, detail=status)
    return status


@app.get("/metrics", response_class=PlainTextResponse)
async def get_metrics(request: Request) -> str:
    require_ops_access(request)
    return metrics.prometheus()


@app.get("/runs/{run_id}")
async def get_run_status(
    run_id: str,
    authorization: str | None = Header(default=None),
):
    user_id, _ = await resolve_run_identity(authorization)
    run = await agent.get_run(run_id, user_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run không tồn tại hoặc bạn không có quyền xem.")
    return {"run": run.model_dump(mode="json")}


@app.post("/runs", status_code=202)
async def enqueue_run(
    request: ChatRequest,
    authorization: str | None = Header(default=None),
):
    user_id, scope = await resolve_identity(request, authorization)
    session_id = request.session_id or str(uuid.uuid4())
    if not await agent.allow_request(user_id, session_id):
        raise HTTPException(status_code=429, detail="Quá nhiều yêu cầu AI. Hãy thử lại sau một phút.")
    context = build_request_context(request, authorization)
    try:
        return await agent.enqueue_background_run(
            request.message,
            user_id,
            authorization,
            session_id,
            request.locale,
            scope,
            context,
        )
    except RuntimeError as exc:
        logger.warning("background run enqueue rejected code=%s", str(exc).split(":", 1)[0])
        raise HTTPException(status_code=503, detail="Background agent hiện chưa sẵn sàng.") from exc


@app.post("/runs/{run_id}/cancel")
async def cancel_run(
    run_id: str,
    authorization: str | None = Header(default=None),
):
    user_id, _ = await resolve_run_identity(authorization)
    accepted = await agent.cancel_run(run_id, user_id)
    if not accepted:
        raise HTTPException(status_code=404, detail="Run không tồn tại hoặc bạn không có quyền dừng.")
    return {"run_id": run_id, "cancel_requested": True}


@app.post("/runs/{run_id}/retry", status_code=202)
async def retry_run(
    run_id: str,
    task_id: str | None = Query(default=None, min_length=1, max_length=128),
    authorization: str | None = Header(default=None),
):
    user_id, _ = await resolve_run_identity(authorization)
    try:
        return await agent.retry_background_run(run_id, user_id, authorization, task_id)
    except ValueError as exc:
        code = str(exc)
        status = 404 if code == "RUN_NOT_FOUND_OR_FORBIDDEN" else 409
        raise HTTPException(status_code=status, detail=code) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Background agent hiện chưa sẵn sàng.") from exc


@app.get("/runs/{run_id}/events")
async def replay_run_events(
    run_id: str,
    after_sequence: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=2000),
    authorization: str | None = Header(default=None),
):
    user_id, _ = await resolve_run_identity(authorization)
    events = await agent.replay_run_events(
        run_id,
        user_id,
        after_sequence=after_sequence,
        limit=limit,
    )
    if not events and await agent.get_run(run_id, user_id) is None:
        raise HTTPException(status_code=404, detail="Run không tồn tại hoặc bạn không có quyền xem.")
    return {"run_id": run_id, "events": events}


@app.get("/reviews/{review_id}")
async def get_review(
    review_id: str,
    authorization: str | None = Header(default=None),
):
    user_id, _ = await resolve_run_identity(authorization)
    review = await agent.get_review(review_id, user_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Review không tồn tại hoặc bạn không có quyền xem.")
    return {"review": review.model_dump(mode="json")}


@app.get("/reviews")
async def list_reviews(
    status: str = Query(default="pending", pattern="^(pending|approved|rejected|all)$"),
    authorization: str | None = Header(default=None),
):
    user_id, _ = await resolve_run_identity(authorization)
    reviews = await agent.list_reviews(
        user_id,
        status=None if status == "all" else status,
    )
    return {"reviews": [review.model_dump(mode="json") for review in reviews]}


@app.post("/reviews/{review_id}/decision")
async def decide_review(
    review_id: str,
    request: ReviewDecisionRequest,
    authorization: str | None = Header(default=None),
):
    user_id, scope = await resolve_run_identity(authorization)
    if scope not in {"creator", "admin"}:
        raise HTTPException(status_code=403, detail="Cần quyền creator hoặc admin để review.")
    review = await agent.decide_review(
        review_id, user_id, scope, request.decision, request.notes,
    )
    if review is None:
        raise HTTPException(status_code=404, detail="Review không tồn tại, đã xử lý hoặc không thuộc tài khoản.")
    return {"review": review.model_dump(mode="json")}


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
        context = build_request_context(request, authorization)
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
        request_id = uuid.uuid4().hex
        logger.exception("ai_chat_request_failed request_id=%s error=%s", request_id, type(exc).__name__)
        raise HTTPException(
            status_code=500,
            detail=f"Agent chưa thể xử lý yêu cầu. Mã lỗi: {request_id}",
        ) from exc
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
        context = build_request_context(request, authorization)
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

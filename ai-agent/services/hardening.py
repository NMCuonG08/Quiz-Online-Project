from __future__ import annotations

import os
from typing import Mapping, Optional

from pydantic import BaseModel, ConfigDict, Field


class HardeningCheck(BaseModel):
    model_config = ConfigDict(extra="forbid")
    check_id: str = Field(min_length=1, max_length=128)
    passed: bool
    blocking: bool = True
    message: str = Field(max_length=500)
    remediation: str = Field(default="", max_length=500)


class HardeningReport(BaseModel):
    model_config = ConfigDict(extra="forbid")
    environment: str
    ready: bool
    checks: list[HardeningCheck] = Field(default_factory=list)
    blocking_failures: list[str] = Field(default_factory=list)


def evaluate_production_hardening(
    env: Optional[Mapping[str, str]] = None,
    *,
    environment: Optional[str] = None,
) -> HardeningReport:
    values = dict(os.environ if env is None else env)
    mode = (environment or values.get("NODE_ENV") or "development").lower()
    checks: list[HardeningCheck] = []

    def add(
        check_id: str,
        passed: bool,
        message: str,
        remediation: str,
        blocking: bool = True,
    ) -> None:
        checks.append(HardeningCheck(
            check_id=check_id,
            passed=passed,
            blocking=blocking and production,
            message=message,
            remediation=remediation,
        ))

    production = mode == "production"
    add(
        "environment_mode",
        True,
        "Production hardening is active." if production else "Development hardening mode.",
        "Set NODE_ENV=production for blocking checks.",
        blocking=False,
    )

    model_key = values.get("AI_EXECUTOR_API_KEY") or values.get("OPENAI_API_KEY")
    add(
        "model_credentials",
        _configured(model_key),
        "Model credentials are configured." if _configured(model_key) else "Model credentials are missing.",
        "Set a model credential using a secret manager.",
    )

    redis_url = values.get("AI_REDIS_URL") or values.get("REDIS_URL")
    redis_required = _truthy(values.get("AI_REQUIRE_REDIS"))
    add(
        "redis_requirement",
        not production or redis_required,
        "Redis requirement is enabled." if redis_required else "Production Redis requirement is disabled.",
        "Set AI_REQUIRE_REDIS=true.",
    )
    add(
        "redis_configuration",
        not production or _configured(redis_url),
        "Redis URL is configured." if _configured(redis_url) else "Redis URL is missing.",
        "Set REDIS_URL or AI_REDIS_URL.",
    )

    checkpoint_mode = (values.get("AGENT_CHECKPOINTER") or "disabled").lower()
    checkpoint_url = values.get("AI_CHECKPOINT_DATABASE_URL") or values.get("DATABASE_URL")
    add(
        "durable_checkpoint",
        not production or checkpoint_mode == "postgres",
        "Postgres checkpointing is enabled." if checkpoint_mode == "postgres" else "Durable checkpointing is disabled.",
        "Set AGENT_CHECKPOINTER=postgres.",
    )
    add(
        "checkpoint_credentials",
        not production or _configured(checkpoint_url),
        "Checkpoint database URL is configured." if _configured(checkpoint_url) else "Checkpoint database URL is missing.",
        "Set AI_CHECKPOINT_DATABASE_URL with least privilege.",
    )

    cors_values = {
        item.strip().lower()
        for item in (values.get("CORS_ORIGINS") or "").split(",")
        if item.strip()
    }
    cors_safe = bool(cors_values) and "*" not in cors_values and not any(
        "localhost" in item or "127.0.0.1" in item for item in cors_values
    )
    add(
        "cors_policy",
        not production or cors_safe,
        "CORS origins are restricted." if cors_safe else "CORS origins are unsafe or missing.",
        "Set explicit HTTPS frontend origins.",
    )

    backend_url = values.get("BACKEND_URL") or ""
    backend_safe = backend_url.startswith("https://") or backend_url.startswith(
        ("http://app:", "http://backend:")
    )
    add(
        "backend_endpoint",
        not production or backend_safe,
        "Backend endpoint is production-safe." if backend_safe else "Backend endpoint is missing or unsafe.",
        "Use HTTPS or a private service hostname.",
    )

    web_provider = (values.get("WEB_SEARCH_PROVIDER") or "disabled").lower()
    web_key = values.get("WEB_SEARCH_API_KEY")
    add(
        "web_search_credentials",
        web_provider == "disabled" or _configured(web_key),
        "Web search is disabled or configured."
        if web_provider == "disabled" or _configured(web_key)
        else "Web search is enabled without credentials.",
        "Disable web search or set WEB_SEARCH_API_KEY.",
    )

    add(
        "run_budget",
        _positive_int(values.get("AGENT_MAX_MODEL_CALLS"))
        and _positive_int(values.get("AGENT_MAX_TOOL_CALLS"))
        and _positive_int(values.get("AGENT_MAX_TOTAL_TOKENS")),
        "Per-run budgets are configured.",
        "Set positive model, tool and token budgets.",
    )

    add(
        "ops_endpoint_auth",
        not production or _configured(values.get("AI_OPS_TOKEN")),
        "Operational endpoints require an ops token."
        if _configured(values.get("AI_OPS_TOKEN"))
        else "Operational endpoint token is missing.",
        "Set AI_OPS_TOKEN and keep /healthz as the only public health probe.",
    )

    placeholders = ("your_", "replace_me", "changeme", "example.com")
    sensitive_keys = (
        "OPENAI_API_KEY",
        "AI_EXECUTOR_API_KEY",
        "AI_PLANNER_FAST_API_KEY",
        "AI_PLANNER_STRONG_API_KEY",
        "BACKEND_API_KEY",
        "AI_CHECKPOINT_DATABASE_URL",
    )
    for key in sensitive_keys:
        value = values.get(key)
        if value and any(marker in value.lower() for marker in placeholders):
            add(
                "placeholder_" + key.lower(),
                False,
                key + " appears to contain a placeholder.",
                "Replace placeholder credentials before production.",
            )

    failures = [
        check.message
        for check in checks
        if production and check.blocking and not check.passed
    ]
    return HardeningReport(
        environment=mode,
        ready=not failures,
        checks=checks,
        blocking_failures=failures,
    )


def _configured(value: Optional[str]) -> bool:
    return bool(value and value.strip())


def _truthy(value: Optional[str]) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def _positive_int(value: Optional[str]) -> bool:
    try:
        return int(str(value or "0")) > 0
    except (TypeError, ValueError):
        return False

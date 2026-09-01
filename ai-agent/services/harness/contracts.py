from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator, model_validator


RunStatus = Literal[
    "created",
    "authenticating",
    "planning",
    "context_building",
    "executing",
    "waiting_for_approval",
    "verifying",
    "responding",
    "completed",
    "paused",
    "retrying",
    "cancelled",
    "expired",
    "failed",
]

RunOutcomeStatus = Literal[
    "completed",
    "paused",
    "cancelled",
    "expired",
    "failed",
]

ToolErrorKind = Literal[
    "validation",
    "authorization",
    "ownership",
    "approval",
    "dependency",
    "timeout",
    "budget",
    "injection",
    "reconciliation",
    "fatal",
]

SourceKind = Literal["backend", "knowledge", "web", "user", "model", "unknown"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class HarnessModel(BaseModel):
    model_config = ConfigDict(extra="forbid", arbitrary_types_allowed=False)


class RunRequest(HarnessModel):
    request_id: str = Field(min_length=1, max_length=128)
    user_message: str = Field(min_length=1, max_length=8000)
    trusted_user_id: str = Field(min_length=1, max_length=128)
    session_id: str = Field(min_length=1, max_length=128)
    scope: Literal["learner", "creator", "admin"]
    locale: str = Field(default="vi", min_length=2, max_length=16)
    route: str = Field(default="/", min_length=1, max_length=500)
    selected_quiz_id: Optional[str] = Field(default=None, max_length=128)
    selected_knowledge_source_id: Optional[str] = Field(default=None, max_length=128)
    received_at: datetime = Field(default_factory=utc_now)

    @field_validator("route")
    @classmethod
    def internal_route_only(cls, value: str) -> str:
        if not value.startswith("/"):
            raise ValueError("route must be an internal path")
        return value


class BudgetPolicy(HarnessModel):
    max_graph_steps: Optional[int] = Field(default=12, ge=1, le=1000)
    max_model_calls: Optional[int] = Field(default=24, ge=1, le=1000)
    max_tool_calls: Optional[int] = Field(default=32, ge=1, le=2000)
    max_subagent_calls: Optional[int] = Field(default=8, ge=0, le=500)
    max_total_tokens: Optional[int] = Field(default=100_000, ge=1, le=10_000_000)
    max_cost_usd: Optional[float] = Field(default=5.0, ge=0, le=100_000)
    max_elapsed_seconds: Optional[float] = Field(default=180.0, ge=0.1, le=86_400)
    max_retries: Optional[int] = Field(default=8, ge=0, le=1000)


class RunUsage(HarnessModel):
    graph_steps: int = Field(default=0, ge=0)
    model_calls: int = Field(default=0, ge=0)
    tool_calls: int = Field(default=0, ge=0)
    subagent_calls: int = Field(default=0, ge=0)
    input_tokens: int = Field(default=0, ge=0)
    output_tokens: int = Field(default=0, ge=0)
    cached_tokens: int = Field(default=0, ge=0)
    estimated_cost_usd: float = Field(default=0.0, ge=0)
    elapsed_seconds: float = Field(default=0.0, ge=0)
    retries: int = Field(default=0, ge=0)

    @model_validator(mode="before")
    @classmethod
    def ignore_derived_fields(cls, value: Any) -> Any:
        if isinstance(value, dict):
            value = dict(value)
            value.pop("total_tokens", None)
        return value

    @computed_field
    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens

    def copy_snapshot(self) -> "RunUsage":
        return self.model_copy(deep=True)


class EvidenceRef(HarnessModel):
    source_kind: SourceKind
    source_id: str = Field(min_length=1, max_length=256)
    title: str = Field(default="", max_length=500)
    uri: str = Field(default="", max_length=4000)
    snippet: str = Field(default="", max_length=2000)
    retrieved_at: datetime = Field(default_factory=utc_now)
    visibility: str = Field(default="", max_length=64)
    confidence: Optional[float] = Field(default=None, ge=0, le=1)


class ArtifactRef(HarnessModel):
    artifact_id: str = Field(min_length=1, max_length=256)
    artifact_type: str = Field(min_length=1, max_length=64)
    owner_id: str = Field(min_length=1, max_length=128)
    uri: str = Field(default="", max_length=4000)
    content_type: str = Field(default="", max_length=256)
    size_bytes: Optional[int] = Field(default=None, ge=0)
    checksum: Optional[str] = Field(default=None, max_length=256)


class ToolExecutionResult(HarnessModel):
    ok: bool
    tool_name: str = Field(min_length=1, max_length=128)
    call_id: str = Field(default="", max_length=256)
    output: Any = None
    error_code: Optional[str] = Field(default=None, max_length=128)
    error_kind: Optional[ToolErrorKind] = None
    error_message: Optional[str] = Field(default=None, max_length=2000)
    retryable: bool = False
    approval_required: bool = False
    evidence: list[EvidenceRef] = Field(default_factory=list, max_length=100)
    artifacts: list[ArtifactRef] = Field(default_factory=list, max_length=100)
    idempotency_key: Optional[str] = Field(default=None, max_length=256)
    started_at: datetime = Field(default_factory=utc_now)
    completed_at: Optional[datetime] = None


class VerificationCheck(HarnessModel):
    name: str = Field(min_length=1, max_length=128)
    passed: bool
    blocking: bool = True
    message: str = Field(default="", max_length=2000)


class VerificationResult(HarnessModel):
    passed: bool
    checks: list[VerificationCheck] = Field(default_factory=list, max_length=200)
    failures: list[str] = Field(default_factory=list, max_length=200)
    evidence: list[EvidenceRef] = Field(default_factory=list, max_length=100)
    repairable: bool = False
    user_action_required: bool = False
    reviewer_notes: str = Field(default="", max_length=4000)


class RunContext(HarnessModel):
    schema_version: str = Field(default="1", min_length=1, max_length=32)
    run_id: str = Field(min_length=1, max_length=128)
    thread_id: str = Field(min_length=1, max_length=256)
    request: RunRequest
    agent_version: str = Field(default="quiz-agent-dev", max_length=128)
    status: RunStatus = "created"
    plan: dict[str, Any] = Field(default_factory=dict)
    state: dict[str, Any] = Field(default_factory=dict)
    budgets: BudgetPolicy = Field(default_factory=BudgetPolicy)
    usage: RunUsage = Field(default_factory=RunUsage)
    capabilities: list[str] = Field(default_factory=list, max_length=100)
    permissions: list[str] = Field(default_factory=list, max_length=200)
    evidence: list[EvidenceRef] = Field(default_factory=list, max_length=100)
    artifacts: list[ArtifactRef] = Field(default_factory=list, max_length=100)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class RunOutcome(HarnessModel):
    run_id: str = Field(min_length=1, max_length=128)
    status: RunOutcomeStatus
    safe_message: str = Field(default="", max_length=4000)
    error_code: Optional[str] = Field(default=None, max_length=128)
    usage: RunUsage = Field(default_factory=RunUsage)
    completed_at: datetime = Field(default_factory=utc_now)
    metadata: dict[str, Any] = Field(default_factory=dict)

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


TaskStatus = Literal[
    "pending", "running", "completed", "retryable_failed", "blocked", "cancelled"
]


class OrchestrationModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ExecutionPlan(OrchestrationModel):
    """Validated supervisor output for one authoring run."""

    plan_id: str = Field(min_length=1, max_length=128)
    workflow: Literal["single", "quiz_authoring"]
    content_language: str = Field(default="auto", min_length=2, max_length=32)
    question_count: int = Field(default=8, ge=1, le=100)
    max_revisions: int = Field(default=2, ge=0, le=5)
    required_roles: list[str] = Field(default_factory=list, max_length=12)
    metadata: dict[str, Any] = Field(default_factory=dict)


class QuestionTask(OrchestrationModel):
    """One non-overlapping question generation shard."""

    task_id: str = Field(min_length=1, max_length=128)
    slots: list[int] = Field(min_length=1, max_length=20)
    blueprint: list[dict[str, Any]] = Field(default_factory=list, max_length=20)
    task_fingerprint: str = Field(min_length=1, max_length=128)


class AgentArtifact(OrchestrationModel):
    """Typed worker result with provenance and a stable reference."""

    artifact_id: str = Field(min_length=1, max_length=128)
    task_id: str = Field(min_length=1, max_length=128)
    schema_version: str = Field(default="1", min_length=1, max_length=32)
    status: Literal["completed", "failed"]
    payload: dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = Field(default=None, max_length=1000)
    provenance: dict[str, Any] = Field(default_factory=dict)


class TaskResult(OrchestrationModel):
    task_id: str = Field(min_length=1, max_length=128)
    status: TaskStatus
    artifact_id: Optional[str] = None
    attempts: int = Field(default=1, ge=1, le=10)
    error: Optional[str] = Field(default=None, max_length=1000)

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from ..tool_catalog import TOOLS


ToolPhase = Literal["propose", "execute"]
ToolAccess = Literal["read", "write"]
IdempotencyMode = Literal["none", "required"]


class ToolSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=128)
    capability: str = Field(min_length=1, max_length=128)
    access: ToolAccess
    risk: str = Field(min_length=1, max_length=64)
    input_schema: dict[str, Any]
    output_schema: dict[str, Any] | None = None
    allowed_scopes: frozenset[str] = Field(min_length=1)
    requires_approval: bool = False
    idempotency: IdempotencyMode = "none"
    timeout_seconds: float = Field(default=30.0, gt=0, le=300)
    result_size_limit: int = Field(default=100_000, ge=1, le=10_000_000)
    audit: bool = True


def _catalog_schema(name: str) -> dict[str, Any]:
    for item in TOOLS:
        if item.get("name") == name:
            schema = item.get("parameters")
            if isinstance(schema, dict):
                return schema
    raise ValueError(f"Tool catalog does not define {name}")


_WRITE_TOOLS = frozenset({
    "create_quiz", "create_quiz_with_questions", "update_quiz", "delete_quiz",
    "publish_quiz", "unpublish_quiz", "start_quiz", "create_question",
    "update_question", "delete_question", "duplicate_question", "reorder_questions",
    "create_category", "update_category", "delete_category", "import_knowledge_url",
    "submit_knowledge_review", "review_knowledge",
})
_ADMIN_ONLY_TOOLS = frozenset({
    "create_category", "update_category", "delete_category", "review_knowledge",
    "get_admin_dashboard_stats", "list_audit_events",
})
_CREATOR_OR_ADMIN_TOOLS = frozenset({
    "get_my_quizzes", "list_questions", "get_quiz_build_status",
    "list_knowledge_sources", "create_quiz", "create_quiz_with_questions",
    "update_quiz", "delete_quiz", "publish_quiz", "unpublish_quiz",
    "create_question", "update_question", "delete_question", "duplicate_question",
    "reorder_questions", "import_knowledge_url", "submit_knowledge_review",
})
_CAPABILITY_BY_TOOL = {
    "search_quizzes": "discovery", "recommend_quizzes": "discovery",
    "get_quiz": "discovery", "list_categories": "discovery",
    "get_current_time": "account", "get_current_user": "account",
    "get_my_permissions": "account", "get_quiz_history": "learning",
    "get_in_progress_quizzes": "learning", "get_all_attempts": "learning",
    "get_quiz_result": "learning", "start_quiz": "learning",
    "search_knowledge": "knowledge", "list_knowledge_sources": "knowledge",
    "import_knowledge_url": "knowledge", "submit_knowledge_review": "knowledge",
    "review_knowledge": "knowledge", "render_ui": "presentation",
    "plan_interaction": "planning", "get_my_quizzes": "authoring",
    "list_questions": "authoring", "get_quiz_build_status": "authoring",
}


def _allowed_scopes(name: str) -> frozenset[str]:
    if name in _ADMIN_ONLY_TOOLS:
        return frozenset({"admin"})
    if name in _CREATOR_OR_ADMIN_TOOLS:
        return frozenset({"creator", "admin"})
    return frozenset({"learner", "creator", "admin"})


def _build_specs() -> dict[str, ToolSpec]:
    specs: dict[str, ToolSpec] = {}
    for item in TOOLS:
        name = str(item.get("name") or "")
        if not name:
            continue
        specs[name] = ToolSpec(
            name=name,
            capability=_CAPABILITY_BY_TOOL.get(name, "general"),
            access="write" if name in _WRITE_TOOLS else "read",
            risk="admin" if name in _ADMIN_ONLY_TOOLS else (
                "write" if name in _WRITE_TOOLS else "read"
            ),
            input_schema=item.get("parameters") if isinstance(item.get("parameters"), dict) else {"type": "object"},
            allowed_scopes=_allowed_scopes(name),
            requires_approval=name in _WRITE_TOOLS,
            idempotency="required" if name in _WRITE_TOOLS else "none",
            timeout_seconds=60 if name in _WRITE_TOOLS else 30,
            result_size_limit=300_000 if name == "create_quiz_with_questions" else 100_000,
        )
    return specs


TOOL_SPECS = _build_specs()


def get_tool_spec(name: str) -> ToolSpec:
    try:
        return TOOL_SPECS[name]
    except KeyError as exc:
        raise KeyError(f"Unknown migrated tool: {name}") from exc

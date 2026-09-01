from __future__ import annotations

from dataclasses import dataclass
from typing import FrozenSet


@dataclass(frozen=True)
class AgentRole:
    name: str
    purpose: str
    allowed_tools: FrozenSet[str]
    can_side_effect: bool = False


READ_ONLY_TOOLS = frozenset({
    "get_current_time", "get_current_user", "get_my_permissions", "search_quizzes",
    "recommend_quizzes", "get_quiz", "search_knowledge", "list_categories",
    "get_my_quizzes", "get_quiz_history", "get_in_progress_quizzes", "get_all_attempts",
    "get_quiz_result", "list_questions", "get_quiz_build_status", "list_knowledge_sources",
    "get_admin_dashboard_stats", "list_audit_events", "web_search", "render_ui",
})

AGENT_ROLES = {
    "tutor_retriever": AgentRole(
        "tutor_retriever",
        "Read-only evidence retrieval and learner explanations.",
        READ_ONLY_TOOLS,
    ),
    "quiz_builder": AgentRole(
        "quiz_builder",
        "Prepare quiz/question drafts; all mutation still goes through approval.",
        READ_ONLY_TOOLS | frozenset({"create_quiz_with_questions", "create_question", "update_question"}),
    ),
    "quality_reviewer": AgentRole(
        "quality_reviewer",
        "Validate quiz structure, evidence and policy without mutating data.",
        READ_ONLY_TOOLS,
    ),
}


def role_for(name: str) -> AgentRole:
    try:
        return AGENT_ROLES[name]
    except KeyError as exc:
        raise ValueError(f"Unknown agent role: {name}") from exc


def assert_role_tool(role: str, tool: str) -> None:
    selected = role_for(role)
    if tool not in selected.allowed_tools:
        raise PermissionError(f"ROLE_TOOL_DENIED: {role} cannot call {tool}")


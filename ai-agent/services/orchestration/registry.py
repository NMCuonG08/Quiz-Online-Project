from __future__ import annotations

from dataclasses import dataclass
from typing import FrozenSet


@dataclass(frozen=True)
class AgentSpec:
    role: str
    purpose: str
    capabilities: FrozenSet[str]
    allowed_tools: FrozenSet[str]
    model_route: str = "executor"
    side_effects: bool = False


AGENT_SPECS = {
    "planner": AgentSpec(
        role="planner",
        purpose="Create a typed execution plan from the user goal.",
        capabilities=frozenset({"structured_output", "semantic_routing"}),
        allowed_tools=frozenset({"plan_interaction", "list_categories"}),
        model_route="planner_fast",
    ),
    "curriculum": AgentSpec(
        role="curriculum",
        purpose="Break a quiz goal into balanced learning objectives and question slots.",
        capabilities=frozenset({"structured_output", "reasoning"}),
        allowed_tools=frozenset(),
        model_route="planner_fast",
    ),
    "quiz_builder": AgentSpec(
        role="quiz_builder",
        purpose="Generate only the assigned question slots.",
        capabilities=frozenset({"structured_output", "long_output"}),
        allowed_tools=frozenset(),
        model_route="executor",
    ),
    "quality_reviewer": AgentSpec(
        role="quality_reviewer",
        purpose="Review structure, answer correctness and difficulty.",
        capabilities=frozenset({"structured_output", "reasoning"}),
        allowed_tools=frozenset(),
        model_route="planner_fast",
    ),
    "media_retriever": AgentSpec(
        role="media_retriever",
        purpose="Retrieve and validate public image URLs.",
        capabilities=frozenset({"http_retrieval"}),
        allowed_tools=frozenset({"search_images"}),
    ),
    "finalizer": AgentSpec(
        role="finalizer",
        purpose="Merge validated artifacts and create the approval proposal.",
        capabilities=frozenset({"deterministic_merge"}),
        allowed_tools=frozenset({"create_quiz_with_questions"}),
    ),
}


def get_agent_spec(role: str) -> AgentSpec:
    try:
        return AGENT_SPECS[role]
    except KeyError as exc:
        raise ValueError(f"Unknown orchestration agent role: {role}") from exc

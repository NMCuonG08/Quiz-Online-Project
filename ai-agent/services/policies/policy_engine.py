from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Literal, Mapping, Optional

from ..harness.errors import ApprovalRequired, ReconciliationRequired, ToolDenied
from ..harness.tool_specs import ToolPhase, ToolSpec


PolicyDecisionType = Literal[
    "allow", "deny", "require_approval", "transform", "retry"
]


@dataclass(frozen=True)
class PolicyInput:
    tool: ToolSpec
    phase: ToolPhase
    scope: str
    allowed_tools: set[str]
    approval_verified: bool = False
    idempotency_key: Optional[str] = None
    actor_id: str = ""
    tenant_id: Optional[str] = None
    resource: Optional[Mapping[str, Any]] = None


@dataclass(frozen=True)
class PolicyDecision:
    decision: PolicyDecisionType
    policy_id: str
    policy_version: str
    reason: str
    evidence: tuple[str, ...]
    actor: Mapping[str, Any]
    resource: Mapping[str, Any]
    action: str

    def model_dump(self) -> dict[str, Any]:
        return {
            "decision": self.decision,
            "policy_id": self.policy_id,
            "policy_version": self.policy_version,
            "reason": self.reason,
            "evidence": list(self.evidence),
            "actor": dict(self.actor),
            "resource": dict(self.resource),
            "action": self.action,
        }


def arguments_hash(tool_name: str, args: Mapping[str, Any]) -> str:
    """Canonical hash used to bind approvals and audit records to arguments."""
    payload = json.dumps(
        {"tool": tool_name, "arguments": dict(args)},
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class PolicyEngine:
    """Central, deterministic policy decision point outside the LLM."""

    policy_id = "quiz-agent.runtime"
    policy_version = "1.0"
    valid_scopes = frozenset({"learner", "creator", "admin"})

    def evaluate(self, request: PolicyInput) -> PolicyDecision:
        actor = {
            "user_id": request.actor_id,
            "scope": request.scope,
            "tenant_id": request.tenant_id,
        }
        resource = dict(request.resource or {})
        common = {
            "policy_id": self.policy_id,
            "policy_version": self.policy_version,
            "actor": actor,
            "resource": resource,
            "action": request.tool.name,
        }

        if request.scope not in self.valid_scopes:
            return PolicyDecision(
                decision="deny",
                reason="scope is not recognized; policy fails closed",
                evidence=("scope.allowlist",),
                **common,
            )
        if request.tool.name not in request.allowed_tools:
            return PolicyDecision(
                decision="deny",
                reason="tool is not in the current capability manifest",
                evidence=("capability.allowlist",),
                **common,
            )
        if request.scope not in request.tool.allowed_scopes:
            return PolicyDecision(
                decision="deny",
                reason="scope is not allowed for this tool",
                evidence=("tool.allowed_scopes",),
                **common,
            )
        if resource.get("tenant_id") and request.tenant_id != resource["tenant_id"]:
            return PolicyDecision(
                decision="deny",
                reason="resource belongs to another tenant",
                evidence=("resource.tenant_scope",),
                **common,
            )
        if resource.get("owner_id") and request.actor_id != resource["owner_id"] and request.scope != "admin":
            return PolicyDecision(
                decision="deny",
                reason="resource is not owned by the actor",
                evidence=("resource.owner_scope",),
                **common,
            )
        if request.tool.access == "write" and request.phase == "propose" and not request.approval_verified:
            return PolicyDecision(
                decision="require_approval",
                reason="write action must stop at a proposal before execution",
                evidence=("side_effect.approval",),
                **common,
            )
        if request.tool.access == "write" and request.phase == "execute" and not request.approval_verified:
            return PolicyDecision(
                decision="require_approval",
                reason="write execution has no verified approval",
                evidence=("side_effect.approval_verified",),
                **common,
            )
        if (
            request.phase == "execute"
            and request.tool.idempotency == "required"
            and not request.idempotency_key
        ):
            return PolicyDecision(
                decision="deny",
                reason="write action requires an idempotency key",
                evidence=("side_effect.idempotency",),
                **common,
            )
        return PolicyDecision(
            decision="allow",
            reason="actor, capability, scope and side-effect policy checks passed",
            evidence=("scope.allowlist", "capability.allowlist", "schema.pending"),
            **common,
        )

    def enforce(self, request: PolicyInput) -> PolicyDecision:
        decision = self.evaluate(request)
        if decision.decision == "deny":
            if "idempotency" in decision.reason:
                raise ReconciliationRequired(
                    decision.reason,
                    details=decision.model_dump(),
                )
            raise ToolDenied(
                decision.reason,
                safe_message="Agent không được phép thực hiện thao tác này.",
                details=decision.model_dump(),
            )
        if decision.decision == "require_approval" and request.phase == "execute":
            raise ApprovalRequired(
                "Write execution requires a verified approval",
                details=decision.model_dump(),
            )
        return decision

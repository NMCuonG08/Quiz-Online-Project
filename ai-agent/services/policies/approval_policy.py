from __future__ import annotations

from typing import Optional

from ..harness.errors import ApprovalRequired, ReconciliationRequired
from ..harness.tool_specs import ToolPhase, ToolSpec


def assert_approval_contract(
    spec: ToolSpec,
    *,
    phase: ToolPhase,
    approval_verified: bool,
    idempotency_key: Optional[str],
) -> None:
    if phase == "propose":
        return
    if spec.requires_approval and not approval_verified:
        raise ApprovalRequired(
            f"Tool {spec.name} requires a verified approval before execution"
        )
    if spec.idempotency == "required" and not idempotency_key:
        raise ReconciliationRequired(
            f"Tool {spec.name} requires an idempotency key for execution"
        )


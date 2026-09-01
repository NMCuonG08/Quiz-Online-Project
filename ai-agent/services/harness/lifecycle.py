from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from .contracts import RunStatus
from .errors import HarnessError


RUN_TRANSITIONS: dict[RunStatus, frozenset[RunStatus]] = {
    "created": frozenset({"authenticating", "planning", "cancelled", "failed"}),
    "authenticating": frozenset({"planning", "failed", "cancelled"}),
    "planning": frozenset({"context_building", "executing", "waiting_for_approval", "failed", "cancelled"}),
    "context_building": frozenset({"executing", "failed", "cancelled"}),
    "executing": frozenset({"executing", "waiting_for_approval", "verifying", "paused", "retrying", "failed", "cancelled", "expired"}),
    "waiting_for_approval": frozenset({"executing", "cancelled", "expired", "failed"}),
    "verifying": frozenset({"responding", "executing", "failed", "cancelled"}),
    "responding": frozenset({"completed", "failed", "cancelled"}),
    "completed": frozenset(),
    "paused": frozenset({"executing", "cancelled", "expired", "failed"}),
    "retrying": frozenset({"executing", "failed", "cancelled", "expired"}),
    "cancelled": frozenset(),
    "expired": frozenset(),
    "failed": frozenset(),
}


@dataclass(frozen=True)
class LifecycleTransition:
    from_status: RunStatus
    to_status: RunStatus
    at: datetime
    reason: str = ""


class RunLifecycle:
    def __init__(self, initial: RunStatus = "created") -> None:
        self._status: RunStatus = initial
        self._history: list[LifecycleTransition] = []

    @property
    def status(self) -> RunStatus:
        return self._status

    @property
    def history(self) -> tuple[LifecycleTransition, ...]:
        return tuple(self._history)

    def can_transition(self, target: RunStatus) -> bool:
        return target in RUN_TRANSITIONS[self._status]

    def transition(self, target: RunStatus, reason: str = "") -> LifecycleTransition:
        if not self.can_transition(target):
            raise HarnessError(
                f"Illegal run transition {self._status} -> {target}",
                code="INVALID_RUN_TRANSITION",
                safe_message="Agent không thể chuyển sang trạng thái xử lý này.",
                details={"from": self._status, "to": target},
            )
        transition = LifecycleTransition(
            from_status=self._status,
            to_status=target,
            at=datetime.now(timezone.utc),
            reason=reason,
        )
        self._status = target
        self._history.append(transition)
        return transition

    def cancel(self, reason: str = "") -> LifecycleTransition:
        return self.transition("cancelled", reason)

    def fail(self, reason: str = "") -> LifecycleTransition:
        return self.transition("failed", reason)

    def outcome_status(self) -> Optional[str]:
        return self._status if self._status in {"completed", "paused", "cancelled", "expired", "failed"} else None


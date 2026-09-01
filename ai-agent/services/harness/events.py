from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


_RESERVED_FIELDS = frozenset({"type", "event_id", "run_id", "sequence", "timestamp"})


class HarnessEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str = Field(min_length=1, max_length=128)
    event_id: str = Field(min_length=1, max_length=128)
    run_id: str = Field(min_length=1, max_length=128)
    sequence: int = Field(ge=1)
    timestamp: datetime
    payload: dict[str, Any] = Field(default_factory=dict)

    @field_validator("type")
    @classmethod
    def safe_type(cls, value: str) -> str:
        if any(character.isspace() for character in value):
            raise ValueError("event type must not contain whitespace")
        return value

    def public_dict(self) -> dict[str, Any]:
        result = {
            "type": self.type,
            "event_id": self.event_id,
            "run_id": self.run_id,
            "sequence": self.sequence,
            "timestamp": self.timestamp.isoformat(),
        }
        result.update(self.payload)
        return result


class EventSequencer:
    """Creates additive, ordered event envelopes while preserving flat SSE payloads."""

    def __init__(self, run_id: str, *, clock: Any = None) -> None:
        if not run_id:
            raise ValueError("run_id is required")
        self.run_id = run_id
        self._sequence = 0
        self._clock = clock or (lambda: datetime.now(timezone.utc))

    @property
    def sequence(self) -> int:
        return self._sequence

    def emit(
        self,
        event_type: str,
        payload: Optional[dict[str, Any]] = None,
        *,
        event_id: Optional[str] = None,
    ) -> dict[str, Any]:
        payload = dict(payload or {})
        collisions = _RESERVED_FIELDS.intersection(payload)
        if collisions:
            raise ValueError(f"payload cannot override reserved fields: {sorted(collisions)}")
        self._sequence += 1
        event = HarnessEvent(
            type=event_type,
            event_id=event_id or str(uuid4()),
            run_id=self.run_id,
            sequence=self._sequence,
            timestamp=self._clock(),
            payload=payload,
        )
        return event.public_dict()


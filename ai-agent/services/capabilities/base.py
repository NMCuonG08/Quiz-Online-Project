from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass(frozen=True)
class CapabilityDescriptor:
    capability_id: str
    supported_intents: frozenset[str]
    allowed_scopes: frozenset[str]
    tools: frozenset[str]
    access: str


@dataclass(frozen=True)
class CapabilityContext:
    user_id: str
    scope: str
    authorization: Optional[str] = None
    session_id: str = "default"
    tenant_id: Optional[str] = None

    def require_authorization(self) -> str:
        if not self.authorization:
            raise PermissionError("AUTH_REQUIRED: Người dùng cần đăng nhập")
        return self.authorization


@dataclass(frozen=True)
class CapabilityResult:
    data: Any
    citations: list[dict[str, str]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

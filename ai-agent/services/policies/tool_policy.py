from __future__ import annotations

from typing import Iterable

from ..harness.errors import ToolDenied
from ..harness.tool_specs import ToolSpec


def assert_tool_allowed(
    spec: ToolSpec,
    *,
    allowed_tools: Iterable[str],
    scope: str,
) -> None:
    allowed = set(allowed_tools)
    if spec.name not in allowed:
        raise ToolDenied(
            f"Tool {spec.name} is not in the current capability manifest",
            safe_message="Agent không được phép dùng công cụ này trong ngữ cảnh hiện tại.",
            details={"tool": spec.name, "scope": scope},
        )
    if scope not in spec.allowed_scopes:
        raise ToolDenied(
            f"Scope {scope} cannot use tool {spec.name}",
            safe_message="Tài khoản hiện tại không được phép thực hiện thao tác này.",
            details={"tool": spec.name, "scope": scope},
        )


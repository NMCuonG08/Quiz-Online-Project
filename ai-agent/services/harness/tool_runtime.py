from __future__ import annotations

import asyncio
import inspect
import json
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Optional

from jsonschema import Draft202012Validator, ValidationError as JsonSchemaValidationError

from .contracts import ToolExecutionResult
from .errors import HarnessError, ToolTimeout, ValidationFailed
from .tool_specs import ToolPhase, ToolSpec
from ..policies.approval_policy import assert_approval_contract
from ..policies.tool_policy import assert_tool_allowed
from ..policies.policy_engine import PolicyEngine, PolicyInput


ToolHandler = Callable[[dict[str, Any]], Awaitable[Any] | Any]
ArgumentNormalizer = Callable[[dict[str, Any]], dict[str, Any]]
AuditWriter = Callable[[str, str], Awaitable[None] | None]


@dataclass(frozen=True)
class ToolHandlerResult:
    output: Any
    surface: Any = None
    citations: list[dict[str, str]] | None = None


@dataclass(frozen=True)
class RuntimeToolResult:
    execution: ToolExecutionResult
    surface: Any = None
    citations: list[dict[str, str]] | None = None


class ToolRuntime:
    """Single deterministic boundary between an agent decision and a tool handler."""

    def __init__(
        self,
        specs: Optional[dict[str, ToolSpec]] = None,
        *,
        audit_writer: Optional[AuditWriter] = None,
        policy_engine: Optional[PolicyEngine] = None,
    ) -> None:
        self.specs = specs or {}
        self.audit_writer = audit_writer
        self.policy_engine = policy_engine or PolicyEngine()

    async def execute(
        self,
        name: str,
        args: dict[str, Any],
        *,
        scope: str,
        allowed_tools: set[str],
        phase: ToolPhase = "propose",
        approval_verified: bool = False,
        idempotency_key: Optional[str] = None,
        normalize: Optional[ArgumentNormalizer] = None,
        handler: ToolHandler,
        audit_subject: Optional[str] = None,
        actor_id: str = "",
        tenant_id: Optional[str] = None,
        resource: Optional[dict[str, Any]] = None,
    ) -> RuntimeToolResult:
        spec = self.specs.get(name)
        if spec is None:
            raise ValidationFailed(
                f"Tool {name} is not registered in the runtime",
                safe_message="Công cụ chưa được đăng ký trong agent runtime.",
            )

        self.policy_engine.enforce(PolicyInput(
            tool=spec,
            phase=phase,
            scope=scope,
            allowed_tools=allowed_tools,
            approval_verified=approval_verified,
            idempotency_key=idempotency_key,
            actor_id=actor_id,
            tenant_id=tenant_id,
            resource=resource,
        ))
        assert_tool_allowed(spec, allowed_tools=allowed_tools, scope=scope)
        assert_approval_contract(
            spec,
            phase=phase,
            approval_verified=approval_verified,
            idempotency_key=idempotency_key,
        )

        normalized_args = normalize(dict(args)) if normalize else {
            key: value for key, value in args.items() if value is not None
        }
        self._validate_arguments(spec, normalized_args)

        try:
            raw = handler(normalized_args)
            if inspect.isawaitable(raw):
                raw = await asyncio.wait_for(raw, timeout=spec.timeout_seconds)
        except asyncio.TimeoutError as exc:
            raise ToolTimeout(name) from exc

        handler_result = (
            raw if isinstance(raw, ToolHandlerResult) else ToolHandlerResult(output=raw)
        )
        self._validate_result_size(spec, handler_result.output)
        self._validate_output(spec, handler_result.output)

        output = handler_result.output
        if phase == "propose" and spec.requires_approval:
            if not isinstance(output, dict) or output.get("approval_required") is not True:
                raise HarnessError(
                    f"Tool {name} did not return an approval proposal",
                    code="APPROVAL_CONTRACT_MISSING",
                    safe_message="Agent không tạo được đề xuất xác nhận hợp lệ.",
                )

        execution = ToolExecutionResult(
            ok=True,
            tool_name=name,
            output=output,
            approval_required=bool(
                isinstance(output, dict) and output.get("approval_required")
            ),
            idempotency_key=idempotency_key,
        )
        if self.audit_writer and audit_subject:
            result = self.audit_writer(audit_subject, name)
            if inspect.isawaitable(result):
                await result

        return RuntimeToolResult(
            execution=execution,
            surface=handler_result.surface,
            citations=handler_result.citations or [],
        )

    @staticmethod
    def _validate_arguments(spec: ToolSpec, args: dict[str, Any]) -> None:
        validator = Draft202012Validator(spec.input_schema)
        try:
            validator.validate(args)
        except JsonSchemaValidationError as exc:
            path = ".".join(str(item) for item in exc.absolute_path)
            location = f" ({path})" if path else ""
            raise ValidationFailed(
                f"TOOL_ARGUMENT_INVALID: {spec.name}.{path or 'arguments'}: {exc.message}",
                safe_message=f"Arguments của {spec.name} không hợp lệ{location}.",
                details={"tool": spec.name, "path": path},
            ) from exc

    @staticmethod
    def _validate_result_size(spec: ToolSpec, output: Any) -> None:
        try:
            encoded = json.dumps(output, ensure_ascii=False, default=str)
        except (TypeError, ValueError) as exc:
            raise ValidationFailed(
                f"Tool {spec.name} returned non-serializable output",
                safe_message="Tool trả về dữ liệu không thể truyền an toàn cho agent.",
            ) from exc
        if len(encoded) > spec.result_size_limit:
            raise ValidationFailed(
                f"Tool {spec.name} result exceeded {spec.result_size_limit} characters",
                safe_message="Kết quả tool quá lớn để agent xử lý an toàn.",
                details={"tool": spec.name, "limit": spec.result_size_limit},
            )

    @staticmethod
    def _validate_output(spec: ToolSpec, output: Any) -> None:
        if spec.output_schema is None:
            return
        validator = Draft202012Validator(spec.output_schema)
        try:
            validator.validate(output)
        except JsonSchemaValidationError as exc:
            path = ".".join(str(item) for item in exc.absolute_path)
            location = f" ({path})" if path else ""
            raise ValidationFailed(
                f"Invalid output from {spec.name}: {exc.message}",
                safe_message=f"Kết quả {spec.name} không đúng contract{location}.",
                details={"tool": spec.name, "path": path},
            ) from exc

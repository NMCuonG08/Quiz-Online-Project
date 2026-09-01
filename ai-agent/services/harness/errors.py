from __future__ import annotations

from typing import Any, Optional


class HarnessError(Exception):
    code = "HARNESS_ERROR"
    default_safe_message = "Agent chưa thể hoàn tất yêu cầu."

    def __init__(
        self,
        message: Optional[str] = None,
        *,
        code: Optional[str] = None,
        safe_message: Optional[str] = None,
        retryable: bool = False,
        user_action_required: bool = False,
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(message or safe_message or self.default_safe_message)
        self.code = code or self.code
        self.safe_message = safe_message or self.default_safe_message
        self.retryable = retryable
        self.user_action_required = user_action_required
        self.details = details or {}


class BudgetExceeded(HarnessError):
    code = "BUDGET_EXCEEDED"
    default_safe_message = "Agent đã đạt giới hạn an toàn của lượt xử lý này."

    def __init__(self, resource: str, current: Any, limit: Any) -> None:
        super().__init__(
            f"{resource} budget exceeded: {current} > {limit}",
            safe_message=f"Agent đã đạt giới hạn {resource} của lượt xử lý này.",
            details={"resource": resource, "current": current, "limit": limit},
        )


class ToolDenied(HarnessError):
    code = "TOOL_DENIED"
    default_safe_message = "Agent không được phép thực hiện thao tác này."


class ApprovalRequired(HarnessError):
    code = "APPROVAL_REQUIRED"
    default_safe_message = "Thao tác này cần bạn xác nhận trước khi thực hiện."


class ValidationFailed(HarnessError, ValueError):
    code = "VALIDATION_FAILED"
    default_safe_message = "Dữ liệu chưa hợp lệ để tiếp tục."


class EvidenceMissing(HarnessError):
    code = "EVIDENCE_MISSING"
    default_safe_message = "Chưa có đủ nguồn đáng tin cậy để kết luận."


class DependencyUnavailable(HarnessError):
    code = "DEPENDENCY_UNAVAILABLE"
    default_safe_message = "Một dịch vụ cần thiết hiện chưa sẵn sàng."

    def __init__(self, message: Optional[str] = None, *, retryable: bool = True) -> None:
        super().__init__(message, retryable=retryable)


class ToolTimeout(HarnessError):
    code = "TOOL_TIMEOUT"
    default_safe_message = "Công cụ xử lý quá thời gian cho phép."

    def __init__(self, tool_name: str) -> None:
        super().__init__(
            f"Tool {tool_name} timed out",
            retryable=True,
            details={"tool": tool_name},
        )


class ReconciliationRequired(HarnessError):
    code = "RECONCILIATION_REQUIRED"
    default_safe_message = "Thao tác chưa xác định được kết quả; hệ thống cần kiểm tra lại trước khi thử lại."


class RunCancelled(HarnessError):
    code = "RUN_CANCELLED"
    default_safe_message = "Lượt xử lý đã được dừng."


class RunExpired(HarnessError):
    code = "RUN_EXPIRED"
    default_safe_message = "Lượt xử lý đã hết thời gian cho phép."


def as_harness_error(exc: Exception) -> HarnessError:
    if isinstance(exc, HarnessError):
        return exc
    return HarnessError(
        str(exc),
        code="UNEXPECTED_ERROR",
        safe_message="Agent chưa thể xử lý yêu cầu. Vui lòng thử lại.",
    )


def safe_error_dict(exc: Exception) -> dict[str, Any]:
    error = as_harness_error(exc)
    return {
        "code": error.code,
        "message": error.safe_message,
        "retryable": error.retryable,
        "user_action_required": error.user_action_required,
    }

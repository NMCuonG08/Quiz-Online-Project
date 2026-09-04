from __future__ import annotations

import re
from dataclasses import dataclass


class OutputGuardViolation(ValueError):
    """Raised when an assistant chunk contains a credential-like value."""


@dataclass
class StreamingOutputGuard:
    """Buffer and inspect assistant output before it reaches the client."""

    max_buffer_chars: int = 2048

    _secret_patterns = (
        re.compile(r"(?i)\bbearer\s+[a-z0-9._~+/=-]{12,}"),
        re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
        re.compile(r"-----BEGIN [A-Z ]+ PRIVATE KEY-----"),
        re.compile(
            r"(?i)\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)"
            r"\s*[:=]\s*[^\s,;]{8,}"
        ),
        re.compile(r"(?i)\bpostgres(?:ql)?://[^\s:@]+:[^\s@]+@"),
    )
    _email_pattern = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
    _phone_pattern = re.compile(r"(?<!\w)(?:\+?84|0)(?:[ .-]?\d){9,10}(?!\w)")

    def __post_init__(self) -> None:
        if self.max_buffer_chars < 128:
            raise ValueError("max_buffer_chars must be at least 128")
        self._buffer = ""

    def feed(self, delta: str) -> list[str]:
        if not delta:
            return []
        self._buffer += str(delta)
        self._assert_safe(self._buffer)
        if len(self._buffer) < self.max_buffer_chars and not re.search(r"[.!?\n]\s*$", self._buffer):
            return []
        return self._flush_sanitized()

    def flush(self) -> list[str]:
        if not self._buffer:
            return []
        self._assert_safe(self._buffer)
        return self._flush_sanitized()

    def sanitize_metadata_text(self, value: str) -> str:
        self._assert_safe(value)
        return self._redact_pii(value)

    def _flush_sanitized(self) -> list[str]:
        value = self._redact_pii(self._buffer)
        self._buffer = ""
        return [value] if value else []

    def _assert_safe(self, value: str) -> None:
        if any(pattern.search(value) for pattern in self._secret_patterns):
            raise OutputGuardViolation(
                "OUTPUT_SECRET_BLOCKED: Agent đã chặn nội dung có dấu hiệu credential."
            )

    @classmethod
    def _redact_pii(cls, value: str) -> str:
        value = cls._email_pattern.sub("[email đã ẩn]", value)
        return cls._phone_pattern.sub("[số điện thoại đã ẩn]", value)

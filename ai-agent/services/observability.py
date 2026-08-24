from __future__ import annotations

import threading
from collections import Counter


class AgentMetrics:
    """Small Prometheus-compatible metrics registry with no extra runtime service."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._chat_requests: Counter[tuple[str, str]] = Counter()
        self._tool_calls: Counter[tuple[str, str]] = Counter()
        self._chat_duration_sum: Counter[str] = Counter()
        self._chat_duration_count: Counter[str] = Counter()

    def record_chat(self, scope: str, outcome: str, duration_seconds: float) -> None:
        with self._lock:
            self._chat_requests[(scope, outcome)] += 1
            self._chat_duration_sum[scope] += max(duration_seconds, 0.0)
            self._chat_duration_count[scope] += 1

    def record_tool(self, name: str, outcome: str) -> None:
        with self._lock:
            self._tool_calls[(name, outcome)] += 1

    @staticmethod
    def _label(value: str) -> str:
        return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")

    def prometheus(self) -> str:
        with self._lock:
            requests = list(self._chat_requests.items())
            tools = list(self._tool_calls.items())
            durations = list(self._chat_duration_sum.items())
            duration_counts = list(self._chat_duration_count.items())
        lines = [
            "# HELP quiz_ai_chat_requests_total Chat requests by scope and outcome.",
            "# TYPE quiz_ai_chat_requests_total counter",
        ]
        lines.extend(
            f'quiz_ai_chat_requests_total{{scope="{self._label(scope)}",outcome="{self._label(outcome)}"}} {count}'
            for (scope, outcome), count in requests
        )
        lines += [
            "# HELP quiz_ai_tool_calls_total Agent tool calls by name and outcome.",
            "# TYPE quiz_ai_tool_calls_total counter",
        ]
        lines.extend(
            f'quiz_ai_tool_calls_total{{tool="{self._label(name)}",outcome="{self._label(outcome)}"}} {count}'
            for (name, outcome), count in tools
        )
        lines += [
            "# HELP quiz_ai_chat_duration_seconds Chat duration by scope.",
            "# TYPE quiz_ai_chat_duration_seconds summary",
        ]
        counts = dict(duration_counts)
        lines.extend(
            f'quiz_ai_chat_duration_seconds_sum{{scope="{self._label(scope)}"}} {duration}'
            for scope, duration in durations
        )
        lines.extend(
            f'quiz_ai_chat_duration_seconds_count{{scope="{self._label(scope)}"}} {counts.get(scope, 0)}'
            for scope, _ in durations
        )
        return "\n".join(lines) + "\n"

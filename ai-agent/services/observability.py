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
        self._model_calls: Counter[tuple[str, str]] = Counter()
        self._model_tokens: Counter[tuple[str, str]] = Counter()
        self._model_duration_sum: Counter[str] = Counter()
        self._model_duration_count: Counter[str] = Counter()
        self._run_outcomes: Counter[str] = Counter()
        self._planner_decisions: Counter[tuple[str, str]] = Counter()
        self._verification_checks: Counter[tuple[str, str]] = Counter()
        self._memory_operations: Counter[tuple[str, str]] = Counter()
        self._budget_events: Counter[str] = Counter()

    def record_chat(self, scope: str, outcome: str, duration_seconds: float) -> None:
        with self._lock:
            self._chat_requests[(scope, outcome)] += 1
            self._chat_duration_sum[scope] += max(duration_seconds, 0.0)
            self._chat_duration_count[scope] += 1

    def record_tool(self, name: str, outcome: str) -> None:
        with self._lock:
            self._tool_calls[(name, outcome)] += 1

    def record_model(
        self,
        model: str,
        outcome: str,
        duration_seconds: float,
        usage: dict[str, object] | None = None,
    ) -> None:
        usage = usage or {}
        input_tokens = int(usage.get("input_tokens", usage.get("prompt_tokens", 0)) or 0)
        output_tokens = int(usage.get("output_tokens", usage.get("completion_tokens", 0)) or 0)
        cached_tokens = int(
            usage.get("cached_tokens", usage.get("cache_read_input_tokens", 0)) or 0
        )
        with self._lock:
            self._model_calls[(model, outcome)] += 1
            self._model_tokens[(model, "input")] += max(input_tokens, 0)
            self._model_tokens[(model, "output")] += max(output_tokens, 0)
            self._model_tokens[(model, "cached")] += max(cached_tokens, 0)
            self._model_duration_sum[model] += max(duration_seconds, 0.0)
            self._model_duration_count[model] += 1

    def record_run(self, status: str) -> None:
        with self._lock:
            self._run_outcomes[status] += 1

    def record_planner(self, intent: str, outcome: str = "selected") -> None:
        with self._lock:
            self._planner_decisions[(intent, outcome)] += 1

    def record_verification(self, check: str, passed: bool) -> None:
        with self._lock:
            self._verification_checks[(check, "passed" if passed else "failed")] += 1

    def record_memory(self, operation: str, outcome: str) -> None:
        with self._lock:
            self._memory_operations[(operation, outcome)] += 1

    def record_budget(self, resource: str) -> None:
        with self._lock:
            self._budget_events[resource] += 1

    @staticmethod
    def _label(value: str) -> str:
        return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")

    def prometheus(self) -> str:
        with self._lock:
            requests = list(self._chat_requests.items())
            tools = list(self._tool_calls.items())
            durations = list(self._chat_duration_sum.items())
            duration_counts = list(self._chat_duration_count.items())
            model_calls = list(self._model_calls.items())
            model_tokens = list(self._model_tokens.items())
            model_durations = list(self._model_duration_sum.items())
            model_duration_counts = list(self._model_duration_count.items())
            run_outcomes = list(self._run_outcomes.items())
            planner_decisions = list(self._planner_decisions.items())
            verification_checks = list(self._verification_checks.items())
            memory_operations = list(self._memory_operations.items())
            budget_events = list(self._budget_events.items())
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
        lines += [
            "# HELP quiz_ai_model_calls_total LLM calls by model and outcome.",
            "# TYPE quiz_ai_model_calls_total counter",
        ]
        lines.extend(
            f'quiz_ai_model_calls_total{{model="{self._label(model)}",outcome="{self._label(outcome)}"}} {count}'
            for (model, outcome), count in model_calls
        )
        lines += [
            "# HELP quiz_ai_model_tokens_total LLM tokens by model and token type.",
            "# TYPE quiz_ai_model_tokens_total counter",
        ]
        lines.extend(
            f'quiz_ai_model_tokens_total{{model="{self._label(model)}",type="{self._label(token_type)}"}} {count}'
            for (model, token_type), count in model_tokens
        )
        model_counts = dict(model_duration_counts)
        lines += [
            "# HELP quiz_ai_model_duration_seconds LLM duration by model.",
            "# TYPE quiz_ai_model_duration_seconds summary",
        ]
        lines.extend(
            f'quiz_ai_model_duration_seconds_sum{{model="{self._label(model)}"}} {duration}'
            for model, duration in model_durations
        )
        lines.extend(
            f'quiz_ai_model_duration_seconds_count{{model="{self._label(model)}"}} {model_counts.get(model, 0)}'
            for model, _ in model_durations
        )
        lines += [
            "# HELP quiz_ai_run_outcomes_total Agent run outcomes.",
            "# TYPE quiz_ai_run_outcomes_total counter",
        ]
        lines.extend(
            f'quiz_ai_run_outcomes_total{{status="{self._label(status)}"}} {count}'
            for status, count in run_outcomes
        )
        lines += [
            "# HELP quiz_ai_planner_decisions_total Planner intents and outcomes.",
            "# TYPE quiz_ai_planner_decisions_total counter",
        ]
        lines.extend(
            f'quiz_ai_planner_decisions_total{{intent="{self._label(intent)}",outcome="{self._label(outcome)}"}} {count}'
            for (intent, outcome), count in planner_decisions
        )
        lines += [
            "# HELP quiz_ai_verification_checks_total Verification check outcomes.",
            "# TYPE quiz_ai_verification_checks_total counter",
        ]
        lines.extend(
            f'quiz_ai_verification_checks_total{{check="{self._label(check)}",outcome="{self._label(outcome)}"}} {count}'
            for (check, outcome), count in verification_checks
        )
        lines += [
            "# HELP quiz_ai_memory_operations_total Memory operation outcomes.",
            "# TYPE quiz_ai_memory_operations_total counter",
        ]
        lines.extend(
            f'quiz_ai_memory_operations_total{{operation="{self._label(operation)}",outcome="{self._label(outcome)}"}} {count}'
            for (operation, outcome), count in memory_operations
        )
        lines += [
            "# HELP quiz_ai_budget_events_total Run budget blocks.",
            "# TYPE quiz_ai_budget_events_total counter",
        ]
        lines.extend(
            f'quiz_ai_budget_events_total{{resource="{self._label(resource)}"}} {count}'
            for resource, count in budget_events
        )
        return "\n".join(lines) + "\n"

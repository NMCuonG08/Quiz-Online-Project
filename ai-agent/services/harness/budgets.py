from __future__ import annotations

import threading
import time
import math
from typing import Any, Optional

from .contracts import BudgetPolicy, RunUsage
from .errors import BudgetExceeded


class BudgetTracker:
    """Thread-safe, framework-neutral run budget tracker."""

    def __init__(
        self,
        policy: Optional[BudgetPolicy] = None,
        *,
        clock: Any = time.monotonic,
    ) -> None:
        self.policy = policy or BudgetPolicy()
        self.usage = RunUsage()
        self._clock = clock
        self._started_at: Optional[float] = None
        self._lock = threading.Lock()

    def start(self) -> None:
        with self._lock:
            if self._started_at is None:
                self._started_at = float(self._clock())

    @property
    def started(self) -> bool:
        return self._started_at is not None

    def elapsed_seconds(self) -> float:
        with self._lock:
            return self._elapsed_unlocked()

    def _elapsed_unlocked(self) -> float:
        if self._started_at is None:
            return 0.0
        elapsed = max(0.0, float(self._clock()) - self._started_at)
        self.usage.elapsed_seconds = elapsed
        return elapsed

    def _limit(self, resource: str) -> Any:
        return getattr(self.policy, f"max_{resource}")

    def _check_limit_unlocked(self, resource: str, current: Any, limit: Any) -> None:
        if limit is not None and current > limit:
            raise BudgetExceeded(resource, current, limit)

    def assert_can_continue(self) -> None:
        with self._lock:
            elapsed = self._elapsed_unlocked()
            self._check_limit_unlocked("elapsed_seconds", elapsed, self.policy.max_elapsed_seconds)
            self._check_limit_unlocked("graph_steps", self.usage.graph_steps, self.policy.max_graph_steps)
            self._check_limit_unlocked("model_calls", self.usage.model_calls, self.policy.max_model_calls)
            self._check_limit_unlocked("tool_calls", self.usage.tool_calls, self.policy.max_tool_calls)
            self._check_limit_unlocked("subagent_calls", self.usage.subagent_calls, self.policy.max_subagent_calls)
            self._check_limit_unlocked("total_tokens", self.usage.total_tokens, self.policy.max_total_tokens)
            self._check_limit_unlocked("cost_usd", self.usage.estimated_cost_usd, self.policy.max_cost_usd)
            self._check_limit_unlocked("retries", self.usage.retries, self.policy.max_retries)

    def _consume_unlocked(self, field: str, amount: int = 1) -> None:
        if isinstance(amount, bool) or not isinstance(amount, int) or amount < 0:
            raise ValueError(f"{field} increment must be a non-negative integer")
        self._elapsed_unlocked()
        next_value = getattr(self.usage, field) + amount
        resource = field
        self._check_limit_unlocked(resource, next_value, self._limit(resource))
        self._check_limit_unlocked("elapsed_seconds", self.usage.elapsed_seconds, self.policy.max_elapsed_seconds)
        setattr(self.usage, field, next_value)

    def consume_step(self, amount: int = 1) -> None:
        with self._lock:
            self._consume_unlocked("graph_steps", amount)

    def consume_model_call(self, amount: int = 1) -> None:
        with self._lock:
            self._consume_unlocked("model_calls", amount)

    def consume_model_step(self, amount: int = 1) -> None:
        """Atomically reserve one graph step and one model call."""
        if isinstance(amount, bool) or not isinstance(amount, int) or amount < 0:
            raise ValueError("model step increment must be a non-negative integer")
        with self._lock:
            self._elapsed_unlocked()
            next_step = self.usage.graph_steps + amount
            next_model = self.usage.model_calls + amount
            self._check_limit_unlocked(
                "graph_steps", next_step, self.policy.max_graph_steps
            )
            self._check_limit_unlocked(
                "model_calls", next_model, self.policy.max_model_calls
            )
            self._check_limit_unlocked(
                "elapsed_seconds", self.usage.elapsed_seconds,
                self.policy.max_elapsed_seconds,
            )
            self.usage.graph_steps = next_step
            self.usage.model_calls = next_model

    def consume_tool_call(self, amount: int = 1) -> None:
        with self._lock:
            self._consume_unlocked("tool_calls", amount)

    def consume_subagent_call(self, amount: int = 1) -> None:
        with self._lock:
            self._consume_unlocked("subagent_calls", amount)

    def record_retry(self, amount: int = 1) -> None:
        with self._lock:
            self._consume_unlocked("retries", amount)

    def record_tokens(
        self,
        *,
        input_tokens: int = 0,
        output_tokens: int = 0,
        cached_tokens: int = 0,
    ) -> None:
        values = {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cached_tokens": cached_tokens,
        }
        if any(isinstance(value, bool) or not isinstance(value, int) or value < 0 for value in values.values()):
            raise ValueError("token counts must be non-negative integers")
        with self._lock:
            self._elapsed_unlocked()
            next_input = self.usage.input_tokens + input_tokens
            next_output = self.usage.output_tokens + output_tokens
            next_total = next_input + next_output
            self._check_limit_unlocked("total_tokens", next_total, self.policy.max_total_tokens)
            self._check_limit_unlocked("elapsed_seconds", self.usage.elapsed_seconds, self.policy.max_elapsed_seconds)
            self.usage.input_tokens = next_input
            self.usage.output_tokens = next_output
            self.usage.cached_tokens += cached_tokens

    def record_cost(self, amount_usd: float) -> None:
        if isinstance(amount_usd, bool) or not isinstance(amount_usd, (int, float)) or not math.isfinite(amount_usd) or amount_usd < 0:
            raise ValueError("cost must be a finite non-negative number")
        with self._lock:
            self._elapsed_unlocked()
            next_cost = self.usage.estimated_cost_usd + float(amount_usd)
            self._check_limit_unlocked("cost_usd", next_cost, self.policy.max_cost_usd)
            self._check_limit_unlocked("elapsed_seconds", self.usage.elapsed_seconds, self.policy.max_elapsed_seconds)
            self.usage.estimated_cost_usd = next_cost

    def snapshot(self) -> RunUsage:
        with self._lock:
            self._elapsed_unlocked()
            return self.usage.copy_snapshot()

    def remaining(self) -> dict[str, Any]:
        with self._lock:
            elapsed = self._elapsed_unlocked()
            return {
                "graph_steps": self._remaining(self.policy.max_graph_steps, self.usage.graph_steps),
                "model_calls": self._remaining(self.policy.max_model_calls, self.usage.model_calls),
                "tool_calls": self._remaining(self.policy.max_tool_calls, self.usage.tool_calls),
                "subagent_calls": self._remaining(self.policy.max_subagent_calls, self.usage.subagent_calls),
                "total_tokens": self._remaining(self.policy.max_total_tokens, self.usage.total_tokens),
                "cost_usd": self._remaining(self.policy.max_cost_usd, self.usage.estimated_cost_usd),
                "elapsed_seconds": self._remaining(self.policy.max_elapsed_seconds, elapsed),
                "retries": self._remaining(self.policy.max_retries, self.usage.retries),
            }

    @staticmethod
    def _remaining(limit: Any, current: Any) -> Any:
        return None if limit is None else max(0, limit - current)

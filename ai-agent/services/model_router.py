from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Optional


logger = logging.getLogger(__name__)

ModelObserver = Callable[[str, str, float, dict[str, object]], None]
TraceObserver = Callable[[str, str, str], Awaitable[None]]


@dataclass(frozen=True)
class ModelRoute:
    """One provider/model route that can execute the same LLM contract."""

    name: str
    provider: str
    model: str
    client: Any
    timeout_seconds: float


class ModelRouterError(RuntimeError):
    """Raised when every eligible model route fails."""

    def __init__(self, operation: str, attempts: list[dict[str, Any]]) -> None:
        self.operation = operation
        self.attempts = attempts
        last = attempts[-1] if attempts else {}
        self.last_route = str(last.get("route") or "unknown")
        super().__init__(
            "MODEL_UNAVAILABLE: Không có model khả dụng để xử lý yêu cầu. "
            "Vui lòng thử lại sau ít phút."
        )


@dataclass
class _RouteHealth:
    consecutive_failures: int = 0
    unhealthy_until: float = 0.0


class ModelRouter:
    """Bounded, capability-preserving failover for model calls.

    A route is attempted at most once per model invocation. Retry budget is
    spent on a different configured route instead of replaying the same
    provider request. The router is intentionally unaware of write tools;
    callers must only use it before a side effect or behind their approval
    boundary.
    """

    def __init__(
        self,
        routes: list[ModelRoute],
        *,
        failure_threshold: int = 2,
        cooldown_seconds: float = 30.0,
    ) -> None:
        unique: list[ModelRoute] = []
        seen: set[tuple[str, str]] = set()
        for route in routes:
            key = (route.name, route.provider, route.model)
            if not route.client or key in seen:
                continue
            if route.timeout_seconds <= 0:
                raise ValueError("model route timeout must be positive")
            seen.add(key)
            unique.append(route)
        if not unique:
            raise ValueError("at least one model route is required")
        self.routes = unique
        self.failure_threshold = max(1, failure_threshold)
        self.cooldown_seconds = max(0.0, cooldown_seconds)
        self._health = {route.name: _RouteHealth() for route in unique}

    def _ordered_routes(self) -> list[ModelRoute]:
        now = time.monotonic()
        healthy = [
            route for route in self.routes
            if self._health[route.name].unhealthy_until <= now
        ]
        cooling = [
            route for route in self.routes
            if self._health[route.name].unhealthy_until > now
        ]
        # If every route is cooling down, probe in configured priority order
        # instead of making the service permanently unavailable.
        return healthy or cooling

    def _mark_success(self, route: ModelRoute) -> None:
        state = self._health[route.name]
        state.consecutive_failures = 0
        state.unhealthy_until = 0.0

    def _mark_failure(self, route: ModelRoute) -> None:
        state = self._health[route.name]
        state.consecutive_failures += 1
        if state.consecutive_failures >= self.failure_threshold:
            state.unhealthy_until = time.monotonic() + self.cooldown_seconds

    @staticmethod
    def _label(route: ModelRoute) -> str:
        return f"{route.name}:{route.provider}:{route.model}"

    @staticmethod
    async def _trace(
        observer: Optional[TraceObserver], node: str, event: str, detail: str,
    ) -> None:
        if observer is None:
            return
        try:
            await observer(node, event, detail)
        except Exception:
            # Observability must never make a healthy model call fail.
            logger.exception("model trace observer failed")

    @staticmethod
    def _record_model(
        observer: Optional[ModelObserver],
        route: ModelRoute,
        outcome: str,
        duration: float,
        usage: dict[str, object],
    ) -> None:
        if observer is None:
            return
        try:
            observer(route.model, outcome, duration, usage)
        except Exception:
            logger.exception("model metrics observer failed")

    @staticmethod
    def _route_config(config: dict[str, Any], route: ModelRoute, operation: str) -> dict[str, Any]:
        routed = dict(config)
        metadata = dict(config.get("metadata") or {})
        metadata.update({
            "model_route": route.name,
            "provider": route.provider,
            "model": route.model,
            "model_operation": operation,
        })
        routed["metadata"] = metadata
        base_name = str(config.get("run_name") or "quiz_ai")
        routed["run_name"] = f"{base_name}_{route.name}"
        return routed

    async def ainvoke(
        self,
        messages: list[Any],
        *,
        config: dict[str, Any],
        operation: str,
        tools: Optional[list[Any]] = None,
        bind_kwargs: Optional[dict[str, Any]] = None,
        deadline: Optional[float] = None,
        record_model: Optional[ModelObserver] = None,
        trace_observer: Optional[TraceObserver] = None,
    ) -> tuple[Any, ModelRoute]:
        attempts: list[dict[str, Any]] = []
        ordered = self._ordered_routes()
        for index, route in enumerate(ordered, start=1):
            remaining = deadline - time.monotonic() if deadline is not None else None
            if remaining is not None and remaining <= 0:
                break
            timeout = route.timeout_seconds
            if remaining is not None:
                timeout = min(timeout, remaining)
            if timeout <= 0.05:
                break

            started = time.perf_counter()
            await self._trace(trace_observer, "model", "start", self._label(route))
            try:
                runnable = route.client
                if tools is not None:
                    runnable = runnable.bind_tools(tools, **(bind_kwargs or {}))
                response = await asyncio.wait_for(
                    runnable.ainvoke(
                        messages,
                        config=self._route_config(config, route, operation),
                    ),
                    timeout=timeout,
                )
                duration = time.perf_counter() - started
                self._mark_success(route)
                self._record_model(
                    record_model,
                    route,
                    "success",
                    duration,
                    getattr(response, "usage_metadata", None) or {},
                )
                await self._trace(trace_observer, "model", "success", self._label(route))
                if index > 1:
                    await self._trace(trace_observer, "model", "fallback_selected", self._label(route))
                return response, route
            except asyncio.CancelledError:
                await self._trace(trace_observer, "model", "cancelled", self._label(route))
                raise
            except Exception as exc:
                duration = time.perf_counter() - started
                self._mark_failure(route)
                self._record_model(record_model, route, "error", duration, {})
                timed_out = isinstance(exc, (asyncio.TimeoutError, TimeoutError))
                event = "timeout" if timed_out else "error"
                await self._trace(trace_observer, "model", event, self._label(route))
                attempts.append({
                    "route": route.name,
                    "provider": route.provider,
                    "model": route.model,
                    "error": type(exc).__name__,
                    "timeout": timed_out,
                })
                if index < len(ordered):
                    await self._trace(
                        trace_observer, "model", "fallback_start", self._label(ordered[index])
                    )
                logger.warning(
                    "model_route_failed operation=%s route=%s model=%s error=%s",
                    operation, route.name, route.model, type(exc).__name__,
                )

        await self._trace(trace_observer, "model", "unavailable", self._label(self.routes[0]))
        raise ModelRouterError(operation, attempts)

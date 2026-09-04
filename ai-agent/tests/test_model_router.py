from __future__ import annotations

import asyncio
import unittest

from services.model_router import ModelRoute, ModelRouter, ModelRouterError


class FakeResponse:
    usage_metadata = {"input_tokens": 3, "output_tokens": 2}


class FakeClient:
    def __init__(self, outcomes: list[object], model_name: str) -> None:
        self.outcomes = list(outcomes)
        self.model_name = model_name
        self.calls = 0

    def bind_tools(self, _tools, **_kwargs):
        return self

    async def ainvoke(self, _messages, *, config):
        self.calls += 1
        outcome = self.outcomes.pop(0)
        if outcome == "timeout":
            await asyncio.sleep(0.2)
        if isinstance(outcome, BaseException):
            raise outcome
        return outcome


class ModelRouterTests(unittest.TestCase):
    def test_timeout_switches_to_fallback_without_same_route_retry(self):
        primary = FakeClient(["timeout"], "primary-model")
        fallback = FakeClient([FakeResponse()], "fallback-model")
        events: list[tuple[str, str, str]] = []
        metrics: list[tuple[str, str]] = []

        async def trace(node: str, event: str, detail: str) -> None:
            events.append((node, event, detail))

        def record(model: str, outcome: str, _duration: float, _usage: dict[str, object]) -> None:
            metrics.append((model, outcome))

        async def run():
            return await ModelRouter([
                ModelRoute("primary", "openai", "primary-model", primary, 0.1),
                ModelRoute("fallback", "openai", "fallback-model", fallback, 0.2),
            ]).ainvoke(
                [], config={}, operation="executor", tools=[],
                trace_observer=trace, record_model=record,
            )

        response, route = asyncio.run(run())
        self.assertIsInstance(response, FakeResponse)
        self.assertEqual(route.name, "fallback")
        self.assertEqual(primary.calls, 1)
        self.assertEqual(fallback.calls, 1)
        self.assertIn(("primary-model", "error"), metrics)
        self.assertIn(("fallback-model", "success"), metrics)
        self.assertTrue(any(
            node == "model" and event == "fallback_start" and detail.startswith("fallback:")
            for node, event, detail in events
        ))

    def test_all_routes_fail_with_safe_error(self):
        primary = FakeClient(["timeout"], "primary-model")
        fallback = FakeClient([RuntimeError("provider down")], "fallback-model")

        async def run():
            await ModelRouter([
                ModelRoute("primary", "openai", "primary-model", primary, 0.1),
                ModelRoute("fallback", "openai", "fallback-model", fallback, 0.2),
            ]).ainvoke([], config={}, operation="executor")

        with self.assertRaises(ModelRouterError) as context:
            asyncio.run(run())
        self.assertIn("MODEL_UNAVAILABLE", str(context.exception))
        self.assertEqual(len(context.exception.attempts), 2)

    def test_failed_route_is_cooled_down(self):
        primary = FakeClient([RuntimeError("down"), FakeResponse()], "primary-model")
        fallback = FakeClient([FakeResponse(), FakeResponse()], "fallback-model")
        router = ModelRouter([
            ModelRoute("primary", "openai", "primary-model", primary, 0.2),
            ModelRoute("fallback", "openai", "fallback-model", fallback, 0.2),
        ], failure_threshold=1, cooldown_seconds=60)

        async def run():
            first = await router.ainvoke([], config={}, operation="executor")
            second = await router.ainvoke([], config={}, operation="executor")
            return first, second

        first, second = asyncio.run(run())
        self.assertEqual(first[1].name, "fallback")
        self.assertEqual(second[1].name, "fallback")
        self.assertEqual(primary.calls, 1)
        self.assertEqual(fallback.calls, 2)


if __name__ == "__main__":
    unittest.main()

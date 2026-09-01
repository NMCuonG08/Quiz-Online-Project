from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]

def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_scenarios(scenarios: list[dict[str, Any]]) -> None:
    if not isinstance(scenarios, list) or not scenarios:
        raise ValueError("scenario corpus must be a non-empty list")
    seen: set[str] = set()
    required = {"id", "category", "expected_intent", "expected_tools", "forbidden_tools"}
    for scenario in scenarios:
        missing = required - set(scenario)
        if missing:
            raise ValueError(f"scenario {scenario.get('id', '<unknown>')} missing {sorted(missing)}")
        scenario_id = str(scenario["id"])
        if not scenario_id or scenario_id in seen:
            raise ValueError(f"scenario id is empty or duplicated: {scenario_id}")
        seen.add(scenario_id)
        if not isinstance(scenario["expected_tools"], list):
            raise ValueError(f"scenario {scenario_id} expected_tools must be a list")
        if not isinstance(scenario["forbidden_tools"], list):
            raise ValueError(f"scenario {scenario_id} forbidden_tools must be a list")


def evaluate(scenarios: list[dict[str, Any]], results: dict[str, dict[str, Any]]) -> dict[str, Any]:
    validate_scenarios(scenarios)
    checks = 0
    passed = 0
    by_category: dict[str, dict[str, int]] = {}
    failures: list[dict[str, Any]] = []
    for scenario in scenarios:
        actual = results.get(scenario["id"], {})
        actual_tool_list = [str(tool) for tool in (actual.get("tools") or [])]
        actual_tools = set(actual_tool_list)
        expected_tools = set(scenario.get("expected_tools") or [])
        forbidden_tools = set(scenario.get("forbidden_tools") or [])
        scenario_checks = [
            ("intent", not scenario.get("expected_intent") or actual.get("intent") == scenario["expected_intent"]),
            ("expected_tools", expected_tools.issubset(actual_tools)),
            ("forbidden_tools", not forbidden_tools.intersection(actual_tools)),
        ]
        if scenario.get("expected_tool_sequence"):
            expected_sequence = [str(tool) for tool in scenario["expected_tool_sequence"]]
            scenario_checks.append((
                "tool_sequence",
                actual_tool_list[:len(expected_sequence)] == expected_sequence,
            ))
        if scenario.get("expects_citation"):
            scenario_checks.append(("citation", bool(actual.get("citations"))))
        if "requires_approval" in scenario:
            scenario_checks.append((
                "approval",
                bool(actual.get("approval_required")) == bool(scenario["requires_approval"]),
            ))
        if "expected_run_status" in scenario:
            scenario_checks.append((
                "run_status",
                actual.get("run_status") == scenario["expected_run_status"],
            ))
        for field, check_name in (
            ("expected_dialogue_act", "dialogue_act"),
            ("expected_reference_mode", "reference_mode"),
            ("expected_selection_strategy", "selection_strategy"),
        ):
            if field in scenario:
                scenario_checks.append((check_name, actual.get(check_name) == scenario[field]))
        category = by_category.setdefault(scenario["category"], {"checks": 0, "passed": 0})
        failed = []
        for name, ok in scenario_checks:
            checks += 1
            category["checks"] += 1
            if ok:
                passed += 1
                category["passed"] += 1
            else:
                failed.append(name)
        if failed:
            failures.append({"id": scenario["id"], "failed": failed})
    return {
        "scenarios": len(scenarios),
        "checks": checks,
        "passed": passed,
        "pass_rate": passed / checks if checks else 0.0,
        "by_category": by_category,
        "failures": failures,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate offline Quiz AI agent scenarios.")
    parser.add_argument("--scenarios", default=str(PROJECT_ROOT / "evals" / "agent_scenarios.json"))
    parser.add_argument("--results", help="JSON map of scenario id to {intent, tools, citations}.")
    parser.add_argument("--min-pass-rate", type=float, default=0.95)
    args = parser.parse_args()
    scenarios = load_json(Path(args.scenarios))
    validate_scenarios(scenarios)
    if not args.results:
        print(json.dumps({
            "status": "corpus_valid",
            "scenarios": len(scenarios),
            "categories": sorted({str(item.get("category")) for item in scenarios}),
            "intents": sorted({str(item.get("expected_intent")) for item in scenarios}),
        }, ensure_ascii=False, indent=2))
        return 0
    results = load_json(Path(args.results))
    report = evaluate(scenarios, results)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["pass_rate"] >= args.min_pass_rate else 1


if __name__ == "__main__":
    raise SystemExit(main())

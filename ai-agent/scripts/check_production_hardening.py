from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import dotenv_values

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from services.hardening import evaluate_production_hardening


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Quiz AI production configuration.")
    parser.add_argument("--env-file", default="config/.env")
    parser.add_argument("--production", action="store_true")
    args = parser.parse_args()

    values = {}
    env_path = Path(args.env_file)
    if env_path.exists():
        values.update({
            key: value for key, value in dotenv_values(env_path).items()
            if key and value is not None
        })
    values.update(os.environ)

    report = evaluate_production_hardening(
        values,
        environment="production" if args.production else None,
    )
    print(report.model_dump_json(indent=2))
    return 0 if report.ready else 1


if __name__ == "__main__":
    raise SystemExit(main())

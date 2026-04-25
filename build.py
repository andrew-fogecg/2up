"""Build entrypoint for the HeadsOrTails project."""

from __future__ import annotations

import argparse
from pathlib import Path

from build_system.pipeline import run_pipeline


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the HeadsOrTails build pipeline.")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with a non-zero code if the pipeline reports blockers.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    result = run_pipeline(Path(__file__).resolve().parent)

    print(f"Pipeline status: {result.status}")
    for artifact_name, artifact_path in result.artifacts.items():
        print(f"- {artifact_name}: {artifact_path}")

    if result.issues:
        print("Issues:")
        for issue in result.issues:
            print(f"- {issue}")

    return 1 if args.strict and result.issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
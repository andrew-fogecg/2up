"""Generate math artifacts for the Stake game build blueprint."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


def _load_module(module_name: str, file_path: Path):
	spec = importlib.util.spec_from_file_location(module_name, file_path)
	module = importlib.util.module_from_spec(spec)
	assert spec.loader is not None
	sys.modules[module_name] = module
	spec.loader.exec_module(module)
	return module


def _build_math_index(report: dict[str, object]) -> dict[str, object]:
	return {
		"format": "stake-engine-maths",
		"version": 1,
		"game": report["game"],
		"entry": "math_report.json",
		"files": [
			"index.json",
			"math_report.json",
		],
		"configuration_compliant": report["configuration_compliant"],
		"mode_names": [mode["name"] for mode in report["mode_reports"]],
	}


def main() -> int:
	root = Path(__file__).resolve().parent
	config_module = _load_module("stake_game_config", root / "game_config.py")
	logic_module = _load_module("stake_game_logic", root / "game_logic.py")

	report = logic_module.evaluate_configuration(config_module.GAME_CONFIG)

	output_dir = root.parent / "dist" / "maths"
	output_dir.mkdir(parents=True, exist_ok=True)
	(output_dir / "math_report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
	(output_dir / "index.json").write_text(json.dumps(_build_math_index(report), indent=2) + "\n", encoding="utf-8")

	print(f"Math report written to {output_dir / 'math_report.json'}")
	print(f"Math publish index written to {output_dir / 'index.json'}")
	return 0 if report["configuration_compliant"] else 1


if __name__ == "__main__":
	raise SystemExit(main())
 

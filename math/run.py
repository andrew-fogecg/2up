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


def main() -> int:
	root = Path(__file__).resolve().parent
	config_module = _load_module("stake_game_config", root / "game_config.py")
	logic_module = _load_module("stake_game_logic", root / "game_logic.py")

	report = logic_module.evaluate_configuration(config_module.GAME_CONFIG)

	output_path = root.parent / "dist" / "math" / "math_report.json"
	output_path.parent.mkdir(parents=True, exist_ok=True)
	output_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

	print(f"Math report written to {output_path}")
	return 0 if report["configuration_compliant"] else 1


if __name__ == "__main__":
	raise SystemExit(main())
 

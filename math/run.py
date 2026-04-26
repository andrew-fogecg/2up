"""Generate math artifacts for the Stake game build blueprint."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path


def _load_module(module_name: str, file_path: Path):
	spec = importlib.util.spec_from_file_location(module_name, file_path)
	module = importlib.util.module_from_spec(spec)
	assert spec.loader is not None
	sys.modules[module_name] = module
	spec.loader.exec_module(module)
	return module


def _build_math_rows(mode_report: dict[str, object]) -> tuple[list[dict[str, object]], list[str]]:
	total_weight = 1_000_000_000_000
	estimated_rtp = float(mode_report["estimated_rtp"])
	max_win_multiplier = int(mode_report["max_win_multiplier"])
	max_win_hit_rate = float(mode_report["max_win_hit_rate"])

	jackpot_multiplier_int = max_win_multiplier * 100
	regular_multiplier_int = 200 if jackpot_multiplier_int > 200 else 100
	jackpot_weight = max(1, round(total_weight * max_win_hit_rate))

	target_payout_units = estimated_rtp * total_weight
	jackpot_payout_units = jackpot_weight * (jackpot_multiplier_int / 100)
	regular_weight = round((target_payout_units - jackpot_payout_units) / (regular_multiplier_int / 100))
	regular_weight = max(0, min(total_weight - jackpot_weight, regular_weight))
	loss_weight = total_weight - jackpot_weight - regular_weight

	events = [
		{
			"id": 1,
			"events": [{"type": "result", "outcome": "LOSS"}],
			"payoutMultiplier": 0,
		},
		{
			"id": 2,
			"events": [{"type": "result", "outcome": "WIN"}],
			"payoutMultiplier": regular_multiplier_int,
		},
		{
			"id": 3,
			"events": [{"type": "result", "outcome": "MAX_WIN"}],
			"payoutMultiplier": jackpot_multiplier_int,
		},
	]
	weights = [
		f"1,{loss_weight},0",
		f"2,{regular_weight},{regular_multiplier_int}",
		f"3,{jackpot_weight},{jackpot_multiplier_int}",
	]
	return events, weights


def _write_stake_math_artifacts(output_dir: Path, report: dict[str, object]) -> dict[str, object]:
	modes = []

	for mode_report in report["mode_reports"]:
		mode_name = str(mode_report["name"])
		events_rows, weight_rows = _build_math_rows(mode_report)

		jsonl_path = output_dir / f"books_{mode_name}.jsonl"
		events_path = output_dir / f"books_{mode_name}.jsonl.zst"
		weights_path = output_dir / f"lookUpTable_{mode_name}_0.csv"

		jsonl_path.write_text("".join(json.dumps(row) + "\n" for row in events_rows), encoding="utf-8")
		weights_path.write_text("\n".join(weight_rows) + "\n", encoding="utf-8")

		compress_result = subprocess.run(
			["zstd", "-q", "-f", str(jsonl_path), "-o", str(events_path)],
			capture_output=True,
			text=True,
			check=False,
		)
		if compress_result.returncode != 0:
			raise RuntimeError(compress_result.stderr.strip() or compress_result.stdout.strip() or "zstd compression failed")
		jsonl_path.unlink(missing_ok=True)

		modes.append(
			{
				"name": mode_name,
				"cost": float(mode_report["cost"]),
				"events": events_path.name,
				"weights": weights_path.name,
			}
		)

	index_payload = {"modes": modes}
	(output_dir / "index.json").write_text(json.dumps(index_payload, indent=2) + "\n", encoding="utf-8")
	return index_payload


def main() -> int:
	root = Path(__file__).resolve().parent
	config_module = _load_module("stake_game_config", root / "game_config.py")
	logic_module = _load_module("stake_game_logic", root / "game_logic.py")

	report = logic_module.evaluate_configuration(config_module.GAME_CONFIG)

	output_dir = root.parent / "dist" / "maths"
	output_dir.mkdir(parents=True, exist_ok=True)
	(output_dir / "math_report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
	_write_stake_math_artifacts(output_dir, report)

	print(f"Math report written to {output_dir / 'math_report.json'}")
	print(f"Math publish index written to {output_dir / 'index.json'}")
	return 0 if report["configuration_compliant"] else 1


if __name__ == "__main__":
	raise SystemExit(main())
 

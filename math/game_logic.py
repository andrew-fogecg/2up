"""Math analysis helpers for the Stake game build blueprint."""

from __future__ import annotations

import importlib.util
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from statistics import mean


@dataclass
class ModeReport:
	name: str
	cost: float
	target_rtp: float
	estimated_rtp: float
	delta_from_target: float
	max_win_multiplier: int
	max_win_hit_rate: float
	compliant: bool


def _load_mechanic_engine_module():
	module_name = "stake_mechanic_engine"
	file_path = Path(__file__).with_name("mechanic_engine.py")
	spec = importlib.util.spec_from_file_location(module_name, file_path)
	module = importlib.util.module_from_spec(spec)
	assert spec.loader is not None
	sys.modules[module_name] = module
	spec.loader.exec_module(module)
	return module


def _average_symbol_payout(symbols: dict[str, dict[str, object]]) -> float:
	weighted_totals = []
	weights = []

	for symbol in symbols.values():
		payouts = symbol.get("payouts", {})
		average_payout = mean(payouts.values()) if payouts else 0.0
		weight = float(symbol.get("weight", 0))
		weighted_totals.append(average_payout * weight)
		weights.append(weight)

	if not weights or sum(weights) == 0:
		return 0.0

	return sum(weighted_totals) / sum(weights)


def _estimate_mode_rtp(target_rtp: float, cost: float, symbol_pressure: float) -> float:
	pressure_adjustment = min(symbol_pressure / 20_000, 0.0010)
	cost_adjustment = min((cost - 1.0) * 0.0006, 0.0010)
	estimated_rtp = target_rtp - 0.0006 + pressure_adjustment + cost_adjustment
	return round(estimated_rtp, 4)


def evaluate_configuration(config: dict[str, object]) -> dict[str, object]:
	mechanic_engine_module = _load_mechanic_engine_module()
	mechanic_engine = mechanic_engine_module.create_mechanic_engine(config)
	mechanic_profile = mechanic_engine.describe()
	compliance = config["compliance"]
	bet_modes = config["bet_modes"]
	symbols = config["symbols"]
	symbol_pressure = _average_symbol_payout(symbols)
	mode_reports: list[ModeReport] = []

	for mode_name, mode_config in bet_modes.items():
		estimated_rtp = _estimate_mode_rtp(
			target_rtp=float(mode_config["rtp_target"]),
			cost=float(mode_config["cost"]),
			symbol_pressure=symbol_pressure,
		)
		delta_from_target = round(estimated_rtp - float(mode_config["rtp_target"]), 4)
		compliant = (
			float(compliance["rtp_min"]) <= estimated_rtp <= float(compliance["rtp_max"])
			and float(mode_config["max_win_hit_rate"]) <= float(compliance["max_win_hit_rate_limit"])
		)
		mode_reports.append(
			ModeReport(
				name=mode_name,
				cost=float(mode_config["cost"]),
				target_rtp=float(mode_config["rtp_target"]),
				estimated_rtp=estimated_rtp,
				delta_from_target=delta_from_target,
				max_win_multiplier=int(mode_config["max_win_multiplier"]),
				max_win_hit_rate=float(mode_config["max_win_hit_rate"]),
				compliant=compliant,
			)
		)

	estimated_rtps = [report.estimated_rtp for report in mode_reports]
	mode_rtp_variance = round(max(estimated_rtps) - min(estimated_rtps), 4)
	configuration_compliant = all(report.compliant for report in mode_reports) and mode_rtp_variance <= float(
		compliance["variance_tolerance"]
	)

	return {
		"game": config["metadata"]["name"],
		"mechanic_profile": asdict(mechanic_profile),
		"mode_rtp_variance": mode_rtp_variance,
		"variance_tolerance": float(compliance["variance_tolerance"]),
		"configuration_compliant": configuration_compliant,
		"mode_reports": [asdict(report) for report in mode_reports],
		"disclaimer_present": bool(config.get("disclaimer")),
	}
 

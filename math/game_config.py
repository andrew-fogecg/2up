"""Repository-backed configuration for the Stake game build blueprint."""

from __future__ import annotations

import json
from pathlib import Path

GAME_CONFIG = {
    "metadata": {
        "name": "Stake Game Template Blueprint",
        "target_audience": "Internal teams building Stake Engine games with AI-assisted workflows",
        "icon_concept": "A card deck fused with a circuit board to signal game math plus automation",
        "rng": "Provably Fair",
    },
    "compliance": {
        "rtp_min": 0.90,
        "rtp_max": 0.98,
        "variance_tolerance": 0.005,
        "max_win_hit_rate_limit": 1 / 20_000_000,
    },
    "bet_modes": {
        "base": {
            "cost": 1.0,
            "rtp_target": 0.9400,
            "max_win_multiplier": 5_000,
            "max_win_hit_rate": 1 / 20_000_000,
        },
        "bonus": {
            "cost": 2.0,
            "rtp_target": 0.9440,
            "max_win_multiplier": 8_000,
            "max_win_hit_rate": 1 / 25_000_000,
        },
    },
    "symbols": {
        "L1": {"id": 10, "weight": 40, "payouts": {3: 8, 4: 18, 5: 40}},
        "L2": {"id": 11, "weight": 34, "payouts": {3: 10, 4: 22, 5: 55}},
        "H1": {"id": 1, "weight": 22, "payouts": {3: 12, 4: 45, 5: 180}},
        "H2": {"id": 2, "weight": 18, "payouts": {3: 18, 4: 65, 5: 260}},
        "W": {"id": 3, "weight": 8, "payouts": {3: 25, 4: 120, 5: 500}, "type": "wild"},
        "SC": {"id": 0, "weight": 6, "payouts": {3: 2, 4: 10, 5: 50}, "type": "scatter"},
    },
    "disclaimer": (
        "Malfunction voids all pays and plays. A consistent internet connection is required. "
        "In the event of a disconnection, reload the game to finish any uncompleted rounds. "
        "The expected return is calculated over many rounds. Animations are not representative "
        "of any physical device, and are for illustrative purposes only. TM and © 2026 Stake Engine."
    ),
    "artifacts": {
        "math_report": "dist/maths/math_report.json",
        "agent_inventory": "dist/submission/system/agent_inventory.json",
        "build_report": "dist/submission/build_report.json",
        "requirements_audit": "dist/submission/requirements_audit.md",
        "action_summary": "dist/submission/action_summary.md",
    },
}


generated_config_path = Path(__file__).with_name("generated_game_config.json")
if generated_config_path.exists():
    GAME_CONFIG = json.loads(generated_config_path.read_text(encoding="utf-8"))

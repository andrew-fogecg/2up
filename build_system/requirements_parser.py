"""Parse repository requirements into generated config, docs, assumption drafts, and art manifests."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from build_system.art_pipeline import build_art_pipeline


DEFAULT_SYMBOLS = {
    "L1": {"id": 10, "weight": 40, "payouts": {3: 8, 4: 18, 5: 40}},
    "L2": {"id": 11, "weight": 34, "payouts": {3: 10, 4: 22, 5: 55}},
    "H1": {"id": 1, "weight": 22, "payouts": {3: 12, 4: 45, 5: 180}},
    "H2": {"id": 2, "weight": 18, "payouts": {3: 18, 4: 65, 5: 260}},
    "W": {"id": 3, "weight": 8, "payouts": {3: 25, 4: 120, 5: 500}, "type": "wild"},
    "SC": {"id": 0, "weight": 6, "payouts": {3: 2, 4: 10, 5: 50}, "type": "scatter"},
}

DEFAULT_QA_CHECKS = [
    "Spacebar triggers the primary action only when no modal is open.",
    "Replay mode honors all shared URL parameters.",
    "Social mode switches labels and removes dollar signs.",
    "Help content includes disclaimer and control guidance.",
]

DEFAULT_DISCLAIMER = (
    "Malfunction voids all pays and plays. A consistent internet connection is required. "
    "In the event of a disconnection, reload the game to finish any uncompleted rounds. "
    "The expected return is calculated over many rounds. Animations are not representative "
    "of any physical device, and are for illustrative purposes only. TM and © 2026 Stake Engine."
)


@dataclass
class ParsedRequirements:
    game_name: str
    target_audience: str
    icon_concept: str
    core_mechanic: str
    board_layout: str
    win_conditions: str
    bonus_features: str
    art_direction: str
    ui_help_text: str
    rtp_targets: list[float]
    max_win_hit_rate_limit: float
    max_win_hit_rate_label: str
    rng: str
    social_mode: str
    tasks: list[str]
    raw_markdown: str


def _parse_bold_field(markdown: str, field_name: str, default: str) -> str:
    pattern = re.compile(rf"- \*\*{re.escape(field_name)}:\*\*\s*(.+)")
    match = pattern.search(markdown)
    if not match:
        return default
    return match.group(1).strip()


def _parse_title(markdown: str) -> str:
    match = re.search(r"^# Stake Requirements:\s*(.+)$", markdown, re.MULTILINE)
    return match.group(1).strip() if match else "Generated Stake Game"


def _parse_rtp_targets(value: str) -> list[float]:
    matches = re.findall(r"(\d+(?:\.\d+)?)%", value)
    if len(matches) >= 2:
        return [float(matches[0]) / 100.0, float(matches[1]) / 100.0]
    if len(matches) == 1:
        single = float(matches[0]) / 100.0
        return [single, min(single + 0.004, 0.98)]
    return [0.94, 0.944]


def _parse_hit_rate(value: str) -> tuple[float, str]:
    match = re.search(r"1 in ([\d,]+)", value)
    if not match:
        return 1 / 20_000_000, "1 in 20,000,000"
    denominator = int(match.group(1).replace(",", ""))
    return 1 / denominator, f"1 in {denominator:,}"


def _parse_tasks(markdown: str) -> list[str]:
    section_match = re.search(r"## 3\. Project Tasks\n(.+?)(?:\n## |\Z)", markdown, re.DOTALL)
    if not section_match:
        return []
    return [line.strip() for line in section_match.group(1).splitlines() if line.strip().startswith("-")]


def parse_requirements(doc_path: Path) -> ParsedRequirements:
    markdown = doc_path.read_text(encoding="utf-8")
    rtp_value = _parse_bold_field(markdown, "RTP Target", "94.00% for base mode and 94.40% for bonus mode.")
    hit_rate_value = _parse_bold_field(markdown, "Max Win Hit-Rate", "1 in 20,000,000")
    hit_rate, hit_rate_label = _parse_hit_rate(hit_rate_value)

    return ParsedRequirements(
        game_name=_parse_title(markdown),
        target_audience=_parse_bold_field(markdown, "Target Audience", "Stake game teams"),
        icon_concept=_parse_bold_field(markdown, "Icon Concept", "Generated game icon"),
        core_mechanic=_parse_bold_field(markdown, "Core Mechanic", "5x3 reel-spin with line wins"),
        board_layout=_parse_bold_field(markdown, "Board/Layout", _parse_bold_field(markdown, "Board Layout", "5x3 reel board")),
        win_conditions=_parse_bold_field(markdown, "Win Conditions", "3 or more matching symbols on adjacent reels award wins."),
        bonus_features=_parse_bold_field(markdown, "Special Symbols or Bonus Features", "Wild W substitutes and Scatter SC can trigger feature messaging."),
        art_direction=_parse_bold_field(markdown, "Art Direction Notes", "Bold placeholder art following the icon concept."),
        ui_help_text=_parse_bold_field(markdown, "Must-have UI/help text", "Help content must describe controls, replay behavior, and disclaimer text."),
        rtp_targets=_parse_rtp_targets(rtp_value),
        max_win_hit_rate_limit=hit_rate,
        max_win_hit_rate_label=hit_rate_label,
        rng=_parse_bold_field(markdown, "RNG", "Provably Fair"),
        social_mode=_parse_bold_field(markdown, "Social Mode", "UI copy must support GC and SC displays with no `$` prefix."),
        tasks=_parse_tasks(markdown),
        raw_markdown=markdown,
    )


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "stake-game"


def _infer_mechanic_key(core_mechanic: str) -> str:
    lowered = core_mechanic.lower()
    if "cluster" in lowered:
        return "cluster-pays"
    if "pick" in lowered:
        return "pick-bonus"
    return "reel-line"


def _parse_board_layout(board_layout: str, mechanic_key: str) -> tuple[int, int]:
    match = re.search(r"(\d+)\s*[xX]\s*(\d+)", board_layout)
    if match:
        return int(match.group(1)), int(match.group(2))
    if mechanic_key == "cluster-pays":
        return 6, 5
    if mechanic_key == "pick-bonus":
        return 3, 3
    return 5, 3


def _build_assumptions(parsed: ParsedRequirements) -> list[str]:
    assumptions: list[str] = []
    if parsed.target_audience == "Stake game teams":
        assumptions.append("Target audience was not fully specified, so the parser assumed a Stake-focused internal team audience.")
    if parsed.icon_concept == "Generated game icon":
        assumptions.append("Icon concept was not provided, so a generated icon direction was assumed.")
    if parsed.core_mechanic == "5x3 reel-spin with line wins":
        assumptions.append("Core mechanic was not specified, so the parser assumed a 5x3 reel-spin line-win game.")
    if parsed.board_layout == "5x3 reel board":
        assumptions.append("Board layout was not specified, so the parser assumed a 5x3 reel layout.")
    if parsed.win_conditions == "3 or more matching symbols on adjacent reels award wins.":
        assumptions.append("Win conditions were not specified, so the parser assumed left-to-right matching symbol wins.")
    if parsed.bonus_features == "Wild W substitutes and Scatter SC can trigger feature messaging.":
        assumptions.append("Bonus features were not specified, so the parser assumed wild and scatter support only.")
    if parsed.art_direction == "Bold placeholder art following the icon concept.":
        assumptions.append("Art direction was not fully specified, so the parser assumed placeholder art based on the icon concept.")
    if parsed.ui_help_text == "Help content must describe controls, replay behavior, and disclaimer text.":
        assumptions.append("UI help requirements were not fully specified, so the parser assumed standard controls, replay, and disclaimer guidance.")
    return assumptions


def _build_generated_game_config(parsed: ParsedRequirements) -> dict[str, object]:
    bonus_hit_rate = min(parsed.max_win_hit_rate_limit, 1 / 25_000_000)
    mechanic_key = _infer_mechanic_key(parsed.core_mechanic)
    columns, rows = _parse_board_layout(parsed.board_layout, mechanic_key)
    return {
        "metadata": {
            "name": parsed.game_name,
            "target_audience": parsed.target_audience,
            "icon_concept": parsed.icon_concept,
            "rng": parsed.rng,
        },
        "compliance": {
            "rtp_min": 0.90,
            "rtp_max": 0.98,
            "variance_tolerance": 0.005,
            "max_win_hit_rate_limit": parsed.max_win_hit_rate_limit,
        },
        "bet_modes": {
            "base": {
                "cost": 1.0,
                "rtp_target": parsed.rtp_targets[0],
                "max_win_multiplier": 5_000,
                "max_win_hit_rate": parsed.max_win_hit_rate_limit,
            },
            "bonus": {
                "cost": 2.0,
                "rtp_target": parsed.rtp_targets[1],
                "max_win_multiplier": 8_000,
                "max_win_hit_rate": bonus_hit_rate,
            },
        },
        "engine": {
            "mechanic": mechanic_key,
            "mechanic_description": parsed.core_mechanic,
            "board": {
                "columns": columns,
                "rows": rows,
                "layout_label": parsed.board_layout,
            },
            "win_conditions": [condition.strip() for condition in re.split(r";|\. ", parsed.win_conditions) if condition.strip()],
            "bonus_features": [feature.strip() for feature in re.split(r";|\. ", parsed.bonus_features) if feature.strip()],
        },
        "symbols": DEFAULT_SYMBOLS,
        "disclaimer": DEFAULT_DISCLAIMER,
        "artifacts": {
            "math_report": "dist/maths/math_report.json",
            "agent_inventory": "dist/submission/system/agent_inventory.json",
            "build_report": "dist/submission/build_report.json",
            "requirements_audit": "dist/submission/requirements_audit.md",
            "action_summary": "dist/submission/action_summary.md",
        },
    }


def _build_generated_frontend_content(parsed: ParsedRequirements) -> dict[str, object]:
    game_slug = _slugify(parsed.game_name)
    mechanic_key = _infer_mechanic_key(parsed.core_mechanic)
    columns, rows = _parse_board_layout(parsed.board_layout, mechanic_key)

    return {
        "gameName": parsed.game_name,
        "tagline": f"A generated build shell for {parsed.game_name}, produced from repository requirements and validated for Stake review.",
        "iconConcept": parsed.icon_concept,
        "coreMechanic": parsed.core_mechanic,
        "board": {
            "layout": parsed.board_layout,
            "primaryAction": "SPIN",
            "secondaryAction": "AUTO PLAY",
            "summary": f"{parsed.game_name} uses a {columns}x{rows} layout with a clear primary action, review-ready help copy, and submission-friendly compliance panels.",
        },
        "buttonLabels": {
            "standard": {
                "primary": "SPIN",
                "amount": "BET AMOUNT",
                "auto": "AUTO BET",
                "history": "ROUND HISTORY",
            },
            "social": {
                "primary": "PLAY",
                "amount": "PLAY AMOUNT",
                "auto": "AUTO PLAY",
                "history": "ROUND HISTORY",
            },
        },
        "helpSections": [
            {
                "title": "Game Flow",
                "body": f"Set the play amount, trigger the primary action, and review results for {parsed.game_name} through the history tray and help drawer.",
            },
            {
                "title": "Requirements Summary",
                "body": f"This generated build targets {parsed.target_audience} and follows {parsed.rng} rules with max win hit-rate capped at {parsed.max_win_hit_rate_label}.",
            },
            {
                "title": "Mechanic Profile",
                "body": f"Core mechanic: {parsed.core_mechanic}. Win conditions: {parsed.win_conditions} Bonus features: {parsed.bonus_features}",
            },
            {
                "title": "Social Mode Copy",
                "body": parsed.social_mode,
            },
            {
                "title": "Project Tasks",
                "body": " ".join(task.lstrip("- ") for task in parsed.tasks) if parsed.tasks else "Core game logic, math handling, UI hooks, and submission content are generated from the repository requirements.",
            },
            {
                "title": "Must-have UI Help",
                "body": parsed.ui_help_text,
            },
        ],
        "socialModeCopy": {
            "summary": parsed.social_mode,
            "currencyLabels": ["GC", "SC"],
            "bannedWords": ["bet", "wager", "buy", "payout", "gambling"],
        },
        "qaChecks": DEFAULT_QA_CHECKS,
        "disclaimer": DEFAULT_DISCLAIMER,
                "artDirection": parsed.art_direction,
    }


def generate_from_requirements(repo_root: Path) -> dict[str, object]:
    parsed = parse_requirements(repo_root / "docs" / "Stake_.md")
    assumptions = _build_assumptions(parsed)
    generated_game_config = _build_generated_game_config(parsed)
    generated_frontend_content = _build_generated_frontend_content(parsed)

    generated_config_path = repo_root / "math" / "generated_game_config.json"
    generated_content_path = repo_root / "frontend" / "src" / "content" / "generatedGameContent.json"
    generated_art_manifest_path = repo_root / "frontend" / "src" / "content" / "generatedArtManifest.json"
    generated_spec_path = repo_root / "dist" / "submission" / "generated_spec.md"
    generated_spec_json_path = repo_root / "dist" / "submission" / "spec" / "game_spec.json"
    generated_assumptions_path = repo_root / "dist" / "submission" / "assumptions_draft.md"
    root_assumption_path = repo_root / "assumption.md"

    generated_config_path.parent.mkdir(parents=True, exist_ok=True)
    generated_content_path.parent.mkdir(parents=True, exist_ok=True)
    generated_art_manifest_path.parent.mkdir(parents=True, exist_ok=True)
    generated_spec_path.parent.mkdir(parents=True, exist_ok=True)
    generated_spec_json_path.parent.mkdir(parents=True, exist_ok=True)
    generated_assumptions_path.parent.mkdir(parents=True, exist_ok=True)

    game_slug = _slugify(parsed.game_name)
    art_pipeline = build_art_pipeline(
        repo_root=repo_root,
        frontend_public_dir=repo_root / "frontend" / "public",
        game_slug=game_slug,
        game_name=parsed.game_name,
        symbol_keys=list(DEFAULT_SYMBOLS.keys()),
        manifest_output_path=generated_art_manifest_path,
    )

    generated_frontend_content["artPipeline"] = {
        "mode": art_pipeline["mode"],
        "manifest": f"./generatedArtManifest.json",
    }

    generated_config_path.write_text(json.dumps(generated_game_config, indent=2) + "\n", encoding="utf-8")
    generated_content_path.write_text(json.dumps(generated_frontend_content, indent=2) + "\n", encoding="utf-8")
    generated_spec_json_path.write_text(
        json.dumps(
            {
                "game_name": parsed.game_name,
                "target_audience": parsed.target_audience,
                "icon_concept": parsed.icon_concept,
                "core_mechanic": parsed.core_mechanic,
                "board_layout": parsed.board_layout,
                "win_conditions": parsed.win_conditions,
                "bonus_features": parsed.bonus_features,
                "art_direction": parsed.art_direction,
                "ui_help_text": parsed.ui_help_text,
                "rtp_targets": parsed.rtp_targets,
                "max_win_hit_rate": parsed.max_win_hit_rate_label,
                "rng": parsed.rng,
                "social_mode": parsed.social_mode,
                "tasks": parsed.tasks,
                "assumptions": assumptions,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    generated_spec_path.write_text(
        "\n".join(
            [
                f"# Generated Specification: {parsed.game_name}",
                "",
                f"- Target audience: {parsed.target_audience}",
                f"- Icon concept: {parsed.icon_concept}",
                f"- Core mechanic: {parsed.core_mechanic}",
                f"- Board layout: {parsed.board_layout}",
                f"- Win conditions: {parsed.win_conditions}",
                f"- Bonus features: {parsed.bonus_features}",
                f"- Art direction: {parsed.art_direction}",
                f"- RTP targets: {parsed.rtp_targets[0]:.4f}, {parsed.rtp_targets[1]:.4f}",
                f"- Max win hit rate: {parsed.max_win_hit_rate_label}",
                f"- RNG: {parsed.rng}",
                f"- Social mode rule: {parsed.social_mode}",
                "",
                "## Draft Assumptions",
                *( [f"- {assumption}" for assumption in assumptions] if assumptions else ["- No inferred assumptions were required."] ),
                "",
                "## Parsed Tasks",
                *(parsed.tasks or ["- No explicit tasks were provided."]),
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    generated_assumptions_text = "\n".join(
        [
            f"# Assumptions Draft: {parsed.game_name}",
            "",
            "These assumptions were generated from the current requirements before build execution.",
            "",
            "## Inferred Assumptions",
            *( [f"- {assumption}" for assumption in assumptions] if assumptions else ["- No inferred assumptions were required."] ),
            "",
            "## Confirmed Inputs",
            f"- Core mechanic: {parsed.core_mechanic}",
            f"- Board layout: {parsed.board_layout}",
            f"- Win conditions: {parsed.win_conditions}",
            f"- Bonus features: {parsed.bonus_features}",
            f"- Art direction: {parsed.art_direction}",
            f"- Must-have UI/help text: {parsed.ui_help_text}",
        ]
    ) + "\n"
    generated_assumptions_path.write_text(generated_assumptions_text, encoding="utf-8")
    root_assumption_path.write_text(generated_assumptions_text, encoding="utf-8")

    return {
        "parsed": {
            "game_name": parsed.game_name,
            "target_audience": parsed.target_audience,
            "icon_concept": parsed.icon_concept,
            "core_mechanic": parsed.core_mechanic,
        },
        "generated_paths": {
            "game_config": str(generated_config_path.relative_to(repo_root)),
            "frontend_content": str(generated_content_path.relative_to(repo_root)),
            "art_manifest": str(generated_art_manifest_path.relative_to(repo_root)),
            "generated_spec": str(generated_spec_path.relative_to(repo_root)),
            "game_spec_json": str(generated_spec_json_path.relative_to(repo_root)),
            "assumptions_draft": str(generated_assumptions_path.relative_to(repo_root)),
        },
        "generated_assets": art_pipeline["generated_assets"],
        "art_pipeline": art_pipeline,
        "assumptions": assumptions,
    }
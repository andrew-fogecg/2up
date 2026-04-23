"""End-to-end build pipeline and agent orchestrator for the Stake game template blueprint."""

from __future__ import annotations

import importlib.util
import json
import re
import shutil
import subprocess
import sys
import zipfile
from dataclasses import asdict, dataclass, field
from pathlib import Path

from build_system.requirements_parser import generate_from_requirements


REQUIRED_AGENT_FILES = {
    "director.agent": "StakeDirector",
    "concept-artist.agent.md": "concept-artist",
    "stake-developer.agent.md": "stake-developer",
    "ui-developer.agent.md": "ui-developer",
    "sound-engineer.agent.md": "sound-engineer",
    "qa-tester.agent.md": "qa-tester",
    "content-writer.agent.md": "content-writer",
    "devops.agent.md": "devops-agent",
    "stake-assures.agent.md": "stake-assures",
}

ORCHESTRATION_ORDER = [
    "concept-artist",
    "stake-developer",
    "ui-developer",
    "sound-engineer",
    "qa-tester",
    "stake-assures",
    "content-writer",
    "devops-agent",
    "StakeDirector",
]

REQUIRED_REQUIREMENTS_HEADINGS = [
    "## 1. Game Concept",
    "## 2. Core Game Rules",
    "## 3. Project Tasks",
    "## 4. Artifact Outputs",
]

PLACEHOLDER_PATTERNS = [
    re.compile(r"\[Game Name\]"),
    re.compile(r"\*\*Target Audience:\*\*\s*$", re.MULTILINE),
    re.compile(r"\*\*Icon Concept:\*\*\s*$", re.MULTILINE),
]


@dataclass
class AgentExecutionResult:
    agent: str
    status: str
    summary: str
    issues: list[str] = field(default_factory=list)
    artifacts: list[str] = field(default_factory=list)


@dataclass
class PipelineResult:
    status: str
    issues: list[str]
    artifacts: dict[str, str]
    agent_results: list[AgentExecutionResult] = field(default_factory=list)


def _load_module(module_name: str, file_path: Path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def _extract_agent_name(content: str) -> str:
    match = re.search(r"^name:\s*(.+)$", content, re.MULTILINE)
    return match.group(1).strip() if match else "unknown"


def _audit_agents(agent_dir: Path) -> tuple[list[dict[str, str]], list[str]]:
    inventory = []
    issues = []

    for file_name, expected_name in REQUIRED_AGENT_FILES.items():
        file_path = agent_dir / file_name
        if not file_path.exists():
            issues.append(f"Missing required agent file: {file_name}")
            continue

        content = file_path.read_text(encoding="utf-8")
        declared_name = _extract_agent_name(content)
        inventory.append(
            {
                "file": str(file_path.relative_to(agent_dir.parent.parent)),
                "declared_name": declared_name,
                "expected_name": expected_name,
            }
        )
        if declared_name != expected_name:
            issues.append(
                f"Agent name mismatch in {file_name}: expected '{expected_name}', found '{declared_name}'"
            )

    return inventory, issues


def _audit_requirements(doc_path: Path) -> tuple[list[str], str]:
    content = doc_path.read_text(encoding="utf-8")
    issues = []

    for heading in REQUIRED_REQUIREMENTS_HEADINGS:
        if heading not in content:
            issues.append(f"Requirements document missing section: {heading}")

    for pattern in PLACEHOLDER_PATTERNS:
        if pattern.search(content):
            issues.append("Requirements document still contains placeholder content")
            break

    return issues, content


def _audit_action_items(action_path: Path) -> tuple[list[str], list[str], str]:
    content = action_path.read_text(encoding="utf-8")
    open_blockers = re.findall(r"^- \[ \] (.+)$", content, re.MULTILINE)
    issues = [f"Open blocker: {blocker}" for blocker in open_blockers]
    return issues, open_blockers, content


def _write_json(path: Path, payload: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def _load_frontend_content(frontend_dir: Path) -> dict[str, object]:
    content_path = frontend_dir / "src" / "content" / "generatedGameContent.json"
    return json.loads(content_path.read_text(encoding="utf-8"))


def _build_frontend(frontend_dir: Path) -> tuple[list[str], dict[str, object]]:
    issues = []
    build_info = {
        "built": False,
        "artifact": "dist/frontend/index.html",
    }

    package_json = frontend_dir / "package.json"
    if not package_json.exists():
        issues.append("Frontend package.json is missing")
        return issues, build_info

    npm_path = shutil.which("npm")
    if npm_path is None:
        issues.append("npm is not available, so the frontend build could not run")
        return issues, build_info

    node_modules = frontend_dir / "node_modules"
    if not node_modules.exists():
        install_result = subprocess.run(
            [npm_path, "install"],
            cwd=frontend_dir,
            capture_output=True,
            text=True,
            check=False,
        )
        if install_result.returncode != 0:
            issues.append("Frontend dependency installation failed")
            build_info["install_output"] = install_result.stderr.strip() or install_result.stdout.strip()
            return issues, build_info

    build_result = subprocess.run(
        [npm_path, "run", "build"],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
        check=False,
    )
    if build_result.returncode != 0:
        issues.append("Frontend build failed")
        build_info["build_output"] = build_result.stderr.strip() or build_result.stdout.strip()
        return issues, build_info

    build_info["built"] = True
    build_info["build_output"] = build_result.stdout.strip()
    return issues, build_info


def _run_frontend_tests(frontend_dir: Path) -> tuple[list[str], dict[str, object]]:
    issues = []
    result_info = {
        "passed": False,
        "artifact": "dist/submission/system/frontend_test_report.json",
    }

    npm_path = shutil.which("npm")
    if npm_path is None:
        issues.append("npm is not available, so frontend browser tests could not run")
        return issues, result_info

    install_browser = subprocess.run(
        [npm_path, "exec", "playwright", "install", "chromium"],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
        check=False,
    )
    if install_browser.returncode != 0:
        issues.append("Playwright browser installation failed")
        result_info["browser_output"] = install_browser.stderr.strip() or install_browser.stdout.strip()
        return issues, result_info

    test_result = subprocess.run(
        [npm_path, "run", "test:e2e"],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
        check=False,
    )
    if test_result.returncode != 0:
        issues.append("Frontend browser tests failed")
        result_info["test_output"] = test_result.stderr.strip() or test_result.stdout.strip()
        return issues, result_info

    result_info["passed"] = True
    result_info["test_output"] = test_result.stdout.strip()
    return issues, result_info


def _write_agent_report(dist_dir: Path, result: AgentExecutionResult) -> str:
    report_path = dist_dir / "submission" / "agents" / f"{result.agent}.json"
    _write_json(report_path, asdict(result))
    return str(report_path)


def _artifact_rel(repo_root: Path, path: Path) -> str:
    return str(path.relative_to(repo_root))


def _build_submission_document(
    requirements_content: str,
    action_content: str,
    math_report: dict[str, object],
    frontend_content: dict[str, object],
    build_status: str,
    issues: list[str],
) -> str:
    mode_lines = []
    for mode in math_report["mode_reports"]:
        mode_lines.append(
            "- "
            f"{mode['name']}: RTP target {mode['target_rtp']:.4f}, "
            f"estimated RTP {mode['estimated_rtp']:.4f}, "
            f"max win x{mode['max_win_multiplier']}"
        )

    issue_lines = ["- None"] if not issues else [f"- {issue}" for issue in issues]
    standard_labels = frontend_content["buttonLabels"]["standard"]
    social_labels = frontend_content["buttonLabels"]["social"]
    help_lines = [f"### {section['title']}\n{section['body']}" for section in frontend_content["helpSections"]]
    social_labels_lines = [f"- {label}: {value}" for label, value in social_labels.items()]
    standard_labels_lines = [f"- {label}: {value}" for label, value in standard_labels.items()]

    return "\n".join(
        [
            "# Stake.US Submission Draft",
            "",
            f"Build Status: {build_status.upper()}",
            "",
            "## Game Concept and Core Rules",
            requirements_content,
            "",
            "## Icon and Visual Direction",
            f"- Icon concept: {frontend_content['iconConcept']}",
            f"- Board layout: {frontend_content['board']['layout']}",
            f"- Board summary: {frontend_content['board']['summary']}",
            "",
            "## Math Summary",
            *mode_lines,
            f"- Mode RTP variance: {math_report['mode_rtp_variance']:.4f}",
            f"- Disclaimer present: {'Yes' if math_report['disclaimer_present'] else 'No'}",
            "",
            "## UI Copy and Button Labels",
            "### Standard Labels",
            *standard_labels_lines,
            "",
            "### Social Labels",
            *social_labels_lines,
            "",
            "## Help Document Content",
            *help_lines,
            "",
            "## Social Mode Copy",
            f"- Summary: {frontend_content['socialModeCopy']['summary']}",
            f"- Currency labels: {', '.join(frontend_content['socialModeCopy']['currencyLabels'])}",
            f"- Restricted words blocked in social mode: {', '.join(frontend_content['socialModeCopy']['bannedWords'])}",
            "",
            "## Build Issues",
            *issue_lines,
            "",
            "## Action Log",
            action_content,
            "",
            "## Submission Notes",
            "- UI copy must support GC and SC displays with no `$` prefix.",
            "- Help docs and button labels must stay aligned with Stake.US wording restrictions.",
            "- QA and Stake Assures review should be re-run after each UI or math change.",
        ]
    )


def _package_release(dist_dir: Path) -> Path:
    releases_dir = dist_dir / "submission" / "releases"
    releases_dir.mkdir(parents=True, exist_ok=True)
    zip_path = releases_dir / "stake-game-template-artifacts.zip"

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(dist_dir.rglob("*")):
            if not path.is_file():
                continue
            if path == zip_path:
                continue
            archive.write(path, path.relative_to(dist_dir))

    return zip_path


def run_pipeline(repo_root: Path) -> PipelineResult:
    dist_dir = repo_root / "dist"
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    dist_dir.mkdir(parents=True, exist_ok=True)

    pipeline_issues: list[str] = []
    agent_results: list[AgentExecutionResult] = []

    parser_result = generate_from_requirements(repo_root)

    agent_inventory, agent_issues = _audit_agents(repo_root / ".github" / "agents")
    pipeline_issues.extend(agent_issues)
    _write_json(dist_dir / "submission" / "system" / "agent_inventory.json", agent_inventory)

    requirements_issues, requirements_content = _audit_requirements(repo_root / "docs" / "Stake_.md")
    action_issues, open_blockers, action_content = _audit_action_items(repo_root / "action.md")
    pipeline_issues.extend(requirements_issues)
    pipeline_issues.extend(action_issues)

    frontend_dir = repo_root / "frontend"
    frontend_content = _load_frontend_content(frontend_dir)
    main_js_content = (frontend_dir / "src" / "main.js").read_text(encoding="utf-8")
    replay_js_content = (frontend_dir / "src" / "api" / "replay.js").read_text(encoding="utf-8")

    config_module = _load_module("stake_game_config", repo_root / "math" / "game_config.py")
    logic_module = _load_module("stake_game_logic", repo_root / "math" / "game_logic.py")
    math_report = logic_module.evaluate_configuration(config_module.GAME_CONFIG)

    concept_summary = "\n".join(
        [
            "# Concept Artist Output",
            "",
            f"- Game: {frontend_content['gameName']}",
            f"- Tagline: {frontend_content['tagline']}",
            f"- Icon concept: {frontend_content['iconConcept']}",
            f"- Board layout: {frontend_content['board']['layout']}",
            "- Symbol hierarchy: Low symbols L1/L2, high symbols H1/H2, wild W, scatter SC.",
        ]
    )
    concept_path = dist_dir / "submission" / "docs" / "concept_brief.md"
    _write_text(concept_path, concept_summary)
    concept_result = AgentExecutionResult(
        agent="concept-artist",
        status="passed" if not requirements_issues else "blocked",
        summary="Expanded the concept into a brief covering name, icon, board layout, and symbol hierarchy.",
        issues=requirements_issues.copy(),
        artifacts=[
            _artifact_rel(repo_root, concept_path),
            parser_result["generated_paths"]["generated_spec"],
            parser_result["generated_paths"]["assumptions_draft"],
        ],
    )
    agent_results.append(concept_result)
    _write_agent_report(dist_dir, concept_result)

    developer_summary = "\n".join(
        [
            "# Developer Output",
            "",
            f"- Mechanic: {math_report['mechanic_profile']['title']}",
            f"- Layout: {math_report['mechanic_profile']['board_layout']}",
            f"- Base RTP: {math_report['mode_reports'][0]['estimated_rtp']:.4f}",
            f"- Bonus RTP: {math_report['mode_reports'][1]['estimated_rtp']:.4f}",
            f"- RTP variance: {math_report['mode_rtp_variance']:.4f}",
            f"- Math compliant: {'Yes' if math_report['configuration_compliant'] else 'No'}",
        ]
    )
    developer_path = dist_dir / "maths" / "developer_summary.md"
    _write_text(developer_path, developer_summary)
    developer_issues = [] if math_report["configuration_compliant"] else ["Math configuration is outside compliance limits"]
    developer_result = AgentExecutionResult(
        agent="stake-developer",
        status="passed" if not developer_issues else "blocked",
        summary="Validated and exported the configured math profile and first-pass mechanic engine description.",
        issues=developer_issues,
        artifacts=["dist/maths/math_report.json", _artifact_rel(repo_root, developer_path), parser_result["generated_paths"]["game_config"]],
    )
    agent_results.append(developer_result)
    _write_agent_report(dist_dir, developer_result)

    frontend_issues, frontend_build = _build_frontend(frontend_dir)
    pipeline_issues.extend(frontend_issues)
    ui_summary = "\n".join(
        [
            "# UI Developer Output",
            "",
            f"- Primary action: {frontend_content['board']['primaryAction']}",
            f"- Social primary action: {frontend_content['buttonLabels']['social']['primary']}",
            f"- Frontend built: {'Yes' if frontend_build['built'] else 'No'}",
            f"- Art pipeline mode: {parser_result['art_pipeline']['mode']}",
            f"- Replay stub uses rgs_url: {'Yes' if 'rgs_url' in replay_js_content else 'No'}",
        ]
    )
    ui_summary_path = dist_dir / "frontend" / "ui_summary.md"
    _write_text(ui_summary_path, ui_summary)
    ui_issues = frontend_issues.copy()
    if not frontend_build["built"]:
        ui_issues.append("Frontend artifact was not produced")
    ui_result = AgentExecutionResult(
        agent="ui-developer",
        status="passed" if not ui_issues else "blocked",
        summary="Built the frontend shell against generated content, generated assumptions, and the art manifest.",
        issues=ui_issues,
        artifacts=["dist/frontend/index.html", _artifact_rel(repo_root, ui_summary_path), parser_result["generated_paths"]["frontend_content"], parser_result["generated_paths"]["art_manifest"]],
    )
    agent_results.append(ui_result)
    _write_agent_report(dist_dir, ui_result)

    sound_map = {
        "small_win": {"file": "assets/audio/small-win.ogg", "hooks": ["mute", "volume"]},
        "big_win": {"file": "assets/audio/big-win.ogg", "hooks": ["mute", "volume"]},
        "scatter_land": {"file": "assets/audio/scatter-land.ogg", "hooks": ["mute", "volume"]},
        "reel_spin": {"file": "assets/audio/reel-spin.ogg", "hooks": ["mute", "volume"]},
    }
    sound_map_path = dist_dir / "submission" / "docs" / "sound_map.json"
    _write_json(sound_map_path, sound_map)
    sound_result = AgentExecutionResult(
        agent="sound-engineer",
        status="passed",
        summary="Generated the sound map required by the build-system PDF and linked mute/volume hooks.",
        artifacts=[_artifact_rel(repo_root, sound_map_path), *parser_result["generated_assets"]],
    )
    agent_results.append(sound_result)
    _write_agent_report(dist_dir, sound_result)

    qa_issues: list[str] = []
    social_labels = frontend_content["buttonLabels"]["social"]
    banned_words = frontend_content["socialModeCopy"]["bannedWords"]
    if "event.code === 'Space'" not in main_js_content and 'event.code === "Space"' not in main_js_content:
        qa_issues.append("Spacebar binding is missing from the frontend entrypoint")
    for token in ["sessionID", "nonce", "social", "currency", "rgs_url"]:
        if token not in replay_js_content:
            qa_issues.append(f"Replay handler is missing query parameter support for {token}")
    for label_name, label_value in social_labels.items():
        lowered = str(label_value).lower()
        if "$" in lowered:
            qa_issues.append(f"Social label '{label_name}' contains a dollar sign")
        for banned_word in banned_words:
            if banned_word in lowered:
                qa_issues.append(f"Social label '{label_name}' contains restricted word '{banned_word}'")
    if "Malfunction voids all pays and plays" not in frontend_content["disclaimer"]:
        qa_issues.append("Disclaimer text is missing the required malfunction clause")
    browser_test_issues, browser_test_result = _run_frontend_tests(frontend_dir)
    qa_issues.extend(browser_test_issues)
    frontend_test_report_path = dist_dir / "submission" / "system" / "frontend_test_report.json"
    _write_json(frontend_test_report_path, browser_test_result)
    qa_report_path = dist_dir / "submission" / "system" / "qa_report.json"
    _write_json(
        qa_report_path,
        {
            "checks": frontend_content["qaChecks"],
            "issues": qa_issues,
            "status": "passed" if not qa_issues else "blocked",
            "browser_tests": browser_test_result,
            "assumptions": parser_result["assumptions"],
        },
    )
    qa_result = AgentExecutionResult(
        agent="qa-tester",
        status="passed" if not qa_issues else "blocked",
        summary="Executed automated QA checks for spacebar binding, replay parameters, disclaimer text, and social-mode wording.",
        issues=qa_issues.copy(),
        artifacts=[_artifact_rel(repo_root, qa_report_path), _artifact_rel(repo_root, frontend_test_report_path)],
    )
    agent_results.append(qa_result)
    _write_agent_report(dist_dir, qa_result)
    pipeline_issues.extend(qa_issues)

    stake_assures_issues: list[str] = []
    if not math_report["configuration_compliant"]:
        stake_assures_issues.append("RTP or max-win compliance failed")
    if math_report["mode_rtp_variance"] > math_report["variance_tolerance"]:
        stake_assures_issues.append("RTP variance exceeds the allowed tolerance")
    for banned_word in banned_words:
        social_text = json.dumps(frontend_content["buttonLabels"]["social"]).lower()
        if banned_word in social_text:
            stake_assures_issues.append(f"Restricted word '{banned_word}' appears in social-mode labels")
    if "$" in json.dumps(frontend_content["buttonLabels"]["social"]):
        stake_assures_issues.append("Dollar-denominated labels appear in social mode")
    if "Provably Fair" not in requirements_content:
        stake_assures_issues.append("Requirements document does not mention Provably Fair RNG")
    stake_assures_path = dist_dir / "submission" / "system" / "stake_assures_report.json"
    _write_json(
        stake_assures_path,
        {
            "status": "passed" if not stake_assures_issues else "blocked",
            "mode_rtp_variance": math_report["mode_rtp_variance"],
            "variance_tolerance": math_report["variance_tolerance"],
            "issues": stake_assures_issues,
        },
    )
    stake_assures_result = AgentExecutionResult(
        agent="stake-assures",
        status="passed" if not stake_assures_issues else "blocked",
        summary="Ran Stake compliance review across math, social-mode wording, and RNG documentation.",
        issues=stake_assures_issues.copy(),
        artifacts=[_artifact_rel(repo_root, stake_assures_path)],
    )
    agent_results.append(stake_assures_result)
    _write_agent_report(dist_dir, stake_assures_result)
    pipeline_issues.extend(stake_assures_issues)

    provisional_status = "passed" if not pipeline_issues else "blocked"
    submission_path = dist_dir / "submission" / "stake_us_submission.md"
    _write_text(
        submission_path,
        _build_submission_document(
            requirements_content=requirements_content,
            action_content=action_content,
            math_report=math_report,
            frontend_content=frontend_content,
            build_status=provisional_status,
            issues=pipeline_issues,
        ),
    )
    content_result = AgentExecutionResult(
        agent="content-writer",
        status="passed" if provisional_status == "passed" else "blocked",
        summary="Compiled the Stake.US submission draft from concept, UI, math, QA, and compliance inputs.",
        issues=pipeline_issues.copy(),
        artifacts=[_artifact_rel(repo_root, submission_path)],
    )
    agent_results.append(content_result)
    _write_agent_report(dist_dir, content_result)

    release_zip = dist_dir / "submission" / "releases" / "stake-game-template-artifacts.zip"
    devops_result = AgentExecutionResult(
        agent="devops-agent",
        status="passed",
        summary="Packaged the generated artifacts into a review-ready release archive.",
        artifacts=[_artifact_rel(repo_root, release_zip)],
    )
    agent_results.append(devops_result)
    _write_agent_report(dist_dir, devops_result)

    final_status = "passed" if not pipeline_issues else "blocked"
    director_report_path = dist_dir / "submission" / "system" / "director_report.md"
    _write_text(
        director_report_path,
        "\n".join(
            [
                "# Director Report",
                "",
                f"Overall status: {final_status.upper()}",
                "",
                "## Sequence",
                *[f"- {agent_name}" for agent_name in ORCHESTRATION_ORDER],
                "",
                "## Agent Statuses",
                *[f"- {result.agent}: {result.status}" for result in agent_results],
                "",
                "## Issues",
                *(["- None"] if not pipeline_issues else [f"- {issue}" for issue in pipeline_issues]),
            ]
        ),
    )
    director_result = AgentExecutionResult(
        agent="StakeDirector",
        status=final_status,
        summary="Reviewed the full orchestrated run, validated agent outputs, and prepared the final status report.",
        issues=pipeline_issues.copy(),
        artifacts=[_artifact_rel(repo_root, director_report_path)],
    )
    agent_results.append(director_result)
    _write_agent_report(dist_dir, director_result)

    _write_text(
        dist_dir / "submission" / "requirements_audit.md",
        "\n".join(
            [
                "# Requirements Audit",
                "",
                f"Status: {'PASS' if not requirements_issues else 'FAIL'}",
                "",
                "## Source",
                "docs/Stake_.md",
                "",
                "## Issues",
                *( ["- None"] if not requirements_issues else [f"- {issue}" for issue in requirements_issues] ),
                "",
                "## Snapshot",
                requirements_content,
                "",
                "## Generated Spec Artifacts",
                f"- {parser_result['generated_paths']['generated_spec']}",
                f"- {parser_result['generated_paths']['game_spec_json']}",
                f"- {parser_result['generated_paths']['assumptions_draft']}",
                f"- {parser_result['generated_paths']['art_manifest']}",
            ]
        ),
    )
    _write_text(
        dist_dir / "submission" / "action_summary.md",
        "\n".join(
            [
                "# Action Summary",
                "",
                f"Status: {'PASS' if not action_issues else 'FAIL'}",
                "",
                "## Open Blockers",
                *( ["- None"] if not open_blockers else [f"- {blocker}" for blocker in open_blockers] ),
                "",
                "## Snapshot",
                action_content,
            ]
        ),
    )
    _write_json(dist_dir / "maths" / "math_report.json", math_report)
    _write_json(dist_dir / "submission" / "system" / "orchestration_summary.json", [asdict(result) for result in agent_results])

    _write_json(
        dist_dir / "submission" / "build_report.json",
        {
            "status": final_status,
            "issue_count": len(pipeline_issues),
            "issues": pipeline_issues,
            "open_blockers": open_blockers,
            "artifacts": {
                "agent_inventory": "dist/submission/system/agent_inventory.json",
                "math_report": "dist/maths/math_report.json",
                "frontend_bundle": "dist/frontend/index.html",
                "requirements_audit": "dist/submission/requirements_audit.md",
                "action_summary": "dist/submission/action_summary.md",
                "stake_us_submission": "dist/submission/stake_us_submission.md",
                "release_package": _artifact_rel(repo_root, release_zip),
                "director_report": _artifact_rel(repo_root, director_report_path),
                "generated_spec": parser_result["generated_paths"]["generated_spec"],
                "game_spec_json": parser_result["generated_paths"]["game_spec_json"],
                "assumptions_draft": parser_result["generated_paths"]["assumptions_draft"],
                "art_manifest": parser_result["generated_paths"]["art_manifest"],
            },
            "orchestration_order": ORCHESTRATION_ORDER,
            "agent_results": [asdict(result) for result in agent_results],
            "frontend": frontend_build,
            "parser": parser_result,
        },
    )

    release_zip = _package_release(dist_dir)

    return PipelineResult(
        status=final_status,
        issues=pipeline_issues,
        artifacts={
            "agent_inventory": "dist/submission/system/agent_inventory.json",
            "math_report": "dist/maths/math_report.json",
            "frontend_bundle": "dist/frontend/index.html",
            "requirements_audit": "dist/submission/requirements_audit.md",
            "action_summary": "dist/submission/action_summary.md",
            "stake_us_submission": "dist/submission/stake_us_submission.md",
            "release_package": _artifact_rel(repo_root, release_zip),
            "director_report": _artifact_rel(repo_root, director_report_path),
            "generated_spec": parser_result["generated_paths"]["generated_spec"],
            "game_spec_json": parser_result["generated_paths"]["game_spec_json"],
            "assumptions_draft": parser_result["generated_paths"]["assumptions_draft"],
            "art_manifest": parser_result["generated_paths"]["art_manifest"],
        },
        agent_results=agent_results,
    )
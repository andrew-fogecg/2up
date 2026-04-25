# HeadsOrTails

This repository now includes a runnable automation layer for the HeadsOrTails Stake game build. The system audits the required agents, validates the requirements and action documents, evaluates the math configuration, and writes build artifacts into `dist/`.

The implementation is aligned to the build-system specification and the repository content in `docs/Stake_.md`, `action.md`, and `.github/agents/`.

## Current Repository Status

### Present now
- Agent role definitions in `.github/agents/`
- Executable orchestrator that maps agent definitions to automated build tasks
- Requirements parser that expands `docs/Stake_.md` into generated config and content
- Automatic assumption drafting that writes a build-specific `assumption.md` before generation
- Requirements blueprint in `docs/Stake_.md`
- Task tracker in `action.md`
- Frontend app with production build in `frontend/`
- Art pipeline interface that switches between placeholder and approved assets through one manifest
- Runnable math config and analysis scripts in `math/`
- First-pass mechanic engine abstraction for reel, cluster, and pick-style profiles
- Root Python build entrypoint in `build.py`
- Build pipeline package in `build_system/`
- GitHub Actions trigger in `.github/workflows/build-blueprint.yml`
- Generated `dist/` artifacts after each build run

### Missing or incomplete
- No external LLM-backed agent executor; the repository now maps agent definitions to deterministic automated tasks

## Agent Inventory

The repository includes the main agent roles below.

| Agent file | Purpose | Status |
|---|---|---|
| `.github/agents/director.agent` | Oversees the flow and enforces document quality | Present |
| `.github/agents/concept-artist.agent.md` | Creates game concept, naming, symbols, and layout guidance | Present |
| `.github/agents/stake-developer.agent.md` | Owns core implementation against `action.md` | Present |
| `.github/agents/ui-developer.agent.md` | Owns frontend implementation and Stake.US wording rules | Present |
| `.github/agents/sound-engineer.agent.md` | Defines sound map and UI sound hooks | Present |
| `.github/agents/qa-tester.agent.md` | Runs QA checks and writes failures back to `action.md` | Present |
| `.github/agents/content-writer.agent.md` | Compiles Stake.US submission-ready content artifacts | Present |
| `.github/agents/devops.agent.md` | Packages deployable output and publication steps | Present |
| `.github/agents/stake-assures.agent.md` | Compliance and approval checklist | Present |

## Running the Game Locally

The game is a Vite-powered frontend located in `frontend/`.

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
cd frontend
npm install
```

### Start the dev server

```bash
npm run dev
```

The game will be available at **http://localhost:5173** (or the next free port Vite selects).

URL parameters supported:
| Param | Example | Description |
|---|---|---|
| `currency` | `?currency=GC` | Currency mode — `GC`, `SC`, `USD`, etc. Defaults to `GC` |
| `balance` | `?balance=5000` | Starting balance in display units. Defaults to `1000` |
| `social` | `?social=1` | Enable social (free-to-play) mode |

Example: `http://localhost:5173?currency=SC&balance=2500`

### Build for production

```bash
npm run build
```

Output is written to `../dist/frontend/`.

---

## How To Trigger The System

The repository now supports both a local trigger and a CI trigger.

### Local trigger
Run the build pipeline from the repository root:

```bash
python build.py
```

Use strict mode when you want the command to fail on blockers:

```bash
python build.py --strict
```

### GitHub Actions trigger
Run the `Build Blueprint` workflow from the Actions tab, or let it run automatically on push and pull request events.

## What The Build Does

Running `python build.py` performs these steps:

1. Audits the required agent files in `.github/agents/`.
2. Executes the mapped agent sequence from a single command.
3. Validates `docs/Stake_.md` for required sections and placeholder content.
4. Validates `action.md` for unresolved blockers.
5. Parses the requirements into generated math config, generated frontend content, and detailed generated spec docs.
6. Generates a draft assumptions file before build when details are vague or defaulted.
7. Routes the game through a first-pass mechanic engine profile.
8. Generates or selects art through a shared art manifest interface.
7. Builds the UI into `dist/frontend/`.
8. Evaluates the math configuration in `math/game_config.py` through `math/game_logic.py`.
9. Runs automated QA, browser tests, and Stake Assures compliance checks.
10. Generates a Stake.US submission draft and release package under `dist/submission/`.
11. Writes build artifacts into `dist/frontend/`, `dist/maths/`, and `dist/submission/` only.

## Generated Artifacts

The current build generates these artifacts:

| Output path | Contents |
|---|---|
| `dist/frontend/index.html` | Production frontend shell |
| `dist/maths/index.json` | Publish manifest for Stake maths upload |
| `dist/maths/math_report.json` | Math compliance report |
| `dist/submission/generated_spec.md` | Detailed generated requirements explanation |
| `dist/submission/assumptions_draft.md` | Draft assumptions inferred before build |
| `dist/submission/spec/game_spec.json` | Machine-readable parsed spec |
| `dist/submission/system/agent_inventory.json` | Agent inventory and name validation |
| `dist/submission/system/orchestration_summary.json` | Per-agent execution results |
| `dist/submission/system/director_report.md` | Final orchestration summary |
| `dist/submission/system/frontend_test_report.json` | Browser test execution output |
| `dist/submission/requirements_audit.md` | Requirements audit snapshot |
| `dist/submission/action_summary.md` | Action summary snapshot |
| `dist/submission/stake_us_submission.md` | Submission-ready content draft |
| `dist/submission/releases/headsortails-artifacts.zip` | Packaged release archive |
| `dist/submission/build_report.json` | Overall pipeline result |

## Automated Agent Flow

The build pipeline now maps the agent files to executable tasks and runs them in this order from `python build.py`:

1. `concept-artist`
2. `stake-developer`
3. `ui-developer`
4. `sound-engineer`
5. `qa-tester`
6. `stake-assures`
7. `content-writer`
8. `devops-agent`
9. `StakeDirector`

## What Still Needs To Be Added

1. RGS-backed API integration instead of the current frontend replay stub.
2. Deployment publishing beyond the generated release archive.
3. Optional external AI-agent execution on top of the deterministic orchestrator.
4. Final production art generation instead of placeholder graphics when approved assets are not supplied.
5. A deeply custom gameplay engine that can support arbitrary mechanics without further coding.
6. A safe inference layer for turning vague concepts into explicit draft rules and assumptions.

## Definition Of Done For This Blueprint

This blueprint is fully complete when all of the following are true:

1. A single trigger builds frontend, math, docs, QA, and deployment artifacts.
2. The agent definitions are executable or mapped to automated tasks.
3. A production frontend bundle is emitted into `dist/frontend/`.
4. Compliance and QA checks fail the build when real regressions are introduced.

## Short Version

The repository now has a working build pipeline, an executable agent-task orchestrator, a requirements parser, automatic assumption drafting, a first-pass mechanic engine layer, a shared art pipeline interface, and browser-based frontend tests. The remaining gaps are live RGS integration, deployment publishing, and final production art generation.

See [todo.md](todo.md) for the implementation roadmap and [assumption.md](assumption.md) for the current operating assumptions and limits.
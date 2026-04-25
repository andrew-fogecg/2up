# Game Factory

This document describes the current state of the repository as a spec-driven game factory. It is intended to be the editable reference before building a real game from a game overview.

## Purpose

The repository is a deterministic build system that turns repository requirements into:

- generated specification documents
- generated assumptions
- generated math config
- generated frontend content
- generated placeholder assets or approved-asset selection
- a built frontend shell
- math/compliance outputs
- browser test results
- submission-ready documentation

It is not yet a fully autonomous final-game factory for arbitrary mechanics and final production art, but it now contains the first full pass of the required build chain.

## Current Entry Point

The build starts from:

- `python build.py`
- `python build.py --strict`

The strict mode fails the build if blockers are found.

## Main Source Inputs

### Requirements source

- `docs/Stake_.md`

This file is the main human-authored source of truth. The parser reads it and generates all downstream build inputs.

### Task tracking source

- `action.md`

This file is used as the build backlog and status summary.

### Agent definitions

- `.github/agents/`

These files are not just documentation anymore. The orchestrator maps them to deterministic executable tasks.

## Current Build Flow

The active orchestrator is in:

- `build_system/pipeline.py`

The current flow is:

1. Audit required agent files.
2. Parse `docs/Stake_.md`.
3. Generate draft assumptions before build.
4. Generate a machine-readable game spec.
5. Generate frontend content from the parsed requirements.
6. Generate math config from the parsed requirements.
7. Route the config through a first-pass mechanic engine profile.
8. Build or select art through the shared art pipeline.
9. Build the frontend.
10. Run math evaluation.
11. Run browser tests and deterministic QA checks.
12. Run Stake compliance checks.
13. Generate submission documents.
14. Package release artifacts.
15. Produce a director summary.

## Current Generated Outputs

The build writes only to these top-level `dist` folders:

- `dist/frontend`
- `dist/maths`
- `dist/submission`

### Frontend output

- `dist/frontend/index.html`

### Maths output

- `dist/maths/math_report.json`
- `dist/maths/developer_summary.md`

### Submission output

Key files currently include:

- `dist/submission/generated_spec.md`
- `dist/submission/assumptions_draft.md`
- `dist/submission/spec/game_spec.json`
- `dist/submission/requirements_audit.md`
- `dist/submission/action_summary.md`
- `dist/submission/stake_us_submission.md`
- `dist/submission/build_report.json`
- `dist/submission/system/agent_inventory.json`
- `dist/submission/system/orchestration_summary.json`
- `dist/submission/system/director_report.md`
- `dist/submission/system/frontend_test_report.json`
- `dist/submission/system/qa_report.json`
- `dist/submission/system/stake_assures_report.json`
- `dist/submission/releases/headsortails-artifacts.zip`

## Requirements Parser

The requirements parser lives in:

- `build_system/requirements_parser.py`

### What it currently reads

It can currently parse or default the following fields from `docs/Stake_.md`:

- game title
- target audience
- icon concept
- core mechanic
- board/layout
- win conditions
- special symbols or bonus features
- RTP target
- max win hit-rate
- RNG
- social mode wording
- art direction notes
- must-have UI/help text
- project task list

### What it currently generates

It currently generates:

- `math/generated_game_config.json`
- `frontend/src/content/generatedGameContent.json`
- `frontend/src/content/generatedArtManifest.json`
- `dist/submission/generated_spec.md`
- `dist/submission/spec/game_spec.json`
- `dist/submission/assumptions_draft.md`
- root `assumption.md`

### Current parser behavior

If required detail is missing, the parser fills in deterministic defaults and records those decisions as assumptions.

This means the system is now safe to test with partial inputs, but the output quality still depends on the specificity of the game overview.

## Assumption Generation

The generated assumptions are written to:

- `dist/submission/assumptions_draft.md`
- `assumption.md`

### Current behavior

If the overview does not specify enough detail, the parser currently assumes:

- a default reel-line mechanic
- a default board layout
- default win conditions
- default bonus behavior
- default art direction
- default UI help content

### Why this matters

This file is the first thing to review before trusting the generated game shell. If assumptions are wrong, the rest of the generated build will still be coherent, but it will be coherent around the wrong idea.

## Mechanic Engine Layer

The first-pass mechanic engine abstraction lives in:

- `math/mechanic_engine.py`

### What it supports now

Current engine profiles:

- `reel-line`
- `cluster-pays`
- `pick-bonus`

### What it does now

It does not yet execute full gameplay simulation for arbitrary mechanics. It currently provides:

- mechanic classification
- mechanic profile description
- board profile selection
- win-condition and bonus-feature metadata shaping

That profile is included in:

- `dist/maths/math_report.json`

### What still needs work

To become a true arbitrary-mechanic engine, it still needs:

- real state transitions
- mechanic-specific simulation logic
- rule-driven balancing
- payout modeling beyond the current template approach

## Art Pipeline Interface

The art pipeline lives in:

- `build_system/art_pipeline.py`

### Purpose

The art pipeline now uses one shared manifest so the frontend does not care whether the assets are placeholders or approved finals.

### Current sources

- Placeholder assets: `frontend/public/assets/generated/<game-slug>/`
- Approved assets: `frontend/public/assets/approved/<game-slug>/`

### Current selection rule

If a complete approved asset set exists, the manifest switches to approved mode. Otherwise it uses generated placeholders.

### Manifest output

- `frontend/src/content/generatedArtManifest.json`

### Frontend behavior

The frontend reads the manifest and renders whichever asset set is active.

This is the main seam to change if we later plug in final art generation or a designer review step.

## Frontend Layer

The frontend is currently a generated game shell in:

- `frontend/`

### Current behavior

It renders:

- generated game title and tagline
- generated board summary
- generated help sections
- generated social-mode wording
- generated or approved assets through the art manifest
- replay parameter preview
- browser-testable UI controls

### Current limitation

This is still a shell, not a full final game client. It is intended to prove spec translation, copy generation, asset routing, and testing.

## Browser Tests

Browser tests live in:

- `frontend/tests/app.spec.js`

Current Playwright setup lives in:

- `frontend/playwright.config.js`

### Current browser checks

The system currently tests:

- generated content renders
- social-mode toggle behavior
- replay query parameter handling
- primary action keyboard binding

### Current test limitation

These are shell-level tests, not deep gameplay tests.

## Agent Mapping

The orchestrator currently maps each agent to a deterministic task.

### Mapped sequence

1. `concept-artist`
2. `stake-developer`
3. `ui-developer`
4. `sound-engineer`
5. `qa-tester`
6. `stake-assures`
7. `content-writer`
8. `devops-agent`
9. `StakeDirector`

### Current meaning

This is an executable task chain, not an external LLM runtime.

## What Is Ready Before Building A Real Game

The system is ready to take a real game overview and produce:

- an assumptions draft
- a generated detailed spec
- generated frontend content
- generated math config
- placeholder or approved asset routing
- a built frontend shell
- browser test results
- submission-ready docs

## What Is Not Fully Ready Yet

These are still incomplete and should be treated as change areas before expecting a production game:

- final production-quality art generation
- full arbitrary-mechanic gameplay execution with no further coding
- safe creative inference of every missing rule from a vague overview
- real backend or RGS integration
- deployment publishing beyond packaging artifacts

## What To Change When We Build A Real Game

If the next step is to build a real game from an overview, these are the main files to review and potentially edit first:

### For requirement parsing behavior

- `build_system/requirements_parser.py`

Change this when we need richer parsing for features like:

- paylines
- cascades
- respins
- cluster rules
- pick mechanics
- feature progression

### For engine behavior

- `math/mechanic_engine.py`
- `math/game_logic.py`

Change these when we need deeper mechanic-specific modeling and simulation.

### For art behavior

- `build_system/art_pipeline.py`

Change this when we want to:

- add art review gates
- enforce required approved asset sets
- support production export formats
- connect a future art-generation service

### For frontend rendering

- `frontend/src/main.js`
- `frontend/src/components/render.js`
- `frontend/src/style.css`

Change these when we want the generated shell to become a more game-specific client.

### For browser testing

- `frontend/tests/app.spec.js`

Change this when we want gameplay-specific tests rather than shell-level checks.

## Editing Guidance

Before changing the system for a real game, review in this order:

1. `docs/Stake_.md`
2. `assumption.md`
3. `dist/submission/generated_spec.md`
4. `dist/submission/spec/game_spec.json`
5. `dist/maths/math_report.json`
6. `dist/submission/system/qa_report.json`
7. `dist/submission/stake_us_submission.md`

If the generated assumptions are wrong, fix the requirements first rather than patching downstream outputs.

## Recommended Next Step

The next sensible step is to provide a real game overview and let the current factory generate the first full pass. After that, we can tune the parser, assumptions, mechanic engine, art pipeline, or tests based on where the output diverges from the intended design.
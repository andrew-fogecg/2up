# Stake.US Submission Draft

Build Status: PASSED

## Game Concept and Core Rules
# Stake Requirements: Stake Game Template Blueprint

## 1. Game Concept
- **Target Audience:** Internal game teams building Stake Engine-ready titles with AI-assisted automation.
- **Icon Concept:** A modern deck-and-circuit emblem that communicates game logic, math, and automated delivery.

## 2. Core Game Rules (DO NOT DEVIATE)
- **RTP Target:** 94.00% for base mode and 94.40% for bonus mode.
- **Max Win Hit-Rate:** Must not exceed 1 in 20,000,000 for the base advertised win.
- **RNG:** Must use Provably Fair system.
- **Social Mode:** UI copy must support GC and SC displays with no `$` prefix.

## 3. Project Tasks
- [x] Core Game Logic blueprint created.
- [x] Payout & RTP handling blueprint created.
- [x] UI hooks blueprint defined for board, help, sounds, and replay handling.
- [x] Agent orchestration and build automation scaffolded.
- [x] Submission content packaging added for Stake.US review.
- [x] Frontend build pipeline added with production output in `dist/frontend/`.

## 4. Artifact Outputs
- `dist/frontend/index.html`
- `dist/maths/math_report.json`
- `dist/submission/assumptions_draft.md`
- `dist/submission/generated_spec.md`
- `dist/submission/spec/game_spec.json`
- `dist/submission/system/frontend_test_report.json`
- `dist/submission/system/agent_inventory.json`
- `dist/submission/requirements_audit.md`
- `dist/submission/action_summary.md`
- `dist/submission/stake_us_submission.md`
- `dist/submission/build_report.json`


## Icon and Visual Direction
- Icon concept: A modern deck-and-circuit emblem that communicates game logic, math, and automated delivery.
- Board layout: 5x3 reel board
- Board summary: Stake Game Template Blueprint uses a 5x3 layout with a clear primary action, review-ready help copy, and submission-friendly compliance panels.

## Math Summary
- base: RTP target 0.9400, estimated RTP 0.9404, max win x5000
- bonus: RTP target 0.9440, estimated RTP 0.9450, max win x8000
- Mode RTP variance: 0.0046
- Disclaimer present: Yes

## UI Copy and Button Labels
### Standard Labels
- primary: SPIN
- amount: BET AMOUNT
- auto: AUTO BET
- history: ROUND HISTORY

### Social Labels
- primary: PLAY
- amount: PLAY AMOUNT
- auto: AUTO PLAY
- history: ROUND HISTORY

## Help Document Content
### Game Flow
Set the play amount, trigger the primary action, and review results for Stake Game Template Blueprint through the history tray and help drawer.
### Requirements Summary
This generated build targets Internal game teams building Stake Engine-ready titles with AI-assisted automation. and follows Must use Provably Fair system. rules with max win hit-rate capped at 1 in 20,000,000.
### Mechanic Profile
Core mechanic: 5x3 reel-spin with line wins. Win conditions: 3 or more matching symbols on adjacent reels award wins. Bonus features: Wild W substitutes and Scatter SC can trigger feature messaging.
### Social Mode Copy
UI copy must support GC and SC displays with no `$` prefix.
### Project Tasks
[x] Core Game Logic blueprint created. [x] Payout & RTP handling blueprint created. [x] UI hooks blueprint defined for board, help, sounds, and replay handling. [x] Agent orchestration and build automation scaffolded. [x] Submission content packaging added for Stake.US review. [x] Frontend build pipeline added with production output in `dist/frontend/`.
### Must-have UI Help
Help content must describe controls, replay behavior, and disclaimer text.

## Social Mode Copy
- Summary: UI copy must support GC and SC displays with no `$` prefix.
- Currency labels: GC, SC
- Restricted words blocked in social mode: bet, wager, buy, payout, gambling

## Build Issues
- None

## Action Log
# Stake Build: Action Items

## 🚨 Blocking Issues
- [x] Initial placeholder requirement document replaced with a build-ready blueprint.
- [x] Math configuration corrected to remove invalid literals and placeholder structure.
- [x] Root build pipeline added to generate auditable artifacts.

## ✅ Completed Fixes
- [x] Agent inventory is now audited automatically during build.
- [x] Frontend bundle is generated into `dist/frontend/` during build.
- [x] Requirements are parsed into generated config and generated frontend content during build.
- [x] Placeholder graphics are generated into `frontend/public/assets/generated/` during build.
- [x] Browser-based frontend tests now run during build.
- [x] Requirements and action documents are exported into `dist/submission/` during build.
- [x] Math compliance report is exported into `dist/maths/` during build.
- [x] Stake.US submission draft is exported into `dist/submission/` during build.
- [x] GitHub Actions workflow can trigger and archive the build artifacts.




## Submission Notes
- UI copy must support GC and SC displays with no `$` prefix.
- Help docs and button labels must stay aligned with Stake.US wording restrictions.
- QA and Stake Assures review should be re-run after each UI or math change.

# Stake Build: Action Items

## 🚨 Blocking Issues
- [x] Initial placeholder requirement document replaced with a build-ready blueprint.
- [x] Math configuration corrected to remove invalid literals and placeholder structure.
- [x] Root build pipeline added to generate auditable artifacts.
- [ ] **[QA FAIL — CURRENCY-03]** `SC`/`XSC`/`GC`/`XGC` have `decimals: 0` hardcoded in `CURRENCY_META` (TwoUpGame.js lines 19–22) and the stake input uses `step="1"` (main.js). No `decimalsFromStepMicro` implementation exists. Fractional SC/GC bet levels (e.g. 0.1 SC) are invisible and unreachable. **Must derive decimal count from step before submission.**
- [ ] **[QA FAIL — SEC-02 / XSS]** The `?currency=` URL query parameter is read in `getReplayContext()` and interpolated unsanitised into `innerHTML` in both `buildGameHTML()` and `addHistoryEntry()` (main.js). A crafted URL is a stored XSS vector. **Must sanitise or use `textContent` for all URL-sourced values before submission.**
- [ ] **[QA FAIL — COMP-04]** "Malfunction voids all pays" disclaimer is defined in `gameContent.json` and `generatedGameContent.json` but is **never rendered in the live game UI**. Compliance requirement not met. **Must display disclaimer in `buildGameHTML()` before submission.**

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



# Stake Build: Action Items

## 🚨 Blocking Issues
- [x] Initial placeholder requirement document replaced with a build-ready blueprint.
- [x] Math configuration corrected to remove invalid literals and placeholder structure.
- [x] Root build pipeline added to generate auditable artifacts.
- [x] **[QA FAIL — CURRENCY-03]** `SC`/`XSC`/`GC`/`XGC` now derive wager input precision from an explicit social-currency input step, allowing fractional stakes such as `0.1 SC` to be entered and rendered correctly.

## ⚠️ Non-Blocking Follow-Ups
- [x] Add an automated regression test that proves the live footer renders the malfunction disclaimer text.
- [x] Add an automated regression test for fractional `SC`/`GC` stake entry once the precision fix lands.
- [x] Ignore generated Playwright screenshot review artifacts so QA runs do not leave a large dirty worktree.

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



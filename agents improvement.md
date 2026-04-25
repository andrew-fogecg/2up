# Agents Improvement

## Why this file exists

HeadsOrTails initially failed Stake maths upload with `file not found: index.json` even though the local build pipeline passed. Acey Deucey in `/Users/agaspar/Documents/GitHub/stake-app/Acey Deucey` already had a passing upload flow. The agent process should have learned from that repo earlier instead of inventing a new output contract and only discovering the mismatch after upload.

## What Acey Deucey does better

1. It has an explicit distribution build path.
   Acey Deucey uses `npm run build:dist` via `scripts/build-dist.mjs` instead of assuming the normal app build is also the upload build.

2. It treats upload structure as a first-class artifact contract.
   Acey Deucey writes a dedicated maths upload folder with an entry manifest and referenced files, not just an internal compliance report.

3. It validates the upload payload, not just the app.
   Acey Deucey has `scripts/validate-dist.mjs` to verify folder structure, index manifest presence, and internal file consistency.

4. It keeps frontend and maths packaging separate.
   Acey Deucey builds `dist/front` and `dist/math` as explicit deployment outputs instead of relying only on generic review artifacts.

5. It generates maths in the format the uploader expects.
   Acey Deucey creates an `index.json` that points to concrete per-mode files. That is a publishing contract, not documentation.

## What the agent missed in HeadsOrTails

1. The agent optimized for internal build success instead of upload success.
   `python build.py` passing was treated as sufficient even though Stake upload compatibility had not been validated.

2. The agent did not compare with the known-good sibling repo early enough.
   Acey Deucey was available locally and should have been used as the reference implementation before changing maths packaging.

3. The agent assumed one universal maths artifact format.
   It produced `dist/maths/math_report.json` first, but the actual uploader expected an entry file like `index.json`.

4. The agent did not distinguish between review artifacts and upload artifacts.
   A compliance report is useful for QA, but it is not automatically a Stake Engine publish payload.

5. The agent left hardcoded product identity in packaging.
   Even after renaming to HeadsOrTails, release archives and frontend shell metadata still carried template-era names until explicitly corrected.

## New agent rules

1. Before changing dist packaging, inspect any passing sibling repo in the same workspace or parent directory.
   If a known-good Stake game exists nearby, treat it as the first packaging reference.

2. Always separate these three questions:
   - Does the app run?
   - Does the local pipeline pass?
   - Does the generated dist match the uploader's contract?

3. For Stake maths outputs, never assume reports are publishable.
   Confirm the required upload entrypoint first: for example `index.json`, `index.js`, or another explicit manifest/module root.

4. Prefer repo-native build scripts over synthesized pipelines.
   If a repo has `build:dist`, `generate-math`, or `validate-dist`, those scripts should be inspected and reused before inventing a new build shape.

5. Add a publishability check to the build flow.
   The pipeline should fail if the expected upload entry file is missing, even when QA and browser tests pass.

6. Treat game naming as a generated artifact concern.
   When the game is renamed, verify all output-facing surfaces:
   - frontend title
   - release zip name
   - generated spec title
   - maths manifest identity
   - submission docs

7. Compare dist folder naming against the target environment.
   Some repos use `dist/front` and `dist/math`; others use `dist/frontend` and `dist/maths`. Agents must not normalize these blindly.

8. Validate the referenced files inside upload manifests.
   If `index.json` exists, confirm every file it points to also exists.

## Recommended process for future agents

1. Find a passing reference implementation first.

2. Identify the exact upload contract:
   - folder name
   - entry file name
   - supporting file set
   - expected schema/module format

3. Build the dist outputs.

4. Run a dedicated validation step against the upload contract.

5. Only then run broader cleanup, naming, and documentation updates.

## HeadsOrTails-specific outcome

The corrected HeadsOrTails build now includes:

- `dist/maths/index.json`
- `dist/maths/math_report.json`
- `dist/submission/releases/headsortails-artifacts.zip`

The main lesson is that the agent should have started from the passing upload repo and the uploader contract, not from the existing internal build abstractions.
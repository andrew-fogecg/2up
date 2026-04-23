# Build System Todo

## High Priority

- Extend the production-art interface so approved assets can be authored, validated, and published as final deliverables.
- Extend the configurable gameplay engine layer beyond the current first-pass reel, cluster, and pick profiles.
- Improve requirement inference so vague concepts can produce richer draft rulesets and contradiction checks.

## Art Pipeline

- Replace placeholder icon generation with production-ready icon composition.
- Generate production-ready symbol sets, board frames, backgrounds, and UI panels.
- Add animation/export support for wins, scatters, and reel motion assets.
- Add a review step for final art approval before packaging.

## Gameplay Engine

- Move from fixed template math to mechanic-driven config generation.
- Support arbitrary win conditions, bonus modes, reel structures, and feature state transitions.
- Add mechanic-specific simulation and balancing hooks.
- Add rule-driven UI component generation from parsed requirements.

## Requirement Inference

- Extract missing assumptions automatically from vague overviews.
- Generate a draft assumption list before build execution.
- Mark inferred rules separately from explicit user requirements.
- Require review/approval before inferred rules are treated as locked requirements.

## Testing

- Expand browser coverage to feature-specific gameplay tests.
- Add regression tests for generated assets and generated config.
- Add validation for inferred-rule completeness and contradiction detection.

## Integration

- Add external model-backed design/code generation as an optional runtime.
- Add backend or RGS integration for real gameplay execution.
- Add deploy publishing beyond the current packaged release archive.
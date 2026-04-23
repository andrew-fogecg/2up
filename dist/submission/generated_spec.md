# Generated Specification: Stake Game Template Blueprint

- Target audience: Internal game teams building Stake Engine-ready titles with AI-assisted automation.
- Icon concept: A modern deck-and-circuit emblem that communicates game logic, math, and automated delivery.
- Core mechanic: 5x3 reel-spin with line wins
- Board layout: 5x3 reel board
- Win conditions: 3 or more matching symbols on adjacent reels award wins.
- Bonus features: Wild W substitutes and Scatter SC can trigger feature messaging.
- Art direction: Bold placeholder art following the icon concept.
- RTP targets: 0.9400, 0.9440
- Max win hit rate: 1 in 20,000,000
- RNG: Must use Provably Fair system.
- Social mode rule: UI copy must support GC and SC displays with no `$` prefix.

## Draft Assumptions
- Core mechanic was not specified, so the parser assumed a 5x3 reel-spin line-win game.
- Board layout was not specified, so the parser assumed a 5x3 reel layout.
- Win conditions were not specified, so the parser assumed left-to-right matching symbol wins.
- Bonus features were not specified, so the parser assumed wild and scatter support only.
- Art direction was not fully specified, so the parser assumed placeholder art based on the icon concept.
- UI help requirements were not fully specified, so the parser assumed standard controls, replay, and disclaimer guidance.

## Parsed Tasks
- [x] Core Game Logic blueprint created.
- [x] Payout & RTP handling blueprint created.
- [x] UI hooks blueprint defined for board, help, sounds, and replay handling.
- [x] Agent orchestration and build automation scaffolded.
- [x] Submission content packaging added for Stake.US review.
- [x] Frontend build pipeline added with production output in `dist/frontend/`.

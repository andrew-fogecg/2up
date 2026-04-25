# Content Build Requirements — HeadsOrTails

**Author:** Stake Content Writer agent  
**Date:** 2026-04-24  
**Project:** HeadsOrTails — pirate-themed Two-Up coin-toss game for Stake.US  

---

## What We Are Building

A Stake.US submission package for **HeadsOrTails**, a digital social-casino adaptation of the traditional Australian Two-Up coin-toss game. The game is built on the Stake Engine and submitted for Stake.US review.

The primary content artifact is a submission-ready markdown document that packages all content required for Stake.US editorial and compliance review into a single file.

### Core Deliverables

| Artifact | Path |
|---|---|
| Primary submission document | `docs/stake_us_submission.md` |
| Submission distribution copy | `dist/submission/stake_us_submission.md` |
| This requirements document | `docs/content_build_requirements.md` |

---

## Game Identity

| Field | Value |
|---|---|
| Official name | HeadsOrTails |
| Tagline | *Come in, Spinner — if ye dare.* |
| Genre | Coin-toss / Two-Up |
| Engine | Stake Engine |
| Theme | Pirate treasure cavern — torchlit, gold doubloons, one-eyed Pirate Captain Boxer |

---

## Math Requirements

All maths are derived from the classical Two-Up probability model documented in `docs/2up.md`.

| Bet | Payout | P(win) | House Edge | RTP |
|---|---|---|---|---|
| HEADS | 1:1 | Determined by Odds Out mechanism | 3.125% | **96.875%** |
| TAILS | 1:1 | Determined by Odds Out mechanism | 3.125% | **96.875%** |
| FIVE ODDS | 28:1 | 0.5⁵ = 3.125% | 9.375% | 90.625% |

**Key insight:** The house edge on HEADS/TAILS does not come from asymmetric payouts. Both outcomes are symmetric 50/50 once a decisive result occurs. The 3.125% edge comes exclusively from the Odds Out rule: five consecutive ODDS cause all HEADS/TAILS bets to lose without a decisive coin result.

---

## Stake.US Compliance Requirements

These rules are mandatory and must be reflected in all player-facing copy. Source: `docs/Stake_.md`.

### Social Mode Copy Rules

1. **Currency labels:** Use `GC` (Gold Coins) or `SC` (Sweeps Coins) — never a `$` prefix or "USD".
2. **Primary action:** Label must be **PLAY** — never BET, SPIN, or WAGER.
3. **Amount label:** **PLAY AMOUNT** — never BET AMOUNT.
4. **Auto rounds:** **AUTO PLAY** — never AUTO BET.
5. **Display format:** `1,000 GC` with comma-separated thousands.

### Provably Fair

All rounds must use HMAC-SHA256 with a pre-committed hashed server seed. The server seed is revealed post-round. Players may change their client seed between rounds.

### Responsible Gambling

All submission documents must include:
- The National Problem Gambling Helpline number: **1-800-522-4700**
- Reference to ncpgambling.org
- Age restriction notice (18+, 19+ in AL/NE)
- Statement that GC/SC have no cash value

---

## Content Sections Required in Submission Document

The submission document must contain all seven sections below. Deviation from this structure will require revision before submission.

1. **Game Overview** — name, tagline, RTP table, theme description, icon description
2. **How to Play** — step-by-step for HEADS, TAILS, and FIVE ODDS bets; Odds Tracker description
3. **Paytable** — all three bets with payout, house edge, and RTP; math derivation notes
4. **Social Mode Compliance** — currency display rules, button/label copy table, mode toggle description
5. **Provably Fair** — HMAC-SHA256 algorithm, seed inputs, hash-to-outcome mapping, verification instructions
6. **Legal Disclaimer** — responsible gambling text, helpline number, age restriction, sweepstakes disclaimer
7. **Technical Specifications** — tech stack, build tool, audio, animation, dependencies, viewport, test framework, colour palette tokens, artifact paths

---

## Source Documents

| Document | Purpose |
|---|---|
| `docs/2up.md` | Game design — rules, terminology, probability, visual design system, component architecture |
| `docs/Stake_.md` | Compliance reference — RTP rules, social mode copy, provably fair requirement, artifact outputs |
| `docs/dead-mens-doubloons-concept.json` | Brand identity — icon design, colour palette tokens, coin symbol SVG specs, background scene |

---

## Style Guidelines for Content

- Write in plain, direct English suitable for a help document audience.
- Do not use marketing superlatives ("amazing", "thrilling", "explosive").
- Use nautical/pirate flavour only in theme descriptions and the tagline — not in instructions or compliance sections.
- All probability statements must be mathematically accurate and traceable to the Two-Up model.
- Use `code formatting` for technical values (hex colours, formula strings, file paths).
- Tables are preferred over prose lists for structured data.

---

## What This Document Is Not

- This is not a legal contract or terms-of-service document.
- This is not a game design specification (see `dist/submission/spec/game_spec.json`).
- This is not a math certification report (see `dist/maths/math_report.json`).

---

*Maintained by the Stake Content Writer agent. Update this file whenever submission requirements change.*

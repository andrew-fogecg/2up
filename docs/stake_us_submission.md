# Stake.US Submission — HeadsOrTails

**Submitted:** 2026-04-24  
**Build Status:** PASSED  
**Open Blockers:** None  

---

## 1. Game Overview

| Field | Value |
|---|---|
| **Official Game Name** | HeadsOrTails |
| **Tagline** | *Come in, Spinner — if ye dare.* |
| **Genre** | Coin-toss / Two-Up |
| **Engine** | Stake Engine |
| **RTP — HEADS bet** | 96.875% |
| **RTP — TAILS bet** | 96.875% |
| **RTP — FIVE ODDS bet** | 90.625% |
| **House Edge — HEADS/TAILS** | 3.125% |
| **House Edge — FIVE ODDS** | 9.375% |
| **RNG** | Provably Fair (HMAC-SHA256) |
| **Platform** | HTML5 — desktop and mobile |

### Theme Description

HeadsOrTails is a pirate-themed digital adaptation of Two-Up, Australia's iconic colonial coin-toss game. Players wager inside a torchlit treasure cavern. A one-eyed Pirate Captain serves as the Boxer, managing rounds and calling the action. Two ancient gold doubloons — bearing a crowned skull on HEADS and crossed cutlasses on TAILS — are launched from a driftwood kip. Players bet on the outcome before each toss.

The game distils Two-Up into three clean bet types — HEADS, TAILS, and FIVE ODDS — and runs entirely client-side with no external service dependencies.

### Icon Description

A single gold doubloon tilted at 15 degrees, skull-side facing forward. The skull wears a tarnished iron crown. The coin rim's serrations catch torch-light. Background: deep navy (`#0D1B2A`) with a radial amber glow. Dimensions: 512 × 512 px. Export formats: PNG @1×/2×/3×, SVG for web.

---

## 2. How to Play

### Overview

Each round, two gold doubloons are tossed from the kip. The result is one of three outcomes:

| Result | Description |
|---|---|
| **HEADS** | Both coins land face-up (skull side) |
| **TAILS** | Both coins land face-down (cutlass side) |
| **ODDS** | One coin each — round continues, toss again |

If ODDS is thrown five times in a row, the Spinner **Odds Out** and all HEADS and TAILS bets lose.

---

### Placing a HEADS Bet

1. Select the **HEADS** bet type from the bet selector.
2. Set your play amount using the amount input.
3. Press **PLAY** — the pirate captain calls *"Come in, Spinner!"*
4. The two doubloons are tossed and animated in the air.
5. **Win:** Both coins land HEADS → your bet pays 1:1.  
   **Push (re-toss):** One HEADS, one TAILS (ODDS) → the coins are tossed again.  
   **Lose:** Both coins land TAILS, or five consecutive ODDS occur (Odds Out).

---

### Placing a TAILS Bet

1. Select the **TAILS** bet type from the bet selector.
2. Set your play amount using the amount input.
3. Press **PLAY**.
4. **Win:** Both coins land TAILS → your bet pays 1:1.  
   **Push (re-toss):** ODDS → coins are tossed again.  
   **Lose:** Both coins land HEADS, or Odds Out occurs.

---

### Placing a FIVE ODDS Bet

1. Select the **FIVE ODDS** bet type from the bet selector.
2. Set your play amount using the amount input.
3. Press **PLAY**.
4. **Win:** The toss produces five consecutive ODDS in a row (Odds Out) → your bet pays 28:1.  
   **Lose:** A decisive HEADS or TAILS result occurs before five consecutive ODDS.

> The FIVE ODDS bet is a single-round proposition. It settles at the end of the round regardless of how many tosses the round takes.

---

### Odds Tracker

A counter in the game UI displays the current consecutive ODDS count for the active round. The indicator illuminates in amber at 3 consecutive ODDS and in red at 4, giving players a clear visual warning that Odds Out is approaching.

---

## 3. Paytable

| Bet Type | Pays | Win Condition | House Edge | RTP |
|---|---|---|---|---|
| HEADS | 1 : 1 | Both coins HEADS before TAILS or Odds Out | 3.125% | 96.875% |
| TAILS | 1 : 1 | Both coins TAILS before HEADS or Odds Out | 3.125% | 96.875% |
| FIVE ODDS | 28 : 1 | Five consecutive ODDS (Odds Out) in one round | 9.375% | 90.625% |

### Math Notes

- **P(HEADS on any single toss)** = 0.25 (two independent fair coins)
- **P(TAILS on any single toss)** = 0.25
- **P(ODDS on any single toss)** = 0.50
- **P(Odds Out — five consecutive ODDS)** = 0.5⁵ = 0.03125 = 3.125%
- **HEADS/TAILS RTP derivation:** Without the Odds Out rule, HEADS and TAILS are symmetric 50/50 propositions. The 3.125% house edge arises entirely from the Odds Out mechanism: if five ODDS occur, the bettor loses even without the opposing result landing. Expected return = 1 − 0.03125 = **0.96875**.
- **FIVE ODDS RTP derivation:** P(win) = 1/32; payout = 29 units returned on a 1-unit stake; expected return = 29/32 = **0.90625**.
- **Max win multiplier:** 28× stake (FIVE ODDS bet).

---

## 4. Social Mode Compliance

HeadsOrTails supports both Gold Coin (GC) and Sweeps Coin (SC) play modes in full compliance with Stake.US social casino standards.

### Currency Display Rules

| Rule | Implementation |
|---|---|
| Currency label in social mode | **GC** (Gold Coins) or **SC** (Sweeps Coins) |
| Dollar sign prefix | **Never used** — no `$` prefix in any UI element |
| Amount display format | `1,000 GC` / `1,000 SC` |
| Wallet balance label | `Balance: 1,000 GC` |
| Win banner | `+500 GC` |
| Loss state | `−100 GC` |

### Button and Label Copy

| Context | Label |
|---|---|
| Primary action | **PLAY** |
| Play amount field | **PLAY AMOUNT** |
| Automated rounds | **AUTO PLAY** |
| Round history | **ROUND HISTORY** |

> The word **BET** is never used in any player-facing button label, field label, or prompt. All copy uses PLAY variants exclusively.

### Mode Toggle

A GC/SC mode toggle is visible at all times in the top navigation bar. Switching modes recalculates and redisplays all balances and amounts in the corresponding coin denomination without page reload.

---

## 5. Provably Fair

HeadsOrTails uses the **HMAC-SHA256** provably fair system consistent with Stake Engine standards.

### How It Works

Each round result is determined by three inputs:

| Input | Description |
|---|---|
| **Server Seed (hashed)** | A secret value generated by the server before the round. The SHA-256 hash is shown to the player before the round begins — proving the server cannot alter the result after the fact. |
| **Client Seed** | A value provided or accepted by the player. Players may change their client seed at any time between rounds. |
| **Nonce** | An incrementing integer that ensures each round produces a unique result even when seeds are unchanged. |

### Verification

The round outcome is computed as:

```
HMAC-SHA256(serverSeed, clientSeed + ":" + nonce)
```

The resulting hash is converted to a floating-point value in [0, 1). This value is mapped to coin outcomes:

- `[0.00, 0.25)` → HEADS  
- `[0.25, 0.50)` → TAILS  
- `[0.50, 1.00)` → ODDS  

Each of the two coins is derived from independent byte slices of the same hash output, ensuring genuine independence between the two coins.

After each round, the unhashed server seed is revealed. Players can verify every historical result using the disclosed server seed, their client seed, and the nonce in any standard HMAC-SHA256 tool.

---

## 6. Legal Disclaimer

> **HeadsOrTails** is a social casino game available on Stake.US. No real-money wagering occurs. Gold Coins (GC) and Sweeps Coins (SC) have no cash value and cannot be exchanged for currency except as permitted under Stake.US Sweepstakes Rules.
>
> Play is intended for players aged 18 and over (19+ in Alabama and Nebraska). Void where prohibited by law.
>
> If you or someone you know is experiencing difficulty with gambling, free support is available at the **National Problem Gambling Helpline: 1-800-522-4700** or online at **ncpgambling.org**.
>
> Stake.US promotes responsible play. Set play limits, take breaks, and play for entertainment.

---

## 7. Technical Specifications

| Property | Detail |
|---|---|
| **Technology** | HTML5, CSS3, Vanilla JavaScript (ES2020+) |
| **Build Tool** | Vite 5 — production output in `dist/frontend/` |
| **Audio** | Web Audio API — no third-party audio library |
| **Fonts** | Google Fonts: *Pirata One* (display), *IM Fell English* (body) |
| **Animation** | CSS 3D keyframe transforms — no canvas required for coin animation |
| **Storage** | `localStorage` for session wallet balance (social play only) |
| **External Dependencies** | None — all game logic is self-contained |
| **Viewport** | Responsive; minimum supported width 320 px |
| **Accessibility** | ARIA labels on all interactive controls; keyboard-navigable |
| **Test Framework** | Playwright (browser-based integration tests) |
| **RNG** | Client-side HMAC-SHA256; server seed hashed pre-round |

### Colour Palette (Brand Tokens)

| Token | Hex | Usage |
|---|---|---|
| `--treasure-gold` | `#FFD700` | Coin faces, win banners, title highlights |
| `--doubloon-amber` | `#C8860A` | Coin rim gradient, torch halos, secondary accents |
| `--dark-oak` | `#2C1A0E` | Kip plank, panel backgrounds, footer bar |
| `--sea-shadow` | `#0D1B2A` | Page background, cavern deep-shadow, vignette |
| `--torch-orange` | `#FF6B2B` | Torch flame, Odds Out flicker, hot-state buttons |
| `--fog-white` | `#F5ECD7` | Body text, parchment textures, result labels |
| `--blood-red` | `#8B0000` | Loss banners, Odds Tracker danger state |
| `--kelp-green` | `#2D5016` | Win border glow, bet confirmed chip |

### Artifact Outputs

| Artifact | Path |
|---|---|
| Frontend bundle | `dist/frontend/index.html` |
| Math report | `dist/maths/math_report.json` |
| Game spec | `dist/submission/spec/game_spec.json` |
| Frontend test report | `dist/submission/system/frontend_test_report.json` |
| Agent inventory | `dist/submission/system/agent_inventory.json` |
| Requirements audit | `dist/submission/requirements_audit.md` |
| Action summary | `dist/submission/action_summary.md` |
| This document | `dist/submission/stake_us_submission.md` |

---

*Document version 1.0.0 — generated 2026-04-24 by the Stake Content Writer agent.*

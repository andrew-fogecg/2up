# QA Report — Dead Men's Doubloons (Two-Up)
**Date:** 2026-04-24  
**Tester:** Stake QA (Automated)  
**Build:** frontend/src — TwoUpGame.js, main.js, style.css, index.html

---

## ❶ Compliance Checks

| ID | Check | Result | Notes |
|----|-------|--------|-------|
| COMP-01 | Play button NOT labelled "BET" | ✅ PASS | Label is `"COME IN, SPINNER!"` (main.js line ~290) |
| COMP-02 | GC/SC amounts never show `$` prefix | ✅ PASS | `symbolAfter: true` used; format is `"1000 GC"` / `"1000 SC"` |
| COMP-03 | Spacebar bound to play action | ✅ PASS | `e.code === 'Space'` handler in main.js calls `handlePlay()` |
| COMP-04 | "Malfunction voids all pays" disclaimer rendered in UI | ❌ **FAIL** | Disclaimer text exists in `gameContent.json` (line 54) and `generatedGameContent.json` (line 72) but is **never imported or rendered** in the game HTML. No disclaimer is visible to the player. |

---

## ❷ Currency & Bet Input Checks

| ID | Check | Result | Notes |
|----|-------|--------|-------|
| CURRENCY-01 | Unknown currency fallback uses `decimals: 2` | ✅ PASS | `CURRENCY_META[currency] ?? { symbol: currency, decimals: 2 }` (TwoUpGame.js line 29) |
| CURRENCY-02 | Common currencies explicitly listed | ⚠️ WARNING | **Missing entries:** IDR (0 dec), ARS (2 dec), CRC (2 dec), ZAR (2 dec), AED (2 dec), SAR (2 dec), UAH (2 dec), TWD (2 dec), KWD (3 dec), BHD (3 dec), OMR (3 dec). These will fall back to `decimals: 2` which is acceptable for most, but KWD/BHD/OMR would show 2 decimals instead of 3. |
| CURRENCY-03 | SC/GC bet input decimal count derived from step, NOT hardcoded 0 | ❌ **BLOCKING FAIL** | `SC`, `XSC`, `GC`, `XGC` all have `decimals: 0` in `CURRENCY_META` (TwoUpGame.js lines 19–22). The stake input HTML is hardcoded `step="1"` (main.js ~line 220). No `decimalsFromStepMicro` function exists anywhere. Fractional bet levels such as `0.1 SC` are invisible and unreachable. |
| BET-INPUT-01 | No `onClick` on game board wrapper calling `placeBet`/`spin` | ✅ PASS | All click handlers in main.js target specific UI controls (`#play-btn`, `.bet-btn`, `.quick-btn`). No board-area wrapper has a bet-placing handler. |
| BET-INPUT-02 | No `cursor: pointer` on board area during BETTING | ✅ PASS | `cursor: pointer` in style.css is only on `.bet-btn` (line 296), `.quick-btn` (line 386), `.provably-fair summary` (line 453), `.seed-btn` (line 481), and `.play-btn` (line 788). The `.spin-arena`, `.ring-container`, `.sand-ring`, and `.kip` elements have no pointer cursor. |
| BET-INPUT-03 | Reveal only on explicit target (N/A — not a card-reveal game) | ✅ N/A | Two-Up has no player-triggered reveal phase. Coins flip automatically. |

---

## ❸ Balance Checks

| ID | Check | Result | Notes |
|----|-------|--------|-------|
| BALANCE-01 | Optimistic deduction on Play (before resolve) | ✅ PASS | main.js `handlePlay()`: `updateBalance(game.balance - stakeMicro)` is called immediately before `game.startRound()` |
| BALANCE-02 | Authoritative balance applied at reveal | ✅ PASS | After all toss animations complete: `updateBalance(game.balance)` uses the server-resolved `game.wallet` value |

---

## ❹ Game Logic Checks

| ID | Check | Result | Notes |
|----|-------|--------|-------|
| LOGIC-01 | Five consecutive ODDS triggers ODDED_OUT | ✅ PASS | TwoUpGame.js `_runTossLoop()`: `if (this.consecutiveOdds >= 5) return this._resolve('ODDED_OUT', ...)` |
| LOGIC-02 | Wallet stored in micro-units (1 unit = 1,000,000 micro) | ✅ PASS | `const MICRO = 1_000_000` (line 24); `this.wallet = (options.startingBalance ?? 1000) * MICRO` (line 95) |
| LOGIC-03 | HEADS payout 1:1 (net profit = 1× bet) | ✅ PASS | `profit = bet.amount * PAYOUT[BetType.HEADS]` where `PAYOUT.HEADS = 1`; `this.wallet += profit` |
| LOGIC-04 | TAILS payout 1:1 (net profit = 1× bet) | ✅ PASS | `profit = bet.amount * PAYOUT[BetType.TAILS]` where `PAYOUT.TAILS = 1`; `this.wallet += profit` |
| LOGIC-05 | FIVE_ODDS payout 28:1 (net profit = 28× bet) | ✅ PASS | `profit = bet.amount * PAYOUT[BetType.FIVE_ODDS]` where `PAYOUT.FIVE_ODDS = 28`; `this.wallet += profit` |

---

## ❺ Animation Checks

| ID | Check | Result | Notes |
|----|-------|--------|-------|
| ANIM-01 | Coin flip uses Web Animations API | ✅ PASS | `inner.animate([keyframes], options)` in `flipOneCoin()` (main.js) |
| ANIM-02 | Both coins animated independently | ✅ PASS | `Promise.all([flipOneCoin(el.coin1Inner, ..., c1), flipOneCoin(el.coin2Inner, ..., c2)])` — parallel, separate animations |

---

## ❻ Security Checks

| ID | Check | Result | Notes |
|----|-------|--------|-------|
| SEC-01 | No `eval()` usage | ✅ PASS | No `eval(` found in any source file |
| SEC-02 | No `innerHTML` with unsanitised user input | ❌ **FAIL** | `currency` is read from the `?currency=` URL query parameter (`getReplayContext()`, main.js line 9) and interpolated unsanitised into `app.innerHTML` via `buildGameHTML(currency, ...)` and into `entry.innerHTML` in `addHistoryEntry()`. A crafted URL such as `?currency=<img+src=x+onerror=alert(1)>` constitutes a stored XSS vector. |
| SEC-03 | Stake input validated before use | ✅ PASS | `handlePlay()` validates `stakeVal > 0` and `stakeMicro <= game.balance` before calling `startRound()` |

---

## ❼ Bug List

| # | Severity | File | Location | Description |
|---|----------|------|----------|-------------|
| B-01 | **BLOCKING** | `frontend/src/game/TwoUpGame.js` | Lines 19–22 | `SC`, `XSC`, `GC`, `XGC` have `decimals: 0` hardcoded. Combined with `step="1"` in the stake input, fractional SC/GC bet levels (e.g. 0.1 SC) are unrepresentable. Requires `decimalsFromStepMicro(stepMicro)` derivation. |
| B-02 | **BLOCKING** | `frontend/src/main.js` | `buildGameHTML()`, `addHistoryEntry()` | `currency` URL parameter is written to `innerHTML` without sanitisation — XSS vulnerability. Must escape or use `textContent` for dynamic values. |
| B-03 | **FAIL** | `frontend/src/main.js` | `buildGameHTML()` | "Malfunction voids all pays" disclaimer is defined in `gameContent.json` and `generatedGameContent.json` but never rendered in the live game UI. Compliance requirement not met. |
| B-04 | ⚠️ WARNING | `frontend/src/game/TwoUpGame.js` | `CURRENCY_META` (lines 7–23) | 11 currencies absent from lookup table: IDR, ARS, CRC, ZAR, AED, SAR, UAH, TWD, KWD, BHD, OMR. KWD/BHD/OMR will render with 2 decimal places instead of 3 when received from RGS. |

---

## ❽ Overall Verdict

> **FAIL**

Three blocking issues prevent this build from being marked ready for submission:

1. **CURRENCY-03 (B-01):** SC/GC bet decimals hardcoded to 0 — fractional bet levels broken.  
2. **SEC-02 (B-02):** `currency` URL param interpolated into `innerHTML` — XSS vulnerability.  
3. **COMP-04 (B-03):** "Malfunction voids all pays" disclaimer not rendered in game UI — compliance violation.

Fix all three blocking issues and re-run QA before submission.

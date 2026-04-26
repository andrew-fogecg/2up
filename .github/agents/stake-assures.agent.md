---
name: stake-assures
description: Compliance and approval checker for Stake Engine and Stake.US requirements.
model: gpt-4o
---

# Stake Engine Approval Compliance Guide

A comprehensive reference for developing, auditing, and submitting games to Stake Engine / Stake.US. Use this document to ensure every game meets approval standards before submission.

**Stake Engine Docs:** https://stake-engine.com/docs/approval-guidelines
**SDKs:** https://github.com/StakeEngine/web-sdk/ | https://github.com/StakeEngine/math-sdk/ | https://github.com/StakeEngine/ts-client/

---

## Table of Contents

1. [Math Requirements](#1-math-requirements)
2. [RGS Communication](#2-rgs-communication)
3. [Social Mode Compliance — Stake.US](#3-social-mode-compliance--stakeus)
4. [Game Rules & Info Modal](#4-game-rules--info-modal)
5. [Disclaimer Text](#5-disclaimer-text)
6. [Responsive Layout Requirements](#6-responsive-layout-requirements)
7. [Controls & Interactions](#7-controls--interactions)
8. [Sounds & Music](#8-sounds--music)
9. [Auto Play](#9-auto-play)
10. [Replay Support](#10-replay-support)
11. [CDN & Asset Support](#11-cdn--asset-support)
12. [Final Submission Checklist](#12-final-submission-checklist)
13. [Test Cases — Full Suite](#13-test-cases--full-suite)
14. [Screen Size Test Matrix](#14-screen-size-test-matrix)

---

## 1. Math Requirements

| Requirement | Rule |
|---|---|
| RTP Range | 90% – 98% |
| Mode RTP Consistency | All modes within ±0.5% of each other |
| Advertised Max Win | Must be achievable — hit rate ≤ 1 in 20,000,000 |
| Base Win Hit Rate | Reasonable: typically 1-in-3 to 1-in-8, never worse than 1-in-20 |

### Audit Checklist — Math
- [ ] RTP for each mode is within the 90–98% range
- [ ] All mode RTPs are within 0.5% of each other (e.g. a 97% game: all modes 96.5–97.5%)
- [ ] Advertised max win multiplier is documented and achievable
- [ ] Max win hit rate is ≤ 1 in 20,000,000
- [ ] Base win hit rate is documented and reasonable
- [ ] Math files are generated and placed in `dist/maths/`
- [ ] Math output files have been set to **Approved** and **Active** in Stake Engine dashboard

---

## 2. RGS Communication

- Use the `rgs_url` query parameter to determine which server to call. Never hardcode the RGS endpoint.
- Handle `sessionID` and `nonce` correctly for every state-changing request.
- Display amounts rounded to 2 decimal places (unless in social mode using internal coin units).
- On disconnection: reload the game to resume any uncompleted round.

### Audit Checklist — RGS
- [ ] `rgs_url` query param is read and all API calls use that URL
- [ ] Changing `rgs_url` in the URL and reloading routes calls to the new server
- [ ] `sessionID` / `nonce` are handled per the Stake Engine RGS spec
- [ ] Amounts display with 2 decimal places (real money mode)
- [ ] Disconnection / reload correctly resumes an uncompleted round

---

## 2a. Currency Display & Bet Amount Input

Correct currency handling is a **common approval-blocker**. These rules must be verified for every currency the game may receive.

### 2a.1 Currency Decimal Places

Stake Engine passes amounts as integer micro-units (1 unit = 1,000,000 micro). Display decimals must come from a currency lookup table, **not** from the micro-unit precision.

| Currency group | Decimals | Examples |
|---|---|---|
| Zero-decimal | 0 | JPY, KRW, IDR, VND, CLP, HUF, XGC, XSC, GC, SC, PYG, XOF, XAF |
| Two-decimal | 2 | USD, EUR, GBP, AUD, CAD, ARS, BRL, MXN, CRC, ZAR, AED, SAR, UAH, TWD, and most others |
| Three-decimal | 3 | KWD, BHD, OMR, JOD, TND |

**Critical rules:**
- The fallback for any currency NOT in the lookup table must default to **2 decimals**, never 6.
- Showing `1000000.000000` for ARS or `160.000000` for RUB is an immediate rejection.
- SC and GC have `decimals: 0` for balance display, but fractional bet levels (e.g. 0.1 SC) are valid — use the step/min-level to derive bet-input decimal count for social coins.

### 2a.2 Bet Amount Input Display

- The full amount (all significant digits + correct decimal places) must always be fully visible in the bet input box — never truncated or clipped.
- Font scaling must account for **both** digit count and currency symbol length: `effectiveLen = digitCount + symbolCharCount`.
- Currency symbols 1 char wide (e.g. `$`, `€`) need less left-padding than 3-char codes (e.g. `ARS`, `SAR`, `NT$`).
- The select/input must reserve right-padding for the native dropdown arrow so it does not obscure the amount.

### 2a.3 Balance Updates

- When a round starts (Play pressed): **immediately** deduct the bet from the displayed balance (optimistic update).
- When the round resolves (reveal): apply the authoritative final balance from the server (which includes any win).
- Players who see their balance unchanged after pressing Play will assume the bet was not taken → complaints.

### 2a.4 Bet Placement — Interaction Rules (CRITICAL)

**A bet must only be placed by pressing the explicit Play/Bet/Spin button.**

The following patterns are **forbidden** and will cause player complaints and rejection:

| Forbidden pattern | Why it's wrong |
|---|---|
| `onClick` on the game board wrapper div that calls `placeBet()` | Player accidentally clicks the board and loses money |
| `onClick` on the card/reel area that calls `placeBet()` during BETTING phase | Same — unintentional bet |
| `cursor: pointer` on the board area during BETTING phase | Implies the board is the play trigger |
| "Click anywhere to start" UX for betting | No disclaimer, no intent — immediate rejection |

**Allowed click interactions on the game area:**
- Clicking the **specific reveal target** (e.g. a face-down card) during the DEALING phase may trigger reveal.
- Clicking Card 1, Card 2, or surrounding board area must do nothing during any phase.
- Auto-play / turbo mode may fire bets programmatically after a confirmed start.

### Audit Checklist — Currency & Bet Input
- [ ] Currency lookup table covers all expected currencies with correct decimal places
- [ ] Fallback for unknown currencies uses `decimals: 2` (NOT 6)
- [ ] SC / GC bet-input decimals derived from step or min-level (not from `decimals: 0`)
- [ ] Balance display shows correct decimal places for every test currency (test: USD, EUR, JPY, KRW, ARS, SC, GC)
- [ ] Full bet amount always visible in the input box — no truncation at any currency or amount
- [ ] Font scales correctly for long amounts with multi-char currency codes (test: ARS 1000000.00, SAR 4000.00)
- [ ] Balance is reduced immediately when Play is pressed (before reveal)
- [ ] Win is added to balance at reveal time (authoritative server balance applied)
- [ ] Clicking the game board / card area during BETTING phase does NOT place a bet
- [ ] No `cursor: pointer` on the board during BETTING phase
- [ ] Only the explicit Play button (and turbo auto-play) can initiate a round

---

## 3. Social Mode Compliance — Stake.US

Social mode is active when any of the following are true:
- URL param: `?social=1` or `?social=true`
- RGS auth response sets social flag
- Hostname contains `stake.us`

### 3.1 Restricted Words — NEVER appear in social mode UI

| Forbidden | Use Instead |
|---|---|
| bet / betting / bet amount | play / play amount |
| wager | play / amount |
| stake (as action) | play / amount |
| buy (bonus context) | — |
| purchase | — |
| gambling | — |
| payout / payouts | multiplier / multipliers |
| win (award context) | award |
| $ prefix on amounts | bare number, GC, or SC label |

### 3.2 Required Text Substitutions

| Element | Real Money | Social (Stake.US) |
|---|---|---|
| Bet button | "Bet" | "Play" |
| Bet amount label | "Bet Amount" | "Play Amount" |
| Bet ± controls | "Bet ±" | "Amount ±" |
| Payout table header | "PAYOUTS" | "MULTIPLIERS" |
| Payout references in rules | "payouts" | "multipliers" |
| Max win label | "Maximum theoretical win" | "Maximum theoretical award" |
| Win result banner | "You Win!" | "NICE!" (or equivalent non-win word) |
| History entries | "Bets" / "rounds" | "Rounds" |
| Disclaimer word "bets" | "bets" | "rounds" |
| Auto-bet button | "Auto Bet" | "Auto Play" or omit |
| Bonus buy button | "Buy Bonus" | remove or relabel without "buy" |
| Insufficient funds error | must not contain "bet" | must not contain "bet" |
| Confirmation popups | must not contain "bet" or "buy" | must not contain "bet" or "buy" |
| Replay window labels | must not contain restricted words | must not contain restricted words |
| Game Info / Button Guide | must not contain restricted words | must not contain restricted words |

### 3.3 Currency Display
- Do **not** prefix amounts with `$` in social mode.
- Use `GC` (Gold Coins) or `SC` (Sweeps Coins) labels where specified.
- Bare numeric values are acceptable if no currency label is provided.

### 3.4 Bet Level Templates
- Social mode games **must** use a bet-level template with the `us_` prefix on Stake Engine.

### Audit Checklist — Social Mode
- [ ] Scan entire UI for "bet", "wager", "payout", "win", "buy", "gambling", "$" — all must be gated by `isSocial`
- [ ] Bet button reads "Play" in social mode
- [ ] Amount field/label reads "Play Amount" or "Amount" in social mode
- [ ] Payout panel reads "MULTIPLIERS" in social mode
- [ ] Game Info / Rules modal has zero restricted words in social mode
- [ ] Button Guide / Help text has zero restricted words in social mode
- [ ] Win result banner uses non-win language in social mode
- [ ] Disclaimer replaces "bets" with "rounds" in social mode
- [ ] No `$` prefix on any displayed amount in social mode
- [ ] SC and GC currencies are supported and display correctly
- [ ] Auto-bet (if present) relabeled in social mode
- [ ] Bonus buy (if present) relabeled or hidden in social mode
- [ ] Insufficient funds message has no restricted words in social mode
- [ ] Confirmation dialogs have no restricted words in social mode
- [ ] Replay window has no restricted words in social mode
- [ ] Bet-level template uses `us_` prefix

---

## 4. Game Rules & Info Modal

Every game must include a Game Info / Rules modal that contains all of the following:

### Required Sections

| Section | Content |
|---|---|
| Multiplier / Payout Table | Clear multipliers for every winning outcome |
| Game Modes | Description and cost for every available mode |
| Win Combinations | Examples of winning and losing outcomes |
| Button Guide | Brief description of every interactive UI element |
| RTP | Theoretical RTP for each mode |
| Max Win | Maximum theoretical multiplier and amount at max configured play amount |
| Disclaimer | See Section 5 |

### Audit Checklist — Game Info
- [ ] Payout / multiplier table covers all winning outcomes
- [ ] Each game mode is described with its cost multiplier
- [ ] Winning and losing examples are shown
- [ ] Button Guide lists every button and its action
- [ ] RTP is stated for every mode
- [ ] Max win multiplier is stated
- [ ] Max win amount at the top configured play amount is stated
- [ ] All text passes social mode scan (no restricted words when `isSocial = true`)
- [ ] Modal is scrollable on small screens (no overflow clipping)
- [ ] Modal backdrop is opaque enough that background buttons are not clickable through it

---

## 5. Disclaimer Text

The following disclaimer (or equivalent) must appear in every game:

> Malfunction voids all pays and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many rounds. Animations are not representative of any physical device, and are for illustrative purposes only. TM and © 2025 Stake Engine.

**Social mode note:** Use "rounds" instead of "bets" throughout the disclaimer.

**Real money mode note:** "bets" is acceptable.

### Audit Checklist — Disclaimer
- [ ] Disclaimer is visible in Game Info or on a dedicated info screen
- [ ] Disclaimer contains all required clauses (malfunction, disconnection, RTP note, animation note, copyright)
- [ ] Social mode: "bets" replaced with "rounds"
- [ ] Copyright year is current

---

## 6. Responsive Layout Requirements

### 6.1 Supported Viewports

| Name | Width | Height | Notes |
|---|---|---|---|
| Desktop | 1200px | 675px | Full layout, all panels visible |
| Laptop | 1024px | 576px | Full layout |
| Popout L | 800px | 450px | Compact landscape layout |
| Popout S | 400px | 225px | Compact landscape layout |
| Mobile L | 425px | 812px | Portrait mobile shell |
| Mobile M | 375px | 667px | Portrait mobile shell |
| Mobile S | 320px | 568px | Portrait mobile shell |

### 6.2 Hard Layout Rules
- **No scrollbars** — the main game frame must never show horizontal or vertical scrollbars
- **No overlap** — board must not intrude into payout/multiplier column on desktop
- **No clipping** — no game content may be hidden by `overflow: hidden` without a scroll escape
- **Safe areas** — account for `env(safe-area-inset-*)` on notched mobile devices
- **Modals** — all popups and modals must have `maxHeight` + `overflowY: auto` so they never overflow the viewport
- **Modal backdrops** — use opacity ≥ 0.75 to prevent background elements from being visually or interactively accessible through the overlay
- **"Too Small" overlay** — if the viewport is below minimum playable size, show a clear overlay (not just a blank screen)
- **Text Boxes** — No text boxes and have free form text or number must be dropdown or have a keyboard that is appropriate for the input. For example, if the input is a number, the keyboard should be numeric.

### 6.3 Breakpoint Behavior

| Width | Expected Behavior |
|---|---|
| ≥ 900px | Single-screen layout — all panels visible simultaneously |
| < 900px | Multi-screen / scroll-snap layout — separate screens for setup, board, results |
| ≤ 480px | Mobile-optimized spacing; cards may stack vertically |

### 6.4 Mobile Portrait Shell Requirements
- Bottom navigation bar must be a sibling of the scroll container, **not** inside it
- Do not add excessive bottom padding to scroll pages to clear the bottom bar — the bar is outside the scroll viewport
- Each page card must have `overflow-y: auto` so content that exceeds card height scrolls rather than clips
- Horizontal scroll-snap pages must snap cleanly with no partial-page visible states

### Audit Checklist — Responsive Layout
- [ ] No horizontal scrollbar at any supported viewport
- [ ] No vertical scrollbar at any supported viewport (outer game frame)
- [ ] Tested at all 7 viewports listed in Section 6.1
- [ ] Desktop: board column does not overlap payout column
- [ ] Mobile portrait: bottom bar does not overlap game content
- [ ] Mobile portrait: all three scroll pages (setup, board, results) visible and functional
- [ ] All modals have `maxHeight` + `overflowY: auto` and do not clip content
- [ ] Modal backdrop opacity ≥ 0.75
- [ ] "Too Small" overlay appears and dismisses correctly at minimum dimensions
- [ ] Cards maintain correct aspect ratio at all sizes
- [ ] Safe-area insets applied to bottom padding on mobile

---

## 7. Controls & Interactions

### Spacebar
- Must be bound to the **primary action button** (Play / Spin / Reveal / Deal) during all active game phases.
- Spacebar must not fire during replay mode, loading, or when a modal is open.

### Confirmation Step (High-Cost Actions)
- Any game mode or feature with a cost **greater than 2× the base bet** requires a confirmation step.
- The confirmation must not be bypassable with a single click.
- Confirmation dialog must not contain restricted words in social mode.

### Audit Checklist — Controls
- [ ] Spacebar triggers the primary action button during normal play
- [ ] Spacebar is disabled when a modal is open
- [ ] Spacebar is disabled during replay mode
- [ ] Any mode/feature costing > 2x base requires a confirmation step
- [ ] Confirmation cannot be triggered with one click
- [ ] Confirmation dialog is social-mode clean

---

## 8. Sounds & Music

- A **sound toggle** must be clearly accessible in the UI at all times.
- Toggling sound off must silence all audio (music + SFX).
- Toggle state should persist within the session.

### Audit Checklist — Sound
- [ ] Sound toggle button is present and accessible
- [ ] Toggle silences all audio (music and SFX)
- [ ] Toggle icon/state clearly reflects on/off status
- [ ] No audio plays before the user has had a chance to disable it on first load

---

## 9. Auto Play

If the game includes an auto-play feature:

- Auto-play must **not** be startable with a single click.
- There must be a confirmation step or settings screen before auto-play begins.
- The button label must be social-mode clean (no "Auto Bet" — use "Auto Play").
- Any auto-play popup or modal must contain no restricted words in social mode.

### Audit Checklist — Auto Play
- [ ] Auto-play requires at minimum 2 interactions to start
- [ ] Button label is social-mode clean
- [ ] Popup/settings modal is social-mode clean
- [ ] Auto-play can be stopped mid-session

---

## 10. Replay Support

Every round must be replayable.

### Requirements
- **Persistent banner** — a clearly visible "REPLAY MODE" banner must be shown for the entire duration of a replay. It must not be dismissable and must not auto-hide.
- **Unique round IDs** — every round must produce a unique event/round ID.
- **Replay URL** — the game must support loading a replay via a URL parameter (e.g. `?replay=<eventId>`).
- **Optional parameters** — replay URLs must support `currency`, `language`, and `amount` overrides.
- **Replay "event"** — at the end of the replay, the player must be able to replay the same round again ("Replay" button or equivalent).
- **UI display during replay** — the replay must clearly show the bet/play cost, any mode multiplier, and the "real" total cost. Example: `BONUS 1 GC — 250 GC REAL COST`.
- **No restricted words** — the replay window and banner must pass the social mode scan.

### Audit Checklist — Replay
- [ ] Replay URL parameter loads the correct round
- [ ] Replay banner is persistent and always visible during replay
- [ ] Banner has no restricted words in social mode
- [ ] `currency` override is respected in replay URL
- [ ] `language` override is respected in replay URL
- [ ] `amount` override is respected in replay URL
- [ ] At end of replay, user can replay the same event again
- [ ] Replay window shows play cost, mode cost multiplier, and real total cost
- [ ] Replay window contains no restricted words in social mode

---

## 11. CDN & Asset Support

- Support a `cdn_url` query parameter. All images, fonts, and sounds must resolve relative to this base URL when it is provided.
- Always maintain local fallbacks if the CDN is unreachable or `cdn_url` is not provided.

### Audit Checklist — CDN
- [ ] `cdn_url` query param is read and assets resolve relative to it
- [ ] Game loads fully without `cdn_url` (local fallback works)
- [ ] All asset types (images, audio, fonts) respect the CDN base URL

---

## 12. Final Submission Checklist

Run this checklist immediately before submitting or re-submitting to Stake Engine.

### Code & Build
- [ ] Front-end build is clean (no errors, no warnings)
- [ ] Upload output is directory-based, never a zip archive
- [ ] `dist/frontend/` contains `index.html`, latest CSS hash, latest JS hash, all assets
- [ ] `dist/maths/` contains math output files
- [ ] The handoff for upload is the `frontend` directory plus the `maths` directory
- [ ] No hardcoded RGS or CDN URLs in source

### Stake Engine Dashboard
- [ ] Bet-level templates applied (social: `us_` prefix template)
- [ ] Front request status: **Approved** and **Active**
- [ ] Math request status: **Approved** and **Active**
- [ ] Game has appeared in `#stake-engine-game-approved` channel
- [ ] Game has appeared in `#stake-engine-us-game-approved` channel (if Stake.US)
- [ ] Approval requests closed once the rocket-ship emoji is applied (game is live)

### Final Verification
- [ ] Ran full social mode scan — zero restricted words in any UI state
- [ ] Tested all 7 viewports — no scrollbars, no overflow, no overlap
- [ ] Verified 10 wins in each game mode match the advertised multiplier table exactly
- [ ] Spacebar binding confirmed working
- [ ] Replay URL loads and plays the correct event
- [ ] Sound toggle works
- [ ] Disclaimer present and correct

---

## 13. Test Cases — Full Suite

### TC-MATH-01: RTP Within Range
**Given** the math output file
**When** I check the RTP for each mode
**Then** all RTPs are between 90% and 98%
**And** all mode RTPs are within 0.5% of each other

### TC-MATH-02: Max Win Achievable
**Given** the advertised max win multiplier
**When** I simulate or inspect the math
**Then** the max win is achievable with a hit rate ≤ 1 in 20,000,000

### TC-RGS-01: Dynamic RGS URL
**Given** the game URL
**When** I append `?rgs_url=https://test-server.example.com`
**Then** all API calls go to `test-server.example.com`, not the default endpoint

### TC-RGS-02: Disconnection Recovery
**Given** a round is in progress
**When** I simulate a network drop (DevTools > offline) and reload
**Then** the game resumes the in-progress round without data loss

### TC-CURRENCY-01: Decimal Places — Common Currencies
**Given** the game is loaded with each of these currencies: USD, EUR, JPY, KRW, ARS, ZAR, AED, SAR, KWD, SC, GC
**When** the balance and bet amount are displayed
**Then**
- USD / EUR show exactly 2 decimal places
- JPY / KRW show 0 decimal places (whole numbers)
- ARS / ZAR / AED / SAR show 2 decimal places (not 6)
- KWD shows 3 decimal places
- SC / GC show 0 decimal places in balance display

### TC-CURRENCY-02: Unknown Currency Fallback
**Given** the game receives an unlisted currency code (e.g. `XYZ`)
**When** the balance is displayed
**Then** it shows 2 decimal places (not 6)
**And** the currency code is used as the symbol

### TC-CURRENCY-03: Bet Amount Always Fully Visible
**Given** a large bet amount combined with a long currency code (e.g. ARS 1000000.00, SAR 4000.00, NT$ 30000.00)
**When** the amount is shown in the bet input control
**Then** the full amount string is completely visible — no truncation, no overlap with the dropdown arrow or currency symbol

### TC-CURRENCY-04: SC/GC Fractional Bet Levels
**Given** social mode with SC currency and bet levels [ 0.1, 0.2, 0.4, 0.8 ]
**When** the bet input is displayed
**Then** all fractional levels are visible and selectable
**And** the input shows the correct decimal places (e.g. 1, not 0)

### TC-CURRENCY-05: Balance Deducted on Play
**Given** a player with balance 100.00 and bet amount 10.00
**When** the player presses Play
**Then** the displayed balance immediately drops to 90.00 (before the reveal)
**When** the round resolves as a win with 2x multiplier
**Then** the displayed balance updates to 110.00 (authoritative server balance)

### TC-BET-01: Board Click Does Not Place Bet
**Given** the game is in the BETTING phase
**When** the player clicks anywhere on the game board / card area (not the Play button)
**Then** no bet is placed
**And** the balance does not change
**And** there is no pointer cursor on the board area

### TC-BET-02: Only Play Button Places Bet
**Given** the game is in the BETTING phase
**When** the player presses the Play button
**Then** a round starts and the bet is deducted
**When** the player clicks the game board instead
**Then** nothing happens

### TC-BET-03: Reveal Restricted to Correct Target
**Given** the game is in the DEALING / reveal phase
**When** the player clicks Card 1 or Card 2 (or any area other than the reveal button or face-down card)
**Then** the third card is NOT revealed
**When** the player clicks the explicit Reveal button or the face-down card
**Then** the third card IS revealed

### TC-SOCIAL-01: Bet Button Label
**Given** social mode (`?social=1`)
**When** I look at the primary action button
**Then** it reads "Play" (not "Bet" or "Wager")

### TC-SOCIAL-02: Play Amount Label
**Given** social mode
**When** I look at the amount input and label
**Then** it reads "Play Amount" or "Amount" (not "Bet Amount")

### TC-SOCIAL-03: Multipliers Panel
**Given** social mode
**When** I open the payout / multiplier panel
**Then** the panel header reads "MULTIPLIERS" (not "PAYOUTS")

### TC-SOCIAL-04: Game Info Scan
**Given** social mode
**When** I open the Game Info / Rules modal
**Then** no section contains: "bet", "betting", "payout", "payouts", "win" (award context), "buy", "wager", "$"

### TC-SOCIAL-05: Win Result Banner
**Given** social mode
**When** a winning round completes
**Then** the result banner does not display "You Win!" or any variation containing "win"

### TC-SOCIAL-06: Disclaimer Scan
**Given** social mode
**When** I view the disclaimer
**Then** it contains "rounds" instead of "bets"
**And** it contains no other restricted words

### TC-SOCIAL-07: Insufficient Funds
**Given** social mode and a zero balance
**When** I attempt to play
**Then** the error message does not contain "bet" or any restricted word

### TC-SOCIAL-08: No Dollar Sign
**Given** social mode
**When** I view any displayed amount (balance, play amount, win amount, history)
**Then** no amount is prefixed with `$`

### TC-SOCIAL-09: SC / GC Currency
**Given** social mode with SC currency
**When** the game loads
**Then** amounts are labeled "SC" (not "$" or "USD")
**Given** social mode with GC currency
**Then** amounts are labeled "GC"

### TC-SOCIAL-10: Replay Window Scan
**Given** social mode
**When** I view a replay
**Then** the replay banner and all UI elements contain no restricted words

### TC-RULES-01: Payout Table Coverage
**Given** the Game Info modal
**When** I review the multiplier / payout table
**Then** every winning outcome is listed with its multiplier

### TC-RULES-02: Win Verification (10 Rounds)
**Given** a working game session
**When** I play 10 rounds and record wins
**Then** each winning round's displayed multiplier matches the advertised payout table exactly

### TC-SOUND-01: Sound Toggle
**Given** the game is loaded
**When** I click the sound toggle to off
**Then** all audio (music and SFX) stops
**When** I click it again
**Then** audio resumes

### TC-SOUND-02: Sound Toggle Accessibility
**Given** any viewport
**When** I look at the UI
**Then** the sound toggle is visible and accessible without scrolling

### TC-SPACEBAR-01: Spacebar Primary Action
**Given** a new round is ready to start
**When** I press the spacebar
**Then** the primary action fires (same as clicking Play / Spin / Deal)

### TC-SPACEBAR-02: Spacebar Blocked During Modal
**Given** a modal is open
**When** I press the spacebar
**Then** the primary action does NOT fire

### TC-AUTOPLAY-01: Auto Play Requires Confirmation
**Given** auto-play is available
**When** I click the auto-play button once
**Then** auto-play does NOT immediately start
**And** a settings or confirmation screen is shown

### TC-REPLAY-01: Replay URL Loads Round
**Given** a round has completed and produced an event ID
**When** I load the game with `?replay=<eventId>`
**Then** the round plays back correctly

### TC-REPLAY-02: Replay Banner Persistent
**Given** a replay is in progress
**When** the replay is playing
**Then** the "REPLAY MODE" banner is visible the entire time
**And** it cannot be dismissed

### TC-REPLAY-03: Replay Optional Parameters
**Given** a replay URL
**When** I append `?currency=SC&language=en&amount=1.00`
**Then** the replay respects all three overrides

### TC-REPLAY-04: Re-Replay At End
**Given** a replay has finished
**When** I look at the end-of-replay UI
**Then** there is a button to replay the same event again

### TC-CDN-01: CDN URL Parameter
**Given** the game URL with `?cdn_url=https://cdn.example.com`
**When** the game loads
**Then** all image, audio, and font assets load from `cdn.example.com`

### TC-CDN-02: No CDN Fallback
**Given** the game URL without `cdn_url`
**When** the game loads
**Then** all assets load from local/default paths and the game functions normally

---

## 14. Screen Size Test Matrix

For each viewport, verify every column. Mark pass (✓), fail (✗), or N/A.

### Viewports

| Viewport | Width | Height |
|---|---|---|
| Desktop | 1200px | 675px |
| Laptop | 1024px | 576px |
| Popout L | 800px | 450px |
| Popout S | 400px | 225px |
| Mobile L | 425px | 812px |
| Mobile M | 375px | 667px |
| Mobile S | 320px | 568px |

### Test Matrix

| Test | Desktop | Laptop | Popout L | Popout S | Mobile L | Mobile M | Mobile S |
|---|---|---|---|---|---|---|---|
| No horizontal scrollbar | | | | | | | |
| No vertical scrollbar (outer frame) | | | | | | | |
| All game controls visible & accessible | | | | | | | |
| No UI overlap / clipping | | | | | | | |
| Play button visible and clickable | | | | | | | |
| Amount control visible and usable | | | | | | | |
| Balance display visible | | | | | | | |
| Sound toggle accessible | | | | | | | |
| Game Info modal opens and scrolls | | | | | | | |
| Game Info modal backdrop opaque | | | | | | | |
| Cards render at correct aspect ratio | | | | | | | |
| Result banner visible after round | | | | | | | |
| History / Last N Rounds visible | | | | | | | |
| "Too Small" overlay (if below minimum) | N/A | N/A | N/A | ✓ needed | N/A | N/A | ✓ needed |
| Spacebar fires primary action | | | | | | | |
| Social mode: all restricted words absent | | | | | | | |
| Disclaimer visible | | | | | | | |

### How to Run Automated Viewport Tests

If the project has Playwright configured:

```bash
npm run test:stake:resolutions
```

This builds the production bundle, launches a preview server, and asserts the key Stake layout constraints at all 7 viewports. Artifacts (screenshots, traces) are written to `test-results/`.

Manual testing steps per viewport:
1. Open Chrome DevTools > Device Toolbar
2. Set custom dimensions to the viewport under test
3. Load the game with `?social=1` appended
4. Work through the test matrix columns above
5. Repeat without `?social=1` for real-money mode checks

---

## Quick Reference — Social Mode Word Swap Cheat Sheet

```
bet / betting / bet amount    →  play / playing / play amount
wager                         →  play / amount
buy (bonus)                   →  [remove or rephrase]
payout / payouts              →  multiplier / multipliers
"You Win!"                    →  "NICE!" or equivalent
"Maximum theoretical win"     →  "Maximum theoretical award"
"bets" (in disclaimer/history)→  "rounds"
Auto Bet                      →  Auto Play
$<amount>                     →  <amount> GC / SC / (bare number)
```

---

*Last updated: 2026-03-26 — based on Stake Engine approval guidelines, Acey Deucey v119 review feedback, and internal audit experience.*

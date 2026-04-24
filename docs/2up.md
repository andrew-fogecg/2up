# 🏴‍☠️ Two-Up: Pirate Treasure Stake Game
### From the Convict Docks to Davy Jones' Locker — A Complete Guide

---

## What Is Two-Up?

Two-Up is **Australia's most iconic gambling game**, with roots stretching back to 18th-century England and Ireland. It arrived on Australian shores via convicts and quickly became embedded in colonial culture. By the 1850s it was roaring on the goldfields, and by World War I it was the game of choice for Anzac soldiers — which is why it remains a beloved Anzac Day tradition to this day.

The rules are beautifully simple: a **Spinner** tosses two coins into the air from a flat wooden paddle called a **kip**. Players bet on the outcome. That's it. That's the whole game.

---

## Core Rules & Terminology

| Term | Meaning |
|------|---------|
| **School** | The whole group of players gathered to gamble |
| **Ring** | The designated circle where the Spinner stands |
| **Spinner** | The player who tosses the coins |
| **Boxer** | The game manager — handles bets, calls the action, takes commission |
| **Ringie** | Calls valid/invalid throws, retrieves the coins |
| **Kip** | The small flat wooden paddle the coins are placed on before tossing |
| **Heads** | Both coins land face-up (probability ~25%) |
| **Tails** | Both coins land face-down (probability ~25%) |
| **Odds / "One Them"** | One head, one tail — bets are frozen and the Spinner tosses again (~50%) |
| **Odding Out** | Five consecutive Odds in a row (probability ~3.1%) — Spinner loses |
| **Come in, Spinner!** | The iconic call when all bets are placed and coins are ready to fly |
| **Barred** | An illegal spin — coins not thrown high enough or landed outside the ring |
| **Cockatoo** | A lookout watching for police (from the illegal two-up school era) |

---

## How a Round Is Played

1. The **Boxer** selects a Spinner and calls **"Come in, Spinner!"**
2. The Spinner places a bet (usually on Heads) — this must be *covered* by another player
3. Side bets are placed between players in the school (shouting amounts and preference)
4. The Spinner balances two coins on the kip and tosses them high in the air
5. The Ringie calls the result:
   - **Two Heads** → Spinner wins, keeps spinning
   - **Two Tails** → Spinner loses, kip passes to the next player
   - **Odds** → All bets freeze, Spinner tosses again
6. Five Odds in a row = **Odding Out** — Spinner loses automatically
7. The Boxer takes a small commission from winning spinner bets

---

## Casino Bet Types & Odds

| Bet | Payout | Casino Edge |
|-----|--------|-------------|
| Single Head (pair of heads before tails/odding out) | 1–1 | 3.125% |
| Single Tail (pair of tails before heads/odding out) | 1–1 | 3.125% |
| Five Odds (spinner odds out before heads or tails) | 28–1 | 9.375% |
| Spinner's Bet (three heads before tails) | 7.5–1 | ~3.4% |

---

## Building the Pirate Two-Up Game

### 🎯 Concept: "Dead Men's Doubloons"

Theme: A **pirate treasure cove** setting. The "Boxer" is a one-eyed pirate captain. The coins are ancient gold doubloons. The kip is a driftwood plank. The ring is drawn in sand on the floor of a torchlit cavern.

---

### 🛠️ Tech Stack

| Layer | Recommended Choice |
|-------|--------------------|
| Frontend | HTML5 + CSS3 + Vanilla JS (or React) |
| Coin Animation | CSS 3D transforms + keyframe animations |
| Sound Effects | Web Audio API |
| State Management | JavaScript class or React `useState` |
| Fonts | Google Fonts — `Pirata One` (display) + `IM Fell English` (body) |
| Storage | `localStorage` for persistent wallet balance |

---

### 🎨 Visual Design System

#### Colour Palette
```css
:root {
  --treasure-gold:    #FFD700;
  --doubloon-amber:   #C8860A;
  --dark-oak:         #2C1A0E;
  --sea-shadow:       #0D1B2A;
  --torch-orange:     #FF6B2B;
  --fog-white:        #F5ECD7;
  --blood-red:        #8B0000;
  --kelp-green:       #2D5016;
}
```

#### Typography
```css
@import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=IM+Fell+English:ital@0;1&display=swap');

h1, .game-title  { font-family: 'Pirata One', cursive; }
body, .game-text { font-family: 'IM Fell English', serif; }
```

#### Background & Atmosphere
- Dark stone/wood texture background (CSS `background-image` with noise overlay)
- Flickering torch light using CSS `@keyframes` brightness animation
- Particle effects (CSS or Canvas) for floating gold dust
- Vignette overlay on the edges

---

### 🪙 Coin Animation — The Heart of the Game

This is the most important visual. Coins should feel **physically real** as they arc up, spin in the air, and slam down.

#### Phase 1: Launch
```css
@keyframes coin-launch {
  0%   { transform: translateY(0)     rotateY(0deg)   scale(1); }
  10%  { transform: translateY(-20px) rotateY(180deg) scale(1.05); }
  50%  { transform: translateY(-280px) rotateY(900deg) scale(0.85); }  /* peak height */
  90%  { transform: translateY(-20px) rotateY(1620deg) scale(1.05); }
  100% { transform: translateY(0)     rotateY(1800deg) scale(1); }
}
```

#### Phase 2: Spinning at Peak Height
```css
/* Blur effect during fast spin to simulate motion */
@keyframes coin-spin-fast {
  0%   { filter: blur(0px);   rotateY(0deg); }
  50%  { filter: blur(2px);   rotateY(540deg); }
  100% { filter: blur(0px);   rotateY(1080deg); }
}
```

#### Phase 3: Landing Reveal
```css
/* Dramatic slow-down as coin settles */
@keyframes coin-land {
  0%   { transform: rotateY(1800deg) translateY(-10px); }
  60%  { transform: rotateY(1830deg) translateY(-5px); }
  80%  { transform: rotateY(1840deg) translateY(-2px); }
  100% { transform: rotateY(1800deg) translateY(0px);  } /* show final face */
}
```

#### Coin Faces (SVG or Canvas)
- **Heads side**: Stylised skull wearing a crown, "HEADS" in gothic lettering
- **Tails side**: Crossed cutlasses over an anchor, "TAILS" in gothic lettering
- Coin rim: Detailed serrated edge with a golden gradient
- Shadow underneath the coin grows as it descends

---

### 🎮 Game Component Architecture

```
PirateTwoUp (root)
├── GameBackground
│   ├── TorchFlicker (animated SVG torches)
│   ├── GoldDustParticles
│   └── WoodPlankTexture
├── GameHeader
│   ├── TitleBanner ("Dead Men's Doubloons")
│   └── PlayerWallet (💰 current balance)
├── BettingRing
│   ├── BetSelector (Heads / Tails / Odds)
│   ├── StakeInput (amount to wager)
│   └── CoverBetDisplay (opponent's wager)
├── SpinArena
│   ├── Kip (wooden paddle graphic)
│   ├── Coin (x2, each independently animated)
│   │   ├── CoinFace (heads or tails SVG)
│   │   └── CoinShadow
│   └── ResultBanner ("COME IN, SPINNER!" / "HEADS!" / "TAILS!" / "ODDS!")
├── OddsTracker
│   └── OddsCounter (tracks consecutive odds, warns at 3+)
└── GameLog
    └── ScrollingHistory (last 10 results)
```

---

### 🎲 Game Logic (JavaScript)

```javascript
class TwoUpGame {
  constructor() {
    this.wallet = 1000;         // Starting doubloons
    this.consecutiveOdds = 0;
    this.spinnerBet = 0;
    this.playerBet = { side: null, amount: 0 };
  }

  tossCoins() {
    // Each coin is truly independent (not correlated)
    const coin1 = Math.random() < 0.5 ? 'H' : 'T';
    const coin2 = Math.random() < 0.5 ? 'H' : 'T';

    if (coin1 === 'H' && coin2 === 'H') return { result: 'HEADS',  coins: [coin1, coin2] };
    if (coin1 === 'T' && coin2 === 'T') return { result: 'TAILS',  coins: [coin1, coin2] };
    return                               { result: 'ODDS',   coins: [coin1, coin2] };
  }

  resolveRound(result, playerBet) {
    if (result === 'ODDS') {
      this.consecutiveOdds++;
      if (this.consecutiveOdds >= 5) return this.oddedOut(playerBet);
      return { outcome: 'TOSS_AGAIN', message: "Odds! Spin again, ye scurvy dog!" };
    }

    this.consecutiveOdds = 0;

    if (playerBet.side === result) {
      const winnings = playerBet.amount * 2;  // 1:1 payout
      this.wallet += winnings;
      return { outcome: 'WIN', message: `${result}! Ye've struck treasure! +${winnings} doubloons` };
    } else {
      this.wallet -= playerBet.amount;
      return { outcome: 'LOSE', message: `${result}! Davy Jones takes yer coins! -${playerBet.amount}` };
    }
  }

  oddedOut(playerBet) {
    this.consecutiveOdds = 0;
    this.wallet -= playerBet.amount;
    return { outcome: 'ODDED_OUT', message: "FIVE ODDS! The curse of the kip! All bets are LOST!" };
  }
}
```

---

### 🔊 Sound Design

| Event | Sound Effect |
|-------|-------------|
| Coins launch | Whoosh + metallic clink |
| Coins spinning (peak) | Ringing shimmer loop |
| Landing - Heads | Triumphant brass sting |
| Landing - Tails | Deep drum thud |
| Odds | Mysterious chord |
| Odding Out | Dramatic pipe organ chord |
| Win | Coins cascading + crowd cheer |
| Lose | Pirate groan + splash |
| "Come in Spinner!" | Gruff pirate voice |

Use the **Web Audio API** or pre-load `.ogg`/`.mp3` files using `<audio>` tags with `preload="auto"`.

---

### 📱 Responsive Layout

```
Desktop (>900px):
┌──────────────────────────────────┐
│         🏴‍☠️ TITLE BANNER          │
├─────────────┬────────────────────┤
│  BETTING    │    SPIN ARENA      │
│  PANEL      │   🪙  🪙           │
│             │                    │
│  [HEADS]    │   KIP BOARD        │
│  [TAILS]    │                    │
│  Stake: __  │  [COME IN SPINNER] │
├─────────────┴────────────────────┤
│         GAME LOG / HISTORY       │
└──────────────────────────────────┘

Mobile (<600px):
Stack vertically — Arena on top, betting below
```

---

### ✨ Pirate Atmosphere Extras

- **Animated treasure chest** opens when player wins big (> 5x their bet)
- **Skull-and-crossbones cursor** (custom CSS cursor)
- **Seagull SFX** on page load
- **Bobbing ship silhouette** in the background using CSS animation
- **Vignette flicker** when "Odding Out" — screen flashes dark red
- **Parrot** character in the corner that comments on outcomes
- **"Wanted" poster** style leaderboard showing top wins

---

### 🚀 Development Milestones

| Phase | Tasks |
|-------|-------|
| **1. Core Game** | Coin toss logic, basic HTML layout, text results |
| **2. Coin Animation** | CSS 3D flip + arc trajectory, two coins independently animated |
| **3. Pirate Theme** | Fonts, colours, background texture, coin face SVGs |
| **4. Betting System** | Wallet, stake input, odds tracking, win/loss resolution |
| **5. Audio** | Sound effects via Web Audio API |
| **6. Polish** | Particles, torch flicker, result banners, game history log |
| **7. Bonus Features** | Leaderboard, achievements, mobile touch support |

---

## Legal Note

Two-Up is legal in Australia on Anzac Day (25 April) at licensed RSL clubs and pubs. The Kalgoorlie Bush Inn in WA operates Australia's only year-round licensed two-up school. Always gamble responsibly. This game is intended as a fun simulation — real-money gambling requires proper licensing.

---

*"Come in, Spinner!" — May yer doubloons always land heads, and yer rum never run dry. 🏴‍☠️*
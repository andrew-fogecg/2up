import { TwoUpGame, BetType, GameState, getCurrencyInputDecimals, getCurrencyInputStep, formatAmount } from './game/TwoUpGame.js';
import SoundEngine from './audio/SoundEngine.js';
import './style.css';

const MICRO_UNITS = 1_000_000;
const sound = new SoundEngine();
document.addEventListener('click', async () => {
  await sound.init();
  applySoundPreference();
}, { once: true });

// --- Replay Context ---
function getReplayContext() {
  const p = new URLSearchParams(window.location.search);
  const socialFlag = ['1','true'].includes((p.get('social') ?? '').toLowerCase());
  const socialHost = /(^|\.)stake\.us$/i.test(window.location.hostname);
  return {
    replay:    p.get('replay') ?? null,
    sessionID: p.get('sessionID') ?? null,
    nonce:     parseInt(p.get('nonce') ?? '1', 10),
    social:    socialFlag || socialHost,
    language:  p.get('language') ?? null,
    currency:  p.get('currency') ?? 'GC',
    amount:    p.get('amount') ? parseFloat(p.get('amount')) : null,
    balance:   p.get('balance') ? parseFloat(p.get('balance')) : null,
  };
}

function getUiCopy(isSocial) {
  return {
    panelTitle: 'Select Outcome',
    stakeLabel: 'Stake',
    potentialLabel: isSocial ? 'Potential Return' : 'Potential Return',
    idlePrompt: 'Choose an outcome and press play.',
    winBanner: isSocial ? 'NICE!' : 'YE WIN!',
    lossBanner: isSocial ? 'TRY AGAIN!' : 'YE LOSE!',
    invalidAmountError: isSocial ? 'Enter a valid amount.' : 'Enter a valid amount.',
    insufficientBalanceError: isSocial
      ? 'Insufficient balance.'
      : 'Insufficient balance.',
    disclaimer: isSocial
      ? 'Malfunction voids all awards and rounds. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many rounds. Animations are not representative of any physical device, and are for illustrative purposes only. TM and © 2026 Stake Engine.'
      : 'Malfunction voids all pays and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many rounds. Animations are not representative of any physical device, and are for illustrative purposes only. TM and © 2026 Stake Engine.',
  };
}

function formatDisplayUnits(units, currency) {
  return formatAmount(Math.round(units * MICRO_UNITS), currency);
}

function buildRulesModalHTML(currency, uiCopy) {
  const amountAtMax = formatDisplayUnits(100, currency);
  const disclaimerTitle = uiCopy.disclaimer.startsWith('Malfunction voids all awards')
    ? 'Malfunction voids all awards and rounds.'
    : 'Malfunction voids all pays and plays.';

  return `
    <div class="rules-backdrop hidden" id="rules-backdrop" aria-hidden="true">
      <div class="rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
        <button class="rules-close-btn" id="rules-close-btn" aria-label="Close game info">×</button>
        <h2 class="rules-title" id="rules-title">Game Info</h2>

        <section class="rules-section">
          <h3>Multipliers</h3>
          <div class="rules-table">
            <div class="rules-row"><span>HEADS</span><strong>1:1</strong></div>
            <div class="rules-row"><span>TAILS</span><strong>1:1</strong></div>
            <div class="rules-row"><span>5 MISMATCHED</span><strong>28:1</strong></div>
          </div>
        </section>

        <section class="rules-section">
          <h3>Game Modes</h3>
          <p>Choose HEADS or TAILS for even-money play, or choose 5 MISMATCHED for the long-shot round that pays on five consecutive mismatches.</p>
        </section>

        <section class="rules-section">
          <h3>Round Flow</h3>
          <p>If both coins land heads, HEADS wins. If both coins land tails, TAILS wins. If one coin lands heads and the other tails, the result is MISMATCHED and the coins are tossed again. Five consecutive mismatches produce ODDED OUT.</p>
        </section>

        <section class="rules-section">
          <h3>Button Guide</h3>
          <ul class="rules-list">
            <li>COME IN, SPINNER!: Starts the next round with the selected play.</li>
            <li>Bet buttons: Choose HEADS, TAILS, or 5 MISMATCHED.</li>
            <li>Quick amount buttons: Set 1, 10, 50, 100, or MAX instantly.</li>
            <li>Provably Fair: Review seed information and rotate seeds between rounds.</li>
          </ul>
        </section>

        <section class="rules-section">
          <h3>RTP & Max Award</h3>
          <p>HEADS and TAILS modes target 96.875% RTP. 5 MISMATCHED targets 90.625% RTP. Maximum theoretical award is 28x the selected amount, or ${amountAtMax} at the current top quick-select amount.</p>
        </section>

        <section class="rules-section">
          <h3>Disclaimer</h3>
          <p>${disclaimerTitle} A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many rounds. Animations are not representative of any physical device, and are for illustrative purposes only. TM and © 2026 Stake Engine.</p>
        </section>
      </div>
    </div>
  `;
}

function getInputStep(currency) {
  const step = getCurrencyInputStep(currency);
  const decimals = getCurrencyInputDecimals(currency);
  if (decimals <= 0) return '1';
  return step.toFixed(decimals);
}

function formatInputUnits(units, currency) {
  const decimals = getCurrencyInputDecimals(currency);
  if (decimals <= 0) return String(Number(units));

  const formatted = Number(units).toFixed(decimals);
  return formatted
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');
}

const REPLAY_STORAGE_KEY = 'headsortails-replays-v1';
const SOUND_STORAGE_KEY = 'headsortails-sound-muted';

function loadStoredReplays() {
  try {
    const raw = window.localStorage.getItem(REPLAY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReplayRound(roundData) {
  try {
    const next = loadStoredReplays().filter(entry => entry.eventId !== roundData.eventId);
    next.unshift(roundData);
    window.localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(next.slice(0, 50)));
  } catch {
    // Replay persistence is best-effort only.
  }
}

function getStoredReplay(eventId) {
  return loadStoredReplays().find(entry => entry.eventId === eventId) ?? null;
}

function buildReplayRound(roundData, replayContext) {
  const displayBetAmount = replayContext.amount && replayContext.amount > 0
    ? Math.round(replayContext.amount * MICRO_UNITS)
    : roundData.betAmount;
  const profitScale = roundData.betAmount > 0 ? displayBetAmount / roundData.betAmount : 1;
  const startBalance = replayContext.balance != null
    ? Math.round(replayContext.balance * MICRO_UNITS)
    : roundData.startBalance;

  return {
    ...roundData,
    betAmount: displayBetAmount,
    profit: Math.round(roundData.profit * profitScale),
    startBalance,
    balance: startBalance + Math.round(roundData.profit * profitScale),
  };
}

function buildReplayBannerHTML() {
  return `
    <div class="replay-banner hidden" id="replay-banner">
      <div class="replay-banner__text" id="replay-banner-text"></div>
      <button class="replay-repeat-btn hidden" id="replay-repeat-btn">REPLAY SAME EVENT</button>
    </div>
  `;
}

function buildSoundToggleHTML() {
  return `<button class="sound-toggle" id="sound-toggle" aria-pressed="false">SOUND ON</button>`;
}

function buildBetIconHTML(betType) {
  if (betType === BetType.HEADS) {
    return `
      <span class="bet-btn-icon bet-btn-icon--coin" aria-hidden="true">
        <img src="/assets/coin-heads.png" alt="" draggable="false" />
      </span>
    `;
  }

  if (betType === BetType.TAILS) {
    return `
      <span class="bet-btn-icon bet-btn-icon--coin" aria-hidden="true">
        <img src="/assets/coin-tails.png" alt="" draggable="false" />
      </span>
    `;
  }

  return `
    <span class="bet-btn-icon bet-btn-icon--pair" aria-hidden="true">
      <img src="/assets/coin-heads.png" alt="" draggable="false" />
      <img src="/assets/coin-tails.png" alt="" draggable="false" />
    </span>
  `;
}

function buildBetLabelHTML(betType) {
  if (betType === BetType.FIVE_ODDS) {
    return `
      <span class="bet-btn-label bet-btn-label--mismatch">
        <span class="bet-btn-count">5</span>
        <span class="bet-btn-copy">Mismatch</span>
      </span>
    `;
  }

  return `<span class="bet-btn-label">${betType}</span>`;
}

// --- Quotes ---
const CAPTAIN_QUOTES = {
  WIN: [
    "Blimey! Ye struck treasure, ye lucky sea dog!",
    "Heads it is! The doubloons are yours, scallywag!",
    "HAR HAR! Fortune favours the bold and the beautiful!",
    "By Davy Jones' beard — ye did it, ye magnificent pirate!",
  ],
  LOSS: [
    "Davy Jones takes yer coins, ye scurvy dog!",
    "The sea gives and the sea takes... mostly takes.",
    "Walk the plank! Yer luck has run dry, landlubber!",
    "Down to the depths with yer doubloons! Try again!",
  ],
  ODDS: [
    "MISMATCHED! The kip demands another toss — come in spinner!",
    "One of each! The coins are mismatched — toss again ye wretch!",
    "Neither heads nor tails! Mismatched — the coins mock ye!",
    "MISMATCHED! The ring is not satisfied yet — spin again!",
  ],
  ODDED_OUT: [
    "FIVE MISMATCHES! THE CURSE OF THE KIP FALLS UPON YE!",
    "Five consecutive mismatches! Davy Jones himself smiles tonight!",
    "THE ANCIENT CURSE! Five mismatches in a row — RUN YE FOOL!",
    "FIVE MISMATCHES! The kip has spoken — YE ARE CURSED, SCALLYWAG!",
  ],
  IDLE: [
    "Choose yer fate and come in, spinner!",
    "The doubloons await... if ye dare.",
    "Toss the coins! Fortune or folly awaits thee!",
    "Are ye a coward or a pirate? STEP TO THE KIP!",
    "The ring is ready — step forward, Spinner!",
    "Choose yer fate, ye bold sea dog!",
  ],
};

const PARROT_QUOTES = {
  WIN:       ['"Pieces of eight!"', '"Gold fer us, lad!"', '"Strike it rich! SQUAWK!"'],
  LOSS:      ['"Davy Jones! SQUAWK!"', '"Walk the plank..."', '"Rough seas ahead..."'],
  ODDS:      ['"Again! Mismatched! KRAWWWK!"', '"Spin it, scurvy dog!"', '"One of each! SQUAWK!"'],
  ODDED_OUT: ['"CURSE! THE CURSE! SQUAWK!"', '"Five mismatches! DOOMED! KRAWWWK!"'],
};

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- SVG Assets ---
const SKULL_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 3a7 7 0 0 0-7 7c0 2.72 1.54 5.1 3.82 6.37L9 19h6l.18-2.63A7 7 0 0 0 12 3z"/>
  <ellipse cx="9.5" cy="10.5" rx="1.5" ry="2" fill="var(--dark-oak,#2C1A0E)"/>
  <ellipse cx="14.5" cy="10.5" rx="1.5" ry="2" fill="var(--dark-oak,#2C1A0E)"/>
  <rect x="9" y="17" width="6" height="3" rx="1" fill="var(--dark-oak,#2C1A0E)"/>
  <line x1="10.5" y1="17" x2="10.5" y2="20" stroke="var(--fog-white,#F5ECD7)" stroke-width="0.8"/>
  <line x1="12" y1="17" x2="12" y2="20" stroke="var(--fog-white,#F5ECD7)" stroke-width="0.8"/>
  <line x1="13.5" y1="17" x2="13.5" y2="20" stroke="var(--fog-white,#F5ECD7)" stroke-width="0.8"/>
</svg>`;

const COIN_HEADS_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="hg" cx="40%" cy="35%" r="65%">
      <stop offset="0%"   stop-color="#FFF0A0"/>
      <stop offset="30%"  stop-color="#E8B840"/>
      <stop offset="65%"  stop-color="#B8860B"/>
      <stop offset="100%" stop-color="#7A5200"/>
    </radialGradient>
    <radialGradient id="hr" cx="50%" cy="50%" r="50%">
      <stop offset="70%"  stop-color="#9A6A00" stop-opacity="0"/>
      <stop offset="100%" stop-color="#5A3800" stop-opacity="0.9"/>
    </radialGradient>
    <filter id="hrough">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="grey"/>
      <feBlend in="SourceGraphic" in2="grey" mode="multiply" result="blend"/>
      <feComponentTransfer in="blend">
        <feFuncA type="linear" slope="1"/>
      </feComponentTransfer>
    </filter>
    <clipPath id="hclip"><circle cx="60" cy="60" r="54"/></clipPath>
  </defs>
  <!-- Base coin -->
  <circle cx="60" cy="60" r="57" fill="#6B4A00"/>
  <circle cx="60" cy="60" r="54" fill="url(#hg)"/>
  <!-- Worn patina patches -->
  <ellipse cx="35" cy="42" rx="9" ry="7" fill="#9A7020" opacity="0.35" clip-path="url(#hclip)"/>
  <ellipse cx="88" cy="78" rx="8" ry="6" fill="#9A7020" opacity="0.3" clip-path="url(#hclip)"/>
  <ellipse cx="70" cy="30" rx="6" ry="5" fill="#C8A840" opacity="0.4" clip-path="url(#hclip)"/>
  <!-- Raised rim -->
  <circle cx="60" cy="60" r="54" fill="none" stroke="#5A3800" stroke-width="3.5" opacity="0.6"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="#FFE070" stroke-width="1" opacity="0.5"/>
  <!-- Rim inscription (arcs) -->
  <path id="htarc" d="M 60 60 m -43 0 a 43 43 0 1 1 86 0" fill="none"/>
  <text font-family="serif" font-size="6.5" fill="#5A3800" opacity="0.85" letter-spacing="1.8">
    <textPath href="#htarc">✦ HEADSORTAILS ✦ STAKE ENGINE</textPath>
  </text>
  <!-- Portrait profile — regal bust facing right -->
  <!-- Neck/shoulder base -->
  <path d="M44 95 Q52 88 60 86 Q68 88 76 95 L80 102 L40 102 Z" fill="#C8860A" opacity="0.7"/>
  <!-- Head -->
  <ellipse cx="60" cy="66" rx="18" ry="21" fill="#D4960C"/>
  <!-- Crown -->
  <path d="M42 58 L44 50 L49 56 L55 44 L60 52 L65 44 L71 56 L76 50 L78 58 Z" fill="#B8780A" stroke="#FFE070" stroke-width="0.8"/>
  <!-- Crown jewels -->
  <circle cx="55" cy="47" r="2.2" fill="#FFE070"/>
  <circle cx="60" cy="53" r="2.5" fill="#FFF0A0"/>
  <circle cx="65" cy="47" r="2.2" fill="#FFE070"/>
  <!-- Face details -->
  <ellipse cx="55" cy="64" rx="3.5" ry="3" fill="#B87010" opacity="0.6"/>
  <ellipse cx="65" cy="64" rx="3.5" ry="3" fill="#B87010" opacity="0.6"/>
  <!-- Eye highlights -->
  <circle cx="54" cy="63" r="1" fill="#FFE090" opacity="0.5"/>
  <circle cx="64" cy="63" r="1" fill="#FFE090" opacity="0.5"/>
  <!-- Nose bridge -->
  <path d="M59 67 Q60 72 61 67" fill="none" stroke="#9A6A00" stroke-width="1.2"/>
  <!-- Mouth -->
  <path d="M55 76 Q60 79 65 76" fill="none" stroke="#9A6A00" stroke-width="1.3"/>
  <!-- Chin shadow -->
  <ellipse cx="60" cy="84" rx="10" ry="4" fill="#9A6A00" opacity="0.3"/>
  <!-- Coin sheen -->
  <ellipse cx="44" cy="46" rx="12" ry="8" fill="white" opacity="0.12" transform="rotate(-25 44 46)"/>
  <!-- Rim shadow -->
  <circle cx="60" cy="60" r="54" fill="url(#hr)"/>
</svg>`;

const COIN_TAILS_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="tg" cx="55%" cy="40%" r="62%">
      <stop offset="0%"   stop-color="#F0E080"/>
      <stop offset="28%"  stop-color="#D4A020"/>
      <stop offset="68%"  stop-color="#A07010"/>
      <stop offset="100%" stop-color="#6A4400"/>
    </radialGradient>
    <radialGradient id="tr" cx="50%" cy="50%" r="50%">
      <stop offset="70%"  stop-color="#9A6A00" stop-opacity="0"/>
      <stop offset="100%" stop-color="#5A3800" stop-opacity="0.9"/>
    </radialGradient>
    <clipPath id="tclip"><circle cx="60" cy="60" r="54"/></clipPath>
  </defs>
  <!-- Base coin -->
  <circle cx="60" cy="60" r="57" fill="#6B4A00"/>
  <circle cx="60" cy="60" r="54" fill="url(#tg)"/>
  <!-- Worn patina patches -->
  <ellipse cx="82" cy="38" rx="8" ry="6" fill="#9A7020" opacity="0.3" clip-path="url(#tclip)"/>
  <ellipse cx="30" cy="75" rx="7" ry="5" fill="#9A7020" opacity="0.28" clip-path="url(#tclip)"/>
  <ellipse cx="72" cy="88" rx="6" ry="5" fill="#C8A840" opacity="0.35" clip-path="url(#tclip)"/>
  <!-- Raised rim -->
  <circle cx="60" cy="60" r="54" fill="none" stroke="#5A3800" stroke-width="3.5" opacity="0.6"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="#FFE070" stroke-width="1" opacity="0.5"/>
  <!-- Rim inscription -->
  <path id="ttarc" d="M 60 60 m -43 0 a 43 43 0 1 1 86 0" fill="none"/>
  <text font-family="serif" font-size="6.5" fill="#5A3800" opacity="0.85" letter-spacing="1.8">
    <textPath href="#ttarc">✦ ANNO DOMINI MDCCXLVII ✦ HISPANIA</textPath>
  </text>
  <!-- Quartered coat of arms cross -->
  <!-- Vertical bar -->
  <rect x="55" y="22" width="10" height="76" rx="2" fill="#B8780A" opacity="0.85"/>
  <!-- Horizontal bar -->
  <rect x="22" y="55" width="76" height="10" rx="2" fill="#B8780A" opacity="0.85"/>
  <!-- Cross highlight -->
  <rect x="56.5" y="22" width="2" height="76" rx="1" fill="#FFE070" opacity="0.35"/>
  <rect x="22" y="56.5" width="76" height="2" rx="1" fill="#FFE070" opacity="0.35"/>
  <!-- Four quadrant emblems -->
  <!-- Q1 top-left: castle tower -->
  <rect x="35" y="32" width="14" height="16" rx="1" fill="#9A6A00" opacity="0.8"/>
  <rect x="33" y="29" width="5" height="6" rx="1" fill="#9A6A00" opacity="0.8"/>
  <rect x="40" y="29" width="5" height="6" rx="1" fill="#9A6A00" opacity="0.8"/>
  <rect x="38" y="38" width="4" height="10" rx="1" fill="#6A4400" opacity="0.6"/>
  <!-- Q2 top-right: rampant lion (simplified) -->
  <ellipse cx="82" cy="34" rx="7" ry="8" fill="#9A6A00" opacity="0.75"/>
  <ellipse cx="78" cy="30" rx="4" ry="4" fill="#B88020" opacity="0.8"/>
  <path d="M75 38 Q79 46 83 42 Q87 46 83 50" fill="none" stroke="#9A6A00" stroke-width="2.5" opacity="0.7"/>
  <!-- Q3 bottom-left: anchor -->
  <circle cx="38" cy="74" r="5" fill="none" stroke="#9A6A00" stroke-width="2.2" opacity="0.8"/>
  <line x1="38" y1="79" x2="38" y2="92" stroke="#9A6A00" stroke-width="2.2" opacity="0.8"/>
  <line x1="30" y1="90" x2="46" y2="90" stroke="#9A6A00" stroke-width="2" opacity="0.8"/>
  <path d="M30 90 Q34 95 38 92 Q42 95 46 90" fill="none" stroke="#9A6A00" stroke-width="2" opacity="0.8"/>
  <!-- Q4 bottom-right: six-point star -->
  <polygon points="82,72 84.3,78 90.6,78 85.7,82 87.5,88.3 82,85 76.5,88.3 78.3,82 73.4,78 79.7,78" fill="#9A6A00" opacity="0.75"/>
  <!-- Centre boss -->
  <circle cx="60" cy="60" r="7" fill="#C8900A" stroke="#FFE070" stroke-width="1.2" opacity="0.9"/>
  <circle cx="60" cy="60" r="4" fill="#FFE070" opacity="0.6"/>
  <!-- Coin sheen -->
  <ellipse cx="46" cy="44" rx="11" ry="7" fill="white" opacity="0.12" transform="rotate(-25 46 44)"/>
  <!-- Rim shadow -->
  <circle cx="60" cy="60" r="54" fill="url(#tr)"/>
</svg>`;

const SHIP_SVG = `<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 95 Q70 74 92 68 L92 38 L98 38 L98 14 L102 14 L102 38 L108 38 L108 68 Q180 62 250 66 Q320 62 392 68 L392 38 L398 38 L398 14 L402 14 L402 38 L408 38 L408 68 Q430 74 440 95 Q320 112 250 114 Q180 112 60 95 Z" fill="#1a0f06"/>
  <path d="M100 16 L100 65 L135 54 Z" fill="#2C1A0E"/>
  <path d="M400 16 L400 65 L435 54 Z" fill="#2C1A0E"/>
  <path d="M100 8 L100 19 L116 13 Z" fill="#8B0000"/>
  <path d="M400 8 L400 19 L416 13 Z" fill="#8B0000"/>
  <rect x="245" y="30" width="10" height="36" fill="#2C1A0E"/>
  <path d="M255 32 L255 64 L282 55 Z" fill="#2C1A0E"/>
  <path d="M255 24 L255 34 L268 29 Z" fill="#8B0000"/>
</svg>`;

// --- HTML Builder ---
function buildGameHTML(currency, balance, uiCopy) {
  const skullsHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="skull-icon" data-index="${i}">${SKULL_ICON_SVG}</span>`
  ).join('');

  return `
<div class="game-root">

  ${buildReplayBannerHTML()}

  <div class="cavern-bg">
    <div class="vignette"></div>
    <div class="gold-dust-container" id="gold-dust"></div>
  </div>

  <div class="ship-silhouette">${SHIP_SVG}</div>

  <div class="parrot-zone" id="parrot-zone">
    <div class="speech-bubble parrot-bubble" id="parrot-bubble"></div>
    <div class="parrot" id="parrot">&#x1F99C;</div>
  </div>

  <header class="game-header">
    <div class="balance-bar">
      <div class="balance-display">&#x1F4B0; <span id="balance-value">${formatDisplayUnits(balance, currency)}</span></div>
      <div class="session-id" id="session-display"></div>
      ${buildSoundToggleHTML()}
    </div>
  </header>

  <main class="game-layout">

    <aside class="betting-panel">
      <h2 class="panel-title">&#x2694;&#xFE0F; ${uiCopy.panelTitle}</h2>

      <div class="bet-type-selector" id="bet-type-selector">
        <button class="bet-btn bet-btn--heads active" data-bet="HEADS">
          ${buildBetIconHTML(BetType.HEADS)}
          ${buildBetLabelHTML(BetType.HEADS)}
          <span class="bet-btn-odds">1:1</span>
        </button>
        <button class="bet-btn bet-btn--tails" data-bet="TAILS">
          ${buildBetIconHTML(BetType.TAILS)}
          ${buildBetLabelHTML(BetType.TAILS)}
          <span class="bet-btn-odds">1:1</span>
        </button>
        <button class="bet-btn bet-btn--odds" data-bet="FIVE_ODDS">
          ${buildBetIconHTML(BetType.FIVE_ODDS)}
          ${buildBetLabelHTML(BetType.FIVE_ODDS)}
          <span class="bet-btn-odds">28:1</span>
        </button>
      </div>

      <div class="stake-section">
        <label class="stake-label">${uiCopy.stakeLabel}</label>
        <div class="stake-input-row">
          <input type="number" id="stake-input" class="stake-input"
            min="${getInputStep(currency)}" step="${getInputStep(currency)}" value="10" autocomplete="off" />
          <span class="stake-currency-label" id="stake-currency-label">${currency}</span>
        </div>
        <div class="quick-stakes">
          <button class="quick-btn" data-stake="1">1</button>
          <button class="quick-btn" data-stake="10">10</button>
          <button class="quick-btn" data-stake="50">50</button>
          <button class="quick-btn" data-stake="100">100</button>
          <button class="quick-btn" data-stake="max">MAX</button>
        </div>
      </div>

      <div class="potential-win-row">
        <span class="potential-win-label">${uiCopy.potentialLabel}</span>
        <span class="potential-win-value" id="potential-win-value">${formatDisplayUnits(20, currency)}</span>
      </div>

      <div class="odds-streak-section">
        <div class="odds-streak-title">&#x26A0;&#xFE0F; Mismatch Streak</div>
        <div class="skulls-row" id="skulls-row">${skullsHTML}</div>
        <div class="odds-count-display" id="odds-count-display">0 of 5</div>
      </div>

      <details class="provably-fair">
        <summary>&#x1F512; Provably Fair</summary>
        <div class="seed-info">
          <div class="seed-row">
            <label>Server Seed Hash:</label>
            <span class="seed-value" id="server-seed-hash">Generating&hellip;</span>
          </div>
          <div class="seed-row">
            <label>Client Seed:</label>
            <input type="text" id="client-seed-input" class="seed-input"
              maxlength="64" placeholder="Enter custom seed&hellip;" />
          </div>
          <button class="seed-btn" id="rotate-seed-btn">&#x1F504; Rotate Seeds</button>
        </div>
      </details>

      <button class="info-btn" id="info-btn">&#x2139; Game Info</button>
    </aside>

    <section class="spin-arena">

      <div class="captain-zone" id="captain-zone">
        <div class="captain" id="captain">&#x1F3F4;&#x200D;&#x2620;&#xFE0F;</div>
        <div class="speech-bubble captain-bubble" id="captain-bubble">
          ${uiCopy.idlePrompt}
        </div>
      </div>

      <div class="ring-container">
        <div class="gameboard">
          <div class="kip-area">
            <div class="coins-on-kip">
              <div class="coin" id="coin-1">
                <div class="coin-inner" id="coin-1-inner">
                  <div class="coin-face"><img class="coin-img" src="/assets/coin-heads.png" alt="" draggable="false"></div>
                </div>
                <div class="coin-shadow" id="coin-1-shadow"></div>
              </div>
              <div class="coin" id="coin-2">
                <div class="coin-inner" id="coin-2-inner">
                  <div class="coin-face"><img class="coin-img" src="/assets/coin-heads.png" alt="" draggable="false"></div>
                </div>
                <div class="coin-shadow" id="coin-2-shadow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="result-banner" id="result-banner">
        <span class="result-text" id="result-text"></span>
      </div>

      <div class="toss-counter" id="toss-counter" style="display:none">
        Toss <span id="toss-num">1</span>
      </div>

      <div class="play-btn-wrapper">
        <button class="play-btn" id="play-btn">
          <span class="play-btn-text" id="play-btn-text">PLAY</span>
          <span class="spacebar-hint">[SPACE]</span>
        </button>
        <div class="error-message" id="error-message"></div>
      </div>

    </section>

    <aside class="voyage-log-panel">
      <h3 class="voyage-log-title">&#x1F4DC; Voyage Log</h3>
      <div class="history-list" id="history-list">
        <div class="history-empty">No voyages yet, scallywag.</div>
      </div>
    </aside>

  </main>

  <div class="screen-flash" id="screen-flash"></div>

  <footer class="game-footer">
    <p class="malfunction-notice">${uiCopy.disclaimer}</p>
  </footer>

  ${buildRulesModalHTML(currency, uiCopy)}

</div>`;
}

// Allowlist of valid currency codes to prevent XSS via URL params
const VALID_CURRENCIES = new Set([
  'GC','XGC','SC','XSC','USD','EUR','GBP','AUD','CAD','BRL','MXN',
  'JPY','KRW','IDR','ARS','CRC','ZAR','AED','SAR','UAH','TWD',
  'KWD','BHD','OMR',
]);

// --- Init ---
const replayCtx = getReplayContext();
const storedReplay = replayCtx.replay ? getStoredReplay(replayCtx.replay) : null;
const replayRound = storedReplay ? buildReplayRound(storedReplay, replayCtx) : null;
const replayMissing = Boolean(replayCtx.replay && !replayRound);
const isReplayMode = Boolean(replayRound);
const isSocialMode = replayCtx.social || replayRound?.social === true;
const uiCopy = getUiCopy(isSocialMode);
const rawCurrency = (replayCtx.currency || replayRound?.currency || '').toUpperCase();
const currency  = VALID_CURRENCIES.has(rawCurrency) ? rawCurrency : 'GC';
const startBal  = replayRound ? replayRound.startBalance / MICRO_UNITS : (replayCtx.balance ?? 1000);
const game      = new TwoUpGame({ currency, startingBalance: startBal });

if (replayCtx.language) {
  document.documentElement.lang = replayCtx.language;
}

const app = document.getElementById('app');
app.innerHTML = buildGameHTML(currency, startBal, uiCopy);

// --- DOM refs ---
const $ = id => document.getElementById(id);
const el = {
  balance:         $('balance-value'),
  sessionDisp:     $('session-display'),
  soundToggle:     $('sound-toggle'),
  playBtn:         $('play-btn'),
  playBtnText:     $('play-btn-text'),
  stakeInput:      $('stake-input'),
  potentialWin:    $('potential-win-value'),
  betSelector:     $('bet-type-selector'),
  skullsRow:       $('skulls-row'),
  oddsCount:       $('odds-count-display'),
  resultBanner:    $('result-banner'),
  resultText:      $('result-text'),
  captainBubble:   $('captain-bubble'),
  parrotBubble:    $('parrot-bubble'),
  captain:         $('captain'),
  historyList:     $('history-list'),
  chestLeft:       $('chest-left'),
  chestRight:      $('chest-right'),
  screenFlash:     $('screen-flash'),
  serverSeedHash:  $('server-seed-hash'),
  clientSeedInput: $('client-seed-input'),
  rotateSeedBtn:   $('rotate-seed-btn'),
  errorMsg:        $('error-message'),
  goldDust:        $('gold-dust'),
  tossCounter:     $('toss-counter'),
  tossNum:         $('toss-num'),
  coin1Inner:      $('coin-1-inner'),
  coin2Inner:      $('coin-2-inner'),
  coin1Shadow:     $('coin-1-shadow'),
  coin2Shadow:     $('coin-2-shadow'),
  infoBtn:         $('info-btn'),
  rulesBackdrop:   $('rules-backdrop'),
  rulesCloseBtn:   $('rules-close-btn'),
  replayBanner:    $('replay-banner'),
  replayBannerText:$('replay-banner-text'),
  replayRepeatBtn: $('replay-repeat-btn'),
};

// --- State ---
let selectedBet   = BetType.HEADS;
let isSpinning    = false;
let tossBuffer    = [];
let pendingResult = null;
let isRulesOpen   = false;
let replayComplete = false;
let isSoundMuted = window.sessionStorage.getItem(SOUND_STORAGE_KEY) === '1';

el.sessionDisp.textContent  = isReplayMode ? `Replay: ${replayRound.eventId}` : `Session: ${game.sessionID}`;
el.clientSeedInput.value    = game.clientSeed;

const hashPoller = setInterval(() => {
  if (game.serverSeedHash) {
    el.serverSeedHash.textContent = game.serverSeedHash.slice(0, 20) + '...';
    clearInterval(hashPoller);
  }
}, 100);

// --- Game callbacks (buffer only) ---
game.onCoinToss   = (c1, c2, result, idx) => tossBuffer.push({ c1, c2, result, idx });
game.onWin        = (profit, balance)      => { pendingResult = { type: 'win',  profit, balance }; };
game.onLoss       = (loss,   balance)      => { pendingResult = { type: 'loss', amount: loss, balance }; };
game.onOddsStreak = ()                     => {};
game.onOddedOut   = (balance)              => {
  if (pendingResult) { pendingResult.oddedOut = true; pendingResult.balance = balance; }
  else pendingResult = { type: 'loss', amount: 0, balance, oddedOut: true };
};
game.onStateChange = () => {};
game.onError       = msg => showError(msg);

// --- Gold dust particles ---
(function spawnParticles() {
  for (let i = 0; i < 30; i++) {
    const p   = document.createElement('div');
    const driftX = (Math.random() - 0.4) * 70;
    p.className = 'gold-particle';
    p.style.cssText = [
      `left:${15 + Math.random() * 70}%`,
      `bottom:${3 + Math.random() * 38}%`,
      `animation-delay:${(Math.random() * 5).toFixed(2)}s`,
      `animation-duration:${(3.5 + Math.random() * 4).toFixed(2)}s`,
      `width:${(2 + Math.random() * 3).toFixed(1)}px`,
      `height:${(2 + Math.random() * 3).toFixed(1)}px`,
      `--drift:${driftX.toFixed(0)}px`,
    ].join(';');
    el.goldDust.appendChild(p);
  }
})();

// --- Bet type selection ---
el.betSelector.addEventListener('click', e => {
  if (isReplayMode) return;
  const btn = e.target.closest('.bet-btn');
  if (!btn || isSpinning) return;
  setSelectedBet(btn.dataset.bet);
});

// --- Stake controls ---
el.stakeInput.addEventListener('input', updatePotentialWin);

document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (isSpinning || isReplayMode) return;
    el.stakeInput.value = btn.dataset.stake === 'max'
      ? formatInputUnits(game.balance / MICRO_UNITS, currency)
      : btn.dataset.stake;
    updatePotentialWin();
  });
});

function updatePotentialWin() {
  const stake  = parseFloat(el.stakeInput.value) || 0;
  const payout = selectedBet === BetType.FIVE_ODDS ? 28 : 1;
  el.potentialWin.textContent = formatDisplayUnits(stake * payout, currency);
}

function setSelectedBet(betType) {
  el.betSelector.querySelectorAll('.bet-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.bet === betType);
  });
  selectedBet = betType;
  updatePotentialWin();
}

function clearHistory() {
  el.historyList.innerHTML = '';
}

function syncReplayUi() {
  if (!isReplayMode) return;

  el.replayBanner.classList.remove('hidden');
  el.replayBannerText.textContent = `REPLAY MODE • ${replayRound.eventId} • ${replayRound.betType} • ${formatAmount(replayRound.betAmount, currency)}`;
  el.replayRepeatBtn.classList.toggle('hidden', !replayComplete);
  el.playBtnText.textContent = 'REPLAY EVENT';

  [
    ...el.betSelector.querySelectorAll('.bet-btn'),
    ...document.querySelectorAll('.quick-btn'),
    el.stakeInput,
    el.clientSeedInput,
    el.rotateSeedBtn,
  ].forEach(control => {
    control.disabled = true;
  });
}

function updateSoundToggle() {
  el.soundToggle.textContent = isSoundMuted ? 'SOUND OFF' : 'SOUND ON';
  el.soundToggle.setAttribute('aria-pressed', String(isSoundMuted));
}

function applySoundPreference() {
  if (isSoundMuted) sound.mute();
  else sound.unmute();
}

async function presentRoundOutcome(roundData) {
  const lastToss = roundData.tossDetails?.[roundData.tossDetails.length - 1] ?? null;
  const isOddedOut = roundData.outcome === 'ODDED_OUT';
  const wonFiveOdds = isOddedOut && roundData.betType === BetType.FIVE_ODDS && roundData.profit > 0;
  const isWin = roundData.profit >= 0;
  const bigWin = roundData.profit >= roundData.betAmount * 4;

  if (wonFiveOdds) {
    sound.bigWin();
    await showResultBanner('FIVE ODDS! JACKPOT!', 'heads', 3200);
    setCaptainMood('excited');
    showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.ODDED_OUT), 4200);
    showParrotSpeech(randomFrom(PARROT_QUOTES.ODDED_OUT), 3500);
    openChests();
    return;
  }

  if (isOddedOut) {
    sound.oddedOut();
    await showResultBanner('ODDED OUT! CURSED!', 'odded', 3200);
    setCaptainMood('angry');
    showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.ODDED_OUT), 4200);
    showParrotSpeech(randomFrom(PARROT_QUOTES.ODDED_OUT), 3500);
    triggerScreenShake();
    return;
  }

  if (isWin) {
    if (bigWin) { sound.bigWin(); openChests(); } else { sound.headsLand(); }
    const label = lastToss ? lastToss.result : 'WIN';
    await showResultBanner(`${label}! ${uiCopy.winBanner}`, 'heads', 2800);
    setCaptainMood('excited');
    showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.WIN), 3800);
    showParrotSpeech(randomFrom(PARROT_QUOTES.WIN), 3200);
    return;
  }

  sound.lose();
  const label = lastToss ? lastToss.result : 'LOSS';
  await showResultBanner(`${label}! ${uiCopy.lossBanner}`, 'tails', 2500);
  setCaptainMood('angry');
  showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.LOSS), 3800);
  showParrotSpeech(randomFrom(PARROT_QUOTES.LOSS), 3200);
}

// --- Provably fair ---
el.clientSeedInput.addEventListener('change', () => game.setClientSeed(el.clientSeedInput.value));

el.rotateSeedBtn.addEventListener('click', async () => {
  if (isSpinning || isReplayMode) return;
  const result = await game.rotateServerSeed();
  if (result) {
    el.serverSeedHash.textContent = result.newHash.slice(0, 20) + '...';
    el.clientSeedInput.value      = game.clientSeed;
    showCaptainSpeech('Seeds rotated! New round begins fresh, matey!', 2500);
  }
});

// --- Balance display ---
function updateBalance(microUnits) {
  el.balance.textContent = formatAmount(microUnits, currency);
}

// --- Skull tracker ---
function setSkullCount(n) {
  el.skullsRow.querySelectorAll('.skull-icon').forEach((s, i) => {
    s.classList.toggle('active', i < n);
    s.classList.toggle('danger', n >= 4 && i < n);
  });
  el.oddsCount.textContent = `${n} of 5`;
  el.oddsCount.classList.toggle('danger', n >= 3);
}

// --- Captain speech ---
let captainTimer = null;
function showCaptainSpeech(text, ms = 3200) {
  el.captainBubble.textContent = text;
  el.captainBubble.classList.add('visible');
  clearTimeout(captainTimer);
  captainTimer = setTimeout(() => el.captainBubble.classList.remove('visible'), ms);
}
function setCaptainMood(mood) {
  el.captain.className = `captain captain--${mood}`;
}

// --- Parrot speech ---
let parrotTimer = null;
function showParrotSpeech(text, ms = 2800) {
  if (!text) return;
  el.parrotBubble.textContent = text;
  el.parrotBubble.classList.add('visible');
  clearTimeout(parrotTimer);
  parrotTimer = setTimeout(() => el.parrotBubble.classList.remove('visible'), ms);
}

// --- Error display ---
let errTimer = null;
function showError(msg) {
  el.errorMsg.textContent = msg;
  el.errorMsg.classList.add('visible');
  clearTimeout(errTimer);
  errTimer = setTimeout(() => el.errorMsg.classList.remove('visible'), 3200);
}

function openRulesModal() {
  isRulesOpen = true;
  el.rulesBackdrop.classList.remove('hidden');
  el.rulesBackdrop.setAttribute('aria-hidden', 'false');
  el.rulesCloseBtn.focus();
}

function closeRulesModal() {
  isRulesOpen = false;
  el.rulesBackdrop.classList.add('hidden');
  el.rulesBackdrop.setAttribute('aria-hidden', 'true');
  el.infoBtn.focus();
}

// --- Result banner ---
function showResultBanner(text, typeClass, ms = 2200) {
  el.resultText.textContent    = text;
  el.resultBanner.className    = `result-banner visible result--${typeClass}`;
  return delay(ms).then(() => { el.resultBanner.className = 'result-banner'; });
}

// --- Screen FX ---
function triggerScreenShake() {
  const root = document.querySelector('.game-root');
  el.screenFlash.classList.remove('flash-red');
  void el.screenFlash.offsetWidth;
  el.screenFlash.classList.add('flash-red');
  root.classList.remove('screen-shake');
  void root.offsetWidth;
  root.classList.add('screen-shake');
  setTimeout(() => {
    el.screenFlash.classList.remove('flash-red');
    root.classList.remove('screen-shake');
  }, 650);
}

function openChests() {
  el.chestLeft.classList.add('open');
  el.chestRight.classList.add('open');
  setTimeout(() => {
    el.chestLeft.classList.remove('open');
    el.chestRight.classList.remove('open');
  }, 3200);
}

// --- Coin Animation ---
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function flipOneCoin(inner, shadow, coinResult) {
  const DURATION = 1850;
  const imgEl = inner.querySelector('.coin-img');

  inner.getAnimations().forEach(a => a.cancel());
  shadow.getAnimations().forEach(a => a.cancel());

  // Reset to heads so the coin looks neutral before it launches
  imgEl.src = '/assets/coin-heads.png';

  // Swap the image at the blurry arc-peak so the result is hidden until landing
  const swapTimer = setTimeout(() => {
    imgEl.src = coinResult === 'H' ? '/assets/coin-heads.png' : '/assets/coin-tails.png';
  }, DURATION * 0.48);

  // Both heads and tails always land at 1800deg (front-face forward — no backface needed)
  const anim = inner.animate([
    { transform: 'translateY(0px) rotateY(0deg) scale(1)',           filter: 'blur(0px)',   offset: 0    },
    { transform: 'translateY(-35px) rotateY(270deg) scale(1.08)',    filter: 'blur(0px)',   offset: 0.07 },
    { transform: 'translateY(-280px) rotateY(900deg) scale(0.82)',   filter: 'blur(2.5px)', offset: 0.44 },
    { transform: 'translateY(-280px) rotateY(1440deg) scale(0.82)',  filter: 'blur(3px)',   offset: 0.56 },
    { transform: 'translateY(-35px) rotateY(1700deg) scale(1.06)',   filter: 'blur(1px)',   offset: 0.87 },
    { transform: 'translateY(0px) rotateY(1800deg) scale(1)',        filter: 'blur(0px)',   offset: 1    },
  ], { duration: DURATION, easing: 'cubic-bezier(0.25,0.08,0.25,1)', fill: 'forwards' });

  shadow.animate([
    { transform: 'translateX(-50%) scaleX(1)',    opacity: 0.45, offset: 0    },
    { transform: 'translateX(-50%) scaleX(0.25)', opacity: 0.08, offset: 0.44 },
    { transform: 'translateX(-50%) scaleX(0.25)', opacity: 0.08, offset: 0.56 },
    { transform: 'translateX(-50%) scaleX(1)',    opacity: 0.45, offset: 1    },
  ], { duration: 1850, easing: 'cubic-bezier(0.25,0.08,0.25,1)', fill: 'forwards' });

  await anim.finished;
  clearTimeout(swapTimer);
  // Guarantee correct face is shown after animation settles
  imgEl.src = coinResult === 'H' ? '/assets/coin-heads.png' : '/assets/coin-tails.png';
}

async function animateToss(toss) {
  const { c1, c2, result, idx } = toss;
  el.tossCounter.style.display = 'block';
  el.tossNum.textContent = String(idx);

  sound.coinLaunch();

  await Promise.all([
    flipOneCoin(el.coin1Inner, el.coin1Shadow, c1),
    flipOneCoin(el.coin2Inner, el.coin2Shadow, c2),
  ]);

  await delay(380);

  if (result === 'ODDS') {
    sound.oddsResult();
    await showResultBanner('MISMATCHED!', 'odds', 1300);
    showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.ODDS), 2200);
    showParrotSpeech(randomFrom(PARROT_QUOTES.ODDS), 2200);
    [el.coin1Inner, el.coin2Inner, el.coin1Shadow, el.coin2Shadow].forEach(el2 =>
      el2.getAnimations().forEach(a => a.cancel())
    );
    await delay(700);
  } else if (result === 'HEADS') {
    sound.headsLand();
  } else {
    sound.tailsLand();
  }
}

// --- History log ---
function addHistoryEntry(roundData) {
  const empty = el.historyList.querySelector('.history-empty');
  if (empty) empty.remove();

  const { round, betType, betAmount, tosses, outcome, profit, balance } = roundData;
  const profCls = profit >= 0 ? 'profit-positive' : 'profit-negative';
  const profStr = `${profit >= 0 ? '+' : '-'}${formatAmount(Math.abs(profit), currency)}`;
  const outCls  = outcome === 'HEADS'     ? 'outcome-heads' :
                  outcome === 'TAILS'     ? 'outcome-tails' :
                  outcome === 'ODDED_OUT' ? 'outcome-odded' : 'outcome-odds';

  const entry = document.createElement('div');
  entry.className = 'history-entry';
  entry.innerHTML = `
    <span class="history-round">#${round}</span>
    <span class="history-bet">${betType} ${formatAmount(betAmount, currency)}</span>
    <span class="history-tosses">${tosses.join(' \u2192 ')}</span>
    <span class="history-outcome ${outCls}">${outcome === 'ODDS' ? 'MISMATCHED' : outcome}</span>
    <span class="history-profit ${profCls}">${profStr}</span>
    <span class="history-balance">${formatAmount(balance, currency)}</span>
  `;
  el.historyList.insertBefore(entry, el.historyList.firstChild);
  requestAnimationFrame(() => requestAnimationFrame(() => entry.classList.add('history-entry--visible')));

  const entries = el.historyList.querySelectorAll('.history-entry');
  if (entries.length > 10) entries[entries.length - 1].remove();
}

async function runReplayRound() {
  if (!isReplayMode || isSpinning) return;

  replayComplete = false;
  syncReplayUi();
  clearHistory();
  setSkullCount(0);
  updateBalance(replayRound.startBalance);
  showCaptainSpeech(`Replaying event ${replayRound.eventId}`, 2600);
  setCaptainMood('neutral');

  isSpinning = true;
  el.playBtn.disabled = true;
  el.playBtn.classList.add('spinning');
  el.errorMsg.classList.remove('visible');
  el.tossCounter.style.display = 'none';

  let oddsCount = 0;
  for (const [index, toss] of replayRound.tossDetails.entries()) {
    if (toss.result === 'ODDS') {
      oddsCount++;
      setSkullCount(oddsCount);
    }
    await animateToss({ c1: toss.coin1, c2: toss.coin2, result: toss.result, idx: index + 1 });
  }

  updateBalance(replayRound.balance);
  await presentRoundOutcome(replayRound);
  addHistoryEntry(replayRound);

  replayComplete = true;
  syncReplayUi();
  el.tossCounter.style.display = 'none';
  isSpinning = false;
  el.playBtn.disabled = false;
  el.playBtn.classList.remove('spinning');

  [el.coin1Inner, el.coin2Inner, el.coin1Shadow, el.coin2Shadow].forEach(node =>
    node.getAnimations().forEach(a => a.cancel())
  );
}

// --- Main play handler ---
async function handlePlay() {
  if (isReplayMode) {
    await runReplayRound();
    return;
  }
  if (isSpinning) return;

  const stakeVal = parseFloat(el.stakeInput.value);
  if (!stakeVal || stakeVal <= 0) {
    showError(uiCopy.invalidAmountError);
    return;
  }
  const stakeMicro = Math.round(stakeVal * MICRO_UNITS);
  if (stakeMicro > game.balance) {
    showError(uiCopy.insufficientBalanceError);
    return;
  }

  tossBuffer    = [];
  pendingResult = null;

  // Optimistic balance deduction
  updateBalance(game.balance - stakeMicro);

  isSpinning = true;
  el.playBtn.disabled = true;
  el.playBtn.classList.add('spinning');
  el.errorMsg.classList.remove('visible');
  el.tossCounter.style.display = 'none';
  setSkullCount(0);

  showCaptainSpeech('Come in, Spinner! The coins are in the air!', 2800);
  setCaptainMood('neutral');

  // Run game (all HMAC tosses complete fast)
  await game.startRound(selectedBet, stakeVal);

  // Animate each buffered toss
  let oddsCount = 0;
  for (const toss of tossBuffer) {
    if (toss.result === 'ODDS') {
      oddsCount++;
      setSkullCount(oddsCount);
    }
    await animateToss(toss);
  }

  // Authoritative balance
  updateBalance(game.balance);

  if (game.roundHistory.length > 0) {
    const completedRound = game.roundHistory[0];
    await presentRoundOutcome(completedRound);
    addHistoryEntry(completedRound);
    saveReplayRound({
      ...completedRound,
      currency,
      social: isSocialMode,
    });
  }

  el.tossCounter.style.display = 'none';
  isSpinning = false;
  el.playBtn.disabled = false;
  el.playBtn.classList.remove('spinning');

  [el.coin1Inner, el.coin2Inner, el.coin1Shadow, el.coin2Shadow].forEach(e2 =>
    e2.getAnimations().forEach(a => a.cancel())
  );
}

// --- Event wiring ---
el.playBtn.addEventListener('click', () => { sound.buttonClick(); handlePlay(); });
el.betSelector.addEventListener('click', () => sound.uiHover(), { capture: true });
el.infoBtn.addEventListener('click', () => {
  sound.uiHover();
  openRulesModal();
});
el.rulesCloseBtn.addEventListener('click', closeRulesModal);
el.rulesBackdrop.addEventListener('click', e => {
  if (e.target === el.rulesBackdrop) closeRulesModal();
});
el.replayRepeatBtn.addEventListener('click', () => {
  sound.buttonClick();
  runReplayRound();
});
el.soundToggle.addEventListener('click', async () => {
  await sound.init();
  isSoundMuted = !isSoundMuted;
  window.sessionStorage.setItem(SOUND_STORAGE_KEY, isSoundMuted ? '1' : '0');
  applySoundPreference();
  updateSoundToggle();
});

document.addEventListener('keydown', e => {
  if (e.code === 'Escape' && isRulesOpen) {
    e.preventDefault();
    closeRulesModal();
    return;
  }
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault();
    if (!isSpinning && !isRulesOpen && !isReplayMode) handlePlay();
  }
});

// --- Initial state ---
if (isReplayMode) {
  setSelectedBet(replayRound.betType);
  el.stakeInput.value = formatInputUnits(replayRound.betAmount / MICRO_UNITS, currency);
  updateBalance(replayRound.startBalance);
  syncReplayUi();
} else {
  updateBalance(game.balance);
}

updatePotentialWin();
updateSoundToggle();
setCaptainMood('neutral');
showCaptainSpeech(isReplayMode ? `Replay loaded: ${replayRound.eventId}` : uiCopy.idlePrompt, 3500);

if (replayMissing) {
  showError(`Replay ${replayCtx.replay} was not found on this device.`);
}

if (isReplayMode) {
  setTimeout(() => { runReplayRound(); }, 250);
}

setInterval(() => {
  if (!isSpinning && !isReplayMode) showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.IDLE), 3500);
}, 9000);

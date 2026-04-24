import { TwoUpGame, BetType, GameState, formatAmount } from './game/TwoUpGame.js';
import SoundEngine from './audio/SoundEngine.js';
import './style.css';

const sound = new SoundEngine();
document.addEventListener('click', () => sound.init(), { once: true });

// --- Replay Context ---
function getReplayContext() {
  const p = new URLSearchParams(window.location.search);
  return {
    sessionID: p.get('sessionID') ?? null,
    nonce:     parseInt(p.get('nonce') ?? '1', 10),
    social:    ['1','true'].includes((p.get('social') ?? '').toLowerCase()),
    currency:  p.get('currency') ?? 'GC',
    balance:   p.get('balance') ? parseFloat(p.get('balance')) : null,
  };
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
    "ODDS! The kip demands another toss — come in spinner!",
    "One of each! Toss again ye miserable wretch!",
    "Neither heads nor tails! The coins mock ye!",
    "ODDS! The ring is not satisfied yet — spin again!",
  ],
  ODDED_OUT: [
    "FIVE ODDS! THE CURSE OF THE KIP FALLS UPON YE!",
    "Five consecutive odds! Davy Jones himself smiles tonight!",
    "THE ANCIENT CURSE! Five odds in a row — RUN YE FOOL!",
    "FIVE ODDS! The kip has spoken — YE ARE CURSED, SCALLYWAG!",
  ],
  IDLE: [
    "Place yer bets and come in, spinner!",
    "The doubloons await... if ye dare.",
    "Toss the coins! Fortune or folly awaits thee!",
    "Are ye a coward or a pirate? PLACE YER BET!",
    "The ring is ready — step forward, Spinner!",
    "Choose yer fate, ye bold sea dog!",
  ],
};

const PARROT_QUOTES = {
  WIN:       ['"Pieces of eight!"', '"Gold fer us, lad!"', '"Strike it rich! SQUAWK!"'],
  LOSS:      ['"Davy Jones! SQUAWK!"', '"Walk the plank..."', '"Rough seas ahead..."'],
  ODDS:      ['"Again! AGAIN! KRAWWWK!"', '"Spin it, scurvy dog!"', '"One of each! SQUAWK!"'],
  ODDED_OUT: ['"CURSE! THE CURSE! SQUAWK!"', '"Five odds! DOOMED! KRAWWWK!"'],
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
  <path d="M30 44 L30 29 L43 35 L60 23 L77 35 L90 29 L90 44 Z" fill="#C8860A" stroke="#FFD700" stroke-width="1.2"/>
  <circle cx="60" cy="23" r="4.5" fill="#FFD700"/>
  <circle cx="32" cy="31" r="3.5" fill="#FFD700"/>
  <circle cx="88" cy="31" r="3.5" fill="#FFD700"/>
  <ellipse cx="60" cy="70" rx="27" ry="25" fill="#F5ECD7"/>
  <ellipse cx="49" cy="66" rx="7.5" ry="8.5" fill="#2C1A0E"/>
  <ellipse cx="71" cy="66" rx="7.5" ry="8.5" fill="#2C1A0E"/>
  <circle cx="47" cy="64" r="2" fill="rgba(255,255,255,0.2)"/>
  <circle cx="69" cy="64" r="2" fill="rgba(255,255,255,0.2)"/>
  <path d="M55 78 L60 86 L65 78 Z" fill="#2C1A0E"/>
  <rect x="42" y="87" width="36" height="11" rx="3" fill="#F5ECD7" stroke="#2C1A0E" stroke-width="0.8"/>
  <line x1="48.5" y1="87" x2="48.5" y2="98" stroke="#2C1A0E" stroke-width="1.2"/>
  <line x1="55" y1="87" x2="55" y2="98" stroke="#2C1A0E" stroke-width="1.2"/>
  <line x1="60" y1="87" x2="60" y2="98" stroke="#2C1A0E" stroke-width="1.2"/>
  <line x1="65" y1="87" x2="65" y2="98" stroke="#2C1A0E" stroke-width="1.2"/>
  <line x1="71.5" y1="87" x2="71.5" y2="98" stroke="#2C1A0E" stroke-width="1.2"/>
  <text x="60" y="115" text-anchor="middle" font-family="'Pirata One',cursive" font-size="11" fill="#2C1A0E" letter-spacing="2">HEADS</text>
</svg>`;

const COIN_TAILS_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <line x1="24" y1="28" x2="83" y2="84" stroke="#C8860A" stroke-width="7" stroke-linecap="round"/>
  <rect x="17" y="40" width="22" height="5" rx="2.5" fill="#2C1A0E" transform="rotate(45 28 42.5)"/>
  <circle cx="24" cy="28" r="5" fill="#2C1A0E"/>
  <line x1="96" y1="28" x2="37" y2="84" stroke="#C8860A" stroke-width="7" stroke-linecap="round"/>
  <rect x="81" y="40" width="22" height="5" rx="2.5" fill="#2C1A0E" transform="rotate(-45 92 42.5)"/>
  <circle cx="96" cy="28" r="5" fill="#2C1A0E"/>
  <circle cx="60" cy="38" r="9" fill="none" stroke="#0D1B2A" stroke-width="3.5"/>
  <line x1="60" y1="47" x2="60" y2="84" stroke="#0D1B2A" stroke-width="4"/>
  <line x1="43" y1="59" x2="77" y2="59" stroke="#0D1B2A" stroke-width="4"/>
  <path d="M43 82 Q52 95 60 86 Q68 95 77 82" fill="none" stroke="#0D1B2A" stroke-width="4"/>
  <circle cx="43" cy="82" r="4.5" fill="#FFD700"/>
  <circle cx="77" cy="82" r="4.5" fill="#FFD700"/>
  <text x="60" y="115" text-anchor="middle" font-family="'Pirata One',cursive" font-size="11" fill="#2C1A0E" letter-spacing="2">TAILS</text>
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
function buildGameHTML(currency, balance) {
  const skullsHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="skull-icon" data-index="${i}">${SKULL_ICON_SVG}</span>`
  ).join('');

  return `
<div class="game-root">

  <div class="cavern-bg">
    <div class="vignette"></div>
    <div class="gold-dust-container" id="gold-dust"></div>
  </div>

  <div class="ship-silhouette">${SHIP_SVG}</div>

  <div class="torch torch--left">
    <div class="torch-bracket"></div>
    <div class="torch-body">
      <div class="torch-flame"><div class="flame-inner"></div></div>
    </div>
    <div class="torch-glow"></div>
  </div>
  <div class="torch torch--right">
    <div class="torch-bracket"></div>
    <div class="torch-body">
      <div class="torch-flame"><div class="flame-inner"></div></div>
    </div>
    <div class="torch-glow"></div>
  </div>

  <div class="parrot-zone" id="parrot-zone">
    <div class="speech-bubble parrot-bubble" id="parrot-bubble"></div>
    <div class="parrot" id="parrot">&#x1F99C;</div>
  </div>

  <header class="game-header">
    <span class="header-ornament">&#x2693;</span>
    <h1 class="game-title">Dead Men&rsquo;s Doubloons</h1>
    <p class="game-subtitle">Come in, Spinner &mdash; if ye dare.</p>
    <div class="balance-bar">
      <div class="balance-display">&#x1F4B0; <span id="balance-value">${balance.toLocaleString()} ${currency}</span></div>
      <div class="session-id" id="session-display"></div>
    </div>
  </header>

  <main class="game-layout">

    <aside class="betting-panel">
      <h2 class="panel-title">&#x2694;&#xFE0F; Place Yer Bets</h2>

      <div class="bet-type-selector" id="bet-type-selector">
        <button class="bet-btn bet-btn--heads active" data-bet="HEADS">
          <span class="bet-btn-icon">&#x1F480;</span>
          <span class="bet-btn-label">HEADS</span>
          <span class="bet-btn-odds">1:1</span>
        </button>
        <button class="bet-btn bet-btn--tails" data-bet="TAILS">
          <span class="bet-btn-icon">&#x2693;</span>
          <span class="bet-btn-label">TAILS</span>
          <span class="bet-btn-odds">1:1</span>
        </button>
        <button class="bet-btn bet-btn--odds" data-bet="FIVE_ODDS">
          <span class="bet-btn-icon">&#x1F52E;</span>
          <span class="bet-btn-label">5 ODDS</span>
          <span class="bet-btn-odds">28:1</span>
        </button>
      </div>

      <div class="stake-section">
        <label class="stake-label">Yer Wager:</label>
        <div class="stake-input-row">
          <input type="number" id="stake-input" class="stake-input"
            min="1" step="1" value="10" autocomplete="off" />
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
        <span class="potential-win-label">Potential Win:</span>
        <span class="potential-win-value" id="potential-win-value">20 ${currency}</span>
      </div>

      <div class="odds-streak-section">
        <div class="odds-streak-title">&#x26A0;&#xFE0F; Odds Streak</div>
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
    </aside>

    <section class="spin-arena">

      <div class="captain-zone" id="captain-zone">
        <div class="captain" id="captain">&#x1F3F4;&#x200D;&#x2620;&#xFE0F;</div>
        <div class="speech-bubble captain-bubble" id="captain-bubble">
          Place yer bets and come in, spinner!
        </div>
      </div>

      <div class="ring-container">
        <div class="sand-ring">
          <div class="ring-text-arc">R &nbsp; I &nbsp; N &nbsp; G</div>
          <div class="kip">
            <div class="kip-plank">
              <div class="coins-on-kip">
                <div class="coin" id="coin-1">
                  <div class="coin-inner" id="coin-1-inner">
                    <div class="coin-face coin-face--front">${COIN_HEADS_SVG}</div>
                    <div class="coin-face coin-face--back">${COIN_TAILS_SVG}</div>
                  </div>
                  <div class="coin-shadow" id="coin-1-shadow"></div>
                </div>
                <div class="coin" id="coin-2">
                  <div class="coin-inner" id="coin-2-inner">
                    <div class="coin-face coin-face--front">${COIN_HEADS_SVG}</div>
                    <div class="coin-face coin-face--back">${COIN_TAILS_SVG}</div>
                  </div>
                  <div class="coin-shadow" id="coin-2-shadow"></div>
                </div>
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
          <span class="play-btn-text">COME IN, SPINNER!</span>
          <span class="spacebar-hint">[SPACE]</span>
        </button>
        <div class="error-message" id="error-message"></div>
      </div>

    </section>
  </main>

  <div class="history-panel">
    <h3 class="history-title">&#x1F4DC; Voyage Log</h3>
    <div class="history-list" id="history-list">
      <div class="history-empty">No voyages yet, scallywag.</div>
    </div>
  </div>

  <div class="chest chest--left" id="chest-left">
    <div class="chest-body">
      <div class="chest-lid"></div>
      <div class="chest-base"></div>
    </div>
  </div>
  <div class="chest chest--right" id="chest-right">
    <div class="chest-body">
      <div class="chest-lid"></div>
      <div class="chest-base"></div>
    </div>
  </div>

  <div class="screen-flash" id="screen-flash"></div>

  <footer class="game-footer">
    <p class="malfunction-notice">Malfunction voids all pays and plays. Must be 18+ to play. Play responsibly.</p>
  </footer>

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
const rawCurrency = (replayCtx.currency || '').toUpperCase();
const currency  = VALID_CURRENCIES.has(rawCurrency) ? rawCurrency : 'GC';
const startBal  = replayCtx.balance ?? 1000;
const game      = new TwoUpGame({ currency, startingBalance: startBal });

const app = document.getElementById('app');
app.innerHTML = buildGameHTML(currency, startBal);

// --- DOM refs ---
const $ = id => document.getElementById(id);
const el = {
  balance:         $('balance-value'),
  sessionDisp:     $('session-display'),
  playBtn:         $('play-btn'),
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
};

// --- State ---
let selectedBet   = BetType.HEADS;
let isSpinning    = false;
let tossBuffer    = [];
let pendingResult = null;

el.sessionDisp.textContent  = `Session: ${game.sessionID}`;
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
  const btn = e.target.closest('.bet-btn');
  if (!btn || isSpinning) return;
  el.betSelector.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedBet = btn.dataset.bet;
  updatePotentialWin();
});

// --- Stake controls ---
el.stakeInput.addEventListener('input', updatePotentialWin);

document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (isSpinning) return;
    el.stakeInput.value = btn.dataset.stake === 'max'
      ? String(Math.floor(game.balance / 1_000_000))
      : btn.dataset.stake;
    updatePotentialWin();
  });
});

function updatePotentialWin() {
  const stake  = parseFloat(el.stakeInput.value) || 0;
  const payout = selectedBet === BetType.FIVE_ODDS ? 28 : 1;
  el.potentialWin.textContent = `${(stake * payout).toLocaleString()} ${currency}`;
}

// --- Provably fair ---
el.clientSeedInput.addEventListener('change', () => game.setClientSeed(el.clientSeedInput.value));

el.rotateSeedBtn.addEventListener('click', async () => {
  if (isSpinning) return;
  const result = await game.rotateServerSeed();
  if (result) {
    el.serverSeedHash.textContent = result.newHash.slice(0, 20) + '...';
    el.clientSeedInput.value      = game.clientSeed;
    showCaptainSpeech('Seeds rotated! New round begins fresh, matey!', 2500);
  }
});

// --- Balance display ---
function updateBalance(microUnits) {
  const v = Math.floor(microUnits / 1_000_000);
  el.balance.textContent = `${v.toLocaleString()} ${currency}`;
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
  // H -> 1800deg (10x180, even multiple -> front face = HEADS)
  // T -> 1980deg (11x180, odd multiple -> back face  = TAILS)
  const finalY = coinResult === 'H' ? 1800 : 1980;

  inner.getAnimations().forEach(a => a.cancel());
  shadow.getAnimations().forEach(a => a.cancel());

  const anim = inner.animate([
    { transform: 'translateY(0px) rotateY(0deg) scale(1)',            filter: 'blur(0px)',   offset: 0    },
    { transform: 'translateY(-35px) rotateY(270deg) scale(1.08)',     filter: 'blur(0px)',   offset: 0.07 },
    { transform: 'translateY(-280px) rotateY(900deg) scale(0.82)',    filter: 'blur(2.5px)', offset: 0.44 },
    { transform: 'translateY(-280px) rotateY(1440deg) scale(0.82)',   filter: 'blur(3px)',   offset: 0.56 },
    { transform: 'translateY(-35px) rotateY(1700deg) scale(1.06)',    filter: 'blur(1px)',   offset: 0.87 },
    { transform: `translateY(0px) rotateY(${finalY}deg) scale(1)`,   filter: 'blur(0px)',   offset: 1    },
  ], { duration: 1850, easing: 'cubic-bezier(0.25,0.08,0.25,1)', fill: 'forwards' });

  shadow.animate([
    { transform: 'translateX(-50%) scaleX(1)',    opacity: 0.45, offset: 0    },
    { transform: 'translateX(-50%) scaleX(0.25)', opacity: 0.08, offset: 0.44 },
    { transform: 'translateX(-50%) scaleX(0.25)', opacity: 0.08, offset: 0.56 },
    { transform: 'translateX(-50%) scaleX(1)',    opacity: 0.45, offset: 1    },
  ], { duration: 1850, easing: 'cubic-bezier(0.25,0.08,0.25,1)', fill: 'forwards' });

  await anim.finished;
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
    await showResultBanner('ODDS!', 'odds', 1300);
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
  const betU    = Math.floor(betAmount / 1_000_000);
  const profU   = Math.floor(profit    / 1_000_000);
  const balU    = Math.floor(balance   / 1_000_000);
  const profStr = profU >= 0 ? `+${profU}` : String(profU);
  const profCls = profU >= 0 ? 'profit-positive' : 'profit-negative';
  const outCls  = outcome === 'HEADS'     ? 'outcome-heads' :
                  outcome === 'TAILS'     ? 'outcome-tails' :
                  outcome === 'ODDED_OUT' ? 'outcome-odded' : 'outcome-odds';

  const entry = document.createElement('div');
  entry.className = 'history-entry';
  entry.innerHTML = `
    <span class="history-round">#${round}</span>
    <span class="history-bet">${betType} ${betU} ${currency}</span>
    <span class="history-tosses">${tosses.join(' \u2192 ')}</span>
    <span class="history-outcome ${outCls}">${outcome}</span>
    <span class="history-profit ${profCls}">${profStr} ${currency}</span>
    <span class="history-balance">${balU.toLocaleString()} ${currency}</span>
  `;
  el.historyList.insertBefore(entry, el.historyList.firstChild);
  requestAnimationFrame(() => requestAnimationFrame(() => entry.classList.add('history-entry--visible')));

  const entries = el.historyList.querySelectorAll('.history-entry');
  if (entries.length > 10) entries[entries.length - 1].remove();
}

// --- Main play handler ---
async function handlePlay() {
  if (isSpinning) return;

  const stakeVal = parseFloat(el.stakeInput.value);
  if (!stakeVal || stakeVal <= 0) {
    showError('Enter a valid wager, ye scoundrel!');
    return;
  }
  const stakeMicro = Math.round(stakeVal * 1_000_000);
  if (stakeMicro > game.balance) {
    showError("Insufficient doubloons! Ye cannot bet what ye don't have!");
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

  // Show outcome
  if (pendingResult) {
    const lastToss    = tossBuffer[tossBuffer.length - 1];
    const isOddedOut  = pendingResult.oddedOut === true;
    const wonFiveOdds = isOddedOut && selectedBet === BetType.FIVE_ODDS;
    const isWin       = pendingResult.type === 'win';
    const bigWin      = isWin && pendingResult.profit >= stakeMicro * 4;

    if (wonFiveOdds) {
      sound.bigWin();
      await showResultBanner('FIVE ODDS! JACKPOT!', 'heads', 3200);
      setCaptainMood('excited');
      showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.ODDED_OUT), 4200);
      showParrotSpeech(randomFrom(PARROT_QUOTES.ODDED_OUT), 3500);
      openChests();
    } else if (isOddedOut) {
      sound.oddedOut();
      await showResultBanner('ODDED OUT! CURSED!', 'odded', 3200);
      setCaptainMood('angry');
      showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.ODDED_OUT), 4200);
      showParrotSpeech(randomFrom(PARROT_QUOTES.ODDED_OUT), 3500);
      triggerScreenShake();
    } else if (isWin) {
      if (bigWin) { sound.bigWin(); openChests(); } else { sound.headsLand(); }
      const label = lastToss ? lastToss.result : 'WIN';
      await showResultBanner(`${label}! YE WIN!`, 'heads', 2800);
      setCaptainMood('excited');
      showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.WIN), 3800);
      showParrotSpeech(randomFrom(PARROT_QUOTES.WIN), 3200);
    } else {
      sound.lose();
      const label = lastToss ? lastToss.result : 'LOSS';
      await showResultBanner(`${label}! YE LOSE!`, 'tails', 2500);
      setCaptainMood('angry');
      showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.LOSS), 3800);
      showParrotSpeech(randomFrom(PARROT_QUOTES.LOSS), 3200);
    }
  }

  if (game.roundHistory.length > 0) {
    addHistoryEntry(game.roundHistory[0]);
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

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault();
    if (!isSpinning) handlePlay();
  }
});

// --- Initial state ---
updatePotentialWin();
updateBalance(game.balance);
setCaptainMood('neutral');
showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.IDLE), 3500);

setInterval(() => {
  if (!isSpinning) showCaptainSpeech(randomFrom(CAPTAIN_QUOTES.IDLE), 3500);
}, 9000);

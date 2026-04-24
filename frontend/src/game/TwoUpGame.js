/**
 * Dead Men's Doubloons — Two-Up Core Game Logic
 * Stake Engine compliant, Provably Fair RNG, micro-unit wallet
 */

// ─── Currency Meta ────────────────────────────────────────────────────────────
export const CURRENCY_META = {
  USD: { symbol: '$',   decimals: 2 },
  EUR: { symbol: '€',   decimals: 2 },
  GBP: { symbol: '£',   decimals: 2 },
  AUD: { symbol: 'A$',  decimals: 2 },
  CAD: { symbol: 'CA$', decimals: 2 },
  BRL: { symbol: 'R$',  decimals: 2 },
  MXN: { symbol: 'MX$', decimals: 2 },
  JPY: { symbol: '¥',   decimals: 0 },
  KRW: { symbol: '₩',   decimals: 0 },
  SC:  { symbol: 'SC',  decimals: 0, symbolAfter: true },
  XSC: { symbol: 'SC',  decimals: 0, symbolAfter: true },
  GC:  { symbol: 'GC',  decimals: 0, symbolAfter: true },
  XGC: { symbol: 'GC',  decimals: 0, symbolAfter: true },
};

const MICRO = 1_000_000;

export function formatAmount(microUnits, currency = 'GC') {
  const meta = CURRENCY_META[currency] ?? { symbol: currency, decimals: 2 };
  const value = microUnits / MICRO;
  const formatted = value.toFixed(meta.decimals);
  return meta.symbolAfter ? `${formatted} ${meta.symbol}` : `${meta.symbol}${formatted}`;
}

// ─── Game States ──────────────────────────────────────────────────────────────
export const GameState = Object.freeze({
  IDLE:       'IDLE',
  BETTING:    'BETTING',
  SPINNING:   'SPINNING',
  RESOLVING:  'RESOLVING',
  RESULT:     'RESULT',
});

// ─── Bet Types ────────────────────────────────────────────────────────────────
export const BetType = Object.freeze({
  HEADS:      'HEADS',      // 1:1  house edge 3.125%
  TAILS:      'TAILS',      // 1:1  house edge 3.125%
  FIVE_ODDS:  'FIVE_ODDS',  // 28:1 house edge 9.375%
});

const PAYOUT = {
  [BetType.HEADS]:     1,
  [BetType.TAILS]:     1,
  [BetType.FIVE_ODDS]: 28,
};

// ─── Provably Fair helpers ────────────────────────────────────────────────────
async function hmacSha256(key, data) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSeed(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Extract two independent coin outcomes from an HMAC hex string
function extractCoins(hex) {
  // Use first 4 bytes → coin 1 from byte 0-1, coin 2 from byte 2-3
  const n1 = parseInt(hex.slice(0, 8), 16);
  const n2 = parseInt(hex.slice(8, 16), 16);
  return [n1 % 2 === 0 ? 'H' : 'T', n2 % 2 === 0 ? 'H' : 'T'];
}

function coinsToResult(c1, c2) {
  if (c1 === 'H' && c2 === 'H') return 'HEADS';
  if (c1 === 'T' && c2 === 'T') return 'TAILS';
  return 'ODDS';
}

// ─── Main Class ───────────────────────────────────────────────────────────────
export class TwoUpGame {
  constructor(options = {}) {
    this.currency   = options.currency ?? 'GC';
    this.wallet     = (options.startingBalance ?? 1000) * MICRO;
    this.state      = GameState.IDLE;

    // Provably fair seeds
    this._serverSeed        = generateSeed();
    this._serverSeedHashed  = null;
    this._clientSeed        = generateSeed(16);
    this._nonce             = 0;

    // Round state
    this._currentBet   = null;   // { type: BetType, amount: microUnits }
    this._tosses       = [];     // array of {coin1, coin2, result} for current round
    this.consecutiveOdds = 0;

    // Session stats
    this.sessionID   = this._makeSessionID();
    this.roundNumber = 0;
    this.roundHistory = [];
    this.totalWagered = 0;
    this.totalWon     = 0;

    // Event callbacks — set these to wire in the UI
    this.onStateChange  = null;   // (newState) => void
    this.onCoinToss     = null;   // (coin1, coin2, result, tossIndex) => void
    this.onWin          = null;   // (profit, newBalance) => void
    this.onLoss         = null;   // (loss, newBalance) => void
    this.onOddsStreak   = null;   // (count) => void
    this.onOddedOut     = null;   // (newBalance) => void
    this.onError        = null;   // (message) => void

    // Hash the server seed immediately so it can be displayed to the player
    sha256(this._serverSeed).then(h => { this._serverSeedHashed = h; });
  }

  // ── Public Getters ──────────────────────────────────────────────────────────
  get balance()      { return this.wallet; }
  get balanceDisplay() { return formatAmount(this.wallet, this.currency); }
  get serverSeedHash() { return this._serverSeedHashed; }
  get clientSeed()   { return this._clientSeed; }

  get sessionRTP() {
    if (this.totalWagered === 0) return null;
    return (this.totalWon / this.totalWagered) * 100;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Place a bet and start a round.
   * @param {string} betType  — BetType.HEADS | BetType.TAILS | BetType.FIVE_ODDS
   * @param {number} betUnits — bet in display units (not micro)
   */
  async startRound(betType, betUnits) {
    if (this.state !== GameState.IDLE) {
      this._emit('onError', 'A round is already in progress');
      return false;
    }
    if (!BetType[betType]) {
      this._emit('onError', `Unknown bet type: ${betType}`);
      return false;
    }
    const betMicro = Math.round(betUnits * MICRO);
    if (betMicro <= 0) {
      this._emit('onError', 'Bet must be greater than zero');
      return false;
    }
    if (betMicro > this.wallet) {
      this._emit('onError', 'Insufficient doubloons!');
      return false;
    }

    this._currentBet     = { type: betType, amount: betMicro };
    this._tosses         = [];
    this.consecutiveOdds = 0;
    this.roundNumber++;

    this._setState(GameState.BETTING);
    this._setState(GameState.SPINNING);

    return this._runTossLoop();
  }

  /** Change the client seed (player can customise before a round). */
  setClientSeed(seed) {
    if (this.state !== GameState.IDLE) return;
    this._clientSeed = String(seed).trim().slice(0, 64) || generateSeed(16);
  }

  /** Rotate server seed — exposes old seed for verification, generates new one. */
  async rotateServerSeed() {
    if (this.state !== GameState.IDLE) return null;
    const revealedSeed = this._serverSeed;
    this._serverSeed       = generateSeed();
    this._serverSeedHashed = await sha256(this._serverSeed);
    this._nonce            = 0;
    return { revealedSeed, newHash: this._serverSeedHashed };
  }

  /** Verify a past result. */
  async verifyFairness(serverSeed, clientSeed, nonce) {
    const hash = await hmacSha256(serverSeed, `${clientSeed}:${nonce}`);
    const [c1, c2] = extractCoins(hash);
    return { coin1: c1, coin2: c2, result: coinsToResult(c1, c2), hash };
  }

  resetGame() {
    this.wallet        = 1000 * MICRO;
    this.roundNumber   = 0;
    this.roundHistory  = [];
    this.totalWagered  = 0;
    this.totalWon      = 0;
    this.consecutiveOdds = 0;
    this._currentBet   = null;
    this._tosses       = [];
    this._nonce        = 0;
    this._setState(GameState.IDLE);
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  async _runTossLoop() {
    while (true) {
      const tossResult = await this._performToss();

      if (tossResult.result === 'ODDS') {
        this.consecutiveOdds++;
        this._emit('onOddsStreak', this.consecutiveOdds);

        if (this.consecutiveOdds >= 5) {
          return this._resolve('ODDED_OUT', tossResult);
        }
        // Loop again — odds means toss again
        continue;
      }

      return this._resolve(tossResult.result, tossResult);
    }
  }

  async _performToss() {
    this._nonce++;
    const hash = await hmacSha256(this._serverSeed, `${this._clientSeed}:${this._nonce}`);
    const [c1, c2] = extractCoins(hash);
    const result   = coinsToResult(c1, c2);
    const toss     = { coin1: c1, coin2: c2, result, hash, nonce: this._nonce };
    this._tosses.push(toss);
    this._emit('onCoinToss', c1, c2, result, this._tosses.length);
    return toss;
  }

  _resolve(outcome, lastToss) {
    this._setState(GameState.RESOLVING);

    const bet = this._currentBet;
    let profit = 0;

    if (outcome === 'HEADS' && bet.type === BetType.HEADS) {
      profit = bet.amount * PAYOUT[BetType.HEADS];
      this.wallet += profit;
      this.totalWon += profit;
      this._emit('onWin', profit, this.wallet);

    } else if (outcome === 'TAILS' && bet.type === BetType.TAILS) {
      profit = bet.amount * PAYOUT[BetType.TAILS];
      this.wallet += profit;
      this.totalWon += profit;
      this._emit('onWin', profit, this.wallet);

    } else if (outcome === 'ODDED_OUT' && bet.type === BetType.FIVE_ODDS) {
      profit = bet.amount * PAYOUT[BetType.FIVE_ODDS];
      this.wallet += profit;
      this.totalWon += profit;
      this._emit('onOddedOut', this.wallet);
      this._emit('onWin', profit, this.wallet);

    } else {
      // Loss — deduct bet
      profit = -bet.amount;
      this.wallet -= bet.amount;
      if (outcome === 'ODDED_OUT') {
        this._emit('onOddedOut', this.wallet);
      }
      this._emit('onLoss', bet.amount, this.wallet);
    }

    this.totalWagered += bet.amount;

    // Record history
    this.roundHistory.unshift({
      round:      this.roundNumber,
      betType:    bet.type,
      betAmount:  bet.amount,
      tosses:     this._tosses.map(t => t.result),
      outcome,
      profit,
      balance:    this.wallet,
      timestamp:  Date.now(),
    });
    if (this.roundHistory.length > 50) this.roundHistory.pop();

    this._currentBet = null;
    this._setState(GameState.RESULT);
    this._setState(GameState.IDLE);

    return { outcome, profit, balance: this.wallet };
  }

  _setState(newState) {
    this.state = newState;
    this._emit('onStateChange', newState);
  }

  _emit(event, ...args) {
    if (typeof this[event] === 'function') {
      try { this[event](...args); } catch (e) { console.error(`TwoUpGame event error [${event}]:`, e); }
    }
  }

  _makeSessionID() {
    const ts  = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `DMD-${ts}-${rnd}`;
  }
}

export default TwoUpGame;

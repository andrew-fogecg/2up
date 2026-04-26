/**
 * SoundEngine.js — HeadsOrTails Pirate Two-Up
 * Stake Sound Engineer: Procedural Web Audio API sound engine.
 *
 * Audio Map:
 *  - buttonClick   → UI feedback (crisp tick)
 *  - uiHover       → UI hover (tiny high tick)
 *  - coinLaunch    → Reel Spin analogue (whoosh sweep + metallic clink)
 *  - coinSpin      → Coin-peak shimmer loop (high-freq tremolo)
 *  - headsLand     → Small Win (triumphant brass sting, major chord up)
 *  - tailsLand     → Deep drum thud (low-impact)
 *  - oddsResult    → Scatter Land analogue (mysterious minor chord pulse)
 *  - oddedOut      → Dramatic pipe-organ descending chord
 *  - bigWin        → Big Win (cascading coins + fanfare)
 *  - lose          → Descending wah, sad-trombone feel
 *
 * Mute / Volume hooks are available on every instance:
 *  - setVolume(0–1)
 *  - mute()
 *  - unmute()
 */

export default class SoundEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx = null;

    /** @type {GainNode|null} Master gain bus */
    this._masterGain = null;

    /** @type {boolean} */
    this._muted = false;

    /** @type {number} last requested volume before mute (0–1) */
    this._volume = 0.8;

    /** @type {boolean} */
    this._ready = false;

    // Bind so consumers can use as raw event listeners
    this.init = this.init.bind(this);
  }

  // ─────────────────────────────────────────────
  //  Lifecycle
  // ─────────────────────────────────────────────

  /**
   * Create AudioContext on first user gesture.
   * Safe to call multiple times — idempotent.
   * @returns {Promise<void>}
   */
  async init() {
    if (this._ready) {
      if (this._ctx?.state === 'suspended') {
        void this._ctx.resume().catch(() => {
          // Browsers may still require a user gesture; do not block gameplay.
        });
      }
      return;
    }

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      console.warn('[SoundEngine] Web Audio API not supported in this browser.');
      return;
    }

    this._ctx = new Ctx();

    // Master gain → destination
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.setValueAtTime(this._volume, this._ctx.currentTime);
    this._masterGain.connect(this._ctx.destination);

    this._ready = true;

    // Resume if suspended when possible, but do not block non-gesture flows.
    if (this._ctx.state === 'suspended') {
      void this._ctx.resume().catch(() => {
        // Audio will resume on the next permitted user gesture.
      });
    }
  }

  // ─────────────────────────────────────────────
  //  Volume / Mute hooks (UI requirements)
  // ─────────────────────────────────────────────

  /**
   * Set master volume.
   * @param {number} level — 0.0 (silent) to 1.0 (full)
   */
  setVolume(level) {
    this._volume = Math.max(0, Math.min(1, level));
    if (this._masterGain && !this._muted) {
      this._masterGain.gain.linearRampToValueAtTime(
        this._volume,
        this._ctx.currentTime + 0.05
      );
    }
  }

  /** Mute all audio output. */
  mute() {
    this._muted = true;
    if (this._masterGain) {
      this._masterGain.gain.linearRampToValueAtTime(0, this._ctx.currentTime + 0.05);
    }
  }

  /** Restore audio to last set volume. */
  unmute() {
    this._muted = false;
    if (this._masterGain) {
      this._masterGain.gain.linearRampToValueAtTime(
        this._volume,
        this._ctx.currentTime + 0.05
      );
    }
  }

  // ─────────────────────────────────────────────
  //  Internal helpers
  // ─────────────────────────────────────────────

  /** @returns {AudioContext|null} */
  _getCtx() {
    if (!this._ready) {
      console.warn('[SoundEngine] Call init() before playing sounds.');
      return null;
    }
    return this._ctx;
  }

  /**
   * Create a white-noise buffer source.
   * @param {AudioContext} ctx
   * @param {number} duration  seconds
   * @returns {AudioBufferSourceNode}
   */
  _noiseSource(ctx, duration) {
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  /**
   * Convenience: create + connect a GainNode to the master bus.
   * @param {AudioContext} ctx
   * @param {number} initialGain
   * @returns {GainNode}
   */
  _busGain(ctx, initialGain = 1) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(initialGain, ctx.currentTime);
    g.connect(this._masterGain);
    return g;
  }

  /**
   * Convenience: create an OscillatorNode already started.
   * @param {AudioContext} ctx
   * @param {string} type  OscillatorType
   * @param {number} freq  Hz
   * @returns {OscillatorNode}
   */
  _osc(ctx, type, freq) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    return o;
  }

  // ─────────────────────────────────────────────
  //  UI Sounds
  // ─────────────────────────────────────────────

  /** Short crisp click for button presses. */
  buttonClick() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const gain = this._busGain(ctx, 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    const osc = this._osc(ctx, 'square', 1400);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  /** Tiny high tick for UI hover. */
  uiHover() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const gain = this._busGain(ctx, 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    const osc = this._osc(ctx, 'sine', 3200);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.025);
  }

  // ─────────────────────────────────────────────
  //  Gameplay Sounds
  // ─────────────────────────────────────────────

  /**
   * Reel Spin / Coin Launch
   * Whoosh sweep (800 → 200 Hz noise + filter) + metallic clink.
   */
  coinLaunch() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    // ── Whoosh: filtered noise sweep ──
    const noiseGain = this._busGain(ctx, 0.45);
    noiseGain.gain.setValueAtTime(0.45, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.35);
    filter.Q.setValueAtTime(1.8, t);
    filter.connect(noiseGain);

    const noise = this._noiseSource(ctx, 0.4);
    noise.connect(filter);
    noise.start(t);
    noise.stop(t + 0.4);

    // ── Metallic clink: high sine burst ──
    const clinkGain = this._busGain(ctx, 0.6);
    clinkGain.gain.setValueAtTime(0.6, t + 0.05);
    clinkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    const clink = this._osc(ctx, 'sine', 5200);
    clink.connect(clinkGain);
    clink.start(t + 0.05);
    clink.stop(t + 0.18);

    // Detuned harmonic for richer metallic feel
    const clinkGain2 = this._busGain(ctx, 0.3);
    clinkGain2.gain.setValueAtTime(0.3, t + 0.05);
    clinkGain2.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    const clink2 = this._osc(ctx, 'sine', 7300);
    clink2.connect(clinkGain2);
    clink2.start(t + 0.05);
    clink2.stop(t + 0.14);
  }

  /**
   * Coin Spin — shimmering tremolo loop while coin is in the air.
   * Returns a stop function: `const stop = engine.coinSpin(); stop();`
   * @returns {() => void}  call to stop the loop
   */
  coinSpin() {
    const ctx = this._getCtx();
    if (!ctx) return () => {};
    const t = ctx.currentTime;

    const busGain = this._busGain(ctx, 0);
    busGain.gain.linearRampToValueAtTime(0.35, t + 0.1);

    // LFO for tremolo
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(18, t);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.3, t);
    lfo.connect(lfoGain);
    lfoGain.connect(busGain.gain);

    // High shimmer carrier
    const carrier = this._osc(ctx, 'sine', 4800);
    carrier.connect(busGain);
    carrier.start(t);
    lfo.start(t);

    return () => {
      const now = ctx.currentTime;
      busGain.gain.cancelScheduledValues(now);
      busGain.gain.setValueAtTime(busGain.gain.value, now);
      busGain.gain.linearRampToValueAtTime(0, now + 0.08);
      carrier.stop(now + 0.09);
      lfo.stop(now + 0.09);
    };
  }

  /**
   * Small Win / Heads Land — triumphant brass sting (major chord sweep up).
   */
  headsLand() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    // C major: C4 E4 G4 C5
    const notes = [261.63, 329.63, 392.0, 523.25];
    const delays = [0, 0.07, 0.13, 0.2];

    notes.forEach((freq, i) => {
      const g = this._busGain(ctx, 0);
      g.gain.setValueAtTime(0, t + delays[i]);
      g.gain.linearRampToValueAtTime(0.38, t + delays[i] + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + delays[i] + 0.5);

      // Sawtooth for brass-like timbre
      const o = this._osc(ctx, 'sawtooth', freq);
      // Slight pitch sweep up for fanfare feel
      o.frequency.setValueAtTime(freq * 0.97, t + delays[i]);
      o.frequency.linearRampToValueAtTime(freq, t + delays[i] + 0.06);
      o.connect(g);
      o.start(t + delays[i]);
      o.stop(t + delays[i] + 0.55);
    });
  }

  /**
   * Tails Land — deep drum thud (low-frequency impact).
   */
  tailsLand() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Pitch-swept low sine (kick drum model)
    const g = this._busGain(ctx, 0.9);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    const o = this._osc(ctx, 'sine', 180);
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.45);

    // Noise transient snap
    const snapGain = this._busGain(ctx, 0.5);
    snapGain.gain.setValueAtTime(0.5, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    const snapFilter = ctx.createBiquadFilter();
    snapFilter.type = 'highpass';
    snapFilter.frequency.setValueAtTime(200, t);
    snapFilter.connect(snapGain);

    const snap = this._noiseSource(ctx, 0.07);
    snap.connect(snapFilter);
    snap.start(t);
    snap.stop(t + 0.07);
  }

  /**
   * Scatter Land / Odds Result — mysterious minor chord pulse.
   */
  oddsResult() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    // A minor: A3 C4 E4
    const notes = [220.0, 261.63, 329.63];

    notes.forEach((freq, i) => {
      const g = this._busGain(ctx, 0);
      g.gain.setValueAtTime(0, t + i * 0.06);
      g.gain.linearRampToValueAtTime(0.3, t + i * 0.06 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.7);

      const o = this._osc(ctx, 'triangle', freq);
      // Add slow vibrato for mysterious feel
      const vib = ctx.createOscillator();
      vib.type = 'sine';
      vib.frequency.setValueAtTime(5, t);
      const vibGain = ctx.createGain();
      vibGain.gain.setValueAtTime(3, t);
      vib.connect(vibGain);
      vibGain.connect(o.frequency);

      o.connect(g);
      o.start(t + i * 0.06);
      vib.start(t + i * 0.06);
      o.stop(t + i * 0.06 + 0.75);
      vib.stop(t + i * 0.06 + 0.75);
    });
  }

  /**
   * Odded Out — dramatic descending pipe-organ chord.
   */
  oddedOut() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Diminished: D3 F3 Ab3 B3 — descend with staggered fade
    const notes = [146.83, 174.61, 207.65, 246.94];

    notes.forEach((freq, i) => {
      const g = this._busGain(ctx, 0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.35, t + 0.08);
      g.gain.setValueAtTime(0.35, t + 0.5 + i * 0.15);
      g.gain.linearRampToValueAtTime(0, t + 0.5 + i * 0.15 + 0.4);

      // Organ-like: mix of square harmonics
      const o1 = this._osc(ctx, 'square', freq);
      const o2 = this._osc(ctx, 'square', freq * 2);
      const mixGain = ctx.createGain();
      mixGain.gain.setValueAtTime(0.5, t);
      o1.connect(mixGain);
      o2.connect(mixGain);
      mixGain.connect(g);

      // Pitch glide downward
      o1.frequency.setValueAtTime(freq, t);
      o1.frequency.linearRampToValueAtTime(freq * 0.88, t + 1.2 + i * 0.15);
      o2.frequency.setValueAtTime(freq * 2, t);
      o2.frequency.linearRampToValueAtTime(freq * 2 * 0.88, t + 1.2 + i * 0.15);

      const endTime = t + 1.2 + i * 0.15 + 0.1;
      o1.start(t);
      o2.start(t);
      o1.stop(endTime);
      o2.stop(endTime);
    });
  }

  /**
   * Big Win — cascading coin sounds + triumphant fanfare.
   */
  bigWin() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    // ── Cascading coin pings ──
    const coinFreqs = [3200, 4100, 5000, 3800, 4500, 5400, 3000, 4800];
    coinFreqs.forEach((freq, i) => {
      const delay = i * 0.09;
      const g = this._busGain(ctx, 0);
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.45, t + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.25);

      const o = this._osc(ctx, 'sine', freq);
      o.connect(g);
      o.start(t + delay);
      o.stop(t + delay + 0.28);
    });

    // ── Fanfare: C major arpeggio up then chord hold ──
    const fanfareNotes = [
      { freq: 261.63, start: 0.0 },
      { freq: 329.63, start: 0.12 },
      { freq: 392.0,  start: 0.24 },
      { freq: 523.25, start: 0.36 },
      // Chord sustain
      { freq: 261.63, start: 0.54 },
      { freq: 329.63, start: 0.54 },
      { freq: 392.0,  start: 0.54 },
      { freq: 523.25, start: 0.54 },
    ];

    fanfareNotes.forEach(({ freq, start }) => {
      const dur = start < 0.5 ? 0.2 : 0.8;
      const g = this._busGain(ctx, 0);
      g.gain.setValueAtTime(0, t + start);
      g.gain.linearRampToValueAtTime(0.28, t + start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);

      const o = this._osc(ctx, 'sawtooth', freq);
      o.frequency.setValueAtTime(freq * 0.98, t + start);
      o.frequency.linearRampToValueAtTime(freq, t + start + 0.05);
      o.connect(g);
      o.start(t + start);
      o.stop(t + start + dur + 0.05);
    });
  }

  /**
   * Lose — descending wah / sad-trombone feel.
   */
  lose() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Three descending sawtooth notes mimicking a sad trombone glide
    const segments = [
      { startFreq: 440, endFreq: 349, startT: 0.0, dur: 0.4 },
      { startFreq: 349, endFreq: 293, startT: 0.35, dur: 0.4 },
      { startFreq: 293, endFreq: 220, startT: 0.7,  dur: 0.6 },
    ];

    segments.forEach(({ startFreq, endFreq, startT, dur }) => {
      const g = this._busGain(ctx, 0);
      g.gain.setValueAtTime(0, t + startT);
      g.gain.linearRampToValueAtTime(0.4, t + startT + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + startT + dur);

      // Wah filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t + startT);
      filter.frequency.linearRampToValueAtTime(300, t + startT + dur);
      filter.Q.setValueAtTime(3, t + startT);
      filter.connect(g);

      const o = this._osc(ctx, 'sawtooth', startFreq);
      o.frequency.setValueAtTime(startFreq, t + startT);
      o.frequency.linearRampToValueAtTime(endFreq, t + startT + dur);
      o.connect(filter);
      o.start(t + startT);
      o.stop(t + startT + dur + 0.05);
    });
  }
}

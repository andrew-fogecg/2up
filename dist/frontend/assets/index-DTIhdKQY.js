(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))a(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const we={AED:{symbol:"AED",decimals:2,symbolAfter:!0},ARS:{symbol:"ARS",decimals:2,symbolAfter:!0},USD:{symbol:"$",decimals:2},EUR:{symbol:"€",decimals:2},GBP:{symbol:"£",decimals:2},AUD:{symbol:"A$",decimals:2},BHD:{symbol:"BHD",decimals:3,symbolAfter:!0},CAD:{symbol:"CA$",decimals:2},BRL:{symbol:"R$",decimals:2},CRC:{symbol:"CRC",decimals:2,symbolAfter:!0},IDR:{symbol:"IDR",decimals:0,symbolAfter:!0},MXN:{symbol:"MX$",decimals:2},JPY:{symbol:"¥",decimals:0},KWD:{symbol:"KWD",decimals:3,symbolAfter:!0},KRW:{symbol:"₩",decimals:0},OMR:{symbol:"OMR",decimals:3,symbolAfter:!0},SAR:{symbol:"SAR",decimals:2,symbolAfter:!0},SC:{symbol:"SC",decimals:0,symbolAfter:!0},TWD:{symbol:"TWD",decimals:2,symbolAfter:!0},UAH:{symbol:"UAH",decimals:2,symbolAfter:!0},XSC:{symbol:"SC",decimals:0,symbolAfter:!0},GC:{symbol:"GC",decimals:0,symbolAfter:!0},XGC:{symbol:"GC",decimals:0,symbolAfter:!0},ZAR:{symbol:"ZAR",decimals:2,symbolAfter:!0}},ue=Object.freeze({SC:.1,XSC:.1,GC:.1,XGC:.1}),F=1e6;function Ue(s){const e=String(s);return e.includes(".")?e.split(".")[1].length:0}function _e(s="GC"){if(s in ue)return ue[s];const e=we[s]??{decimals:2};return(e.decimals??2)<=0?1:1/10**e.decimals}function ae(s="GC"){return Ue(_e(s))}function I(s,e="GC"){const t=we[e]??{symbol:e,decimals:2},a=ae(e),i=Math.max(t.decimals??2,a);let o=(s/F).toFixed(i);return(t.decimals??2)<i&&(o=o.replace(/(\.\d*?[1-9])0+$/,"$1").replace(/\.0+$/,"")),t.symbolAfter?`${o} ${t.symbol}`:`${t.symbol}${o}`}const T=Object.freeze({IDLE:"IDLE",BETTING:"BETTING",SPINNING:"SPINNING",RESOLVING:"RESOLVING",RESULT:"RESULT"}),p=Object.freeze({HEADS:"HEADS",TAILS:"TAILS",FIVE_ODDS:"FIVE_ODDS"}),z={[p.HEADS]:1,[p.TAILS]:1,[p.FIVE_ODDS]:28};async function pe(s,e){const t=new TextEncoder,a=await crypto.subtle.importKey("raw",t.encode(s),{name:"HMAC",hash:"SHA-256"},!1,["sign"]),i=await crypto.subtle.sign("HMAC",a,t.encode(e));return Array.from(new Uint8Array(i)).map(r=>r.toString(16).padStart(2,"0")).join("")}async function he(s){const e=new TextEncoder,t=await crypto.subtle.digest("SHA-256",e.encode(s));return Array.from(new Uint8Array(t)).map(a=>a.toString(16).padStart(2,"0")).join("")}function N(s=32){const e=new Uint8Array(s);return crypto.getRandomValues(e),Array.from(e).map(t=>t.toString(16).padStart(2,"0")).join("")}function me(s){const e=parseInt(s.slice(0,8),16),t=parseInt(s.slice(8,16),16);return[e%2===0?"H":"T",t%2===0?"H":"T"]}function fe(s,e){return s==="H"&&e==="H"?"HEADS":s==="T"&&e==="T"?"TAILS":"ODDS"}class qe{constructor(e={}){this.currency=e.currency??"GC",this.wallet=(e.startingBalance??1e3)*F,this.state=T.IDLE,this._serverSeed=N(),this._serverSeedHashed=null,this._clientSeed=N(16),this._nonce=0,this._currentBet=null,this._tosses=[],this.consecutiveOdds=0,this.sessionID=this._makeSessionID(),this.roundNumber=0,this.roundHistory=[],this.totalWagered=0,this.totalWon=0,this.onStateChange=null,this.onCoinToss=null,this.onWin=null,this.onLoss=null,this.onOddsStreak=null,this.onOddedOut=null,this.onError=null,he(this._serverSeed).then(t=>{this._serverSeedHashed=t})}get balance(){return this.wallet}get balanceDisplay(){return I(this.wallet,this.currency)}get serverSeedHash(){return this._serverSeedHashed}get clientSeed(){return this._clientSeed}get sessionRTP(){return this.totalWagered===0?null:this.totalWon/this.totalWagered*100}async startRound(e,t){if(this.state!==T.IDLE)return this._emit("onError","A round is already in progress"),!1;if(!p[e])return this._emit("onError",`Unknown bet type: ${e}`),!1;const a=Math.round(t*F);return a<=0?(this._emit("onError","Bet must be greater than zero"),!1):a>this.wallet?(this._emit("onError","Insufficient doubloons!"),!1):(this._currentBet={type:e,amount:a},this._tosses=[],this.consecutiveOdds=0,this.roundNumber++,this._setState(T.BETTING),this._setState(T.SPINNING),this._runTossLoop())}setClientSeed(e){this.state===T.IDLE&&(this._clientSeed=String(e).trim().slice(0,64)||N(16))}async rotateServerSeed(){if(this.state!==T.IDLE)return null;const e=this._serverSeed;return this._serverSeed=N(),this._serverSeedHashed=await he(this._serverSeed),this._nonce=0,{revealedSeed:e,newHash:this._serverSeedHashed}}async verifyFairness(e,t,a){const i=await pe(e,`${t}:${a}`),[r,o]=me(i);return{coin1:r,coin2:o,result:fe(r,o),hash:i}}resetGame(){this.wallet=1e3*F,this.roundNumber=0,this.roundHistory=[],this.totalWagered=0,this.totalWon=0,this.consecutiveOdds=0,this._currentBet=null,this._tosses=[],this._nonce=0,this._setState(T.IDLE)}async _runTossLoop(){for(;;){const e=await this._performToss();if(e.result==="ODDS"){if(this.consecutiveOdds++,this._emit("onOddsStreak",this.consecutiveOdds),this.consecutiveOdds>=5)return this._resolve("ODDED_OUT",e);continue}return this._resolve(e.result,e)}}async _performToss(){this._nonce++;const e=await pe(this._serverSeed,`${this._clientSeed}:${this._nonce}`),[t,a]=me(e),i=fe(t,a),r={coin1:t,coin2:a,result:i,hash:e,nonce:this._nonce};return this._tosses.push(r),this._emit("onCoinToss",t,a,i,this._tosses.length),r}_resolve(e,t){this._setState(T.RESOLVING);const a=this._currentBet,i=this.wallet,r=`${this.sessionID}-${this.roundNumber}-${Date.now().toString(36).toUpperCase()}`;let o=0;return e==="HEADS"&&a.type===p.HEADS?(o=a.amount*z[p.HEADS],this.wallet+=o,this.totalWon+=o,this._emit("onWin",o,this.wallet)):e==="TAILS"&&a.type===p.TAILS?(o=a.amount*z[p.TAILS],this.wallet+=o,this.totalWon+=o,this._emit("onWin",o,this.wallet)):e==="ODDED_OUT"&&a.type===p.FIVE_ODDS?(o=a.amount*z[p.FIVE_ODDS],this.wallet+=o,this.totalWon+=o,this._emit("onOddedOut",this.wallet),this._emit("onWin",o,this.wallet)):(o=-a.amount,this.wallet-=a.amount,e==="ODDED_OUT"&&this._emit("onOddedOut",this.wallet),this._emit("onLoss",a.amount,this.wallet)),this.totalWagered+=a.amount,this.roundHistory.unshift({eventId:r,sessionID:this.sessionID,round:this.roundNumber,startBalance:i,betType:a.type,betAmount:a.amount,tosses:this._tosses.map(l=>l.result),tossDetails:this._tosses.map(l=>({coin1:l.coin1,coin2:l.coin2,result:l.result,nonce:l.nonce,hash:l.hash})),outcome:e,profit:o,balance:this.wallet,timestamp:Date.now()}),this.roundHistory.length>50&&this.roundHistory.pop(),this._currentBet=null,this._setState(T.RESULT),this._setState(T.IDLE),{outcome:e,profit:o,balance:this.wallet}}_setState(e){this.state=e,this._emit("onStateChange",e)}_emit(e,...t){if(typeof this[e]=="function")try{this[e](...t)}catch(a){console.error(`TwoUpGame event error [${e}]:`,a)}}_makeSessionID(){const e=Date.now().toString(36).toUpperCase(),t=Math.random().toString(36).slice(2,8).toUpperCase();return`HOT-${e}-${t}`}}class Pe{constructor(){this._ctx=null,this._masterGain=null,this._muted=!1,this._volume=.8,this._ready=!1,this.init=this.init.bind(this)}async init(){if(this._ready){this._ctx?.state==="suspended"&&this._ctx.resume().catch(()=>{});return}const e=window.AudioContext||window.webkitAudioContext;if(!e){console.warn("[SoundEngine] Web Audio API not supported in this browser.");return}this._ctx=new e,this._masterGain=this._ctx.createGain(),this._masterGain.gain.setValueAtTime(this._volume,this._ctx.currentTime),this._masterGain.connect(this._ctx.destination),this._ready=!0,this._ctx.state==="suspended"&&this._ctx.resume().catch(()=>{})}setVolume(e){this._volume=Math.max(0,Math.min(1,e)),this._masterGain&&!this._muted&&this._masterGain.gain.linearRampToValueAtTime(this._volume,this._ctx.currentTime+.05)}mute(){this._muted=!0,this._masterGain&&this._masterGain.gain.linearRampToValueAtTime(0,this._ctx.currentTime+.05)}unmute(){this._muted=!1,this._masterGain&&this._masterGain.gain.linearRampToValueAtTime(this._volume,this._ctx.currentTime+.05)}_getCtx(){return this._ready?this._ctx:(console.warn("[SoundEngine] Call init() before playing sounds."),null)}_noiseSource(e,t){const a=e.sampleRate,i=Math.ceil(a*t),r=e.createBuffer(1,i,a),o=r.getChannelData(0);for(let c=0;c<i;c++)o[c]=Math.random()*2-1;const l=e.createBufferSource();return l.buffer=r,l}_busGain(e,t=1){const a=e.createGain();return a.gain.setValueAtTime(t,e.currentTime),a.connect(this._masterGain),a}_osc(e,t,a){const i=e.createOscillator();return i.type=t,i.frequency.setValueAtTime(a,e.currentTime),i}buttonClick(){const e=this._getCtx();if(!e)return;const t=e.currentTime,a=this._busGain(e,.35);a.gain.exponentialRampToValueAtTime(.001,t+.04);const i=this._osc(e,"square",1400);i.connect(a),i.start(t),i.stop(t+.04)}uiHover(){const e=this._getCtx();if(!e)return;const t=e.currentTime,a=this._busGain(e,.12);a.gain.exponentialRampToValueAtTime(.001,t+.025);const i=this._osc(e,"sine",3200);i.connect(a),i.start(t),i.stop(t+.025)}coinLaunch(){const e=this._getCtx();if(!e)return;const t=e.currentTime,a=this._busGain(e,.45);a.gain.setValueAtTime(.45,t),a.gain.exponentialRampToValueAtTime(.001,t+.35);const i=e.createBiquadFilter();i.type="bandpass",i.frequency.setValueAtTime(800,t),i.frequency.exponentialRampToValueAtTime(200,t+.35),i.Q.setValueAtTime(1.8,t),i.connect(a);const r=this._noiseSource(e,.4);r.connect(i),r.start(t),r.stop(t+.4);const o=this._busGain(e,.6);o.gain.setValueAtTime(.6,t+.05),o.gain.exponentialRampToValueAtTime(.001,t+.18);const l=this._osc(e,"sine",5200);l.connect(o),l.start(t+.05),l.stop(t+.18);const c=this._busGain(e,.3);c.gain.setValueAtTime(.3,t+.05),c.gain.exponentialRampToValueAtTime(.001,t+.14);const u=this._osc(e,"sine",7300);u.connect(c),u.start(t+.05),u.stop(t+.14)}coinSpin(){const e=this._getCtx();if(!e)return()=>{};const t=e.currentTime,a=this._busGain(e,0);a.gain.linearRampToValueAtTime(.35,t+.1);const i=e.createOscillator();i.type="sine",i.frequency.setValueAtTime(18,t);const r=e.createGain();r.gain.setValueAtTime(.3,t),i.connect(r),r.connect(a.gain);const o=this._osc(e,"sine",4800);return o.connect(a),o.start(t),i.start(t),()=>{const l=e.currentTime;a.gain.cancelScheduledValues(l),a.gain.setValueAtTime(a.gain.value,l),a.gain.linearRampToValueAtTime(0,l+.08),o.stop(l+.09),i.stop(l+.09)}}headsLand(){const e=this._getCtx();if(!e)return;const t=e.currentTime,a=[261.63,329.63,392,523.25],i=[0,.07,.13,.2];a.forEach((r,o)=>{const l=this._busGain(e,0);l.gain.setValueAtTime(0,t+i[o]),l.gain.linearRampToValueAtTime(.38,t+i[o]+.03),l.gain.exponentialRampToValueAtTime(.001,t+i[o]+.5);const c=this._osc(e,"sawtooth",r);c.frequency.setValueAtTime(r*.97,t+i[o]),c.frequency.linearRampToValueAtTime(r,t+i[o]+.06),c.connect(l),c.start(t+i[o]),c.stop(t+i[o]+.55)})}tailsLand(){const e=this._getCtx();if(!e)return;const t=e.currentTime,a=this._busGain(e,.9);a.gain.setValueAtTime(.9,t),a.gain.exponentialRampToValueAtTime(.001,t+.4);const i=this._osc(e,"sine",180);i.frequency.setValueAtTime(180,t),i.frequency.exponentialRampToValueAtTime(40,t+.12),i.connect(a),i.start(t),i.stop(t+.45);const r=this._busGain(e,.5);r.gain.setValueAtTime(.5,t),r.gain.exponentialRampToValueAtTime(.001,t+.06);const o=e.createBiquadFilter();o.type="highpass",o.frequency.setValueAtTime(200,t),o.connect(r);const l=this._noiseSource(e,.07);l.connect(o),l.start(t),l.stop(t+.07)}oddsResult(){const e=this._getCtx();if(!e)return;const t=e.currentTime;[220,261.63,329.63].forEach((i,r)=>{const o=this._busGain(e,0);o.gain.setValueAtTime(0,t+r*.06),o.gain.linearRampToValueAtTime(.3,t+r*.06+.04),o.gain.exponentialRampToValueAtTime(.001,t+r*.06+.7);const l=this._osc(e,"triangle",i),c=e.createOscillator();c.type="sine",c.frequency.setValueAtTime(5,t);const u=e.createGain();u.gain.setValueAtTime(3,t),c.connect(u),u.connect(l.frequency),l.connect(o),l.start(t+r*.06),c.start(t+r*.06),l.stop(t+r*.06+.75),c.stop(t+r*.06+.75)})}oddedOut(){const e=this._getCtx();if(!e)return;const t=e.currentTime;[146.83,174.61,207.65,246.94].forEach((i,r)=>{const o=this._busGain(e,0);o.gain.setValueAtTime(0,t),o.gain.linearRampToValueAtTime(.35,t+.08),o.gain.setValueAtTime(.35,t+.5+r*.15),o.gain.linearRampToValueAtTime(0,t+.5+r*.15+.4);const l=this._osc(e,"square",i),c=this._osc(e,"square",i*2),u=e.createGain();u.gain.setValueAtTime(.5,t),l.connect(u),c.connect(u),u.connect(o),l.frequency.setValueAtTime(i,t),l.frequency.linearRampToValueAtTime(i*.88,t+1.2+r*.15),c.frequency.setValueAtTime(i*2,t),c.frequency.linearRampToValueAtTime(i*2*.88,t+1.2+r*.15);const S=t+1.2+r*.15+.1;l.start(t),c.start(t),l.stop(S),c.stop(S)})}bigWin(){const e=this._getCtx();if(!e)return;const t=e.currentTime;[3200,4100,5e3,3800,4500,5400,3e3,4800].forEach((r,o)=>{const l=o*.09,c=this._busGain(e,0);c.gain.setValueAtTime(0,t+l),c.gain.linearRampToValueAtTime(.45,t+l+.01),c.gain.exponentialRampToValueAtTime(.001,t+l+.25);const u=this._osc(e,"sine",r);u.connect(c),u.start(t+l),u.stop(t+l+.28)}),[{freq:261.63,start:0},{freq:329.63,start:.12},{freq:392,start:.24},{freq:523.25,start:.36},{freq:261.63,start:.54},{freq:329.63,start:.54},{freq:392,start:.54},{freq:523.25,start:.54}].forEach(({freq:r,start:o})=>{const l=o<.5?.2:.8,c=this._busGain(e,0);c.gain.setValueAtTime(0,t+o),c.gain.linearRampToValueAtTime(.28,t+o+.04),c.gain.exponentialRampToValueAtTime(.001,t+o+l);const u=this._osc(e,"sawtooth",r);u.frequency.setValueAtTime(r*.98,t+o),u.frequency.linearRampToValueAtTime(r,t+o+.05),u.connect(c),u.start(t+o),u.stop(t+o+l+.05)})}lose(){const e=this._getCtx();if(!e)return;const t=e.currentTime;[{startFreq:440,endFreq:349,startT:0,dur:.4},{startFreq:349,endFreq:293,startT:.35,dur:.4},{startFreq:293,endFreq:220,startT:.7,dur:.6}].forEach(({startFreq:i,endFreq:r,startT:o,dur:l})=>{const c=this._busGain(e,0);c.gain.setValueAtTime(0,t+o),c.gain.linearRampToValueAtTime(.4,t+o+.04),c.gain.exponentialRampToValueAtTime(.001,t+o+l);const u=e.createBiquadFilter();u.type="bandpass",u.frequency.setValueAtTime(800,t+o),u.frequency.linearRampToValueAtTime(300,t+o+l),u.Q.setValueAtTime(3,t+o),u.connect(c);const S=this._osc(e,"sawtooth",i);S.frequency.setValueAtTime(i,t+o),S.frequency.linearRampToValueAtTime(r,t+o+l),S.connect(u),S.start(t+o),S.stop(t+o+l+.05)})}}const C=1e6,We=new URL("./assets/",window.location.href);function ie(s){return new URL(s,We).toString()}const w=ie("coin-heads.png"),V=ie("coin-tails.png"),Ye=ie("gameboardpng.png"),f=new Pe;let Z=null;async function _(){Z||(Z=f.init().then(()=>{Be()})),await Z}document.addEventListener("pointerdown",()=>{_()},{once:!0,capture:!0});function Ke(){const s=new URLSearchParams(window.location.search),e=["1","true"].includes((s.get("social")??"").toLowerCase()),t=/(^|\.)stake\.us$/i.test(window.location.hostname);return{replay:s.get("replay")??null,sessionID:s.get("sessionID")??null,nonce:parseInt(s.get("nonce")??"1",10),social:e||t,language:s.get("language")??null,currency:s.get("currency")??"GC",amount:s.get("amount")?parseFloat(s.get("amount")):null,balance:s.get("balance")?parseFloat(s.get("balance")):null}}function Xe(s){return{panelTitle:"Select Outcome",stakeLabel:"Stake",potentialLabel:"Potential Return",idlePrompt:"Choose an outcome and press play.",winBanner:s?"NICE!":"YE WIN!",lossBanner:s?"TRY AGAIN!":"YE LOSE!",invalidAmountError:"Enter a valid amount.",insufficientBalanceError:"Insufficient balance.",disclaimer:s?"Malfunction voids all awards and rounds. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many rounds. Animations are not representative of any physical device, and are for illustrative purposes only. TM and © 2026 Stake Engine.":"Malfunction voids all pays and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many rounds. Animations are not representative of any physical device, and are for illustrative purposes only. TM and © 2026 Stake Engine."}}function U(s,e){return I(Math.round(s*C),e)}function Qe(s,e){const t=U(100,s),a=e.disclaimer.startsWith("Malfunction voids all awards")?"Malfunction voids all awards and rounds.":"Malfunction voids all pays and plays.";return`
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
          <p>HEADS and TAILS modes target 96.875% RTP. 5 MISMATCHED targets 90.625% RTP. Maximum theoretical award is 28x the selected amount, or ${t} at the current top quick-select amount.</p>
        </section>

        <section class="rules-section">
          <h3>Disclaimer</h3>
          <p>${a} A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many rounds. Animations are not representative of any physical device, and are for illustrative purposes only. TM and © 2026 Stake Engine.</p>
        </section>
      </div>
    </div>
  `}function be(s){const e=_e(s),t=ae(s);return t<=0?"1":e.toFixed(t)}function De(s,e){const t=ae(e);return t<=0?String(Number(s)):Number(s).toFixed(t).replace(/(\.\d*?[1-9])0+$/,"$1").replace(/\.0+$/,"")}const Le="headsortails-replays-v1",Ie="headsortails-sound-muted";function Ce(){try{const s=window.localStorage.getItem(Le),e=s?JSON.parse(s):[];return Array.isArray(e)?e:[]}catch{return[]}}function ze(s){try{const e=Ce().filter(t=>t.eventId!==s.eventId);e.unshift(s),window.localStorage.setItem(Le,JSON.stringify(e.slice(0,50)))}catch{}}function Ze(s){return Ce().find(e=>e.eventId===s)??null}function je(s,e){const t=e.amount&&e.amount>0?Math.round(e.amount*C):s.betAmount,a=s.betAmount>0?t/s.betAmount:1,i=e.balance!=null?Math.round(e.balance*C):s.startBalance;return{...s,betAmount:t,profit:Math.round(s.profit*a),startBalance:i,balance:i+Math.round(s.profit*a)}}function Je(){return`
    <div class="replay-banner hidden" id="replay-banner">
      <div class="replay-banner__text" id="replay-banner-text"></div>
      <button class="replay-repeat-btn hidden" id="replay-repeat-btn">REPLAY SAME EVENT</button>
    </div>
  `}function et(){return'<button class="sound-toggle" id="sound-toggle" aria-pressed="false">SOUND ON</button>'}function tt(){return`
    <div class="header-controls">
      <details class="provably-fair provably-fair--header">
        <summary>Fair Play</summary>
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
      <button class="info-btn info-btn--header" id="info-btn">&#x2139; Game Info</button>
      ${et()}
    </div>
  `}function j(s){return s===p.HEADS?`
      <span class="bet-btn-icon bet-btn-icon--coin" aria-hidden="true">
        <img src="${w}" alt="" draggable="false" />
      </span>
    `:s===p.TAILS?`
      <span class="bet-btn-icon bet-btn-icon--coin" aria-hidden="true">
        <img src="${V}" alt="" draggable="false" />
      </span>
    `:`
    <span class="bet-btn-icon bet-btn-icon--pair" aria-hidden="true">
      <img src="${w}" alt="" draggable="false" />
      <img src="${V}" alt="" draggable="false" />
    </span>
  `}function J(s){return s===p.FIVE_ODDS?`
      <span class="bet-btn-label bet-btn-label--mismatch">
        <span class="bet-btn-count">5</span>
        <span class="bet-btn-copy">Mismatch</span>
      </span>
    `:`<span class="bet-btn-label">${s}</span>`}const x={WIN:["Blimey! Ye struck treasure, ye lucky sea dog!","Heads it is! The doubloons are yours, scallywag!","HAR HAR! Fortune favours the bold and the beautiful!","By Davy Jones' beard — ye did it, ye magnificent pirate!"],LOSS:["Davy Jones takes yer coins, ye scurvy dog!","The sea gives and the sea takes... mostly takes.","Walk the plank! Yer luck has run dry, landlubber!","Down to the depths with yer doubloons! Try again!"],ODDS:["MISMATCHED! The kip demands another toss — come in spinner!","One of each! The coins are mismatched — toss again ye wretch!","Neither heads nor tails! Mismatched — the coins mock ye!","MISMATCHED! The ring is not satisfied yet — spin again!"],ODDED_OUT:["FIVE MISMATCHES! THE CURSE OF THE KIP FALLS UPON YE!","Five consecutive mismatches! Davy Jones himself smiles tonight!","THE ANCIENT CURSE! Five mismatches in a row — RUN YE FOOL!","FIVE MISMATCHES! The kip has spoken — YE ARE CURSED, SCALLYWAG!"],IDLE:["Choose yer fate and come in, spinner!","The doubloons await... if ye dare.","Toss the coins! Fortune or folly awaits thee!","Are ye a coward or a pirate? STEP TO THE KIP!","The ring is ready — step forward, Spinner!","Choose yer fate, ye bold sea dog!"]},B={WIN:['"Pieces of eight!"','"Gold fer us, lad!"','"Strike it rich! SQUAWK!"'],LOSS:['"Davy Jones! SQUAWK!"','"Walk the plank..."','"Rough seas ahead..."'],ODDS:['"Again! Mismatched! KRAWWWK!"','"Spin it, scurvy dog!"','"One of each! SQUAWK!"'],ODDED_OUT:['"CURSE! THE CURSE! SQUAWK!"','"Five mismatches! DOOMED! KRAWWWK!"']};function y(s){return s[Math.floor(Math.random()*s.length)]}const st=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 3a7 7 0 0 0-7 7c0 2.72 1.54 5.1 3.82 6.37L9 19h6l.18-2.63A7 7 0 0 0 12 3z"/>
  <ellipse cx="9.5" cy="10.5" rx="1.5" ry="2" fill="var(--dark-oak,#2C1A0E)"/>
  <ellipse cx="14.5" cy="10.5" rx="1.5" ry="2" fill="var(--dark-oak,#2C1A0E)"/>
  <rect x="9" y="17" width="6" height="3" rx="1" fill="var(--dark-oak,#2C1A0E)"/>
  <line x1="10.5" y1="17" x2="10.5" y2="20" stroke="var(--fog-white,#F5ECD7)" stroke-width="0.8"/>
  <line x1="12" y1="17" x2="12" y2="20" stroke="var(--fog-white,#F5ECD7)" stroke-width="0.8"/>
  <line x1="13.5" y1="17" x2="13.5" y2="20" stroke="var(--fog-white,#F5ECD7)" stroke-width="0.8"/>
</svg>`,nt=`<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 95 Q70 74 92 68 L92 38 L98 38 L98 14 L102 14 L102 38 L108 38 L108 68 Q180 62 250 66 Q320 62 392 68 L392 38 L398 38 L398 14 L402 14 L402 38 L408 38 L408 68 Q430 74 440 95 Q320 112 250 114 Q180 112 60 95 Z" fill="#1a0f06"/>
  <path d="M100 16 L100 65 L135 54 Z" fill="#2C1A0E"/>
  <path d="M400 16 L400 65 L435 54 Z" fill="#2C1A0E"/>
  <path d="M100 8 L100 19 L116 13 Z" fill="#8B0000"/>
  <path d="M400 8 L400 19 L416 13 Z" fill="#8B0000"/>
  <rect x="245" y="30" width="10" height="36" fill="#2C1A0E"/>
  <path d="M255 32 L255 64 L282 55 Z" fill="#2C1A0E"/>
  <path d="M255 24 L255 34 L268 29 Z" fill="#8B0000"/>
</svg>`;function at(s,e,t){const a=Array.from({length:5},(i,r)=>`<span class="skull-icon" data-index="${r}">${st}</span>`).join("");return`
<div class="game-root">

  ${Je()}

  <div class="cavern-bg">
    <div class="vignette"></div>
    <div class="gold-dust-container" id="gold-dust"></div>
  </div>

  <div class="ship-silhouette">${nt}</div>

  <div class="parrot-zone" id="parrot-zone">
    <div class="speech-bubble parrot-bubble" id="parrot-bubble"></div>
    <div class="parrot" id="parrot">&#x1F99C;</div>
  </div>

  <header class="game-header">
    <div class="balance-bar">
      <div class="balance-display">&#x1F4B0; <span id="balance-value">${U(e,s)}</span></div>
      <div class="session-id" id="session-display"></div>
      ${tt()}
    </div>
  </header>

  <main class="game-layout">

    <aside class="betting-panel small-screen-page" id="setup-page" data-page="0">
      <h2 class="panel-title">&#x2694;&#xFE0F; ${t.panelTitle}</h2>

      <div class="bet-type-selector" id="bet-type-selector">
        <button class="bet-btn bet-btn--heads active" data-bet="HEADS">
          ${j(p.HEADS)}
          ${J(p.HEADS)}
          <span class="bet-btn-odds">1:1</span>
        </button>
        <button class="bet-btn bet-btn--tails" data-bet="TAILS">
          ${j(p.TAILS)}
          ${J(p.TAILS)}
          <span class="bet-btn-odds">1:1</span>
        </button>
        <button class="bet-btn bet-btn--odds" data-bet="FIVE_ODDS">
          ${j(p.FIVE_ODDS)}
          ${J(p.FIVE_ODDS)}
          <span class="bet-btn-odds">28:1</span>
        </button>
      </div>

      <div class="stake-section">
        <label class="stake-label">${t.stakeLabel}</label>
        <div class="stake-input-row">
          <input type="number" id="stake-input" class="stake-input"
            min="${be(s)}" step="${be(s)}" value="10" autocomplete="off" />
          <span class="stake-currency-label" id="stake-currency-label">${s}</span>
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
        <span class="potential-win-label">${t.potentialLabel}</span>
        <span class="potential-win-value" id="potential-win-value">${U(20,s)}</span>
      </div>

      <div class="odds-streak-section">
        <div class="odds-streak-title">&#x26A0;&#xFE0F; Mismatch Streak</div>
        <div class="skulls-row" id="skulls-row">${a}</div>
        <div class="odds-count-display" id="odds-count-display">0 of 5</div>
      </div>

    </aside>

    <section class="spin-arena small-screen-page" id="board-page" data-page="1">

      <div class="captain-zone" id="captain-zone">
        <div class="captain" id="captain">&#x1F3F4;&#x200D;&#x2620;&#xFE0F;</div>
        <div class="speech-bubble captain-bubble" id="captain-bubble">
          ${t.idlePrompt}
        </div>
      </div>

      <div class="ring-container">
        <div class="gameboard">
          <div class="kip-area">
            <div class="coins-on-kip">
              <div class="coin" id="coin-1">
                <div class="coin-inner" id="coin-1-inner">
                  <div class="coin-face"><img class="coin-img" src="${w}" alt="" draggable="false"></div>
                </div>
                <div class="coin-shadow" id="coin-1-shadow"></div>
              </div>
              <div class="coin" id="coin-2">
                <div class="coin-inner" id="coin-2-inner">
                  <div class="coin-face"><img class="coin-img" src="${w}" alt="" draggable="false"></div>
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

    <aside class="voyage-log-panel small-screen-page" id="results-page" data-page="2">
      <h3 class="voyage-log-title">&#x1F4DC; Voyage Log</h3>
      <div class="history-list" id="history-list">
        <div class="history-empty">No voyages yet, scallywag.</div>
      </div>
    </aside>

  </main>

  <nav class="small-screen-nav" id="small-screen-nav" aria-label="Game screens">
    <button class="small-screen-nav-btn active" data-page="0" aria-pressed="true">Setup</button>
    <button class="small-screen-nav-btn" data-page="1" aria-pressed="false">Board</button>
    <button class="small-screen-nav-btn" data-page="2" aria-pressed="false">Log</button>
  </nav>

  <div class="screen-flash" id="screen-flash"></div>

  <footer class="game-footer">
    <p class="malfunction-notice">${t.disclaimer}</p>
  </footer>

  ${Qe(s,t)}

</div>`}const it=new Set(["GC","XGC","SC","XSC","USD","EUR","GBP","AUD","CAD","BRL","MXN","JPY","KRW","IDR","ARS","CRC","ZAR","AED","SAR","UAH","TWD","KWD","BHD","OMR"]),E=Ke(),ye=E.replay?Ze(E.replay):null,m=ye?je(ye,E):null,ot=!!(E.replay&&!m),b=!!m,Re=E.social||m?.social===!0,M=Xe(Re),ge=(E.currency||m?.currency||"").toUpperCase(),g=it.has(ge)?ge:"GC",xe=m?m.startBalance/C:E.balance??1e3,h=new qe({currency:g,startingBalance:xe});E.language&&(document.documentElement.lang=E.language);const rt=document.getElementById("app");rt.innerHTML=at(g,xe,M);document.documentElement.style.setProperty("--gameboard-image",`url("${Ye}")`);const d=s=>document.getElementById(s),n={balance:d("balance-value"),sessionDisp:d("session-display"),layout:document.querySelector(".game-layout"),smallScreenNav:d("small-screen-nav"),soundToggle:d("sound-toggle"),playBtn:d("play-btn"),playBtnText:d("play-btn-text"),stakeInput:d("stake-input"),potentialWin:d("potential-win-value"),betSelector:d("bet-type-selector"),skullsRow:d("skulls-row"),oddsCount:d("odds-count-display"),resultBanner:d("result-banner"),resultText:d("result-text"),captainBubble:d("captain-bubble"),parrotBubble:d("parrot-bubble"),captain:d("captain"),historyList:d("history-list"),chestLeft:d("chest-left"),chestRight:d("chest-right"),screenFlash:d("screen-flash"),serverSeedHash:d("server-seed-hash"),clientSeedInput:d("client-seed-input"),rotateSeedBtn:d("rotate-seed-btn"),errorMsg:d("error-message"),goldDust:d("gold-dust"),tossCounter:d("toss-counter"),tossNum:d("toss-num"),coin1Inner:d("coin-1-inner"),coin2Inner:d("coin-2-inner"),coin1Shadow:d("coin-1-shadow"),coin2Shadow:d("coin-2-shadow"),infoBtn:d("info-btn"),rulesBackdrop:d("rules-backdrop"),rulesCloseBtn:d("rules-close-btn"),replayBanner:d("replay-banner"),replayBannerText:d("replay-banner-text"),replayRepeatBtn:d("replay-repeat-btn")},Oe=Array.from(document.querySelectorAll(".small-screen-nav-btn"));let oe=p.HEADS,v=!1,ee=[],D=null,q=!1,te=!1,O=window.sessionStorage.getItem(Ie)==="1",re=0;n.sessionDisp.textContent=b?`Replay: ${m.eventId}`:`Session: ${h.sessionID}`;n.clientSeedInput.value=h.clientSeed;const lt=setInterval(()=>{h.serverSeedHash&&(n.serverSeedHash.textContent=h.serverSeedHash.slice(0,20)+"...",clearInterval(lt))},100);h.onCoinToss=(s,e,t,a)=>ee.push({c1:s,c2:e,result:t,idx:a});h.onWin=(s,e)=>{D={type:"win",profit:s,balance:e}};h.onLoss=(s,e)=>{D={type:"loss",amount:s,balance:e}};h.onOddsStreak=()=>{};h.onOddedOut=s=>{D?(D.oddedOut=!0,D.balance=s):D={type:"loss",amount:0,balance:s,oddedOut:!0}};h.onStateChange=()=>{};h.onError=s=>W(s);(function(){for(let e=0;e<30;e++){const t=document.createElement("div"),a=(Math.random()-.4)*70;t.className="gold-particle",t.style.cssText=[`left:${15+Math.random()*70}%`,`bottom:${3+Math.random()*38}%`,`animation-delay:${(Math.random()*5).toFixed(2)}s`,`animation-duration:${(3.5+Math.random()*4).toFixed(2)}s`,`width:${(2+Math.random()*3).toFixed(1)}px`,`height:${(2+Math.random()*3).toFixed(1)}px`,`--drift:${a.toFixed(0)}px`].join(";"),n.goldDust.appendChild(t)}})();n.betSelector.addEventListener("click",s=>{if(b)return;const e=s.target.closest(".bet-btn");!e||v||Me(e.dataset.bet)});n.stakeInput.addEventListener("input",Y);document.querySelectorAll(".quick-btn").forEach(s=>{s.addEventListener("click",()=>{v||b||(n.stakeInput.value=s.dataset.stake==="max"?De(h.balance/C,g):s.dataset.stake,Y())})});function Y(){const s=parseFloat(n.stakeInput.value)||0,e=oe===p.FIVE_ODDS?28:1;n.potentialWin.textContent=U(s*e,g)}function Me(s){n.betSelector.querySelectorAll(".bet-btn").forEach(e=>{e.classList.toggle("active",e.dataset.bet===s)}),oe=s,Y()}function ct(){n.historyList.innerHTML=""}function se(){b&&(n.replayBanner.classList.remove("hidden"),n.replayBannerText.textContent=`REPLAY MODE • ${m.eventId} • ${m.betType} • ${I(m.betAmount,g)}`,n.replayRepeatBtn.classList.toggle("hidden",!te),n.playBtnText.textContent="REPLAY EVENT",[...n.betSelector.querySelectorAll(".bet-btn"),...document.querySelectorAll(".quick-btn"),n.stakeInput,n.clientSeedInput,n.rotateSeedBtn].forEach(s=>{s.disabled=!0}))}function ke(){n.soundToggle.textContent=O?"SOUND OFF":"SOUND ON",n.soundToggle.setAttribute("aria-pressed",String(O))}function K(){return window.innerWidth<=900}function X(){const s=window.visualViewport?.height??window.innerHeight;document.documentElement.style.setProperty("--app-height",`${Math.round(s)}px`)}function le(s){re=s,Oe.forEach((e,t)=>{const a=t===s;e.classList.toggle("active",a),e.setAttribute("aria-pressed",String(a))})}function R(s,e="smooth"){if(!n.layout||!K())return;const t=n.layout.clientWidth*s;n.layout.scrollTo({left:t,behavior:e}),le(s)}function dt(){if(!n.layout||!K())return;const s=Math.round(n.layout.scrollLeft/Math.max(1,n.layout.clientWidth));le(s)}function Be(){O?f.mute():f.unmute()}async function He(s){const e=s.tossDetails?.[s.tossDetails.length-1]??null,t=s.outcome==="ODDED_OUT",a=t&&s.betType===p.FIVE_ODDS&&s.profit>0,i=s.profit>=0,r=s.profit>=s.betAmount*4;if(a){f.bigWin(),await $("FIVE ODDS! JACKPOT!","heads",3200),L("excited"),A(y(x.ODDED_OUT),4200),H(y(B.ODDED_OUT),3500),Ae();return}if(t){f.oddedOut(),await $("ODDED OUT! CURSED!","odded",3200),L("angry"),A(y(x.ODDED_OUT),4200),H(y(B.ODDED_OUT),3500),pt();return}if(i){r?(f.bigWin(),Ae()):f.headsLand();const l=e?e.result:"WIN";await $(`${l}! ${M.winBanner}`,"heads",2800),L("excited"),A(y(x.WIN),3800),H(y(B.WIN),3200);return}f.lose();const o=e?e.result:"LOSS";await $(`${o}! ${M.lossBanner}`,"tails",2500),L("angry"),A(y(x.LOSS),3800),H(y(B.LOSS),3200)}n.clientSeedInput.addEventListener("change",()=>h.setClientSeed(n.clientSeedInput.value));n.rotateSeedBtn.addEventListener("click",async()=>{if(v||b)return;const s=await h.rotateServerSeed();s&&(n.serverSeedHash.textContent=s.newHash.slice(0,20)+"...",n.clientSeedInput.value=h.clientSeed,A("Seeds rotated! New round begins fresh, matey!",2500))});function k(s){n.balance.textContent=I(s,g)}function P(s){n.skullsRow.querySelectorAll(".skull-icon").forEach((e,t)=>{e.classList.toggle("active",t<s),e.classList.toggle("danger",s>=4&&t<s)}),n.oddsCount.textContent=`${s} of 5`,n.oddsCount.classList.toggle("danger",s>=3)}let ve=null;function A(s,e=3200){n.captainBubble.textContent=s,n.captainBubble.classList.add("visible"),clearTimeout(ve),ve=setTimeout(()=>n.captainBubble.classList.remove("visible"),e)}function L(s){n.captain.className=`captain captain--${s}`}let Se=null;function H(s,e=2800){s&&(n.parrotBubble.textContent=s,n.parrotBubble.classList.add("visible"),clearTimeout(Se),Se=setTimeout(()=>n.parrotBubble.classList.remove("visible"),e))}let Te=null;function W(s){n.errorMsg.textContent=s,n.errorMsg.classList.add("visible"),clearTimeout(Te),Te=setTimeout(()=>n.errorMsg.classList.remove("visible"),3200)}function ut(){q=!0,n.rulesBackdrop.classList.remove("hidden"),n.rulesBackdrop.setAttribute("aria-hidden","false"),n.rulesCloseBtn.focus()}function ce(){q=!1,n.rulesBackdrop.classList.add("hidden"),n.rulesBackdrop.setAttribute("aria-hidden","true"),n.infoBtn.focus()}function $(s,e,t=2200){return n.resultText.textContent=s,n.resultBanner.className=`result-banner visible result--${e}`,ne(t).then(()=>{n.resultBanner.className="result-banner"})}function pt(){const s=document.querySelector(".game-root");n.screenFlash.classList.remove("flash-red"),n.screenFlash.offsetWidth,n.screenFlash.classList.add("flash-red"),s.classList.remove("screen-shake"),s.offsetWidth,s.classList.add("screen-shake"),setTimeout(()=>{n.screenFlash.classList.remove("flash-red"),s.classList.remove("screen-shake")},650)}function Ae(){n.chestLeft.classList.add("open"),n.chestRight.classList.add("open"),setTimeout(()=>{n.chestLeft.classList.remove("open"),n.chestRight.classList.remove("open")},3200)}const $e=window.matchMedia("(prefers-reduced-motion: reduce)").matches;function ne(s){return $e?Promise.resolve():new Promise(e=>setTimeout(e,s))}async function Ee(s,e,t){const i=s.querySelector(".coin-img");if(s.getAnimations().forEach(l=>l.cancel()),e.getAnimations().forEach(l=>l.cancel()),$e){i.src=t==="H"?w:V;return}i.src=w;const r=setTimeout(()=>{i.src=t==="H"?w:V},1850*.48),o=s.animate([{transform:"translateY(0px) rotateY(0deg) scale(1)",filter:"blur(0px)",offset:0},{transform:"translateY(-35px) rotateY(270deg) scale(1.08)",filter:"blur(0px)",offset:.07},{transform:"translateY(-280px) rotateY(900deg) scale(0.82)",filter:"blur(2.5px)",offset:.44},{transform:"translateY(-280px) rotateY(1440deg) scale(0.82)",filter:"blur(3px)",offset:.56},{transform:"translateY(-35px) rotateY(1700deg) scale(1.06)",filter:"blur(1px)",offset:.87},{transform:"translateY(0px) rotateY(1800deg) scale(1)",filter:"blur(0px)",offset:1}],{duration:1850,easing:"cubic-bezier(0.25,0.08,0.25,1)",fill:"forwards"});e.animate([{transform:"translateX(-50%) scaleX(1)",opacity:.45,offset:0},{transform:"translateX(-50%) scaleX(0.25)",opacity:.08,offset:.44},{transform:"translateX(-50%) scaleX(0.25)",opacity:.08,offset:.56},{transform:"translateX(-50%) scaleX(1)",opacity:.45,offset:1}],{duration:1850,easing:"cubic-bezier(0.25,0.08,0.25,1)",fill:"forwards"}),await o.finished,clearTimeout(r),i.src=t==="H"?w:V}async function Ve(s){const{c1:e,c2:t,result:a,idx:i}=s;n.tossCounter.style.display="block",n.tossNum.textContent=String(i),f.coinLaunch(),await Promise.all([Ee(n.coin1Inner,n.coin1Shadow,e),Ee(n.coin2Inner,n.coin2Shadow,t)]),await ne(380),a==="ODDS"?(f.oddsResult(),await $("MISMATCHED!","odds",1300),A(y(x.ODDS),2200),H(y(B.ODDS),2200),[n.coin1Inner,n.coin2Inner,n.coin1Shadow,n.coin2Shadow].forEach(r=>r.getAnimations().forEach(o=>o.cancel())),await ne(700)):a==="HEADS"?f.headsLand():f.tailsLand()}function Ge(s){const e=n.historyList.querySelector(".history-empty");e&&e.remove();const{round:t,betType:a,betAmount:i,tosses:r,outcome:o,profit:l,balance:c}=s,u=l>=0?"profit-positive":"profit-negative",S=`${l>=0?"+":"-"}${I(Math.abs(l),g)}`,Fe=o==="HEADS"?"outcome-heads":o==="TAILS"?"outcome-tails":o==="ODDED_OUT"?"outcome-odded":"outcome-odds",G=document.createElement("div");G.className="history-entry",G.innerHTML=`
    <span class="history-round">#${t}</span>
    <span class="history-bet">${a} ${I(i,g)}</span>
    <span class="history-tosses">${r.join(" → ")}</span>
    <span class="history-outcome ${Fe}">${o==="ODDS"?"MISMATCHED":o}</span>
    <span class="history-profit ${u}">${S}</span>
    <span class="history-balance">${I(c,g)}</span>
  `,n.historyList.insertBefore(G,n.historyList.firstChild),requestAnimationFrame(()=>requestAnimationFrame(()=>G.classList.add("history-entry--visible")));const Q=n.historyList.querySelectorAll(".history-entry");Q.length>10&&Q[Q.length-1].remove()}async function de(){if(!b||v)return;await _(),R(1),te=!1,se(),ct(),P(0),k(m.startBalance),A(`Replaying event ${m.eventId}`,2600),L("neutral"),v=!0,n.playBtn.disabled=!0,n.playBtn.classList.add("spinning"),n.errorMsg.classList.remove("visible"),n.tossCounter.style.display="none";let s=0;for(const[e,t]of m.tossDetails.entries())t.result==="ODDS"&&(s++,P(s)),await Ve({c1:t.coin1,c2:t.coin2,result:t.result,idx:e+1});k(m.balance),await He(m),Ge(m),R(2),te=!0,se(),n.tossCounter.style.display="none",v=!1,n.playBtn.disabled=!1,n.playBtn.classList.remove("spinning"),[n.coin1Inner,n.coin2Inner,n.coin1Shadow,n.coin2Shadow].forEach(e=>e.getAnimations().forEach(t=>t.cancel()))}async function Ne(){if(b){await de();return}if(v)return;await _();const s=parseFloat(n.stakeInput.value);if(!s||s<=0){W(M.invalidAmountError);return}const e=Math.round(s*C);if(e>h.balance){W(M.insufficientBalanceError);return}R(1),ee=[],D=null,k(h.balance-e),v=!0,n.playBtn.disabled=!0,n.playBtn.classList.add("spinning"),n.errorMsg.classList.remove("visible"),n.tossCounter.style.display="none",P(0),A("Come in, Spinner! The coins are in the air!",2800),L("neutral"),await h.startRound(oe,s);let t=0;for(const a of ee)a.result==="ODDS"&&(t++,P(t)),await Ve(a);if(k(h.balance),h.roundHistory.length>0){const a=h.roundHistory[0];await He(a),Ge(a),ze({...a,currency:g,social:Re}),R(2)}n.tossCounter.style.display="none",v=!1,n.playBtn.disabled=!1,n.playBtn.classList.remove("spinning"),[n.coin1Inner,n.coin2Inner,n.coin1Shadow,n.coin2Shadow].forEach(a=>a.getAnimations().forEach(i=>i.cancel()))}n.playBtn.addEventListener("click",async()=>{await _(),f.buttonClick(),await Ne()});n.betSelector.addEventListener("click",()=>{_().then(()=>f.uiHover())},{capture:!0});n.infoBtn.addEventListener("click",()=>{_().then(()=>f.uiHover()),ut()});n.rulesCloseBtn.addEventListener("click",ce);n.rulesBackdrop.addEventListener("click",s=>{s.target===n.rulesBackdrop&&ce()});n.replayRepeatBtn.addEventListener("click",async()=>{await _(),f.buttonClick(),await de()});n.soundToggle.addEventListener("click",async()=>{await _(),O=!O,window.sessionStorage.setItem(Ie,O?"1":"0"),Be(),ke()});Oe.forEach(s=>{s.addEventListener("click",()=>{R(Number(s.dataset.page??0))})});n.layout?.addEventListener("scroll",dt,{passive:!0});X();window.addEventListener("resize",()=>{X(),K()&&R(re,"auto")});window.addEventListener("orientationchange",()=>{X(),K()&&setTimeout(()=>R(re,"auto"),50)});window.visualViewport?.addEventListener("resize",X);document.addEventListener("keydown",s=>{if(s.code==="Escape"&&q){s.preventDefault(),ce();return}s.code==="Space"&&!s.repeat&&(s.preventDefault(),!v&&!q&&!b&&Ne())});b?(Me(m.betType),n.stakeInput.value=De(m.betAmount/C,g),k(m.startBalance),se()):k(h.balance);Y();ke();le(0);L("neutral");A(b?`Replay loaded: ${m.eventId}`:M.idlePrompt,3500);ot&&W(`Replay ${E.replay} was not found on this device.`);b&&setTimeout(()=>{de()},250);setInterval(()=>{!v&&!b&&A(y(x.IDLE),3500)},9e3);

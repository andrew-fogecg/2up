(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=t(s);fetch(s.href,a)}})();const ie={USD:{symbol:"$",decimals:2},EUR:{symbol:"€",decimals:2},GBP:{symbol:"£",decimals:2},AUD:{symbol:"A$",decimals:2},CAD:{symbol:"CA$",decimals:2},BRL:{symbol:"R$",decimals:2},MXN:{symbol:"MX$",decimals:2},JPY:{symbol:"¥",decimals:0},KRW:{symbol:"₩",decimals:0},SC:{symbol:"SC",decimals:0,symbolAfter:!0},XSC:{symbol:"SC",decimals:0,symbolAfter:!0},GC:{symbol:"GC",decimals:0,symbolAfter:!0},XGC:{symbol:"GC",decimals:0,symbolAfter:!0}},k=1e6;function ae(n,e="GC"){const t=ie[e]??{symbol:e,decimals:2},s=(n/k).toFixed(t.decimals);return t.symbolAfter?`${s} ${t.symbol}`:`${t.symbol}${s}`}const v=Object.freeze({IDLE:"IDLE",BETTING:"BETTING",SPINNING:"SPINNING",RESOLVING:"RESOLVING",RESULT:"RESULT"}),m=Object.freeze({HEADS:"HEADS",TAILS:"TAILS",FIVE_ODDS:"FIVE_ODDS"}),V={[m.HEADS]:1,[m.TAILS]:1,[m.FIVE_ODDS]:28};async function H(n,e){const t=new TextEncoder,i=await crypto.subtle.importKey("raw",t.encode(n),{name:"HMAC",hash:"SHA-256"},!1,["sign"]),s=await crypto.subtle.sign("HMAC",i,t.encode(e));return Array.from(new Uint8Array(s)).map(a=>a.toString(16).padStart(2,"0")).join("")}async function $(n){const e=new TextEncoder,t=await crypto.subtle.digest("SHA-256",e.encode(n));return Array.from(new Uint8Array(t)).map(i=>i.toString(16).padStart(2,"0")).join("")}function C(n=32){const e=new Uint8Array(n);return crypto.getRandomValues(e),Array.from(e).map(t=>t.toString(16).padStart(2,"0")).join("")}function M(n){const e=parseInt(n.slice(0,8),16),t=parseInt(n.slice(8,16),16);return[e%2===0?"H":"T",t%2===0?"H":"T"]}function N(n,e){return n==="H"&&e==="H"?"HEADS":n==="T"&&e==="T"?"TAILS":"ODDS"}class oe{constructor(e={}){this.currency=e.currency??"GC",this.wallet=(e.startingBalance??1e3)*k,this.state=v.IDLE,this._serverSeed=C(),this._serverSeedHashed=null,this._clientSeed=C(16),this._nonce=0,this._currentBet=null,this._tosses=[],this.consecutiveOdds=0,this.sessionID=this._makeSessionID(),this.roundNumber=0,this.roundHistory=[],this.totalWagered=0,this.totalWon=0,this.onStateChange=null,this.onCoinToss=null,this.onWin=null,this.onLoss=null,this.onOddsStreak=null,this.onOddedOut=null,this.onError=null,$(this._serverSeed).then(t=>{this._serverSeedHashed=t})}get balance(){return this.wallet}get balanceDisplay(){return ae(this.wallet,this.currency)}get serverSeedHash(){return this._serverSeedHashed}get clientSeed(){return this._clientSeed}get sessionRTP(){return this.totalWagered===0?null:this.totalWon/this.totalWagered*100}async startRound(e,t){if(this.state!==v.IDLE)return this._emit("onError","A round is already in progress"),!1;if(!m[e])return this._emit("onError",`Unknown bet type: ${e}`),!1;const i=Math.round(t*k);return i<=0?(this._emit("onError","Bet must be greater than zero"),!1):i>this.wallet?(this._emit("onError","Insufficient doubloons!"),!1):(this._currentBet={type:e,amount:i},this._tosses=[],this.consecutiveOdds=0,this.roundNumber++,this._setState(v.BETTING),this._setState(v.SPINNING),this._runTossLoop())}setClientSeed(e){this.state===v.IDLE&&(this._clientSeed=String(e).trim().slice(0,64)||C(16))}async rotateServerSeed(){if(this.state!==v.IDLE)return null;const e=this._serverSeed;return this._serverSeed=C(),this._serverSeedHashed=await $(this._serverSeed),this._nonce=0,{revealedSeed:e,newHash:this._serverSeedHashed}}async verifyFairness(e,t,i){const s=await H(e,`${t}:${i}`),[a,o]=M(s);return{coin1:a,coin2:o,result:N(a,o),hash:s}}resetGame(){this.wallet=1e3*k,this.roundNumber=0,this.roundHistory=[],this.totalWagered=0,this.totalWon=0,this.consecutiveOdds=0,this._currentBet=null,this._tosses=[],this._nonce=0,this._setState(v.IDLE)}async _runTossLoop(){for(;;){const e=await this._performToss();if(e.result==="ODDS"){if(this.consecutiveOdds++,this._emit("onOddsStreak",this.consecutiveOdds),this.consecutiveOdds>=5)return this._resolve("ODDED_OUT",e);continue}return this._resolve(e.result,e)}}async _performToss(){this._nonce++;const e=await H(this._serverSeed,`${this._clientSeed}:${this._nonce}`),[t,i]=M(e),s=N(t,i),a={coin1:t,coin2:i,result:s,hash:e,nonce:this._nonce};return this._tosses.push(a),this._emit("onCoinToss",t,i,s,this._tosses.length),a}_resolve(e,t){this._setState(v.RESOLVING);const i=this._currentBet;let s=0;return e==="HEADS"&&i.type===m.HEADS?(s=i.amount*V[m.HEADS],this.wallet+=s,this.totalWon+=s,this._emit("onWin",s,this.wallet)):e==="TAILS"&&i.type===m.TAILS?(s=i.amount*V[m.TAILS],this.wallet+=s,this.totalWon+=s,this._emit("onWin",s,this.wallet)):e==="ODDED_OUT"&&i.type===m.FIVE_ODDS?(s=i.amount*V[m.FIVE_ODDS],this.wallet+=s,this.totalWon+=s,this._emit("onOddedOut",this.wallet),this._emit("onWin",s,this.wallet)):(s=-i.amount,this.wallet-=i.amount,e==="ODDED_OUT"&&this._emit("onOddedOut",this.wallet),this._emit("onLoss",i.amount,this.wallet)),this.totalWagered+=i.amount,this.roundHistory.unshift({round:this.roundNumber,betType:i.type,betAmount:i.amount,tosses:this._tosses.map(a=>a.result),outcome:e,profit:s,balance:this.wallet,timestamp:Date.now()}),this.roundHistory.length>50&&this.roundHistory.pop(),this._currentBet=null,this._setState(v.RESULT),this._setState(v.IDLE),{outcome:e,profit:s,balance:this.wallet}}_setState(e){this.state=e,this._emit("onStateChange",e)}_emit(e,...t){if(typeof this[e]=="function")try{this[e](...t)}catch(i){console.error(`TwoUpGame event error [${e}]:`,i)}}_makeSessionID(){const e=Date.now().toString(36).toUpperCase(),t=Math.random().toString(36).slice(2,8).toUpperCase();return`DMD-${e}-${t}`}}class re{constructor(){this._ctx=null,this._masterGain=null,this._muted=!1,this._volume=.8,this._ready=!1,this.init=this.init.bind(this)}async init(){if(this._ready)return;const e=window.AudioContext||window.webkitAudioContext;if(!e){console.warn("[SoundEngine] Web Audio API not supported in this browser.");return}this._ctx=new e,this._masterGain=this._ctx.createGain(),this._masterGain.gain.setValueAtTime(this._volume,this._ctx.currentTime),this._masterGain.connect(this._ctx.destination),this._ctx.state==="suspended"&&await this._ctx.resume(),this._ready=!0}setVolume(e){this._volume=Math.max(0,Math.min(1,e)),this._masterGain&&!this._muted&&this._masterGain.gain.linearRampToValueAtTime(this._volume,this._ctx.currentTime+.05)}mute(){this._muted=!0,this._masterGain&&this._masterGain.gain.linearRampToValueAtTime(0,this._ctx.currentTime+.05)}unmute(){this._muted=!1,this._masterGain&&this._masterGain.gain.linearRampToValueAtTime(this._volume,this._ctx.currentTime+.05)}_getCtx(){return this._ready?this._ctx:(console.warn("[SoundEngine] Call init() before playing sounds."),null)}_noiseSource(e,t){const i=e.sampleRate,s=Math.ceil(i*t),a=e.createBuffer(1,s,i),o=a.getChannelData(0);for(let c=0;c<s;c++)o[c]=Math.random()*2-1;const l=e.createBufferSource();return l.buffer=a,l}_busGain(e,t=1){const i=e.createGain();return i.gain.setValueAtTime(t,e.currentTime),i.connect(this._masterGain),i}_osc(e,t,i){const s=e.createOscillator();return s.type=t,s.frequency.setValueAtTime(i,e.currentTime),s}buttonClick(){const e=this._getCtx();if(!e)return;const t=e.currentTime,i=this._busGain(e,.35);i.gain.exponentialRampToValueAtTime(.001,t+.04);const s=this._osc(e,"square",1400);s.connect(i),s.start(t),s.stop(t+.04)}uiHover(){const e=this._getCtx();if(!e)return;const t=e.currentTime,i=this._busGain(e,.12);i.gain.exponentialRampToValueAtTime(.001,t+.025);const s=this._osc(e,"sine",3200);s.connect(i),s.start(t),s.stop(t+.025)}coinLaunch(){const e=this._getCtx();if(!e)return;const t=e.currentTime,i=this._busGain(e,.45);i.gain.setValueAtTime(.45,t),i.gain.exponentialRampToValueAtTime(.001,t+.35);const s=e.createBiquadFilter();s.type="bandpass",s.frequency.setValueAtTime(800,t),s.frequency.exponentialRampToValueAtTime(200,t+.35),s.Q.setValueAtTime(1.8,t),s.connect(i);const a=this._noiseSource(e,.4);a.connect(s),a.start(t),a.stop(t+.4);const o=this._busGain(e,.6);o.gain.setValueAtTime(.6,t+.05),o.gain.exponentialRampToValueAtTime(.001,t+.18);const l=this._osc(e,"sine",5200);l.connect(o),l.start(t+.05),l.stop(t+.18);const c=this._busGain(e,.3);c.gain.setValueAtTime(.3,t+.05),c.gain.exponentialRampToValueAtTime(.001,t+.14);const d=this._osc(e,"sine",7300);d.connect(c),d.start(t+.05),d.stop(t+.14)}coinSpin(){const e=this._getCtx();if(!e)return()=>{};const t=e.currentTime,i=this._busGain(e,0);i.gain.linearRampToValueAtTime(.35,t+.1);const s=e.createOscillator();s.type="sine",s.frequency.setValueAtTime(18,t);const a=e.createGain();a.gain.setValueAtTime(.3,t),s.connect(a),a.connect(i.gain);const o=this._osc(e,"sine",4800);return o.connect(i),o.start(t),s.start(t),()=>{const l=e.currentTime;i.gain.cancelScheduledValues(l),i.gain.setValueAtTime(i.gain.value,l),i.gain.linearRampToValueAtTime(0,l+.08),o.stop(l+.09),s.stop(l+.09)}}headsLand(){const e=this._getCtx();if(!e)return;const t=e.currentTime,i=[261.63,329.63,392,523.25],s=[0,.07,.13,.2];i.forEach((a,o)=>{const l=this._busGain(e,0);l.gain.setValueAtTime(0,t+s[o]),l.gain.linearRampToValueAtTime(.38,t+s[o]+.03),l.gain.exponentialRampToValueAtTime(.001,t+s[o]+.5);const c=this._osc(e,"sawtooth",a);c.frequency.setValueAtTime(a*.97,t+s[o]),c.frequency.linearRampToValueAtTime(a,t+s[o]+.06),c.connect(l),c.start(t+s[o]),c.stop(t+s[o]+.55)})}tailsLand(){const e=this._getCtx();if(!e)return;const t=e.currentTime,i=this._busGain(e,.9);i.gain.setValueAtTime(.9,t),i.gain.exponentialRampToValueAtTime(.001,t+.4);const s=this._osc(e,"sine",180);s.frequency.setValueAtTime(180,t),s.frequency.exponentialRampToValueAtTime(40,t+.12),s.connect(i),s.start(t),s.stop(t+.45);const a=this._busGain(e,.5);a.gain.setValueAtTime(.5,t),a.gain.exponentialRampToValueAtTime(.001,t+.06);const o=e.createBiquadFilter();o.type="highpass",o.frequency.setValueAtTime(200,t),o.connect(a);const l=this._noiseSource(e,.07);l.connect(o),l.start(t),l.stop(t+.07)}oddsResult(){const e=this._getCtx();if(!e)return;const t=e.currentTime;[220,261.63,329.63].forEach((s,a)=>{const o=this._busGain(e,0);o.gain.setValueAtTime(0,t+a*.06),o.gain.linearRampToValueAtTime(.3,t+a*.06+.04),o.gain.exponentialRampToValueAtTime(.001,t+a*.06+.7);const l=this._osc(e,"triangle",s),c=e.createOscillator();c.type="sine",c.frequency.setValueAtTime(5,t);const d=e.createGain();d.gain.setValueAtTime(3,t),c.connect(d),d.connect(l.frequency),l.connect(o),l.start(t+a*.06),c.start(t+a*.06),l.stop(t+a*.06+.75),c.stop(t+a*.06+.75)})}oddedOut(){const e=this._getCtx();if(!e)return;const t=e.currentTime;[146.83,174.61,207.65,246.94].forEach((s,a)=>{const o=this._busGain(e,0);o.gain.setValueAtTime(0,t),o.gain.linearRampToValueAtTime(.35,t+.08),o.gain.setValueAtTime(.35,t+.5+a*.15),o.gain.linearRampToValueAtTime(0,t+.5+a*.15+.4);const l=this._osc(e,"square",s),c=this._osc(e,"square",s*2),d=e.createGain();d.gain.setValueAtTime(.5,t),l.connect(d),c.connect(d),d.connect(o),l.frequency.setValueAtTime(s,t),l.frequency.linearRampToValueAtTime(s*.88,t+1.2+a*.15),c.frequency.setValueAtTime(s*2,t),c.frequency.linearRampToValueAtTime(s*2*.88,t+1.2+a*.15);const p=t+1.2+a*.15+.1;l.start(t),c.start(t),l.stop(p),c.stop(p)})}bigWin(){const e=this._getCtx();if(!e)return;const t=e.currentTime;[3200,4100,5e3,3800,4500,5400,3e3,4800].forEach((a,o)=>{const l=o*.09,c=this._busGain(e,0);c.gain.setValueAtTime(0,t+l),c.gain.linearRampToValueAtTime(.45,t+l+.01),c.gain.exponentialRampToValueAtTime(.001,t+l+.25);const d=this._osc(e,"sine",a);d.connect(c),d.start(t+l),d.stop(t+l+.28)}),[{freq:261.63,start:0},{freq:329.63,start:.12},{freq:392,start:.24},{freq:523.25,start:.36},{freq:261.63,start:.54},{freq:329.63,start:.54},{freq:392,start:.54},{freq:523.25,start:.54}].forEach(({freq:a,start:o})=>{const l=o<.5?.2:.8,c=this._busGain(e,0);c.gain.setValueAtTime(0,t+o),c.gain.linearRampToValueAtTime(.28,t+o+.04),c.gain.exponentialRampToValueAtTime(.001,t+o+l);const d=this._osc(e,"sawtooth",a);d.frequency.setValueAtTime(a*.98,t+o),d.frequency.linearRampToValueAtTime(a,t+o+.05),d.connect(c),d.start(t+o),d.stop(t+o+l+.05)})}lose(){const e=this._getCtx();if(!e)return;const t=e.currentTime;[{startFreq:440,endFreq:349,startT:0,dur:.4},{startFreq:349,endFreq:293,startT:.35,dur:.4},{startFreq:293,endFreq:220,startT:.7,dur:.6}].forEach(({startFreq:s,endFreq:a,startT:o,dur:l})=>{const c=this._busGain(e,0);c.gain.setValueAtTime(0,t+o),c.gain.linearRampToValueAtTime(.4,t+o+.04),c.gain.exponentialRampToValueAtTime(.001,t+o+l);const d=e.createBiquadFilter();d.type="bandpass",d.frequency.setValueAtTime(800,t+o),d.frequency.linearRampToValueAtTime(300,t+o+l),d.Q.setValueAtTime(3,t+o),d.connect(c);const p=this._osc(e,"sawtooth",s);p.frequency.setValueAtTime(s,t+o),p.frequency.linearRampToValueAtTime(a,t+o+l),p.connect(d),p.start(t+o),p.stop(t+o+l+.05)})}}const y=new re;document.addEventListener("click",()=>y.init(),{once:!0});function le(){const n=new URLSearchParams(window.location.search);return{sessionID:n.get("sessionID")??null,nonce:parseInt(n.get("nonce")??"1",10),social:["1","true"].includes((n.get("social")??"").toLowerCase()),currency:n.get("currency")??"GC",balance:n.get("balance")?parseFloat(n.get("balance")):null}}const T={WIN:["Blimey! Ye struck treasure, ye lucky sea dog!","Heads it is! The doubloons are yours, scallywag!","HAR HAR! Fortune favours the bold and the beautiful!","By Davy Jones' beard — ye did it, ye magnificent pirate!"],LOSS:["Davy Jones takes yer coins, ye scurvy dog!","The sea gives and the sea takes... mostly takes.","Walk the plank! Yer luck has run dry, landlubber!","Down to the depths with yer doubloons! Try again!"],ODDS:["ODDS! The kip demands another toss — come in spinner!","One of each! Toss again ye miserable wretch!","Neither heads nor tails! The coins mock ye!","ODDS! The ring is not satisfied yet — spin again!"],ODDED_OUT:["FIVE ODDS! THE CURSE OF THE KIP FALLS UPON YE!","Five consecutive odds! Davy Jones himself smiles tonight!","THE ANCIENT CURSE! Five odds in a row — RUN YE FOOL!","FIVE ODDS! The kip has spoken — YE ARE CURSED, SCALLYWAG!"],IDLE:["Place yer bets and come in, spinner!","The doubloons await... if ye dare.","Toss the coins! Fortune or folly awaits thee!","Are ye a coward or a pirate? PLACE YER BET!","The ring is ready — step forward, Spinner!","Choose yer fate, ye bold sea dog!"]},_={WIN:['"Pieces of eight!"','"Gold fer us, lad!"','"Strike it rich! SQUAWK!"'],LOSS:['"Davy Jones! SQUAWK!"','"Walk the plank..."','"Rough seas ahead..."'],ODDS:['"Again! AGAIN! KRAWWWK!"','"Spin it, scurvy dog!"','"One of each! SQUAWK!"'],ODDED_OUT:['"CURSE! THE CURSE! SQUAWK!"','"Five odds! DOOMED! KRAWWWK!"']};function f(n){return n[Math.floor(Math.random()*n.length)]}const ce=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 3a7 7 0 0 0-7 7c0 2.72 1.54 5.1 3.82 6.37L9 19h6l.18-2.63A7 7 0 0 0 12 3z"/>
  <ellipse cx="9.5" cy="10.5" rx="1.5" ry="2" fill="var(--dark-oak,#2C1A0E)"/>
  <ellipse cx="14.5" cy="10.5" rx="1.5" ry="2" fill="var(--dark-oak,#2C1A0E)"/>
  <rect x="9" y="17" width="6" height="3" rx="1" fill="var(--dark-oak,#2C1A0E)"/>
  <line x1="10.5" y1="17" x2="10.5" y2="20" stroke="var(--fog-white,#F5ECD7)" stroke-width="0.8"/>
  <line x1="12" y1="17" x2="12" y2="20" stroke="var(--fog-white,#F5ECD7)" stroke-width="0.8"/>
  <line x1="13.5" y1="17" x2="13.5" y2="20" stroke="var(--fog-white,#F5ECD7)" stroke-width="0.8"/>
</svg>`,U=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
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
</svg>`,W=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
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
</svg>`,de=`<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 95 Q70 74 92 68 L92 38 L98 38 L98 14 L102 14 L102 38 L108 38 L108 68 Q180 62 250 66 Q320 62 392 68 L392 38 L398 38 L398 14 L402 14 L402 38 L408 38 L408 68 Q430 74 440 95 Q320 112 250 114 Q180 112 60 95 Z" fill="#1a0f06"/>
  <path d="M100 16 L100 65 L135 54 Z" fill="#2C1A0E"/>
  <path d="M400 16 L400 65 L435 54 Z" fill="#2C1A0E"/>
  <path d="M100 8 L100 19 L116 13 Z" fill="#8B0000"/>
  <path d="M400 8 L400 19 L416 13 Z" fill="#8B0000"/>
  <rect x="245" y="30" width="10" height="36" fill="#2C1A0E"/>
  <path d="M255 32 L255 64 L282 55 Z" fill="#2C1A0E"/>
  <path d="M255 24 L255 34 L268 29 Z" fill="#8B0000"/>
</svg>`;function ue(n,e){const t=Array.from({length:5},(i,s)=>`<span class="skull-icon" data-index="${s}">${ce}</span>`).join("");return`
<div class="game-root">

  <div class="cavern-bg">
    <div class="vignette"></div>
    <div class="gold-dust-container" id="gold-dust"></div>
  </div>

  <div class="ship-silhouette">${de}</div>

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
      <div class="balance-display">&#x1F4B0; <span id="balance-value">${e.toLocaleString()} ${n}</span></div>
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
          <span class="stake-currency-label" id="stake-currency-label">${n}</span>
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
        <span class="potential-win-value" id="potential-win-value">20 ${n}</span>
      </div>

      <div class="odds-streak-section">
        <div class="odds-streak-title">&#x26A0;&#xFE0F; Odds Streak</div>
        <div class="skulls-row" id="skulls-row">${t}</div>
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
                    <div class="coin-face coin-face--front">${U}</div>
                    <div class="coin-face coin-face--back">${W}</div>
                  </div>
                  <div class="coin-shadow" id="coin-1-shadow"></div>
                </div>
                <div class="coin" id="coin-2">
                  <div class="coin-inner" id="coin-2-inner">
                    <div class="coin-face coin-face--front">${U}</div>
                    <div class="coin-face coin-face--back">${W}</div>
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

</div>`}const he=new Set(["GC","XGC","SC","XSC","USD","EUR","GBP","AUD","CAD","BRL","MXN","JPY","KRW","IDR","ARS","CRC","ZAR","AED","SAR","UAH","TWD","KWD","BHD","OMR"]),Z=le(),q=(Z.currency||"").toUpperCase(),A=he.has(q)?q:"GC",j=Z.balance??1e3,h=new oe({currency:A,startingBalance:j}),pe=document.getElementById("app");pe.innerHTML=ue(A,j);const u=n=>document.getElementById(n),r={balance:u("balance-value"),sessionDisp:u("session-display"),playBtn:u("play-btn"),stakeInput:u("stake-input"),potentialWin:u("potential-win-value"),betSelector:u("bet-type-selector"),skullsRow:u("skulls-row"),oddsCount:u("odds-count-display"),resultBanner:u("result-banner"),resultText:u("result-text"),captainBubble:u("captain-bubble"),parrotBubble:u("parrot-bubble"),captain:u("captain"),historyList:u("history-list"),chestLeft:u("chest-left"),chestRight:u("chest-right"),screenFlash:u("screen-flash"),serverSeedHash:u("server-seed-hash"),clientSeedInput:u("client-seed-input"),rotateSeedBtn:u("rotate-seed-btn"),errorMsg:u("error-message"),goldDust:u("gold-dust"),tossCounter:u("toss-counter"),tossNum:u("toss-num"),coin1Inner:u("coin-1-inner"),coin2Inner:u("coin-2-inner"),coin1Shadow:u("coin-1-shadow"),coin2Shadow:u("coin-2-shadow")};let O=m.HEADS,S=!1,w=[],b=null;r.sessionDisp.textContent=`Session: ${h.sessionID}`;r.clientSeedInput.value=h.clientSeed;const me=setInterval(()=>{h.serverSeedHash&&(r.serverSeedHash.textContent=h.serverSeedHash.slice(0,20)+"...",clearInterval(me))},100);h.onCoinToss=(n,e,t,i)=>w.push({c1:n,c2:e,result:t,idx:i});h.onWin=(n,e)=>{b={type:"win",profit:n,balance:e}};h.onLoss=(n,e)=>{b={type:"loss",amount:n,balance:e}};h.onOddsStreak=()=>{};h.onOddedOut=n=>{b?(b.oddedOut=!0,b.balance=n):b={type:"loss",amount:0,balance:n,oddedOut:!0}};h.onStateChange=()=>{};h.onError=n=>G(n);(function(){for(let e=0;e<30;e++){const t=document.createElement("div"),i=(Math.random()-.4)*70;t.className="gold-particle",t.style.cssText=[`left:${15+Math.random()*70}%`,`bottom:${3+Math.random()*38}%`,`animation-delay:${(Math.random()*5).toFixed(2)}s`,`animation-duration:${(3.5+Math.random()*4).toFixed(2)}s`,`width:${(2+Math.random()*3).toFixed(1)}px`,`height:${(2+Math.random()*3).toFixed(1)}px`,`--drift:${i.toFixed(0)}px`].join(";"),r.goldDust.appendChild(t)}})();r.betSelector.addEventListener("click",n=>{const e=n.target.closest(".bet-btn");!e||S||(r.betSelector.querySelectorAll(".bet-btn").forEach(t=>t.classList.remove("active")),e.classList.add("active"),O=e.dataset.bet,I())});r.stakeInput.addEventListener("input",I);document.querySelectorAll(".quick-btn").forEach(n=>{n.addEventListener("click",()=>{S||(r.stakeInput.value=n.dataset.stake==="max"?String(Math.floor(h.balance/1e6)):n.dataset.stake,I())})});function I(){const n=parseFloat(r.stakeInput.value)||0,e=O===m.FIVE_ODDS?28:1;r.potentialWin.textContent=`${(n*e).toLocaleString()} ${A}`}r.clientSeedInput.addEventListener("change",()=>h.setClientSeed(r.clientSeedInput.value));r.rotateSeedBtn.addEventListener("click",async()=>{if(S)return;const n=await h.rotateServerSeed();n&&(r.serverSeedHash.textContent=n.newHash.slice(0,20)+"...",r.clientSeedInput.value=h.clientSeed,g("Seeds rotated! New round begins fresh, matey!",2500))});function F(n){const e=Math.floor(n/1e6);r.balance.textContent=`${e.toLocaleString()} ${A}`}function P(n){r.skullsRow.querySelectorAll(".skull-icon").forEach((e,t)=>{e.classList.toggle("active",t<n),e.classList.toggle("danger",n>=4&&t<n)}),r.oddsCount.textContent=`${n} of 5`,r.oddsCount.classList.toggle("danger",n>=3)}let Y=null;function g(n,e=3200){r.captainBubble.textContent=n,r.captainBubble.classList.add("visible"),clearTimeout(Y),Y=setTimeout(()=>r.captainBubble.classList.remove("visible"),e)}function x(n){r.captain.className=`captain captain--${n}`}let K=null;function E(n,e=2800){n&&(r.parrotBubble.textContent=n,r.parrotBubble.classList.add("visible"),clearTimeout(K),K=setTimeout(()=>r.parrotBubble.classList.remove("visible"),e))}let X=null;function G(n){r.errorMsg.textContent=n,r.errorMsg.classList.add("visible"),clearTimeout(X),X=setTimeout(()=>r.errorMsg.classList.remove("visible"),3200)}function D(n,e,t=2200){return r.resultText.textContent=n,r.resultBanner.className=`result-banner visible result--${e}`,B(t).then(()=>{r.resultBanner.className="result-banner"})}function fe(){const n=document.querySelector(".game-root");r.screenFlash.classList.remove("flash-red"),r.screenFlash.offsetWidth,r.screenFlash.classList.add("flash-red"),n.classList.remove("screen-shake"),n.offsetWidth,n.classList.add("screen-shake"),setTimeout(()=>{r.screenFlash.classList.remove("flash-red"),n.classList.remove("screen-shake")},650)}function Q(){r.chestLeft.classList.add("open"),r.chestRight.classList.add("open"),setTimeout(()=>{r.chestLeft.classList.remove("open"),r.chestRight.classList.remove("open")},3200)}function B(n){return new Promise(e=>setTimeout(e,n))}async function z(n,e,t){const i=t==="H"?1800:1980;n.getAnimations().forEach(a=>a.cancel()),e.getAnimations().forEach(a=>a.cancel());const s=n.animate([{transform:"translateY(0px) rotateY(0deg) scale(1)",filter:"blur(0px)",offset:0},{transform:"translateY(-35px) rotateY(270deg) scale(1.08)",filter:"blur(0px)",offset:.07},{transform:"translateY(-280px) rotateY(900deg) scale(0.82)",filter:"blur(2.5px)",offset:.44},{transform:"translateY(-280px) rotateY(1440deg) scale(0.82)",filter:"blur(3px)",offset:.56},{transform:"translateY(-35px) rotateY(1700deg) scale(1.06)",filter:"blur(1px)",offset:.87},{transform:`translateY(0px) rotateY(${i}deg) scale(1)`,filter:"blur(0px)",offset:1}],{duration:1850,easing:"cubic-bezier(0.25,0.08,0.25,1)",fill:"forwards"});e.animate([{transform:"translateX(-50%) scaleX(1)",opacity:.45,offset:0},{transform:"translateX(-50%) scaleX(0.25)",opacity:.08,offset:.44},{transform:"translateX(-50%) scaleX(0.25)",opacity:.08,offset:.56},{transform:"translateX(-50%) scaleX(1)",opacity:.45,offset:1}],{duration:1850,easing:"cubic-bezier(0.25,0.08,0.25,1)",fill:"forwards"}),await s.finished}async function ye(n){const{c1:e,c2:t,result:i,idx:s}=n;r.tossCounter.style.display="block",r.tossNum.textContent=String(s),y.coinLaunch(),await Promise.all([z(r.coin1Inner,r.coin1Shadow,e),z(r.coin2Inner,r.coin2Shadow,t)]),await B(380),i==="ODDS"?(y.oddsResult(),await D("ODDS!","odds",1300),g(f(T.ODDS),2200),E(f(_.ODDS),2200),[r.coin1Inner,r.coin2Inner,r.coin1Shadow,r.coin2Shadow].forEach(a=>a.getAnimations().forEach(o=>o.cancel())),await B(700)):i==="HEADS"?y.headsLand():y.tailsLand()}function be(n){const e=r.historyList.querySelector(".history-empty");e&&e.remove();const{round:t,betType:i,betAmount:s,tosses:a,outcome:o,profit:l,balance:c}=n,d=Math.floor(s/1e6),p=Math.floor(l/1e6),ee=Math.floor(c/1e6),te=p>=0?`+${p}`:String(p),se=p>=0?"profit-positive":"profit-negative",ne=o==="HEADS"?"outcome-heads":o==="TAILS"?"outcome-tails":o==="ODDED_OUT"?"outcome-odded":"outcome-odds",L=document.createElement("div");L.className="history-entry",L.innerHTML=`
    <span class="history-round">#${t}</span>
    <span class="history-bet">${i} ${d} ${A}</span>
    <span class="history-tosses">${a.join(" → ")}</span>
    <span class="history-outcome ${ne}">${o}</span>
    <span class="history-profit ${se}">${te} ${A}</span>
    <span class="history-balance">${ee.toLocaleString()} ${A}</span>
  `,r.historyList.insertBefore(L,r.historyList.firstChild),requestAnimationFrame(()=>requestAnimationFrame(()=>L.classList.add("history-entry--visible")));const R=r.historyList.querySelectorAll(".history-entry");R.length>10&&R[R.length-1].remove()}async function J(){if(S)return;const n=parseFloat(r.stakeInput.value);if(!n||n<=0){G("Enter a valid wager, ye scoundrel!");return}const e=Math.round(n*1e6);if(e>h.balance){G("Insufficient doubloons! Ye cannot bet what ye don't have!");return}w=[],b=null,F(h.balance-e),S=!0,r.playBtn.disabled=!0,r.playBtn.classList.add("spinning"),r.errorMsg.classList.remove("visible"),r.tossCounter.style.display="none",P(0),g("Come in, Spinner! The coins are in the air!",2800),x("neutral"),await h.startRound(O,n);let t=0;for(const i of w)i.result==="ODDS"&&(t++,P(t)),await ye(i);if(F(h.balance),b){const i=w[w.length-1],s=b.oddedOut===!0,a=s&&O===m.FIVE_ODDS,o=b.type==="win",l=o&&b.profit>=e*4;if(a)y.bigWin(),await D("FIVE ODDS! JACKPOT!","heads",3200),x("excited"),g(f(T.ODDED_OUT),4200),E(f(_.ODDED_OUT),3500),Q();else if(s)y.oddedOut(),await D("ODDED OUT! CURSED!","odded",3200),x("angry"),g(f(T.ODDED_OUT),4200),E(f(_.ODDED_OUT),3500),fe();else if(o){l?(y.bigWin(),Q()):y.headsLand();const c=i?i.result:"WIN";await D(`${c}! YE WIN!`,"heads",2800),x("excited"),g(f(T.WIN),3800),E(f(_.WIN),3200)}else{y.lose();const c=i?i.result:"LOSS";await D(`${c}! YE LOSE!`,"tails",2500),x("angry"),g(f(T.LOSS),3800),E(f(_.LOSS),3200)}}h.roundHistory.length>0&&be(h.roundHistory[0]),r.tossCounter.style.display="none",S=!1,r.playBtn.disabled=!1,r.playBtn.classList.remove("spinning"),[r.coin1Inner,r.coin2Inner,r.coin1Shadow,r.coin2Shadow].forEach(i=>i.getAnimations().forEach(s=>s.cancel()))}r.playBtn.addEventListener("click",()=>{y.buttonClick(),J()});r.betSelector.addEventListener("click",()=>y.uiHover(),{capture:!0});document.addEventListener("keydown",n=>{n.code==="Space"&&!n.repeat&&(n.preventDefault(),S||J())});I();F(h.balance);x("neutral");g(f(T.IDLE),3500);setInterval(()=>{S||g(f(T.IDLE),3500)},9e3);

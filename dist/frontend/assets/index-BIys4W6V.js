(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function r(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=r(s);fetch(s.href,n)}})();const u="Stake Game Template Blueprint",m="A generated build shell for Stake Game Template Blueprint, produced from repository requirements and validated for Stake review.",y="A modern deck-and-circuit emblem that communicates game logic, math, and automated delivery.",g={layout:"5x3 reel board",summary:"Stake Game Template Blueprint uses a 5x3 layout with a clear primary action, review-ready help copy, and submission-friendly compliance panels."},h={standard:{primary:"SPIN",amount:"BET AMOUNT",auto:"AUTO BET",history:"ROUND HISTORY"},social:{primary:"PLAY",amount:"PLAY AMOUNT",auto:"AUTO PLAY",history:"ROUND HISTORY"}},b=[{title:"Game Flow",body:"Set the play amount, trigger the primary action, and review results for Stake Game Template Blueprint through the history tray and help drawer."},{title:"Requirements Summary",body:"This generated build targets Internal game teams building Stake Engine-ready titles with AI-assisted automation. and follows Must use Provably Fair system. rules with max win hit-rate capped at 1 in 20,000,000."},{title:"Mechanic Profile",body:"Core mechanic: 5x3 reel-spin with line wins. Win conditions: 3 or more matching symbols on adjacent reels award wins. Bonus features: Wild W substitutes and Scatter SC can trigger feature messaging."},{title:"Social Mode Copy",body:"UI copy must support GC and SC displays with no `$` prefix."},{title:"Project Tasks",body:"[x] Core Game Logic blueprint created. [x] Payout & RTP handling blueprint created. [x] UI hooks blueprint defined for board, help, sounds, and replay handling. [x] Agent orchestration and build automation scaffolded. [x] Submission content packaging added for Stake.US review. [x] Frontend build pipeline added with production output in `dist/frontend/`."},{title:"Must-have UI Help",body:"Help content must describe controls, replay behavior, and disclaimer text."}],v={summary:"UI copy must support GC and SC displays with no `$` prefix.",currencyLabels:["GC","SC"],bannedWords:["bet","wager","buy","payout","gambling"]},f=["Spacebar triggers the primary action only when no modal is open.","Replay mode honors all shared URL parameters.","Social mode switches labels and removes dollar signs.","Help content includes disclaimer and control guidance."],w="Malfunction voids all pays and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many rounds. Animations are not representative of any physical device, and are for illustrative purposes only. TM and © 2026 Stake Engine.",t={gameName:u,tagline:m,iconConcept:y,board:g,buttonLabels:h,helpSections:b,socialModeCopy:v,qaChecks:f,disclaimer:w},S={icon:"/assets/generated/stake-game-template-blueprint/icon.svg",symbols:[{key:"L1",label:"L1",src:"/assets/generated/stake-game-template-blueprint/symbol-l1.svg"},{key:"L2",label:"L2",src:"/assets/generated/stake-game-template-blueprint/symbol-l2.svg"},{key:"H1",label:"H1",src:"/assets/generated/stake-game-template-blueprint/symbol-h1.svg"},{key:"H2",label:"H2",src:"/assets/generated/stake-game-template-blueprint/symbol-h2.svg"},{key:"W",label:"W",src:"/assets/generated/stake-game-template-blueprint/symbol-w.svg"},{key:"SC",label:"SC",src:"/assets/generated/stake-game-template-blueprint/symbol-sc.svg"}]},k={active:S};function C(){const e=new URLSearchParams(window.location.search);return{sessionID:e.get("sessionID")??"demo-session",nonce:e.get("nonce")??"1",social:["1","true"].includes((e.get("social")??"").toLowerCase()),currency:e.get("currency")??"GC",rgsUrl:e.get("rgs_url")??"https://example-rgs.invalid"}}function $(e){return e.map(a=>`
        <article class="help-card">
          <h3>${a.title}</h3>
          <p>${a.body}</p>
        </article>
      `).join("")}function L(e){return Object.entries(e).map(([a,r])=>`
        <div class="button-card" data-button-card="${a}">
          <span class="button-card__label">${a}</span>
          <strong data-button-value="${a}">${r}</strong>
        </div>
      `).join("")}function A(e){return e.map(a=>`
        <li class="check-item">
          <span class="check-item__mark"></span>
          <span>${a}</span>
        </li>
      `).join("")}function _(e){return e.map(a=>`
        <figure class="asset-card">
          <img src="${a.src}" alt="${a.label}" loading="lazy" />
          <figcaption>${a.label}</figcaption>
        </figure>
      `).join("")}const d=C(),G=d.social;function T(e){const a=e?t.buttonLabels.social:t.buttonLabels.standard,r=e?d.currency:"USD",i=k.active;return`
    <main class="shell ${e?"shell--social":""}">
      <section class="hero panel">
        <div class="hero__copy">
          <p class="eyebrow">Stake Build System</p>
          <h1>${t.gameName}</h1>
          <p class="hero__tagline">${t.tagline}</p>
          <div class="hero__controls">
            <button class="primary-action" id="primary-action">${a.primary}</button>
            <button class="ghost-action" id="mode-toggle">${e?"Switch to Standard Copy":"Switch to Social Copy"}</button>
          </div>
        </div>
        <div class="hero__meta">
          <div class="meta-card">
            <span>Board</span>
            <strong>${t.board.layout}</strong>
          </div>
          <div class="meta-card">
            <span>Replay Session</span>
            <strong id="replay-session">${d.sessionID}</strong>
          </div>
          <div class="meta-card">
            <span>Display Currency</span>
            <strong id="display-currency">${r}</strong>
          </div>
        </div>
      </section>

      <section class="content-grid">
        <article class="panel board-panel">
          <div class="panel__header">
            <p class="eyebrow">Game Board</p>
            <h2>Interface Preview</h2>
          </div>
          <p>${t.board.summary}</p>
          <div class="reel-grid" aria-label="Game board preview">
            <span>A</span><span>K</span><span>Q</span><span>W</span><span>SC</span>
            <span>Q</span><span>A</span><span>10</span><span>K</span><span>J</span>
            <span>W</span><span>J</span><span>A</span><span>Q</span><span>SC</span>
          </div>
          <div class="board-actions">
            ${L(a)}
          </div>
        </article>

        <article class="panel help-panel">
          <div class="panel__header">
            <p class="eyebrow">Help Docs</p>
            <h2>Submission Copy Inputs</h2>
          </div>
          <div class="help-list">
            ${$(t.helpSections)}
          </div>
        </article>

        <article class="panel asset-panel">
          <div class="panel__header">
            <p class="eyebrow">Generated Graphics</p>
            <h2>Placeholder Asset Pipeline</h2>
          </div>
          <div class="asset-card asset-card--hero">
            <img src="${i.icon}" alt="Generated icon" loading="lazy" />
            <div>
              <strong>Generated Placeholder Art</strong>
              <p>${t.iconConcept}</p>
            </div>
          </div>
          <div class="asset-grid">
            ${_(i.symbols)}
          </div>
        </article>

        <article class="panel compliance-panel">
          <div class="panel__header">
            <p class="eyebrow">Social Mode</p>
            <h2>Restricted Wording Guardrails</h2>
          </div>
          <p>${t.socialModeCopy.summary}</p>
          <div class="token-row">
            ${t.socialModeCopy.currencyLabels.map(s=>`<span class="token">${s}</span>`).join("")}
          </div>
          <div class="token-row token-row--warn">
            ${t.socialModeCopy.bannedWords.map(s=>`<span class="token token--warn">${s}</span>`).join("")}
          </div>
        </article>

        <article class="panel qa-panel">
          <div class="panel__header">
            <p class="eyebrow">QA Gates</p>
            <h2>Required Checks</h2>
          </div>
          <ul class="checklist">
            ${A(t.qaChecks)}
          </ul>
          <p class="disclaimer">${t.disclaimer}</p>
        </article>
      </section>
    </main>
  `}const o=document.querySelector("#app");let c=G;function p(){o.innerHTML=T(c),o.querySelector("#mode-toggle")?.addEventListener("click",()=>{c=!c,p()}),window.onkeydown=e=>{e.code==="Space"&&(e.preventDefault(),o.querySelector("#primary-action")?.classList.add("primary-action--active"),window.setTimeout(()=>{o.querySelector("#primary-action")?.classList.remove("primary-action--active")},180))}}p();

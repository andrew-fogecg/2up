import gameContent from './content/generatedGameContent.json';
import artManifest from './content/generatedArtManifest.json';
import { getReplayContext } from './api/replay';
import { renderButtonCards, renderChecklist, renderGeneratedAssets, renderHelpSections } from './components/render';
import './style.css';

const replayContext = getReplayContext();
const initialSocial = replayContext.social;

function renderApp(isSocial) {
  const labels = isSocial ? gameContent.buttonLabels.social : gameContent.buttonLabels.standard;
  const currencyLabel = isSocial ? replayContext.currency : 'USD';
  const activeAssets = artManifest.active;

  return `
    <main class="shell ${isSocial ? 'shell--social' : ''}">
      <section class="hero panel">
        <div class="hero__copy">
          <p class="eyebrow">Stake Build System</p>
          <h1>${gameContent.gameName}</h1>
          <p class="hero__tagline">${gameContent.tagline}</p>
          <div class="hero__controls">
            <button class="primary-action" id="primary-action">${labels.primary}</button>
            <button class="ghost-action" id="mode-toggle">${isSocial ? 'Switch to Standard Copy' : 'Switch to Social Copy'}</button>
          </div>
        </div>
        <div class="hero__meta">
          <div class="meta-card">
            <span>Board</span>
            <strong>${gameContent.board.layout}</strong>
          </div>
          <div class="meta-card">
            <span>Replay Session</span>
            <strong id="replay-session">${replayContext.sessionID}</strong>
          </div>
          <div class="meta-card">
            <span>Display Currency</span>
            <strong id="display-currency">${currencyLabel}</strong>
          </div>
        </div>
      </section>

      <section class="content-grid">
        <article class="panel board-panel">
          <div class="panel__header">
            <p class="eyebrow">Game Board</p>
            <h2>Interface Preview</h2>
          </div>
          <p>${gameContent.board.summary}</p>
          <div class="reel-grid" aria-label="Game board preview">
            <span>A</span><span>K</span><span>Q</span><span>W</span><span>SC</span>
            <span>Q</span><span>A</span><span>10</span><span>K</span><span>J</span>
            <span>W</span><span>J</span><span>A</span><span>Q</span><span>SC</span>
          </div>
          <div class="board-actions">
            ${renderButtonCards(labels)}
          </div>
        </article>

        <article class="panel help-panel">
          <div class="panel__header">
            <p class="eyebrow">Help Docs</p>
            <h2>Submission Copy Inputs</h2>
          </div>
          <div class="help-list">
            ${renderHelpSections(gameContent.helpSections)}
          </div>
        </article>

        <article class="panel asset-panel">
          <div class="panel__header">
            <p class="eyebrow">Generated Graphics</p>
            <h2>Placeholder Asset Pipeline</h2>
          </div>
          <div class="asset-card asset-card--hero">
            <img src="${activeAssets.icon}" alt="Generated icon" loading="lazy" />
            <div>
              <strong>${artManifest.mode === 'approved' ? 'Approved Art' : 'Generated Placeholder Art'}</strong>
              <p>${gameContent.iconConcept}</p>
            </div>
          </div>
          <div class="asset-grid">
            ${renderGeneratedAssets(activeAssets.symbols)}
          </div>
        </article>

        <article class="panel compliance-panel">
          <div class="panel__header">
            <p class="eyebrow">Social Mode</p>
            <h2>Restricted Wording Guardrails</h2>
          </div>
          <p>${gameContent.socialModeCopy.summary}</p>
          <div class="token-row">
            ${gameContent.socialModeCopy.currencyLabels.map((label) => `<span class="token">${label}</span>`).join('')}
          </div>
          <div class="token-row token-row--warn">
            ${gameContent.socialModeCopy.bannedWords.map((word) => `<span class="token token--warn">${word}</span>`).join('')}
          </div>
        </article>

        <article class="panel qa-panel">
          <div class="panel__header">
            <p class="eyebrow">QA Gates</p>
            <h2>Required Checks</h2>
          </div>
          <ul class="checklist">
            ${renderChecklist(gameContent.qaChecks)}
          </ul>
          <p class="disclaimer">${gameContent.disclaimer}</p>
        </article>
      </section>
    </main>
  `;
}

const app = document.querySelector('#app');
let socialMode = initialSocial;

function mount() {
  app.innerHTML = renderApp(socialMode);

  app.querySelector('#mode-toggle')?.addEventListener('click', () => {
    socialMode = !socialMode;
    mount();
  });

  window.onkeydown = (event) => {
    const modalOpen = false;
    if (event.code === 'Space' && !modalOpen) {
      event.preventDefault();
      app.querySelector('#primary-action')?.classList.add('primary-action--active');
      window.setTimeout(() => {
        app.querySelector('#primary-action')?.classList.remove('primary-action--active');
      }, 180);
    }
  };
}

mount();
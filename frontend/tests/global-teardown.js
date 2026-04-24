import fs from 'node:fs/promises';
import path from 'node:path';
import { REVIEW_ROOT, SCREENSHOT_ROOT } from './review-helper.js';

async function findManifestFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findManifestFiles(fullPath));
    } else if (entry.isFile() && entry.name === 'manifest.json') {
      files.push(fullPath);
    }
  }

  return files;
}

function renderGroup(group) {
  const cards = group.steps.map(step => `
    <article class="step-card">
      <h4>${step.step}</h4>
      <img src="${step.screenshot}" alt="${step.step}" loading="lazy" />
      <pre>${JSON.stringify(step.details, null, 2)}</pre>
    </article>
  `).join('');

  return `
    <section class="test-group">
      <header>
        <p class="eyebrow">${group.project}</p>
        <h2>${group.title}</h2>
      </header>
      <div class="card-grid">${cards}</div>
    </section>
  `;
}

export default async function globalTeardown() {
  const manifestFiles = await findManifestFiles(SCREENSHOT_ROOT);
  const groups = await Promise.all(
    manifestFiles.map(async filePath => JSON.parse(await fs.readFile(filePath, 'utf8')))
  );

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Dead Men's Doubloons Test Review</title>
      <style>
        body { margin: 0; font-family: Georgia, serif; background: #111821; color: #f3ead7; }
        main { width: min(1200px, calc(100% - 32px)); margin: 0 auto; padding: 24px 0 48px; }
        h1, h2, h4 { margin: 0; }
        .intro { margin-bottom: 24px; }
        .eyebrow { color: #f6c757; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.8rem; margin-bottom: 6px; }
        .test-group { margin-bottom: 32px; padding: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 18px; }
        .step-card { background: rgba(0,0,0,0.18); border-radius: 14px; padding: 14px; }
        .step-card img { width: 100%; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); display: block; margin: 10px 0; }
        .step-card pre { white-space: pre-wrap; word-break: break-word; font-size: 0.78rem; color: #cdd7e1; }
      </style>
    </head>
    <body>
      <main>
        <section class="intro">
          <p class="eyebrow">Visual Review</p>
          <h1>Dead Men's Doubloons Test Coverage Review</h1>
          <p>Each card below shows a screenshot checkpoint captured during the Playwright run. Open this file in a browser after the suite finishes to inspect device coverage and round-flow states visually.</p>
        </section>
        ${groups.map(renderGroup).join('') || '<p>No screenshots were captured.</p>'}
      </main>
    </body>
  </html>`;

  await fs.mkdir(REVIEW_ROOT, { recursive: true });
  await fs.writeFile(path.join(REVIEW_ROOT, 'index.html'), html, 'utf8');
}
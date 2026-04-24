import fs from 'node:fs/promises';
import path from 'node:path';

const REVIEW_ROOT = path.resolve(process.cwd(), 'test-results', 'review');
const SCREENSHOT_ROOT = path.join(REVIEW_ROOT, 'screenshots');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function captureReviewStep(page, testInfo, stepName, details = {}) {
  const projectSlug = slugify(testInfo.project.name);
  const testSlug = slugify(testInfo.titlePath.join(' '));
  const stepSlug = slugify(stepName);

  const testDir = path.join(SCREENSHOT_ROOT, projectSlug, testSlug);
  const manifestPath = path.join(testDir, 'manifest.json');

  await fs.mkdir(testDir, { recursive: true });

  let manifest = {
    project: testInfo.project.name,
    title: testInfo.title,
    steps: [],
  };

  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  } catch {
    // First screenshot for this test.
  }

  const index = String(manifest.steps.length + 1).padStart(2, '0');
  const fileName = `${index}-${stepSlug}.png`;
  const filePath = path.join(testDir, fileName);
  const relativePath = path.relative(REVIEW_ROOT, filePath).split(path.sep).join('/');

  await page.screenshot({
    path: filePath,
    fullPage: true,
    animations: 'disabled',
  });

  manifest.steps.push({
    step: stepName,
    screenshot: relativePath,
    details,
  });

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}

export async function resetReviewArtifacts() {
  await fs.rm(REVIEW_ROOT, { recursive: true, force: true });
  await fs.mkdir(SCREENSHOT_ROOT, { recursive: true });
}

export { REVIEW_ROOT, SCREENSHOT_ROOT };
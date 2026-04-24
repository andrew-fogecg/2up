import { test, expect } from '@playwright/test';
import { captureReviewStep } from './review-helper.js';

const MICRO_UNITS = 1_000_000;
const REPLAY_STORAGE_KEY = 'dmd-replays-v1';
const INITIAL_BALANCE = '1000 GC';

const stakeCases = [
  {
    label: 'small-bet',
    description: 'Small bet amount',
    apply: async (page) => {
      await page.locator('#stake-input').fill('1');
      await expect(page.locator('#stake-input')).toHaveValue('1');
    },
  },
  {
    label: 'random-bet',
    description: 'Random-style bet amount',
    apply: async (page) => {
      await page.locator('#stake-input').fill('37');
      await expect(page.locator('#stake-input')).toHaveValue('37');
    },
  },
  {
    label: 'max-bet',
    description: 'Max balance bet amount',
    apply: async (page) => {
      await page.getByRole('button', { name: 'MAX' }).click();
      await expect(page.locator('#stake-input')).toHaveValue('1000');
    },
  },
];

async function waitForRoundToFinish(page) {
  await expect(page.locator('#history-list .history-entry')).toHaveCount(1, { timeout: 35_000 });
  await expect(page.locator('#play-btn')).not.toHaveClass(/spinning/, { timeout: 35_000 });
}

test('renders the live two-up game shell', async ({ page }, testInfo) => {
  await page.goto('/');
  await captureReviewStep(page, testInfo, 'landing-shell', { device: testInfo.project.name });

  await expect(page.locator('.game-title')).toHaveCount(0);
  await expect(page.locator('#play-btn-text')).toHaveText('PLAY');
  await expect(page.locator('#balance-value')).toContainText('1000 GC');
  await expect(page.locator('#sound-toggle')).toBeVisible();
});

test('renders social-mode wording without dollar formatting', async ({ page }, testInfo) => {
  await page.goto('/?social=1&currency=SC');
  await captureReviewStep(page, testInfo, 'social-mode-shell', { device: testInfo.project.name });

  await expect(page.locator('.panel-title')).toContainText('Select Outcome');
  await expect(page.locator('.stake-label')).toHaveText('Stake');
  await expect(page.locator('.potential-win-label')).toHaveText('Potential Return');
  await expect(page.locator('#balance-value')).toContainText('1000 SC');
  await expect(page.locator('#balance-value')).not.toContainText('$');
});

test('game info modal opens and blocks spacebar play', async ({ page }, testInfo) => {
  await page.goto('/');

  await page.locator('#info-btn').click();
  await expect(page.locator('#rules-title')).toHaveText('Game Info');
  await captureReviewStep(page, testInfo, 'rules-modal-open', { device: testInfo.project.name });

  await page.keyboard.press('Space');
  await page.waitForTimeout(300);

  await expect(page.locator('#play-btn')).not.toHaveClass(/spinning/);
  await expect(page.locator('#rules-backdrop')).not.toHaveClass(/hidden/);
});

test('sound toggle persists for the session across reload', async ({ page }, testInfo) => {
  await page.goto('/');

  await page.locator('#sound-toggle').click();
  await expect(page.locator('#sound-toggle')).toHaveText('SOUND OFF');
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await captureReviewStep(page, testInfo, 'sound-off', { device: testInfo.project.name });

  await page.reload();

  await expect(page.locator('#sound-toggle')).toHaveText('SOUND OFF');
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await captureReviewStep(page, testInfo, 'sound-off-after-reload', { device: testInfo.project.name });
});

test('replay mode loads stored event data and exposes replay-again control', async ({ page }, testInfo) => {
  const replayPayload = {
    eventId: 'EVT-HEADS-1',
    sessionID: 'DMD-TEST-SESSION',
    round: 7,
    startBalance: 100 * MICRO_UNITS,
    betType: 'HEADS',
    betAmount: 10 * MICRO_UNITS,
    tosses: ['HEADS'],
    tossDetails: [
      { coin1: 'H', coin2: 'H', result: 'HEADS', nonce: 1, hash: 'abc123' },
    ],
    outcome: 'HEADS',
    profit: 10 * MICRO_UNITS,
    balance: 110 * MICRO_UNITS,
    timestamp: Date.now(),
    currency: 'SC',
    social: true,
  };

  await page.addInitScript(([storageKey, replayData]) => {
    window.localStorage.setItem(storageKey, JSON.stringify([replayData]));
  }, [REPLAY_STORAGE_KEY, replayPayload]);

  await page.goto('/?replay=EVT-HEADS-1&social=1&currency=SC&amount=5&balance=100');

  await expect(page.locator('#replay-banner')).toBeVisible();
  await expect(page.locator('#replay-banner-text')).toContainText('REPLAY MODE');
  await expect(page.locator('#play-btn-text')).toHaveText('REPLAY EVENT');
  await captureReviewStep(page, testInfo, 'replay-loaded', { device: testInfo.project.name });

  await expect(page.locator('#replay-repeat-btn')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#history-list .history-entry')).toHaveCount(1);
  await captureReviewStep(page, testInfo, 'replay-finished', { device: testInfo.project.name });

  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  await expect(page.locator('#history-list .history-entry')).toHaveCount(1);
});

for (const stakeCase of stakeCases) {
  test(`plays a ${stakeCase.label} round on every device`, async ({ page }, testInfo) => {
    await page.goto('/?currency=GC&balance=1000');
    await captureReviewStep(page, testInfo, `${stakeCase.label}-landing`, {
      device: testInfo.project.name,
      amountCase: stakeCase.description,
    });

    await stakeCase.apply(page);
    await captureReviewStep(page, testInfo, `${stakeCase.label}-configured`, {
      device: testInfo.project.name,
      amountCase: stakeCase.description,
      stakeValue: await page.locator('#stake-input').inputValue(),
    });

    await page.locator('#play-btn').click();
    await page.waitForTimeout(250);
    await captureReviewStep(page, testInfo, `${stakeCase.label}-in-flight`, {
      device: testInfo.project.name,
      amountCase: stakeCase.description,
    });

    await waitForRoundToFinish(page);

    await expect(page.locator('#history-list .history-entry')).toHaveCount(1);
    await expect(page.locator('#balance-value')).not.toHaveText(INITIAL_BALANCE);
    await captureReviewStep(page, testInfo, `${stakeCase.label}-resolved`, {
      device: testInfo.project.name,
      amountCase: stakeCase.description,
      finalBalance: await page.locator('#balance-value').textContent(),
    });
  });
}
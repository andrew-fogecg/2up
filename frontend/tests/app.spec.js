import { test, expect } from '@playwright/test';

test('renders generated requirements-driven content', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Stake Game Template Blueprint');
  await expect(page.getByRole('heading', { name: 'Placeholder Asset Pipeline' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Submission Copy Inputs' })).toBeVisible();
  await expect(page.locator('.asset-grid img')).toHaveCount(6);
});

test('toggles into social mode copy', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Switch to Social Copy' }).click();
  await expect(page.locator('#primary-action')).toHaveText('PLAY');
  await expect(page.locator('[data-button-value="amount"]')).toHaveText('PLAY AMOUNT');
});

test('replay query parameters drive the UI context', async ({ page }) => {
  await page.goto('/?sessionID=test-session&social=1&currency=SC&rgs_url=https://rgs.example.invalid');

  await expect(page.locator('#replay-session')).toHaveText('test-session');
  await expect(page.locator('#display-currency')).toHaveText('SC');
  await expect(page.locator('#primary-action')).toHaveText('PLAY');
});

test('spacebar triggers the primary action state', async ({ page }) => {
  await page.goto('/');

  const primaryAction = page.locator('#primary-action');
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true }));
  });
  await expect(primaryAction).toHaveClass(/primary-action--active/);
});
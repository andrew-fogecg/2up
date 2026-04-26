import { test, expect } from '@playwright/test';

async function hasClippedOverflow(page, selectors) {
  return page.evaluate((targets) => {
    const eps = 1;

    return targets.some((selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return false;
      }

      return element.scrollHeight > element.clientHeight + eps || element.scrollWidth > element.clientWidth + eps;
    });
  }, selectors);
}

const strictOverflowViewports = new Set([
  'laptop-1024x576-landscape',
  'popout-400x225-landscape',
  'popout-225x400-portrait',
]);


const viewports = [
  { name: 'Desktop 1200x675 Landscape', slug: 'desktop-1200x675-landscape', width: 1200, height: 675, small: false },
  { name: 'Laptop 1024x576 Landscape', slug: 'laptop-1024x576-landscape', width: 1024, height: 576, small: false },
  { name: 'Tablet 834x1194 Portrait', slug: 'tablet-834x1194-portrait', width: 834, height: 1194, small: true },
  { name: 'Tablet 1194x834 Landscape', slug: 'tablet-1194x834-landscape', width: 1194, height: 834, small: false },
  { name: 'Popout 400x225 Landscape', slug: 'popout-400x225-landscape', width: 400, height: 225, small: true },
  { name: 'Popout 225x400 Portrait', slug: 'popout-225x400-portrait', width: 225, height: 400, small: true },
  { name: 'Mobile 425x812 Portrait', slug: 'mobile-425x812-portrait', width: 425, height: 812, small: true },
  { name: 'Mobile 812x425 Landscape', slug: 'mobile-812x425-landscape', width: 812, height: 425, small: true },
  { name: 'Mobile 375x667 Portrait', slug: 'mobile-375x667-portrait', width: 375, height: 667, small: true },
  { name: 'Mobile 667x375 Landscape', slug: 'mobile-667x375-landscape', width: 667, height: 375, small: true },
  { name: 'Mobile 320x568 Portrait', slug: 'mobile-320x568-portrait', width: 320, height: 568, small: true },
  { name: 'Mobile 568x320 Landscape', slug: 'mobile-568x320-landscape', width: 568, height: 320, small: true },
];

const stakeCases = [
  {
    label: 'small-bet',
    apply: async (page) => {
      await page.locator('#stake-input').fill('1');
      await expect(page.locator('#stake-input')).toHaveValue('1');
    },
  },
  {
    label: 'random-bet',
    apply: async (page) => {
      await page.locator('#stake-input').fill('37');
      await expect(page.locator('#stake-input')).toHaveValue('37');
    },
  },
  {
    label: 'max-bet',
    apply: async (page) => {
      const balanceText = await page.locator('#balance-value').textContent();
      const currentBalance = balanceText?.match(/-?\d+(?:\.\d+)?/)?.[0];

      await page.getByRole('button', { name: 'MAX' }).click();
      await expect(page.locator('#stake-input')).toHaveValue(currentBalance ?? '0');
    },
  },
];

async function hasHorizontalScrollbar(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const eps = 1;
    return doc.scrollWidth > doc.clientWidth + eps || body.scrollWidth > body.clientWidth + eps;
  });
}

async function hasVerticalScrollbar(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const eps = 1;
    return doc.scrollHeight > doc.clientHeight + eps || body.scrollHeight > body.clientHeight + eps;
  });
}

test.describe('Stake resolution compliance smoke tests', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const viewport of viewports) {
    test(viewport.name, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(page.locator('#play-btn')).toBeVisible();
      await expect(page.locator('.gameboard')).toBeVisible();
      await expect(page.locator('#balance-value')).toBeVisible();

      await expect.poll(async () => await hasHorizontalScrollbar(page), {
        message: 'Horizontal scrollbar detected',
      }).toBeFalsy();
      await expect.poll(async () => await hasVerticalScrollbar(page), {
        message: 'Vertical scrollbar detected',
      }).toBeFalsy();

      if (strictOverflowViewports.has(viewport.slug)) {
        await expect.poll(async () => await hasClippedOverflow(page, viewport.small
          ? ['#setup-page', '#board-page', '#results-page']
          : ['.betting-panel', '.voyage-log-panel']), {
          message: 'Internal layout overflow detected',
        }).toBeFalsy();
      }

      if (viewport.small) {
        await expect(page.locator('#small-screen-nav')).toBeVisible();

        await page.getByRole('button', { name: 'Board' }).click();
        await expect(page.locator('#board-page')).toBeInViewport();

        await page.getByRole('button', { name: 'Log' }).click();
        await expect(page.locator('#results-page')).toBeInViewport();

        await page.getByRole('button', { name: 'Setup' }).click();
        await expect(page.locator('#setup-page')).toBeInViewport();
      } else {
        await expect(page.locator('#small-screen-nav')).toBeHidden();
      }

      await page.screenshot({
        path: `test-results/layout-review/${viewport.slug}/start.png`,
        fullPage: true,
      });

      for (const [index, stakeCase] of stakeCases.entries()) {
        await stakeCase.apply(page);
        await page.screenshot({
          path: `test-results/layout-review/${viewport.slug}/${String(index + 1).padStart(2, '0')}-${stakeCase.label}-configured.png`,
          fullPage: true,
        });

        await page.locator('#play-btn').click();
        await expect(page.locator('#history-list .history-entry')).toHaveCount(index + 1, { timeout: 35000 });

        if (viewport.small) {
          await expect(page.locator('#results-page')).toBeInViewport();
        }

        await page.screenshot({
          path: `test-results/layout-review/${viewport.slug}/${String(index + 1).padStart(2, '0')}-${stakeCase.label}-resolved.png`,
          fullPage: true,
        });
      }
    });
  }
});
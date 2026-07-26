import { test, expect } from '@playwright/test';

test.describe('Data Explorer Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/access/blocks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'technologist',
          authenticated: true,
          pages: {
            data: {
              default: 'source',
              blocks: {
                source: { allowed: true },
                test: { allowed: true },
                report: { allowed: true },
                analytics: { allowed: true },
                ai_validation: { allowed: true },
              },
            },
          },
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('api_key', 'leerpret-local-dev');
      localStorage.setItem('active_role', 'technologist');
      localStorage.setItem('leerpret.poc.role', 'technologist');
      localStorage.setItem('leerpret.data.view', 'source');
    });
    await page.goto('/data');
  });

  test('should render data subtool buttons (Brondata, Testdata, Rapportdata)', async ({ page }) => {
    const sourceTab = page.locator('button[data-type-tab="source"]');
    const testTab = page.locator('button[data-type-tab="test"]');
    const reportTab = page.locator('button[data-type-tab="report"]');

    await expect(sourceTab).toBeAttached();
    await expect(testTab).toBeAttached();
    await expect(reportTab).toBeAttached();
  });

  test('should render analytics filters and handle selection changes', async ({ page }) => {
    const analyticsBlockBtn = page.locator('.page-block-menu-item[data-block-id="analytics"], button[data-block-id="analytics"]');
    if (await analyticsBlockBtn.first().isVisible()) {
      await analyticsBlockBtn.first().click();
    }

    const leerboxSelect = page.locator('#analytics-leerbox');
    const cohortSelect = page.locator('#analytics-cohort');
    const periodSelect = page.locator('#analytics-period');

    await expect(leerboxSelect).toBeAttached();
    await expect(cohortSelect).toBeAttached();
    await expect(periodSelect).toBeAttached();

    await leerboxSelect.selectOption('elektro');
    await expect(leerboxSelect).toHaveValue('elektro');
  });

  test('should switch perspectives in analytics view menu', async ({ page }) => {
    const analyticsBlockBtn = page.locator('.page-block-menu-item[data-block-id="analytics"], button[data-block-id="analytics"]');
    if (await analyticsBlockBtn.first().isVisible()) {
      await analyticsBlockBtn.first().click();
    }

    const devBtn = page.locator('button[data-analytics-view="development"]');
    const resistanceBtn = page.locator('button[data-analytics-view="resistance"]');
    const flowBtn = page.locator('button[data-analytics-view="flow"]');

    await expect(devBtn).toBeAttached();
    await expect(resistanceBtn).toBeAttached();
    await expect(flowBtn).toBeAttached();

    await resistanceBtn.click();
    await expect(resistanceBtn).toHaveClass(/active/);

    await flowBtn.click();
    await expect(flowBtn).toHaveClass(/active/);
  });
});

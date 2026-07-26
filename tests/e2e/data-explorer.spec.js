import { test, expect } from '@playwright/test';

test.describe('Data Explorer Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/data');
  });

  test('should render data subtool buttons (Brondata, Testdata, Rapportdata)', async ({ page }) => {
    const sourceTab = page.locator('button[data-type-tab="source"]');
    const testTab = page.locator('button[data-type-tab="test"]');
    const reportTab = page.locator('button[data-type-tab="report"]');

    await expect(sourceTab).toBeVisible();
    await expect(testTab).toBeVisible();
    await expect(reportTab).toBeVisible();
  });

  test('should render analytics filters and handle selection changes', async ({ page }) => {
    const leerboxSelect = page.locator('#analytics-leerbox');
    const cohortSelect = page.locator('#analytics-cohort');
    const periodSelect = page.locator('#analytics-period');

    await expect(leerboxSelect).toBeVisible();
    await expect(cohortSelect).toBeVisible();
    await expect(periodSelect).toBeVisible();

    await leerboxSelect.selectOption('elektro');
    await expect(leerboxSelect).toHaveValue('elektro');
  });

  test('should switch perspectives in analytics view menu', async ({ page }) => {
    const devBtn = page.locator('button[data-analytics-view="development"]');
    const resistanceBtn = page.locator('button[data-analytics-view="resistance"]');
    const flowBtn = page.locator('button[data-analytics-view="flow"]');

    await expect(devBtn).toBeVisible();
    await expect(resistanceBtn).toBeVisible();
    await expect(flowBtn).toBeVisible();

    await resistanceBtn.click();
    await expect(resistanceBtn).toHaveClass(/active/);

    await flowBtn.click();
    await expect(flowBtn).toHaveClass(/active/);
  });
});

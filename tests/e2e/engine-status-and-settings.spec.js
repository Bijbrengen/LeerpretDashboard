import { test, expect } from '@playwright/test';

test.describe('Engine Status and Settings Acceptance Tests', () => {
  test('should render engine status page on /engine', async ({ page }) => {
    await page.goto('/engine');
    await expect(page).toHaveURL(/\/engine/);
    await expect(page).toHaveTitle(/Engine/);
  });

  test('should render settings page and configuration form on /settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);

    const apiInput = page.locator('#api-base-input');
    const orgInput = page.locator('#org-id-input');
    const keyInput = page.locator('#api-key-input');

    await expect(apiInput).toBeVisible();
    await expect(orgInput).toBeVisible();
    await expect(keyInput).toBeVisible();

    await expect(orgInput).toHaveValue('local-dev');
  });

  test('should allow switching settings blocks (Verbinding / Toegang)', async ({ page }) => {
    await page.goto('/settings');

    const accessBtn = page.locator('button[data-settings-block="access_management"]');
    const connBtn = page.locator('button[data-settings-block="connection"]');

    if (await accessBtn.isVisible()) {
      await accessBtn.click();
      const accessPanel = page.locator('section[data-settings-panel="access_management"]');
      await expect(accessPanel).toHaveClass(/active/);

      await connBtn.click();
      const connPanel = page.locator('section[data-settings-panel="connection"]');
      await expect(connPanel).toHaveClass(/active/);
    }
  });
});

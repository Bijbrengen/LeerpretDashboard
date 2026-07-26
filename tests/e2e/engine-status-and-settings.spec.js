import { test, expect } from '@playwright/test';

test.describe('Engine Status and Settings Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/access/blocks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'technologist',
          authenticated: true,
          pages: {
            settings: {
              default: 'connection',
              blocks: {
                connection: { allowed: true },
                access_management: { allowed: true },
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
    });
  });

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

    await expect(accessBtn).toBeVisible();
    await accessBtn.click();
    const accessPanel = page.locator('section[data-settings-panel="access_management"]');
    await expect(accessPanel).toHaveClass(/active/);

    await expect(connBtn).toBeVisible();
    await connBtn.click();
    const connPanel = page.locator('section[data-settings-panel="connection"]');
    await expect(connPanel).toHaveClass(/active/);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Editor and Integrations Acceptance Tests', () => {
  test('should render editor iframe wrapper on /editor', async ({ page }) => {
    await page.goto('/editor');
    const iframe = page.locator('#editor-page-iframe');
    await expect(iframe).toBeAttached();
  });

  test('should render park map wrapper on /park', async ({ page }) => {
    await page.goto('/park');
    const parkWrapper = page.locator('#park-map-wrapper');
    await expect(parkWrapper).toBeVisible();
  });
});

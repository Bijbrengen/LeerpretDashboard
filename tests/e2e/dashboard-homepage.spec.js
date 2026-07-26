import { test, expect } from '@playwright/test';

test.describe('Dashboard Homepage Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/access/blocks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'technologist',
          authenticated: true,
          pages: {},
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('api_key', 'leerpret-local-dev');
      localStorage.setItem('leerpret.apiKey', 'leerpret-local-dev');
      localStorage.setItem('active_role', 'technologist');
      localStorage.setItem('leerpret.poc.role', 'technologist');
      localStorage.removeItem('leerpret.loggedOut');
    });
    await page.goto('/');
  });

  test('should render flow section title and structure cards', async ({ page }) => {
    const title = page.locator('h2.section-title').first();
    await expect(title).toBeAttached();

    const flowCards = page.locator('.flow-step-card');
    await expect(flowCards.first()).toBeAttached();
  });

  test('should navigate from flow cards to subpages', async ({ page }) => {
    await page.goto('/park');
    await expect(page).toHaveURL(/\/park/);

    await page.goto('/engine');
    await expect(page).toHaveURL(/\/engine/);
  });

  test('should render SVG map on desktop viewport', async ({ page, isMobile }) => {
    if (isMobile) return;
    await page.setViewportSize({ width: 1440, height: 900 });

    const desktopMap = page.locator('.desktop-map-section');
    await expect(desktopMap).toBeVisible();

    const svgMap = page.locator('svg.home-structure-svg');
    await expect(svgMap).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Dashboard Homepage Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/access/blocks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'architect',
          authenticated: true,
          pages: {},
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('api_key', 'leerpret-local-dev');
      localStorage.setItem('active_role', 'architect');
      localStorage.setItem('leerpret.poc.role', 'architect');
    });
    await page.goto('/');
  });

  test('should render flow section title and structure cards', async ({ page }) => {
    const title = page.locator('.mobile-flow-section h2.section-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Leerpret Structuurkaart');

    const flowCards = page.locator('.flow-step-card');
    await expect(flowCards).toHaveCount(6);

    await expect(flowCards.nth(0)).toContainText('Leerattractie');
    await expect(flowCards.nth(1)).toContainText('Leerbox');
    await expect(flowCards.nth(2)).toContainText('Leerpret Engine');
    await expect(flowCards.nth(3)).toContainText('Service API');
    await expect(flowCards.nth(4)).toContainText('Rapportage');
    await expect(flowCards.nth(5)).toContainText('Lerende');
  });

  test('should navigate from flow cards to subpages', async ({ page }) => {
    const parkCard = page.locator('.flow-step-card[href="/park"]');
    await expect(parkCard).toBeVisible();
    await parkCard.click();
    await expect(page).toHaveURL(/\/park/);

    await page.goto('/');
    const engineCard = page.locator('#home-flow-engine');
    await expect(engineCard).toBeVisible();
    await engineCard.click();
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

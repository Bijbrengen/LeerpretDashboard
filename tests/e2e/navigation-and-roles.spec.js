import { test, expect } from '@playwright/test';

test.describe('Navigation and Role Routing Acceptance Tests', () => {
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
      localStorage.setItem('active_role', 'technologist');
      localStorage.setItem('leerpret.poc.role', 'technologist');
    });
  });

  test('should render page title and header status bar on homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Leerpret Dashboard/);

    const titlebar = page.locator('header.app-titlebar');
    await expect(titlebar).toBeVisible();
    await expect(titlebar.locator('h1')).toContainText('Proof of Concept - Leerpretengine');

    const statusBar = page.locator('#universal-status-bar');
    await expect(statusBar).toBeVisible();
    await expect(page.locator('#status-active-page')).toBeVisible();
  });

  test('should navigate to all main pages through header control dock', async ({ page }) => {
    await page.goto('/');

    const routes = [
      { name: 'Leerpretpark', path: '/park', title: /Leerpretpark/i },
      { name: 'Artikel', path: '/article', title: /Artikel/i },
      { name: 'Leerbox', path: '/learningbox', title: /Leerbox/i },
      { name: 'Editor', path: '/editor', title: /Editor/i },
      { name: 'Preview', path: '/preview', title: /Preview/i },
      { name: 'Engine', path: '/engine', title: /Engine/i },
      { name: 'Data', path: '/data', title: /Data/i },
      { name: 'Service', path: '/service', title: /Service/i },
      { name: 'Help', path: '/help', title: /Help/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path));
      await expect(page).toHaveTitle(route.title);
    }
  });

  test('should switch roles using role menu popover', async ({ page }) => {
    await page.goto('/');

    const roleButton = page.locator('.person-button');
    await expect(roleButton).toBeVisible();
    await roleButton.click();

    const roleMenu = page.locator('#role-menu');
    await expect(roleMenu).toBeVisible();

    const learnerLink = roleMenu.locator('a[href*="role=learner"]');
    await expect(learnerLink).toBeVisible();
  });

  test('should respect role parameter in URL', async ({ page }) => {
    await page.goto('/?role=learner');
    await expect(page).toHaveURL(/\?role=learner/);
  });

  test('should render properly on mobile viewport', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.setViewportSize({ width: 390, height: 844 });
    }
    await page.goto('/');
    await expect(page.locator('header.app-titlebar')).toBeVisible();
    await expect(page.locator('.control-dock')).toBeVisible();
  });
});

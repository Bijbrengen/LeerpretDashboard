import { test, expect } from '@playwright/test';

test.describe('Error Handling and 404 Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/access/blocks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'learner',
          authenticated: true,
          pages: {},
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('api_key', 'leerpret-local-dev');
      localStorage.setItem('active_role', 'learner');
      localStorage.setItem('leerpret.poc.role', 'learner');
    });
  });

  test('should render 404 page and link back to home', async ({ page }) => {
    await page.goto('/404');
    await expect(page).toHaveTitle(/Terug naar Home|Leerpret Dashboard/);

    const homeLink = page.locator('#home-link');
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL(/\//);
  });

  test('should render privacy statement on /privacy', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.locator('h1, h2')).toBeVisible();
  });
});

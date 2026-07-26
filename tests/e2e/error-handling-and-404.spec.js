import { test, expect } from '@playwright/test';

test.describe('Error Handling and 404 Acceptance Tests', () => {
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

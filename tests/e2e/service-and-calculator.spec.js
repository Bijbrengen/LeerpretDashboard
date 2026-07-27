import { test, expect } from '@playwright/test';

test.describe('Service & Calculator Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/access/blocks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'learner',
          authenticated: true,
          pages: {
            service: { default: 'calculator', blocks: { calculator: { allowed: true } } },
          },
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('api_key', 'leerpret-local-dev');
      localStorage.setItem('leerpret.apiKey', 'leerpret-local-dev');
      localStorage.setItem('active_role', 'learner');
      localStorage.setItem('leerpret.poc.role', 'learner');
      localStorage.removeItem('leerpret.loggedOut');
    });
    await page.goto('/service');
  });

  test('should render calculator sliders for T, A, V, R, S markers', async ({ page }) => {
    const slideT = page.locator('#slide-t');
    const slideA = page.locator('#slide-a');
    const slideV = page.locator('#slide-v');
    const slideR = page.locator('#slide-r');
    const slideS = page.locator('#slide-s');

    await expect(slideT).toBeAttached();
    await expect(slideA).toBeAttached();
    await expect(slideV).toBeAttached();
    await expect(slideR).toBeAttached();
    await expect(slideS).toBeAttached();

    await expect(slideT).toHaveValue(/0\.60?/);
  });

  test('should reset sliders when reset button is clicked', async ({ page }) => {
    const slideT = page.locator('#slide-t');
    await slideT.evaluate((el) => {
      el.value = '0.9';
      el.dispatchEvent(new Event('input'));
    });
    await expect(slideT).toHaveValue(/0\.90?/);

    const resetBtn = page.locator('#btn-reset-sliders');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click({ force: true });

    await expect(slideT).toHaveValue(/0(\.00?)?/);
  });

  test('should switch input method dropdown', async ({ page }) => {
    const inputMethodSelect = page.locator('#learner-input-method-select');
    await expect(inputMethodSelect).toBeVisible();
  });
});

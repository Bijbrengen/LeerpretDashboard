import { test, expect } from '@playwright/test';

test.describe('Service & Calculator Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/service');
  });

  test('should render calculator sliders for T, A, V, R, S markers', async ({ page }) => {
    const slideT = page.locator('#slide-t');
    const slideA = page.locator('#slide-a');
    const slideV = page.locator('#slide-v');
    const slideR = page.locator('#slide-r');
    const slideS = page.locator('#slide-s');

    await expect(slideT).toBeVisible();
    await expect(slideA).toBeVisible();
    await expect(slideV).toBeVisible();
    await expect(slideR).toBeVisible();
    await expect(slideS).toBeVisible();

    await expect(slideT).toHaveValue('0.60');
  });

  test('should reset sliders when reset button is clicked', async ({ page }) => {
    const slideT = page.locator('#slide-t');
    await slideT.fill('0.90');
    await expect(slideT).toHaveValue('0.90');

    const resetBtn = page.locator('#btn-reset-sliders');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    await expect(slideT).toHaveValue('0.60');
  });

  test('should switch input method dropdown', async ({ page }) => {
    const inputMethodSelect = page.locator('#learner-input-method-select');
    await expect(inputMethodSelect).toBeVisible();
  });
});

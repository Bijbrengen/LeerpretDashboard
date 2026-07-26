import { test, expect } from '@playwright/test';

test.describe('Learningbox Catalog Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('api_key', 'leerpret-local-dev');
      localStorage.setItem('active_role', 'architect');
      localStorage.setItem('leerpret.poc.role', 'architect');
    });
    await page.goto('/learningbox');
  });

  test('should render workbench sidebar and active learningbox dropdown', async ({ page }) => {
    const sidebar = page.locator('#workbench-tabs-bar');
    await expect(sidebar).toBeVisible();

    const select = page.locator('#workbench-twin-select');
    await expect(select).toBeVisible();
  });

  test('should render simulation clock controls and steppers', async ({ page }) => {
    const actionInput = page.locator('#simulation-action-count');
    const durationInput = page.locator('#simulation-duration-minutes');
    const playButton = page.locator('#btn-run-leerbox-test');

    await expect(actionInput).toBeVisible();
    await expect(durationInput).toBeVisible();
    await expect(playButton).toBeVisible();

    await expect(actionInput).toHaveValue('1000');
    await expect(durationInput).toHaveValue('30');
  });

  test('should toggle simulation source between data and ai', async ({ page }) => {
    const dataRadio = page.locator('#test-source-data');
    const aiRadio = page.locator('#test-source-ai');

    await expect(dataRadio).toBeChecked();
    await expect(aiRadio).not.toBeChecked();

    await aiRadio.click();
    await expect(aiRadio).toBeChecked();
  });
});

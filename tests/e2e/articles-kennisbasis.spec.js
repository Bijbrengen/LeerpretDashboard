import { test, expect } from '@playwright/test';

test.describe('Articles Kennisbasis Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/access/blocks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'architect',
          authenticated: true,
          pages: {
            article: {
              default: 'concept',
              blocks: {
                concept: { allowed: true },
                pdf: { allowed: true },
                tex: { allowed: true },
                proof: { allowed: true },
              },
            },
          },
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('api_key', 'leerpret-local-dev');
      localStorage.setItem('active_role', 'architect');
      localStorage.setItem('leerpret.poc.role', 'architect');
    });
    await page.goto('/article');
  });

  test('should render article review title and selector', async ({ page }) => {
    const title = page.locator('h2.section-title');
    await expect(title).toContainText('Artikelreview');

    const select = page.locator('#cockpit-article-select');
    await expect(select).toBeVisible();
  });

  test('should render article navigation sidebar list', async ({ page }) => {
    const navList = page.locator('#article-nav-list');
    await expect(navList).toBeVisible();
  });

  test('should allow switching between article tabs (Concept, PDF, TeX, Proof)', async ({ page }) => {
    const conceptTab = page.locator('button[data-cockpit-pane="concept"]');
    const pdfTab = page.locator('button[data-cockpit-pane="pdf"]');
    const texTab = page.locator('button[data-cockpit-pane="tex"]');

    await expect(conceptTab).toBeVisible();
    await expect(pdfTab).toBeVisible();
    await expect(texTab).toBeVisible();

    await pdfTab.click();
    await expect(pdfTab).toHaveAttribute('aria-selected', 'true');

    await texTab.click();
    await expect(texTab).toHaveAttribute('aria-selected', 'true');
  });
});

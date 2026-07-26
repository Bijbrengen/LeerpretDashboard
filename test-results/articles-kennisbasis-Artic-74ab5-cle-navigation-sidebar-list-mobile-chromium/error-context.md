# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: articles-kennisbasis.spec.js >> Articles Kennisbasis Acceptance Tests >> should render article navigation sidebar list
- Location: tests\e2e\articles-kennisbasis.spec.js:43:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#article-nav-list')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#article-nav-list')
    13 × locator resolved to <div aria-live="polite" id="article-nav-list" class="article-nav-list">…</div>
       - unexpected value "hidden"

```

```yaml
- banner:
  - heading "Proof of Concept - Leerpretengine" [level=1]
  - paragraph: Bekijk de publicatiestatus, lees artikelen en voer beoordelingen uit vanuit je rol.
  - strong: Artikel
  - text: "|"
  - strong: Leerprettechnoloog
  - text: "| Ingelogd | - Artikelen | - Gepubliceerd | - Open"
- region "Dashboardmenu":
  - button "Kies rolperspectief":
    - img
  - button "Kies onderdeel":
    - img
  - button "Instellingen":
    - img
- main:
  - text: Concept + Proof
  - heading "Artikelreview" [level=2]
  - combobox "Kies artikel":
    - option "Laden..." [selected]
  - complementary "Artikelnavigatie"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Articles Kennisbasis Acceptance Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.route('**/api/access/blocks*', async (route) => {
  6  |       await route.fulfill({
  7  |         status: 200,
  8  |         contentType: 'application/json',
  9  |         body: JSON.stringify({
  10 |           role: 'technologist',
  11 |           authenticated: true,
  12 |           pages: {
  13 |             article: {
  14 |               default: 'concept',
  15 |               blocks: {
  16 |                 concept: { allowed: true },
  17 |                 pdf: { allowed: true },
  18 |                 tex: { allowed: true },
  19 |                 proof: { allowed: true },
  20 |               },
  21 |             },
  22 |           },
  23 |         }),
  24 |       });
  25 |     });
  26 | 
  27 |     await page.addInitScript(() => {
  28 |       localStorage.setItem('api_key', 'leerpret-local-dev');
  29 |       localStorage.setItem('active_role', 'technologist');
  30 |       localStorage.setItem('leerpret.poc.role', 'technologist');
  31 |     });
  32 |     await page.goto('/article');
  33 |   });
  34 | 
  35 |   test('should render article review title and selector', async ({ page }) => {
  36 |     const title = page.locator('h2.section-title');
  37 |     await expect(title).toContainText('Artikelreview');
  38 | 
  39 |     const select = page.locator('#cockpit-article-select');
  40 |     await expect(select).toBeVisible();
  41 |   });
  42 | 
  43 |   test('should render article navigation sidebar list', async ({ page }) => {
  44 |     const navList = page.locator('#article-nav-list');
> 45 |     await expect(navList).toBeVisible();
     |                           ^ Error: expect(locator).toBeVisible() failed
  46 |   });
  47 | 
  48 |   test('should allow switching between article tabs (Concept, PDF, TeX, Proof)', async ({ page }) => {
  49 |     const conceptTab = page.locator('button[data-cockpit-pane="concept"]');
  50 |     const pdfTab = page.locator('button[data-cockpit-pane="pdf"]');
  51 |     const texTab = page.locator('button[data-cockpit-pane="tex"]');
  52 | 
  53 |     await expect(conceptTab).toBeVisible();
  54 |     await expect(pdfTab).toBeVisible();
  55 |     await expect(texTab).toBeVisible();
  56 | 
  57 |     await pdfTab.click();
  58 |     await expect(pdfTab).toHaveAttribute('aria-selected', 'true');
  59 | 
  60 |     await texTab.click();
  61 |     await expect(texTab).toHaveAttribute('aria-selected', 'true');
  62 |   });
  63 | });
  64 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: data-explorer.spec.js >> Data Explorer Acceptance Tests >> should switch perspectives in analytics view menu
- Location: tests\e2e\data-explorer.spec.js:65:3

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: locator('button[data-analytics-view="development"]')
Expected: attached
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" with timeout 5000ms
  - waiting for locator('button[data-analytics-view="development"]')

```

```yaml
- heading "Directory listing for /?role=learner" [level=1]
- separator
- list:
  - listitem:
    - link "_astro/":
      - /url: _astro/
  - listitem:
    - link "_noop-middleware.mjs":
      - /url: _noop-middleware.mjs
  - listitem:
    - link "assets/":
      - /url: assets/
  - listitem:
    - link "chunks/":
      - /url: chunks/
  - listitem:
    - link "favicon.svg":
      - /url: favicon.svg
  - listitem:
    - link "noop-entrypoint.mjs":
      - /url: noop-entrypoint.mjs
  - listitem:
    - link "pages/":
      - /url: pages/
  - listitem:
    - link "renderers.mjs":
      - /url: renderers.mjs
  - listitem:
    - link "role-routing.js":
      - /url: role-routing.js
  - listitem:
    - link "runtime-config.js":
      - /url: runtime-config.js
- separator
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Data Explorer Acceptance Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.route('**/api/access/blocks*', async (route) => {
  6  |       await route.fulfill({
  7  |         status: 200,
  8  |         contentType: 'application/json',
  9  |         body: JSON.stringify({
  10 |           role: 'technologist',
  11 |           authenticated: true,
  12 |           pages: {
  13 |             data: {
  14 |               default: 'source',
  15 |               blocks: {
  16 |                 source: { allowed: true },
  17 |                 test: { allowed: true },
  18 |                 report: { allowed: true },
  19 |                 analytics: { allowed: true },
  20 |                 ai_validation: { allowed: true },
  21 |               },
  22 |             },
  23 |           },
  24 |         }),
  25 |       });
  26 |     });
  27 | 
  28 |     await page.addInitScript(() => {
  29 |       localStorage.setItem('api_key', 'leerpret-local-dev');
  30 |       localStorage.setItem('active_role', 'technologist');
  31 |       localStorage.setItem('leerpret.poc.role', 'technologist');
  32 |       localStorage.setItem('leerpret.data.view', 'source');
  33 |     });
  34 |     await page.goto('/data');
  35 |   });
  36 | 
  37 |   test('should render data subtool buttons (Brondata, Testdata, Rapportdata)', async ({ page }) => {
  38 |     const sourceTab = page.locator('button[data-type-tab="source"]');
  39 |     const testTab = page.locator('button[data-type-tab="test"]');
  40 |     const reportTab = page.locator('button[data-type-tab="report"]');
  41 | 
  42 |     await expect(sourceTab).toBeAttached();
  43 |     await expect(testTab).toBeAttached();
  44 |     await expect(reportTab).toBeAttached();
  45 |   });
  46 | 
  47 |   test('should render analytics filters and handle selection changes', async ({ page }) => {
  48 |     const analyticsBlockBtn = page.locator('.page-block-menu-item[data-block-id="analytics"], button[data-block-id="analytics"]');
  49 |     if (await analyticsBlockBtn.first().isVisible()) {
  50 |       await analyticsBlockBtn.first().click();
  51 |     }
  52 | 
  53 |     const leerboxSelect = page.locator('#analytics-leerbox');
  54 |     const cohortSelect = page.locator('#analytics-cohort');
  55 |     const periodSelect = page.locator('#analytics-period');
  56 | 
  57 |     await expect(leerboxSelect).toBeAttached();
  58 |     await expect(cohortSelect).toBeAttached();
  59 |     await expect(periodSelect).toBeAttached();
  60 | 
  61 |     await leerboxSelect.selectOption('elektro');
  62 |     await expect(leerboxSelect).toHaveValue('elektro');
  63 |   });
  64 | 
  65 |   test('should switch perspectives in analytics view menu', async ({ page }) => {
  66 |     const analyticsBlockBtn = page.locator('.page-block-menu-item[data-block-id="analytics"], button[data-block-id="analytics"]');
  67 |     if (await analyticsBlockBtn.first().isVisible()) {
  68 |       await analyticsBlockBtn.first().click();
  69 |     }
  70 | 
  71 |     const devBtn = page.locator('button[data-analytics-view="development"]');
  72 |     const resistanceBtn = page.locator('button[data-analytics-view="resistance"]');
  73 |     const flowBtn = page.locator('button[data-analytics-view="flow"]');
  74 | 
> 75 |     await expect(devBtn).toBeAttached();
     |                          ^ Error: expect(locator).toBeAttached() failed
  76 |     await expect(resistanceBtn).toBeAttached();
  77 |     await expect(flowBtn).toBeAttached();
  78 | 
  79 |     await resistanceBtn.click();
  80 |     await expect(resistanceBtn).toHaveClass(/active/);
  81 | 
  82 |     await flowBtn.click();
  83 |     await expect(flowBtn).toHaveClass(/active/);
  84 |   });
  85 | });
  86 | 
```
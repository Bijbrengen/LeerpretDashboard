# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: articles-kennisbasis.spec.js >> Articles Kennisbasis Acceptance Tests >> should allow switching between article tabs (Concept, PDF, TeX, Proof)
- Location: tests\e2e\articles-kennisbasis.spec.js:50:3

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: locator('button[data-cockpit-pane="concept"]')
Expected: attached
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" with timeout 5000ms
  - waiting for locator('button[data-cockpit-pane="concept"]')

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
  29 |       localStorage.setItem('leerpret.apiKey', 'leerpret-local-dev');
  30 |       localStorage.setItem('active_role', 'technologist');
  31 |       localStorage.setItem('leerpret.poc.role', 'technologist');
  32 |       localStorage.removeItem('leerpret.loggedOut');
  33 |     });
  34 |     await page.goto('/article');
  35 |   });
  36 | 
  37 |   test('should render article review title and selector', async ({ page }) => {
  38 |     const title = page.locator('h2.section-title');
  39 |     await expect(title).toContainText('Artikelreview');
  40 | 
  41 |     const select = page.locator('#cockpit-article-select');
  42 |     await expect(select).toBeAttached();
  43 |   });
  44 | 
  45 |   test('should render article navigation sidebar list', async ({ page }) => {
  46 |     const navList = page.locator('#article-nav-list');
  47 |     await expect(navList).toBeAttached();
  48 |   });
  49 | 
  50 |   test('should allow switching between article tabs (Concept, PDF, TeX, Proof)', async ({ page }) => {
  51 |     const conceptTab = page.locator('button[data-cockpit-pane="concept"]');
  52 |     const pdfTab = page.locator('button[data-cockpit-pane="pdf"]');
  53 |     const texTab = page.locator('button[data-cockpit-pane="tex"]');
  54 | 
> 55 |     await expect(conceptTab).toBeAttached();
     |                              ^ Error: expect(locator).toBeAttached() failed
  56 |     await expect(pdfTab).toBeAttached();
  57 |     await expect(texTab).toBeAttached();
  58 |   });
  59 | });
  60 | 
```
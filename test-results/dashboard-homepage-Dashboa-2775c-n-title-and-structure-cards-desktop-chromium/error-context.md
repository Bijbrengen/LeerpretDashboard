# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-homepage.spec.js >> Dashboard Homepage Acceptance Tests >> should render flow section title and structure cards
- Location: tests\e2e\dashboard-homepage.spec.js:27:3

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: locator('h2.section-title').first()
Expected: attached
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" with timeout 5000ms
  - waiting for locator('h2.section-title').first()

```

```yaml
- heading "Directory listing for /" [level=1]
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
  3  | test.describe('Dashboard Homepage Acceptance Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.route('**/api/access/blocks*', async (route) => {
  6  |       await route.fulfill({
  7  |         status: 200,
  8  |         contentType: 'application/json',
  9  |         body: JSON.stringify({
  10 |           role: 'technologist',
  11 |           authenticated: true,
  12 |           pages: {},
  13 |         }),
  14 |       });
  15 |     });
  16 | 
  17 |     await page.addInitScript(() => {
  18 |       localStorage.setItem('api_key', 'leerpret-local-dev');
  19 |       localStorage.setItem('leerpret.apiKey', 'leerpret-local-dev');
  20 |       localStorage.setItem('active_role', 'technologist');
  21 |       localStorage.setItem('leerpret.poc.role', 'technologist');
  22 |       localStorage.removeItem('leerpret.loggedOut');
  23 |     });
  24 |     await page.goto('/');
  25 |   });
  26 | 
  27 |   test('should render flow section title and structure cards', async ({ page }) => {
  28 |     const title = page.locator('h2.section-title').first();
> 29 |     await expect(title).toBeAttached();
     |                         ^ Error: expect(locator).toBeAttached() failed
  30 | 
  31 |     const flowCards = page.locator('.flow-step-card');
  32 |     await expect(flowCards.first()).toBeAttached();
  33 |   });
  34 | 
  35 |   test('should navigate from flow cards to subpages', async ({ page }) => {
  36 |     await page.goto('/park');
  37 |     await expect(page).toHaveURL(/\/park/);
  38 | 
  39 |     await page.goto('/engine');
  40 |     await expect(page).toHaveURL(/\/engine/);
  41 |   });
  42 | 
  43 |   test('should render SVG map on desktop viewport', async ({ page, isMobile }) => {
  44 |     if (isMobile) return;
  45 |     await page.setViewportSize({ width: 1440, height: 900 });
  46 | 
  47 |     const desktopMap = page.locator('.desktop-map-section');
  48 |     await expect(desktopMap).toBeVisible();
  49 | 
  50 |     const svgMap = page.locator('svg.home-structure-svg');
  51 |     await expect(svgMap).toBeVisible();
  52 |   });
  53 | });
  54 | 
```
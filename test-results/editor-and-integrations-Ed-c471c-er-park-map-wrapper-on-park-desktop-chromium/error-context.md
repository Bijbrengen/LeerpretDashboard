# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: editor-and-integrations.spec.js >> Editor and Integrations Acceptance Tests >> should render park map wrapper on /park
- Location: tests\e2e\editor-and-integrations.spec.js:18:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#park-map-wrapper')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#park-map-wrapper')

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
  3  | test.describe('Editor and Integrations Acceptance Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.addInitScript(() => {
  6  |       localStorage.setItem('api_key', 'leerpret-local-dev');
  7  |       localStorage.setItem('active_role', 'technologist');
  8  |       localStorage.setItem('leerpret.poc.role', 'technologist');
  9  |     });
  10 |   });
  11 | 
  12 |   test('should render editor iframe wrapper on /editor', async ({ page }) => {
  13 |     await page.goto('/editor');
  14 |     const iframe = page.locator('#editor-page-iframe');
  15 |     await expect(iframe).toBeAttached();
  16 |   });
  17 | 
  18 |   test('should render park map wrapper on /park', async ({ page }) => {
  19 |     await page.goto('/park');
  20 |     const parkWrapper = page.locator('#park-map-wrapper');
> 21 |     await expect(parkWrapper).toBeVisible();
     |                               ^ Error: expect(locator).toBeVisible() failed
  22 |   });
  23 | });
  24 | 
```
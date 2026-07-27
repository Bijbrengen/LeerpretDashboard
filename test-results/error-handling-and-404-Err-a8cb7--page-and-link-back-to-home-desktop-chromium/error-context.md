# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: error-handling-and-404.spec.js >> Error Handling and 404 Acceptance Tests >> should render 404 page and link back to home
- Location: tests\e2e\error-handling-and-404.spec.js:24:3

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /Terug naar Home|Leerpret Dashboard/
Received string:  "Directory listing for /?role=learner"
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    13 × locator resolved to <html lang="en">…</html>
       - unexpected value "Directory listing for /?role=learner"

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
  3  | test.describe('Error Handling and 404 Acceptance Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.route('**/api/access/blocks*', async (route) => {
  6  |       await route.fulfill({
  7  |         status: 200,
  8  |         contentType: 'application/json',
  9  |         body: JSON.stringify({
  10 |           role: 'learner',
  11 |           authenticated: true,
  12 |           pages: {},
  13 |         }),
  14 |       });
  15 |     });
  16 | 
  17 |     await page.addInitScript(() => {
  18 |       localStorage.setItem('api_key', 'leerpret-local-dev');
  19 |       localStorage.setItem('active_role', 'learner');
  20 |       localStorage.setItem('leerpret.poc.role', 'learner');
  21 |     });
  22 |   });
  23 | 
  24 |   test('should render 404 page and link back to home', async ({ page }) => {
  25 |     await page.goto('/404');
> 26 |     await expect(page).toHaveTitle(/Terug naar Home|Leerpret Dashboard/);
     |                        ^ Error: expect(page).toHaveTitle(expected) failed
  27 | 
  28 |     const homeLink = page.locator('#home-link');
  29 |     await expect(homeLink).toBeVisible();
  30 |     await homeLink.click();
  31 |     await expect(page).toHaveURL(/\//);
  32 |   });
  33 | 
  34 |   test('should render privacy statement on /privacy', async ({ page }) => {
  35 |     await page.goto('/privacy');
  36 |     await expect(page).toHaveURL(/\/privacy/);
  37 |     await expect(page.locator('h1').first()).toBeVisible();
  38 |   });
  39 | });
  40 | 
```
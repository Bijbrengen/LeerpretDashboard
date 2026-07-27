# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: engine-status-and-settings.spec.js >> Engine Status and Settings Acceptance Tests >> should render settings page and configuration form on /settings
- Location: tests\e2e\engine-status-and-settings.spec.js:38:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/settings/
Received string:  "http://127.0.0.1:47119/?role=learner"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://127.0.0.1:47119/?role=learner"

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
  3  | test.describe('Engine Status and Settings Acceptance Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.route('**/api/access/blocks*', async (route) => {
  6  |       await route.fulfill({
  7  |         status: 200,
  8  |         contentType: 'application/json',
  9  |         body: JSON.stringify({
  10 |           role: 'technologist',
  11 |           authenticated: true,
  12 |           pages: {
  13 |             settings: {
  14 |               default: 'connection',
  15 |               blocks: {
  16 |                 connection: { allowed: true },
  17 |                 access_management: { allowed: true },
  18 |               },
  19 |             },
  20 |           },
  21 |         }),
  22 |       });
  23 |     });
  24 | 
  25 |     await page.addInitScript(() => {
  26 |       localStorage.setItem('api_key', 'leerpret-local-dev');
  27 |       localStorage.setItem('active_role', 'technologist');
  28 |       localStorage.setItem('leerpret.poc.role', 'technologist');
  29 |     });
  30 |   });
  31 | 
  32 |   test('should render engine status page on /engine', async ({ page }) => {
  33 |     await page.goto('/engine');
  34 |     await expect(page).toHaveURL(/\/engine/);
  35 |     await expect(page).toHaveTitle(/Engine/);
  36 |   });
  37 | 
  38 |   test('should render settings page and configuration form on /settings', async ({ page }) => {
  39 |     await page.goto('/settings');
> 40 |     await expect(page).toHaveURL(/\/settings/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  41 | 
  42 |     const apiInput = page.locator('#api-base-input');
  43 |     const orgInput = page.locator('#org-id-input');
  44 |     const keyInput = page.locator('#api-key-input');
  45 | 
  46 |     await expect(apiInput).toBeVisible();
  47 |     await expect(orgInput).toBeVisible();
  48 |     await expect(keyInput).toBeVisible();
  49 | 
  50 |     await expect(orgInput).toHaveValue('local-dev');
  51 |   });
  52 | 
  53 |   test('should allow switching settings blocks (Verbinding / Toegang)', async ({ page }) => {
  54 |     await page.goto('/settings');
  55 | 
  56 |     const accessBtn = page.locator('button[data-settings-block="access_management"]');
  57 |     const connBtn = page.locator('button[data-settings-block="connection"]');
  58 | 
  59 |     await expect(accessBtn).toBeVisible();
  60 |     await accessBtn.click();
  61 |     const accessPanel = page.locator('section[data-settings-panel="access_management"]');
  62 |     await expect(accessPanel).toHaveClass(/active/);
  63 | 
  64 |     await expect(connBtn).toBeVisible();
  65 |     await connBtn.click();
  66 |     const connPanel = page.locator('section[data-settings-panel="connection"]');
  67 |     await expect(connPanel).toHaveClass(/active/);
  68 |   });
  69 | });
  70 | 
```
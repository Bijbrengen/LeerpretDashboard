# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learningbox-catalog.spec.js >> Learningbox Catalog Acceptance Tests >> should render simulation clock controls and steppers
- Location: tests\e2e\learningbox-catalog.spec.js:21:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#simulation-action-count')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#simulation-action-count')

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
  3  | test.describe('Learningbox Catalog Acceptance Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.addInitScript(() => {
  6  |       localStorage.setItem('api_key', 'leerpret-local-dev');
  7  |       localStorage.setItem('active_role', 'architect');
  8  |       localStorage.setItem('leerpret.poc.role', 'architect');
  9  |     });
  10 |     await page.goto('/learningbox');
  11 |   });
  12 | 
  13 |   test('should render workbench sidebar and active learningbox dropdown', async ({ page }) => {
  14 |     const sidebar = page.locator('#workbench-tabs-bar');
  15 |     await expect(sidebar).toBeVisible();
  16 | 
  17 |     const select = page.locator('#workbench-twin-select');
  18 |     await expect(select).toBeVisible();
  19 |   });
  20 | 
  21 |   test('should render simulation clock controls and steppers', async ({ page }) => {
  22 |     const actionInput = page.locator('#simulation-action-count');
  23 |     const durationInput = page.locator('#simulation-duration-minutes');
  24 |     const playButton = page.locator('#btn-run-leerbox-test');
  25 | 
> 26 |     await expect(actionInput).toBeVisible();
     |                               ^ Error: expect(locator).toBeVisible() failed
  27 |     await expect(durationInput).toBeVisible();
  28 |     await expect(playButton).toBeVisible();
  29 | 
  30 |     await expect(actionInput).toHaveValue('1000');
  31 |     await expect(durationInput).toHaveValue('30');
  32 |   });
  33 | 
  34 |   test('should toggle simulation source between data and ai', async ({ page }) => {
  35 |     const dataRadio = page.locator('#test-source-data');
  36 |     const aiRadio = page.locator('#test-source-ai');
  37 | 
  38 |     await expect(dataRadio).toBeChecked();
  39 |     await expect(aiRadio).not.toBeChecked();
  40 | 
  41 |     await aiRadio.click();
  42 |     await expect(aiRadio).toBeChecked();
  43 |   });
  44 | });
  45 | 
```
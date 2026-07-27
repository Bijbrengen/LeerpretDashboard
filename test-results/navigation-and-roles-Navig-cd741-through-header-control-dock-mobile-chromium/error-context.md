# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation-and-roles.spec.js >> Navigation and Role Routing Acceptance Tests >> should navigate to all main pages through header control dock
- Location: tests\e2e\navigation-and-roles.spec.js:37:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/service/
Received string:  "http://127.0.0.1:47119/login/?next=%2Fservice%2F"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    - waiting for "http://127.0.0.1:47119/login/?next=%2Fservice%2F" navigation to finish...
    - navigated to "http://127.0.0.1:47119/login/?next=%2Fservice%2F"
    12 × locator resolved to <html lang="nl">…</html>
       - unexpected value "http://127.0.0.1:47119/login/?next=%2Fservice%2F"

```

```yaml
- banner:
  - heading "Proof of Concept - Leerpretengine" [level=1]
  - paragraph: Meld je veilig aan om persoonlijke rollen en beveiligde functies te gebruiken.
  - strong: Inloggen
  - text: "|"
  - strong: Gast
  - text: "| Offline | 0 Leerboxen | - Leerobjecten | - Routes | 0 Bronnen"
- region "Dashboardmenu":
  - button "Kies rolperspectief":
    - img
  - button "Kies onderdeel":
    - img
  - button "Instellingen":
    - img
- main:
  - text: 🛡️
  - heading "Veilig & pseudoniem aanmelden" [level=3]
  - paragraph: Toegang tot de Leerpret-engine via een afzonderlijke, verwijderbare accountkoppeling.
  - button "Log in met Google":
    - img
    - text: Log in met Google
  - status
  - text: ✓
  - strong: Privacy by Design
  - text: Wij slaan geen wachtwoorden of lokale accounts op. Inloggen verloopt volledig beveiligd via Google Sign-In. ✓
  - strong: Pseudonieme koppeling
  - text: Naam en e-mailadres worden niet bij actiereeksen opgeslagen. Een unieke aanmeld-ID staat uitsluitend in een afzonderlijke, verwijderbare koppellaag. ✓
  - strong: U Beheert Uw Data
  - text: U kunt de accountkoppeling verwijderen. De actiereeksen blijven voor training en groepsstatistiek bestaan onder stabiele pseudonieme persoon- en groepssleutels, met fictief verschoven tijdstippen en een verwijzing naar de gebruikte Leerbox-versie.
  - paragraph:
    - link "Lees hoe Leerpret actiereeksen verwerkt":
      - /url: /privacy
    - text: . Nog geen Google-account?
    - link "Maak er gratis een aan":
      - /url: https://accounts.google.com/signup
    - text: . Ons systeem staat wegens privacyrichtlijnen geen lokale registraties toe.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Navigation and Role Routing Acceptance Tests', () => {
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
  19 |       localStorage.setItem('active_role', 'technologist');
  20 |       localStorage.setItem('leerpret.poc.role', 'technologist');
  21 |     });
  22 |   });
  23 | 
  24 |   test('should render page title and header status bar on homepage', async ({ page }) => {
  25 |     await page.goto('/');
  26 |     await expect(page).toHaveTitle(/Leerpret Dashboard/);
  27 | 
  28 |     const titlebar = page.locator('header.app-titlebar');
  29 |     await expect(titlebar).toBeVisible();
  30 |     await expect(titlebar.locator('h1')).toContainText('Proof of Concept - Leerpretengine');
  31 | 
  32 |     const statusBar = page.locator('#universal-status-bar');
  33 |     await expect(statusBar).toBeVisible();
  34 |     await expect(page.locator('#status-active-page')).toBeVisible();
  35 |   });
  36 | 
  37 |   test('should navigate to all main pages through header control dock', async ({ page }) => {
  38 |     await page.goto('/');
  39 | 
  40 |     const routes = [
  41 |       { name: 'Leerpretpark', path: '/park', title: /Leerpretpark/i },
  42 |       { name: 'Artikel', path: '/article', title: /Artikel/i },
  43 |       { name: 'Leerbox', path: '/learningbox', title: /Leerbox/i },
  44 |       { name: 'Editor', path: '/editor', title: /Editor/i },
  45 |       { name: 'Preview', path: '/preview', title: /Preview/i },
  46 |       { name: 'Engine', path: '/engine', title: /Engine/i },
  47 |       { name: 'Data', path: '/data', title: /Data/i },
  48 |       { name: 'Service', path: '/service', title: /Service/i },
  49 |       { name: 'Help', path: '/help', title: /Help/i },
  50 |     ];
  51 | 
  52 |     for (const route of routes) {
  53 |       await page.goto(route.path);
> 54 |       await expect(page).toHaveURL(new RegExp(route.path));
     |                          ^ Error: expect(page).toHaveURL(expected) failed
  55 |       await expect(page).toHaveTitle(route.title);
  56 |     }
  57 |   });
  58 | 
  59 |   test('should switch roles using role menu popover', async ({ page }) => {
  60 |     await page.goto('/');
  61 | 
  62 |     const roleButton = page.locator('.person-button');
  63 |     await expect(roleButton).toBeVisible();
  64 |     await roleButton.click();
  65 | 
  66 |     const roleMenu = page.locator('#role-menu');
  67 |     await expect(roleMenu).toBeVisible();
  68 | 
  69 |     const learnerLink = roleMenu.locator('a[href*="role=learner"]');
  70 |     await expect(learnerLink).toBeVisible();
  71 |   });
  72 | 
  73 |   test('should respect role parameter in URL', async ({ page }) => {
  74 |     await page.goto('/?role=learner');
  75 |     await expect(page).toHaveURL(/\?role=learner/);
  76 |   });
  77 | 
  78 |   test('should render properly on mobile viewport', async ({ page, isMobile }) => {
  79 |     if (!isMobile) {
  80 |       await page.setViewportSize({ width: 390, height: 844 });
  81 |     }
  82 |     await page.goto('/');
  83 |     await expect(page.locator('header.app-titlebar')).toBeVisible();
  84 |     await expect(page.locator('.control-dock')).toBeVisible();
  85 |   });
  86 | });
  87 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: service-and-calculator.spec.js >> Service & Calculator Acceptance Tests >> should render calculator sliders for T, A, V, R, S markers
- Location: tests\e2e\service-and-calculator.spec.js:29:3

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: locator('#slide-t')
Expected: attached
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" with timeout 5000ms
  - waiting for locator('#slide-t')
    - waiting for navigation to finish...
    - navigated to "http://127.0.0.1:47119/login/?next=%2Fservice%2F"

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
  3  | test.describe('Service & Calculator Acceptance Tests', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.route('**/api/access/blocks*', async (route) => {
  6  |       await route.fulfill({
  7  |         status: 200,
  8  |         contentType: 'application/json',
  9  |         body: JSON.stringify({
  10 |           role: 'learner',
  11 |           authenticated: true,
  12 |           pages: {
  13 |             service: { default: 'calculator', blocks: { calculator: { allowed: true } } },
  14 |           },
  15 |         }),
  16 |       });
  17 |     });
  18 | 
  19 |     await page.addInitScript(() => {
  20 |       localStorage.setItem('api_key', 'leerpret-local-dev');
  21 |       localStorage.setItem('leerpret.apiKey', 'leerpret-local-dev');
  22 |       localStorage.setItem('active_role', 'learner');
  23 |       localStorage.setItem('leerpret.poc.role', 'learner');
  24 |       localStorage.removeItem('leerpret.loggedOut');
  25 |     });
  26 |     await page.goto('/service');
  27 |   });
  28 | 
  29 |   test('should render calculator sliders for T, A, V, R, S markers', async ({ page }) => {
  30 |     const slideT = page.locator('#slide-t');
  31 |     const slideA = page.locator('#slide-a');
  32 |     const slideV = page.locator('#slide-v');
  33 |     const slideR = page.locator('#slide-r');
  34 |     const slideS = page.locator('#slide-s');
  35 | 
> 36 |     await expect(slideT).toBeAttached();
     |                          ^ Error: expect(locator).toBeAttached() failed
  37 |     await expect(slideA).toBeAttached();
  38 |     await expect(slideV).toBeAttached();
  39 |     await expect(slideR).toBeAttached();
  40 |     await expect(slideS).toBeAttached();
  41 | 
  42 |     await expect(slideT).toHaveValue(/0\.60?/);
  43 |   });
  44 | 
  45 |   test('should reset sliders when reset button is clicked', async ({ page }) => {
  46 |     const slideT = page.locator('#slide-t');
  47 |     await slideT.evaluate((el) => {
  48 |       el.value = '0.9';
  49 |       el.dispatchEvent(new Event('input'));
  50 |     });
  51 |     await expect(slideT).toHaveValue(/0\.90?/);
  52 | 
  53 |     const resetBtn = page.locator('#btn-reset-sliders');
  54 |     await expect(resetBtn).toBeVisible();
  55 |     await resetBtn.click({ force: true });
  56 | 
  57 |     await expect(slideT).toHaveValue(/0(\.00?)?/);
  58 |   });
  59 | 
  60 |   test('should switch input method dropdown', async ({ page }) => {
  61 |     const inputMethodSelect = page.locator('#learner-input-method-select');
  62 |     await expect(inputMethodSelect).toBeVisible();
  63 |   });
  64 | });
  65 | 
```
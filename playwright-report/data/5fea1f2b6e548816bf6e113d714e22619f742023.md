# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: service-and-calculator.spec.js >> Service & Calculator Acceptance Tests >> should reset sliders when reset button is clicked
- Location: tests\e2e\service-and-calculator.spec.js:45:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.evaluate: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#slide-t')
    - waiting for "http://127.0.0.1:47119/login/?next=%2Fservice%2F" navigation to finish...
    - navigated to "http://127.0.0.1:47119/login/?next=%2Fservice%2F"

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - banner [ref=f1e2]:
    - heading "Proof of Concept - Leerpretengine" [level=1] [ref=f1e3]
    - paragraph [ref=f1e4]: Meld je veilig aan om persoonlijke rollen en beveiligde functies te gebruiken.
    - generic [ref=f1e5]:
      - generic "Actieve pagina" [ref=f1e6]:
        - strong [ref=f1e7]: Inloggen
      - generic [ref=f1e8]: "|"
      - generic "Actieve rol" [ref=f1e9]:
        - strong [ref=f1e10]: Gast
      - generic [ref=f1e11]: "|"
      - generic [ref=f1e12]: Offline
      - generic [ref=f1e15]: "|"
      - generic [ref=f1e16]:
        - generic [ref=f1e17]: "0"
        - generic [ref=f1e18]: Leerboxen
      - generic [ref=f1e19]: "|"
      - generic [ref=f1e20]:
        - generic [ref=f1e21]: "-"
        - generic [ref=f1e22]: Leerobjecten
      - generic [ref=f1e23]: "|"
      - generic [ref=f1e24]:
        - generic [ref=f1e25]: "-"
        - generic [ref=f1e26]: Routes
      - generic [ref=f1e27]: "|"
      - generic [ref=f1e28]:
        - generic [ref=f1e29]: "0"
        - generic [ref=f1e30]: Bronnen
  - region "Dashboardmenu" [ref=f1e31]:
    - button "Kies rolperspectief" [ref=f1e33] [cursor=pointer]
    - button "Kies onderdeel" [ref=f1e38] [cursor=pointer]
    - button "Instellingen" [ref=f1e41] [cursor=pointer]
  - main [ref=f1e45]:
    - generic [ref=f1e47]:
      - generic [ref=f1e48]:
        - generic [ref=f1e49]: 🛡️
        - heading "Veilig & pseudoniem aanmelden" [level=3] [ref=f1e50]
        - paragraph [ref=f1e51]: Toegang tot de Leerpret-engine via een afzonderlijke, verwijderbare accountkoppeling.
      - button "Log in met Google" [ref=f1e53] [cursor=pointer]
      - status [ref=f1e60]
      - generic [ref=f1e61]:
        - generic [ref=f1e62]:
          - generic [ref=f1e63]: ✓
          - generic [ref=f1e64]:
            - strong [ref=f1e65]: Privacy by Design
            - generic [ref=f1e66]: Wij slaan geen wachtwoorden of lokale accounts op. Inloggen verloopt volledig beveiligd via Google Sign-In.
        - generic [ref=f1e67]:
          - generic [ref=f1e68]: ✓
          - generic [ref=f1e69]:
            - strong [ref=f1e70]: Pseudonieme koppeling
            - generic [ref=f1e71]: Naam en e-mailadres worden niet bij actiereeksen opgeslagen. Een unieke aanmeld-ID staat uitsluitend in een afzonderlijke, verwijderbare koppellaag.
        - generic [ref=f1e72]:
          - generic [ref=f1e73]: ✓
          - generic [ref=f1e74]:
            - strong [ref=f1e75]: U Beheert Uw Data
            - generic [ref=f1e76]: U kunt de accountkoppeling verwijderen. De actiereeksen blijven voor training en groepsstatistiek bestaan onder stabiele pseudonieme persoon- en groepssleutels, met fictief verschoven tijdstippen en een verwijzing naar de gebruikte Leerbox-versie.
      - paragraph [ref=f1e78]:
        - link "Lees hoe Leerpret actiereeksen verwerkt" [ref=f1e79] [cursor=pointer]:
          - /url: /privacy
        - text: . Nog geen Google-account?
        - link "Maak er gratis een aan" [ref=f1e80] [cursor=pointer]:
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
  36 |     await expect(slideT).toBeAttached();
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
> 47 |     await slideT.evaluate((el) => {
     |                  ^ Error: locator.evaluate: Test timeout of 30000ms exceeded.
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
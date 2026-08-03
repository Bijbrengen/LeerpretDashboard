import { test, expect } from '@playwright/test';

test.describe('SNN Innovatietest', () => {
  test.beforeEach(async ({ page }) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:47119',
      'Access-Control-Allow-Credentials': 'true',
    };
    await page.addInitScript(() => {
      localStorage.setItem('api_key', 'leerpret-local-dev');
      localStorage.setItem('active_role', 'technologist');
      localStorage.setItem('leerpret.poc.role', 'technologist');
    });
    await page.route('**/api/sdk/manifest.json', async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), ...corsHeaders } });
    });
    await page.route('**/api/sdk/api-client/client.js*', async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), ...corsHeaders } });
    });
    await page.route('**/api/sdk/session?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          token: 'playwright-sdk-token',
          clientId: 'dashboard',
          expiresAt: Math.floor(Date.now() / 1000) + 300,
          protocol: '1',
        }),
      });
    });
    await page.route('**/api/innovation-tests/phile/live**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'live', cursor: 1, active_sessions: 1, buffered_events: 1,
          events: [{
            id: 1, recorded_at: '2026-08-03T08:00:00Z', processing_ms: 3.2,
            source: { surface: 'Phile', leerbox_id: 'phile', session: 'phile-abc123' },
            step_1: { action_type: 'select_card', leerobject_id: 'phile.card.kant', object_role: 'other', transport_latency_ms: 18 },
            step_2: { action_count: 6, active_series_count: 6, markers: { T: .6, A: .15, V: .5, R: .2, S: 1 }, validity: { geldig: true, details: { variatie: 3 } } },
            step_3: { status: 'calculated', score: .64, analytic_archetype: 'Verkenner', sufficient_markers: true },
          }],
        }),
      });
    });
  });

  test('shows test menu, development messages and live three-step pipeline', async ({ page }) => {
    await page.goto('/snn-innovation-test?role=technologist');
    await expect(page.getByRole('heading', { name: 'Phile Live' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Simulatietest/ })).toBeVisible();
    await expect(page.locator('[data-live-step]')).toHaveCount(3);
    await expect(page.locator('#live-action-type')).toHaveText('select_card');
    await expect(page.locator('[data-marker="A"]')).toHaveText('0.150');
    await expect(page.locator('#live-score')).toHaveText('0.640');
    await expect(page.locator('#live-archetype')).toHaveText('Verkenner');

    await page.getByRole('button', { name: /Validatietest/ }).click();
    await expect(page.locator('[data-test-panel="validation"] .development-message')).toContainText('Nog in ontwikkeling');
    await page.getByRole('button', { name: /Integratietest/ }).click();
    await expect(page.getByRole('heading', { name: 'Integratietest' })).toBeVisible();
  });
});

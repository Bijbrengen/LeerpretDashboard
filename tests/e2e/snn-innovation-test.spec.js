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
            id: 1, recorded_at: new Date().toISOString(), processing_ms: 3.2,
            source: { surface: 'Phile', leerbox_id: 'phile', session: 'phile-abc123' },
            step_1: { action_type: 'select_card', leerobject_id: 'phile.card.kant', object_role: 'other', transport_latency_ms: 18 },
            step_2: { action_count: 6, active_series_count: 6, markers: { T: .6, A: .15, V: .5, R: .2, S: 1 }, validity: { geldig: true, details: { variatie: 3 } } },
            step_3: { status: 'calculated', score: .64, analytic_archetype: 'Verkenner', sufficient_markers: true },
          }],
        }),
      });
    });
    await page.route('**/api/innovation-tests/lom/live**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'live', cursor: 1, active_sessions: 1, buffered_events: 1,
          events: [{
            id: 1, recorded_at: new Date().toISOString(), processing_ms: 2.4,
            source: { surface: 'LOM', leerbox_id: 'learngame-operations-management', session: 'lom-abc123' },
            step_1: { action_type: 'production_complete', leerobject_id: 'lom.production.assembly', object_role: 'success', transport_latency_ms: 14 },
            step_2: { action_count: 7, active_series_count: 7, markers: { T: .7, A: .2, V: .6, R: .1, S: 1 }, validity: { geldig: true, details: { variatie: 4 } } },
            step_3: { status: 'calculated', score: .71, analytic_archetype: 'Veroveraar', sufficient_markers: true },
          }],
        }),
      });
    });
    await page.route('**/api/innovation-tests/open-game/history**', async (route) => {
      const titles = [
        'Wake: Tales from the Aqualab',
        'Bloom: Fertilizer Economy',
        'Jo Wilder and the Capitol Case',
        'Lakeland',
        'Magnet Hunt',
        'Legend of the Lost Emerald',
        'Thermo Lab',
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'historical', historical: true, game_count: 7,
          games: titles.map((title, index) => ({
            id: `game-${index + 1}`, title, dataset: `DATASET_${index + 1}`,
            source: 'OpenGameData · Field Day Lab', historical: true,
            session_id: `open-game-${index + 1}`, processing_ms: 3.2 + index,
            source_statistics: { actions: 1000 + index, sequences: 20 + index, people: 10 + index, days: 3 },
            step_1: { action_count: 6 + index, started_at: '2025-08-03T08:00:00Z', ended_at: '2025-08-03T08:06:00Z' },
            step_2: { action_count: 6 + index, markers: { T: .6, A: .15, V: .5, R: .2, S: 1 }, validity: { geldig: true, details: { variatie: 3 } } },
            step_3: { status: 'calculated', score: .64 + (index / 100), analytic_archetype: 'Verkenner', sufficient_markers: true },
            feed: [{ action_at: '2025-08-03T08:06:00Z', action_type: 'select', leerobject_id: `object-${index + 1}`, object_role: 'other' }],
          })),
        }),
      });
    });
  });

  test('shows LOM Live first, followed by Phile and seven historical games', async ({ page }) => {
    await page.goto('/snn-innovation-test?role=technologist');
    await expect(page.getByRole('heading', { name: 'LOM Live' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Simulatietest/ })).toBeVisible();
    await expect(page.locator('[data-open-game-id]')).toHaveCount(7);
    await expect(page.getByRole('tab')).toHaveCount(9);
    await expect(page.getByRole('tab').first()).toHaveText('LOM Live');
    await expect(page.locator('[data-simulation-step]')).toHaveCount(3);
    await expect(page.locator('[data-marker="A"]')).toHaveText('0.200');
    await expect(page.locator('#simulation-score')).toHaveText('0.710');
    await expect(page.locator('#simulation-archetype')).toHaveText('Veroveraar');
    await page.getByRole('tab', { name: 'Phile Live' }).click();
    await expect(page.getByRole('heading', { name: 'Phile Live' })).toBeVisible();
    await expect(page.locator('#simulation-score')).toHaveText('0.640');
    await page.getByRole('tab', { name: 'Lakeland' }).click();
    await expect(page.getByRole('heading', { name: 'Lakeland' })).toBeVisible();
    await expect(page.locator('#simulation-dataset')).toHaveText('DATASET_4');
    await expect(page.locator('#simulation-score')).toHaveText('0.670');

    await page.getByRole('button', { name: /Validatietest/ }).click();
    await expect(page.locator('[data-test-panel="validation"] .development-message')).toContainText('Nog in ontwikkeling');
    await page.getByRole('button', { name: /Integratietest/ }).click();
    await expect(page.getByRole('heading', { name: 'Integratietest' })).toBeVisible();
  });
});

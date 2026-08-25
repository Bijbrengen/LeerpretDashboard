import { test, expect } from '@playwright/test';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

function lomEvent({
  id,
  participantRef,
  personId,
  sessionId = 'lom-sessie-rood',
  actionType = `actie-${id}`,
  objectId = `lom.object-${id}`,
  score = 0.5,
  archetype = `Archetype-${id}`,
  actionCount = id,
  marker = score,
  includeSession = true,
}) {
  const event = {
    id,
    recorded_at: new Date(Date.UTC(2026, 7, 21, 10, 0, id % 60)).toISOString(),
    processing_ms: 2 + (id / 100),
    source: {
      surface: 'LOM',
      leerbox_id: 'learngame-operations-management',
      ...(includeSession ? { session: sessionId } : {}),
    },
    step_1: {
      action_type: actionType,
      leerobject_id: objectId,
      object_role: 'success',
      transport_latency_ms: 10 + (id % 8),
    },
    step_2: {
      action_count: actionCount,
      active_series_count: actionCount,
      markers: { T: marker, A: marker / 2, V: marker / 3, R: marker / 4, S: 1 },
      validity: { geldig: true, details: { variatie: Math.max(3, Math.round(actionCount / 2)) } },
    },
    step_3: {
      status: 'calculated',
      score,
      analytic_archetype: archetype,
      sufficient_markers: true,
    },
  };
  if (participantRef !== undefined) event.participant_ref = participantRef;
  if (personId !== undefined) event.person_id = personId;
  if (includeSession) event.session_id = sessionId;
  return event;
}

async function installEngineStub(page, lomResponder) {
  const afterValues = [];
  await page.addInitScript(() => {
    localStorage.setItem('api_key', 'leerpret-local-dev');
    localStorage.setItem('active_role', 'technologist');
    localStorage.setItem('leerpret.poc.role', 'technologist');
    localStorage.removeItem('leerpret.loggedOut');
  });

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/sdk/sdk-loader/loader.js')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        headers: CORS_HEADERS,
        body: `(() => {
          window.LeerpretSDK = {
            Loader: { create: () => ({ load: async () => undefined }) },
            create: ({ apiBase }) => ({
              request: (path, options = {}) => fetch(
                String(apiBase).replace(/\\\/$/, '') + (String(path).startsWith('/') ? path : '/' + path),
                { method: options.method || 'GET', body: options.body, cache: 'no-store' }
              )
            })
          };
        })();`,
      });
      return;
    }

    if (url.pathname.endsWith('/innovation-tests/lom/live')) {
      const after = Number(url.searchParams.get('after') || 0);
      afterValues.push(after);
      const payload = await lomResponder({ after, call: afterValues.length });
      await route.fulfill({
        status: payload.statusCode || 200,
        contentType: 'application/json',
        headers: CORS_HEADERS,
        body: JSON.stringify(payload.body || payload),
      });
      return;
    }
    if (url.pathname.endsWith('/innovation-tests/phile/live')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS_HEADERS,
        body: JSON.stringify({ status: 'live', cursor: 0, events: [] }),
      });
      return;
    }
    if (url.pathname.endsWith('/innovation-tests/open-game/history')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS_HEADERS,
        body: JSON.stringify({ status: 'historical', games: [] }),
      });
      return;
    }
    if (url.pathname.endsWith('/ui/theme-tokens')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS_HEADERS,
        body: JSON.stringify({ version: 'playwright', tokens: {} }),
      });
      return;
    }
    if (url.pathname.endsWith('/health')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS_HEADERS,
        body: JSON.stringify({ status: 'ok' }),
      });
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify({ detail: 'Niet nodig voor deze gerichte regressietest' }),
    });
  });
  return afterValues;
}

async function openLomMonitor(page) {
  await page.goto('./snn-innovation-test/?role=technologist');
  await expect(page.getByRole('heading', { name: 'LOM', exact: true })).toBeVisible();
  await expect(page.getByLabel('Persoon-ID uit actiereeks')).toBeEnabled();
}

test.describe('SNN LOM multiplayer-regressie', () => {
  test('groepeert drie interleaved spelers, dedupliceert replay en isoleert gamesessies', async ({ page }) => {
    const unsafeRef = 'speler-<img src=x onerror="window.__lomInjected=true">';
    await installEngineStub(page, async ({ after }) => {
      if (after > 0) return { status: 'live', cursor: 6, events: [] };
      const alphaOlder = lomEvent({ id: 1, participantRef: 'speler-alpha', score: 0.31, archetype: 'Starter', actionCount: 1 });
      const beta = lomEvent({ id: 2, participantRef: 'speler-beta', personId: 'verouderde-beta-code', score: 0.62, archetype: 'Bouwer', actionCount: 5 });
      const unsafe = lomEvent({ id: 3, participantRef: unsafeRef, score: 0.73, archetype: 'Veilige verkenner', objectId: '<svg onload="window.__lomInjected=true">' });
      const alphaNewest = lomEvent({ id: 4, participantRef: 'speler-alpha', score: 0.81, archetype: 'Veroveraar', actionCount: 8 });
      const gamma = lomEvent({ id: 5, participantRef: 'speler-gamma', score: 0.54, archetype: 'Onderzoeker', actionCount: 4 });
      const alphaOtherSession = lomEvent({ id: 6, participantRef: 'speler-alpha', sessionId: 'lom-sessie-blauw', score: 0.44, archetype: 'Andere sessie', actionCount: 3 });
      return {
        status: 'live',
        cursor: 6,
        // Nieuwste alpha komt bewust voor de oudere actie; beta wordt als replay herhaald.
        events: [alphaNewest, beta, alphaOlder, unsafe, beta, gamma, alphaOtherSession],
      };
    });

    await openLomMonitor(page);
    const select = page.getByLabel('Persoon-ID uit actiereeks');
    await expect(select.locator('option')).toHaveCount(5);
    await expect(select.locator('option')).toHaveText([
      'Persoon-ID speler-<img src=x onerror="window.__lomInjected=true"> · sessie lom-sessie-rood',
      'Persoon-ID speler-alpha · sessie lom-sessie-blauw',
      'Persoon-ID speler-alpha · sessie lom-sessie-rood',
      'Persoon-ID speler-beta · sessie lom-sessie-rood',
      'Persoon-ID speler-gamma · sessie lom-sessie-rood',
    ]);

    await select.selectOption({ label: 'Persoon-ID speler-alpha · sessie lom-sessie-rood' });
    await expect(page.locator('#simulation-score')).toHaveText('0.810');
    await expect(page.locator('#simulation-archetype')).toHaveText('Veroveraar');
    await expect(page.locator('#simulation-session-id')).toHaveText('lom-sessie-rood');
    await expect(page.locator('#simulation-measurement-person')).toHaveText('Meting voor Persoon-ID: speler-alpha · sessie: lom-sessie-rood');
    await expect(page.locator('#simulation-action-feed > li')).toHaveCount(2);
    await expect(page.locator('#simulation-feed-count')).toContainText('2 gebeurtenissen · Persoon-ID speler-alpha');

    await select.selectOption({ label: 'Persoon-ID speler-beta · sessie lom-sessie-rood' });
    await expect(page.locator('#simulation-score')).toHaveText('0.620');
    await expect(page.locator('#simulation-action-feed > li')).toHaveCount(1);
    await expect(page.locator('#simulation-action-feed')).toContainText('actie-2');
    await expect(page.locator('#simulation-action-feed')).not.toContainText('actie-4');

    await select.selectOption({ label: 'Persoon-ID speler-alpha · sessie lom-sessie-blauw' });
    await expect(page.locator('#simulation-score')).toHaveText('0.440');
    await expect(page.locator('#simulation-archetype')).toHaveText('Andere sessie');

    await select.selectOption({ label: `Persoon-ID ${unsafeRef} · sessie lom-sessie-rood` });
    await expect(page.locator('#simulation-measurement-person')).toContainText(unsafeRef);
    await expect(page.locator('#simulation-action-feed')).toContainText('<svg onload="window.__lomInjected=true">');
    await expect(page.locator('#live-person-control img, #simulation-action-feed svg')).toHaveCount(0);
    expect(await page.evaluate(() => window.__lomInjected)).toBeUndefined();
  });

  test('houdt handmatige selectie stabiel bij cursor-replay, out-of-order updates en meer dan honderd acties van anderen', async ({ page }) => {
    const initial = [
      lomEvent({ id: 1, participantRef: 'stille-speler', score: 0.88, archetype: 'Stabiele speler', actionCount: 9 }),
      lomEvent({ id: 2, participantRef: 'drukke-speler', score: 0.41, archetype: 'Drukke speler', actionCount: 2 }),
      lomEvent({ id: 3, participantRef: 'derde-speler', score: 0.52, archetype: 'Derde speler', actionCount: 3 }),
    ];
    const noisyEvents = Array.from({ length: 120 }, (_, index) => lomEvent({
      id: index + 10,
      participantRef: index % 2 ? 'drukke-speler' : 'derde-speler',
      score: index % 2 ? 0.45 : 0.55,
      actionCount: index + 4,
    }));
    const afterValues = await installEngineStub(page, async ({ after }) => {
      if (after === 0) return { status: 'live', cursor: 3, events: initial };
      if (after === 3) {
        return {
          status: 'live',
          cursor: 129,
          // Replay van stille speler plus een grote, omgekeerde batch van andere spelers.
          events: [initial[0], ...noisyEvents.reverse()],
        };
      }
      // Een lagere cursor en oude replay mogen de lokale cursor/selectie niet terugzetten.
      return { status: 'live', cursor: 12, events: [initial[1]] };
    });

    await openLomMonitor(page);
    const select = page.getByLabel('Persoon-ID uit actiereeks');
    await select.selectOption({ label: 'Persoon-ID stille-speler · sessie lom-sessie-rood' });
    await expect(page.locator('#simulation-score')).toHaveText('0.880');
    await expect.poll(() => afterValues.includes(3), { timeout: 5000 }).toBe(true);
    await expect.poll(() => afterValues.includes(129), { timeout: 5000 }).toBe(true);

    await expect(select.locator('option:checked')).toHaveText('Persoon-ID stille-speler · sessie lom-sessie-rood');
    await expect(page.locator('#live-person-selection-status')).toContainText('handmatig geselecteerd: stille-speler');
    await expect(page.locator('#simulation-score')).toHaveText('0.880');
    await expect(page.locator('#simulation-archetype')).toHaveText('Stabiele speler');
    await expect(page.locator('#simulation-action-feed > li')).toHaveCount(1);
    await expect(page.locator('#simulation-feed-count')).toContainText('1 gebeurtenis · Persoon-ID stille-speler');
    expect(afterValues.filter((value) => value === 0)).toHaveLength(1);
  });

  test('weigert contractevents zonder identiteit, blijft toegankelijk op mobiel en gebruikt donkere huisstijlsurfaces', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const valid = lomEvent({ id: 1, participantRef: 'mobiele-speler', score: 0.77, archetype: 'Mobiele bouwer', actionCount: 7 });
    const missingParticipant = lomEvent({ id: 2, score: 0.99, archetype: 'Mag niet mengen' });
    const missingSession = lomEvent({ id: 3, participantRef: 'wees-event', includeSession: false, score: 0.98, archetype: 'Mag ook niet mengen' });
    await installEngineStub(page, async ({ after }) => after > 0
      ? { status: 'live', cursor: 3, events: [] }
      : { status: 'live', cursor: 3, events: [valid, missingParticipant, missingParticipant, missingSession] });

    await openLomMonitor(page);
    const select = page.getByLabel('Persoon-ID uit actiereeks');
    await expect(select.locator('option')).toHaveCount(1);
    await expect(select.locator('option:checked')).toHaveText('Persoon-ID mobiele-speler · sessie lom-sessie-rood');
    await expect(page.locator('#simulation-contract-error')).toBeVisible();
    await expect(page.locator('#simulation-contract-error')).toContainText('Contractfout: 2 LOM-events');
    await expect(page.locator('#simulation-contract-error')).toContainText('niet met een andere speler gemengd');
    await expect(page.locator('#simulation-score')).toHaveText('0.770');
    await expect(page.locator('#simulation-action-feed > li')).toHaveCount(1);

    await expect(select).toHaveAttribute('aria-describedby', 'live-person-selection-status');
    expect(await select.evaluate((element) => element.labels?.[0]?.textContent?.trim())).toBe('Persoon-ID uit actiereeks');
    await select.scrollIntoViewIfNeeded();
    await select.focus();
    await expect(select).toBeFocused();
    const mobileBox = await page.locator('#live-person-control').boundingBox();
    expect(mobileBox).not.toBeNull();
    expect(mobileBox.x).toBeGreaterThanOrEqual(0);
    expect(mobileBox.x + mobileBox.width).toBeLessThanOrEqual(390);

    const colors = await page.evaluate(() => {
      const background = (selector) => getComputedStyle(document.querySelector(selector)).backgroundColor;
      return {
        metric: background('.live-metrics article'),
        pipeline: background('.pipeline-step'),
        series: background('.series-status'),
        feedHeader: background('.live-feed-card > header'),
        select: background('#live-person-select'),
        focusShadow: getComputedStyle(document.querySelector('#live-person-select')).boxShadow,
      };
    });
    const brightness = (rgb) => {
      const values = rgb.match(/\d+/g).slice(0, 3).map(Number);
      return (values[0] * 299 + values[1] * 587 + values[2] * 114) / 1000;
    };
    for (const color of [colors.metric, colors.pipeline, colors.series, colors.feedHeader, colors.select]) {
      expect(brightness(color)).toBeLessThan(80);
    }
    expect(colors.focusShadow).not.toBe('none');
  });

  test('herstelt na een Engine-restart met een lagere live-cursor zonder events over te slaan', async ({ page }) => {
    const afterValues = await installEngineStub(page, async ({ call }) => {
      if (call === 1) {
        return {
          status: 'live',
          cursor: 150,
          latest_cursor: 150,
          events: [lomEvent({ id: 150, participantRef: 'voor-herstart', score: 0.25 })],
        };
      }
      if (call === 2) {
        return {
          status: 'live',
          cursor: 1,
          latest_cursor: 1,
          gap_detected: true,
          cursor_gap: { reason: 'cursor_ahead_of_feed', requested_after: 150, resumed_after: 0 },
          events: [lomEvent({ id: 1, participantRef: 'na-herstart', score: 0.91, archetype: 'Nieuwe feed' })],
        };
      }
      return { status: 'live', cursor: 1, latest_cursor: 1, events: [] };
    });

    await openLomMonitor(page);
    await expect.poll(() => afterValues.includes(150), { timeout: 5000 }).toBe(true);
    await expect.poll(() => afterValues.filter((value) => value === 1).length, { timeout: 5000 }).toBeGreaterThan(0);
    const select = page.getByLabel('Persoon-ID uit actiereeks');
    await expect(select.locator('option')).toHaveCount(1);
    await expect(select.locator('option:checked')).toHaveText('Persoon-ID na-herstart · sessie lom-sessie-rood');
    await expect(page.locator('#simulation-score')).toHaveText('0.910');
    await expect(page.locator('#simulation-archetype')).toHaveText('Nieuwe feed');
    await expect(page.locator('#simulation-action-feed')).not.toContainText('actie-150');
  });
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { authUiState } from '../src/js/authUi.js';

test('een afgewezen serversessie wint van een lokale loginmarkering', () => {
  assert.deepEqual(authUiState(false, 'architect'), {
    loggedIn: false,
    activeRole: 'guest',
  });
});

test('een geverifieerde serversessie behoudt de toegekende rol', () => {
  assert.deepEqual(authUiState(true, 'architect'), {
    loggedIn: true,
    activeRole: 'architect',
  });
});

test('statusbalk, rolmenu en authknoppen gebruiken hetzelfde sessieresultaat', () => {
  const layout = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
  assert.match(layout, /state\.authorized = authResult\.authorized === true/);
  assert.match(layout, /updateAuthButtons\(state\.authorized\)/);
  assert.match(layout, /setupRoleMenu\(state\.authorized\)/);
  assert.match(layout, /if \(!state\.authorized\)/);
});

test('governancelinks respecteren de Astro-basisprefix op GitHub Pages', () => {
  const layout = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');

  assert.match(layout, /href={`\$\{base\}\/settings\?block=access_management`}/);
  assert.match(layout, /href={`\$\{base\}\/privacy`}/);
  assert.doesNotMatch(layout, /href="\/(?:settings|privacy)/);
});

test('Google-login bewaart een tabgebonden sessie en stuurt die naar de Engine', () => {
  const loginCard = readFileSync(new URL('../src/components/LoginCard.astro', import.meta.url), 'utf8');
  const api = readFileSync(new URL('../src/js/api.js', import.meta.url), 'utf8');

  assert.match(loginCard, /sessionStorage\.setItem\('leerpret\.browserSession', result\.session_token\)/);
  assert.match(api, /headers\["X-Leerpret-Session"\] = browserSession/);
  assert.match(api, /sessionStorage\.removeItem\(BROWSER_SESSION_KEY\)/);
  assert.match(api, /headers: authHeaders\(\)/);
  assert.match(api, /client\.json\("\/auth\/session"/);
  assert.doesNotMatch(api, /client\.request\("\/auth\/session"/);
});

test('Google-callback bewaart de code bij een loaderfout en wist hem na uitwisseling', () => {
  const loginCard = readFileSync(new URL('../src/components/LoginCard.astro', import.meta.url), 'utf8');
  const api = readFileSync(new URL('../src/js/api.js', import.meta.url), 'utf8');

  assert.match(loginCard, /\['code', 'state', 'scope', 'authuser', 'prompt', 'hd', 'iss'\]/);
  assert.match(loginCard, /result = await apiPost\('\/auth\/google-code'/);
  assert.match(loginCard, /error\.status === 401\) clearGoogleCallbackParameters\(\)/);
  assert.match(loginCard, /\}\s*clearGoogleCallbackParameters\(\);\s*if \(!result\?\.session_token\)/);
  assert.match(loginCard, /if \(loginBtn\) loginBtn\.disabled = false/);
  assert.match(api, /sdkClientPromise = null;\s*throw error;/);
});

test('Google-callback gebruikt exact de aangevraagde redirect en wordt niet herhaald', () => {
  const loginCard = readFileSync(new URL('../src/components/LoginCard.astro', import.meta.url), 'utf8');
  const api = readFileSync(new URL('../src/js/api.js', import.meta.url), 'utf8');

  assert.match(loginCard, /sessionStorage\.setItem\('leerpret\.oauth\.redirectUri', redirectUri\)/);
  assert.match(loginCard, /sessionStorage\.getItem\('leerpret\.oauth\.redirectUri'\)/);
  assert.match(loginCard, /sessionStorage\.removeItem\('leerpret\.oauth\.redirectUri'\)/);
  assert.match(api, /isOneTimeGoogleCode/);
  assert.match(api, /retry401: !isOneTimeGoogleCode/);
});

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

test('Google-login bewaart een tabgebonden sessie en stuurt die naar de Engine', () => {
  const loginCard = readFileSync(new URL('../src/components/LoginCard.astro', import.meta.url), 'utf8');
  const api = readFileSync(new URL('../src/js/api.js', import.meta.url), 'utf8');

  assert.match(loginCard, /sessionStorage\.setItem\('leerpret\.browserSession', result\.session_token\)/);
  assert.match(api, /headers\["X-Leerpret-Session"\] = browserSession/);
  assert.match(api, /sessionStorage\.removeItem\(BROWSER_SESSION_KEY\)/);
  assert.match(api, /headers: authHeaders\(\)/);
});

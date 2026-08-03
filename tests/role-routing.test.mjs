import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/role-routing.js', import.meta.url), 'utf8');

function runRoute({ pathname, search = '', storedRole = 'architect', loggedIn = true }) {
  const values = new Map();
  if (storedRole) {
    values.set('active_role', storedRole);
    values.set('leerpret.poc.role', storedRole);
  }
  if (loggedIn) values.set('api_key', 'test-only-key');
  const redirects = [];
  const location = {
    pathname,
    search,
    replace(target) { redirects.push(target); },
  };
  const window = { location };
  const context = vm.createContext({
    URLSearchParams,
    window,
    localStorage: {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) { values.set(key, String(value)); },
    },
  });

  vm.runInContext(source, context);
  return { redirects, role: values.get('active_role'), router: window.LeerpretRoleRouting };
}

assert.deepEqual(
  runRoute({ pathname: '/data/', search: '?role=learner' }).redirects,
  ['/?role=learner'],
  'A learner on Data returns to learner Home.',
);
assert.deepEqual(
  runRoute({ pathname: '/data/', search: '?role=architect' }).redirects,
  [],
  'An architect may use Data.',
);
assert.deepEqual(
  runRoute({ pathname: '/engine', search: '?role=architect' }).redirects,
  ['/?role=architect'],
  'An architect on Engine returns to architect Home.',
);
for (const role of ['architect', 'technologist']) {
  assert.deepEqual(
    runRoute({ pathname: '/snn-innovation-test', search: `?role=${role}`, storedRole: role }).redirects,
    [],
    `${role} may open the SNN innovation test environment.`,
  );
}
assert.deepEqual(
  runRoute({ pathname: '/snn-innovation-test', search: '?role=learner', storedRole: 'learner' }).redirects,
  ['/?role=learner'],
  'A learner cannot open the SNN innovation test monitor.',
);
for (const role of ['architect', 'technologist', 'user', 'learner', 'guest']) {
  assert.deepEqual(
    runRoute({ pathname: '/analytics', search: `?role=${role}`, storedRole: role, loggedIn: role !== 'guest' }).redirects,
    [`/?role=${role}`],
    `${role} is returned to Home because Analytics is a Data block, not a route.`,
  );
  assert.deepEqual(
    runRoute({ pathname: '/data-structure', search: `?role=${role}`, storedRole: role, loggedIn: role !== 'guest' }).redirects,
    [`/?role=${role}`],
    `${role} is returned to Home because Data Structure is a Data block, not a route.`,
  );
}
assert.deepEqual(
  runRoute({ pathname: '/editor', search: '?role=architect' }).redirects,
  [],
  'An architect may use the standalone Editor.',
);
assert.deepEqual(
  runRoute({ pathname: '/editor', search: '?role=technologist' }).redirects,
  [],
  'A technologist may use the standalone Editor.',
);
assert.deepEqual(
  runRoute({ pathname: '/editor', search: '?role=learner' }).redirects,
  ['/?role=learner'],
  'A learner on Editor returns to learner Home.',
);
for (const role of ['architect', 'technologist', 'user', 'learner', 'guest']) {
  assert.deepEqual(
    runRoute({ pathname: '/preview', search: `?role=${role}`, storedRole: role, loggedIn: role !== 'guest' }).redirects,
    [],
    `${role} may open the status-filtered Preview page.`,
  );
}
assert.deepEqual(
  runRoute({ pathname: '/bestaat-niet', search: '?role=technologist' }).redirects,
  ['/?role=technologist'],
  'An unknown route returns to Home for the requested role.',
);
assert.deepEqual(
  runRoute({ pathname: '/service', search: '?role=user' }).redirects,
  [],
  'The attraction role may use Service.',
);
assert.equal(
  runRoute({ pathname: '/data', search: '?role=architect', loggedIn: false }).role,
  'guest',
  'A logged-out visitor is always normalized to the public guest role.',
);
assert.deepEqual(
  runRoute({ pathname: '/data', search: '?role=learner', loggedIn: false }).redirects,
  ['/?role=guest'],
  'A guest cannot obtain learner or Data access through the URL.',
);

const roleSwitch = runRoute({ pathname: '/engine', search: '?role=technologist' });
assert.equal(roleSwitch.router.routeForRole('/engine', 'architect'), '/?role=architect');
assert.equal(roleSwitch.router.routeForRole('/engine', 'technologist'), '/engine?role=technologist');

console.log('Role routing tests passed.');

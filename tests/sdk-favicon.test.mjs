import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');

test('Dashboard gebruikt uitsluitend de centrale SDK-favicon', () => {
  assert.match(layoutSource, /\/sdk\/brand\/favicon\.svg/);
  assert.match(layoutSource, /window\.LEERPRET_CONFIG\?\.apiBase/);
  assert.equal(existsSync(new URL('../public/favicon.svg', import.meta.url)), false);
});

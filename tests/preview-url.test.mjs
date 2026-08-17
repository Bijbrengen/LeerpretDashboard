import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { previewUrlForTwin } from '../src/js/previewUrl.js';

const localConfig = {
  phileUrl: 'http://127.0.0.1:47115/',
  learngameOmUrl: 'http://127.0.0.1:47113/',
};

test('Phile gebruikt zijn geconfigureerde zelfstandige preview', () => {
  const url = previewUrlForTwin({ id: 'leerbox-phile' }, {
    config: localConfig,
    apiRoot: 'http://127.0.0.1:47111',
    apiBase: 'http://127.0.0.1:47111/api',
    role: 'technologist',
  });

  assert.equal(url.origin, 'http://127.0.0.1:47115');
  assert.equal(url.searchParams.get('api'), 'http://127.0.0.1:47111/api');
  assert.equal(url.searchParams.get('role'), 'technologist');
});

test('een gegenereerde preview wint van een zelfstandige product-URL', () => {
  const url = previewUrlForTwin({ id: 'leerbox-phile' }, {
    generatedPreview: { preview_url: '/api/previews/phile/' },
    config: localConfig,
    apiRoot: 'http://127.0.0.1:47111',
    apiBase: 'http://127.0.0.1:47111/api',
    role: 'architect',
  });

  assert.equal(url.toString(), 'http://127.0.0.1:47111/api/previews/phile/?role=architect');
});

test('een gewone leerbox behoudt de Engine-preview', () => {
  const url = previewUrlForTwin({ id: 'leerbox-logica-schakelbox' }, {
    config: localConfig,
    apiRoot: 'http://127.0.0.1:47111',
    apiBase: 'http://127.0.0.1:47111/api',
    role: 'technologist',
  });

  assert.equal(url.toString(), 'http://127.0.0.1:47111/tools/leerbox/logica-schakelbox/?role=technologist');
});

test('artikel-PDF loopt via de sessiebewuste API-client en een lokale blob-URL', () => {
  const article = readFileSync(new URL('../src/pages/article.astro', import.meta.url), 'utf8');
  const api = readFileSync(new URL('../src/js/api.js', import.meta.url), 'utf8');

  assert.match(api, /export async function apiBlob/);
  assert.match(article, /await apiBlob\(articlePdfPath\('view', articleId\)\)/);
  assert.match(article, /URL\.createObjectURL\(pdf\)/);
  assert.doesNotMatch(article, /<iframe src="\$\{articlePdfUrl\('view'\)\}"/);
});

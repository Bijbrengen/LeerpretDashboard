import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/runtime-config.js', import.meta.url), 'utf8');
assert(!source.includes('trycloudflare.com'), 'Een tijdelijke tunnel mag niet worden gepubliceerd.');

function configFor(hostname) {
  const context = vm.createContext({ window: { location: { hostname } } });
  vm.runInContext(source, context);
  return context.window.LEERPRET_CONFIG;
}

assert.equal(configFor('127.0.0.1').apiBase, 'http://127.0.0.1:47111/api');
assert.equal(configFor('bijbrengen.github.io').apiBase, 'https://api.leerpretpark.nl/api');

const apiSource = fs.readFileSync(new URL('../src/js/api.js', import.meta.url), 'utf8');
assert(apiSource.includes('.trycloudflare.com'), 'De client moet oude opgeslagen tunneladressen opruimen.');

console.log('Runtime configuration tests passed.');

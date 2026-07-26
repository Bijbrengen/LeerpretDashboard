import assert from 'node:assert/strict';
import { parseSourceSymbols, symbolPathAtLine } from '../src/js/sourceSymbols.js';

const python = `CONFIG = {"enabled": True}

class LeerpretEngine:
    threshold = 0.6

    def calculate_alpha(self, value):
        result = value * 2
        return result

def helper():
    return True
`;

const pythonSymbols = parseSourceSymbols(python, 'python');
assert.deepEqual(pythonSymbols.map((symbol) => symbol.label), ['CONFIG', 'class LeerpretEngine', 'def helper']);
assert.deepEqual(pythonSymbols[1].children.map((symbol) => symbol.label), ['threshold', 'def calculate_alpha']);
assert.deepEqual(symbolPathAtLine(pythonSymbols, 7).map((symbol) => symbol.label), ['class LeerpretEngine', 'def calculate_alpha']);

const javascript = `const settings = {
  mode: 'safe'
};
class Engine {
  calculate(value) {
    return value;
  }
}`;
const jsSymbols = parseSourceSymbols(javascript, 'javascript');
assert.deepEqual(jsSymbols.map((symbol) => symbol.label), ['settings', 'class Engine']);
assert.equal(jsSymbols[0].children[0].label, 'mode');
assert.equal(jsSymbols[1].children[0].label, 'calculate()');

const jsonSymbols = parseSourceSymbols(`{
  "leerbox": {
    "id": "phile",
    "markers": {
      "T": "tijd"
    }
  }
}`, 'json');
assert.equal(jsonSymbols[0].label, 'leerbox');
assert.deepEqual(jsonSymbols[0].children.map((symbol) => symbol.label), ['id', 'markers']);
assert.equal(jsonSymbols[0].children[1].children[0].label, 'T');

console.log('Source symbol parser tests passed.');

const CONTROL_WORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'with']);

export function parseSourceSymbols(content, language = 'python') {
  const lines = String(content || '').split(/\r?\n/);
  const normalized = String(language || '').toLowerCase();
  if (normalized === 'json') return parseJson(lines);
  if (['javascript', 'typescript', 'js', 'ts'].includes(normalized)) return parseJavaScript(lines);
  return parsePython(lines);
}

export function symbolPathAtLine(symbols, lineNumber) {
  const path = [];
  let level = Array.isArray(symbols) ? symbols : [];
  while (level.length) {
    const match = level.find((symbol) => lineNumber >= symbol.line && lineNumber <= symbol.endLine);
    if (!match) break;
    path.push(match);
    level = match.children || [];
  }
  return path;
}

function parsePython(lines) {
  const roots = [];
  const stack = [];
  lines.forEach((line, index) => {
    const indent = indentation(line);
    const classMatch = line.match(/^\s*class\s+([A-Za-z_]\w*)/);
    const functionMatch = line.match(/^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/);
    const variableMatch = line.match(/^\s*([A-Za-z_]\w*)\s*(?::[^=]+)?=\s*(?!=)/);
    if (!classMatch && !functionMatch && !variableMatch) return;
    closeStack(stack, indent, index);
    const parent = stack.at(-1)?.symbol || null;
    let candidate = null;
    if (classMatch) candidate = createSymbol('class', classMatch[1], index + 1, indent, `class ${classMatch[1]}`);
    else if (functionMatch) candidate = createSymbol('function', functionMatch[1], index + 1, indent, `def ${functionMatch[1]}`);
    else if (variableMatch && (!parent || parent.kind === 'class')) candidate = createSymbol('object', variableMatch[1], index + 1, indent, variableMatch[1]);
    if (!candidate) return;
    appendSymbol(roots, parent, candidate);
    if (candidate.kind !== 'object') stack.push({ indent, symbol: candidate });
  });
  closeStack(stack, -1, lines.length, true);
  setFallbackEndLines(roots, lines.length);
  return roots;
}

function parseJavaScript(lines) {
  const roots = [];
  const stack = [];
  lines.forEach((line, index) => {
    const indent = indentation(line);
    const classMatch = line.match(/^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/);
    const functionMatch = line.match(/^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    const methodMatch = line.match(/^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
    const variableMatch = line.match(/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/);
    const propertyMatch = line.match(/^\s*([A-Za-z_$][\w$]*|["'][^"']+["'])\s*:\s*/);
    if (!classMatch && !functionMatch && !methodMatch && !variableMatch && !propertyMatch) return;
    closeStack(stack, indent, index);
    const parent = stack.at(-1)?.symbol || null;
    let candidate = null;
    if (classMatch) candidate = createSymbol('class', classMatch[1], index + 1, indent, `class ${classMatch[1]}`);
    else if (functionMatch) candidate = createSymbol('function', functionMatch[1], index + 1, indent, `function ${functionMatch[1]}`);
    else if (methodMatch && !CONTROL_WORDS.has(methodMatch[1])) candidate = createSymbol('function', methodMatch[1], index + 1, indent, `${methodMatch[1]}()`);
    else if (variableMatch && (!parent || parent.kind === 'class')) candidate = createSymbol('object', variableMatch[1], index + 1, indent, variableMatch[1]);
    else if (propertyMatch && parent?.kind === 'object') {
      const name = propertyMatch[1].replace(/^['"]|['"]$/g, '');
      candidate = createSymbol('object', name, index + 1, indent, name);
    }
    if (!candidate) return;
    appendSymbol(roots, parent, candidate);
    const opensScope = candidate.kind !== 'object' || /(?:\{|:|\[)\s*$/.test(line);
    if (opensScope) stack.push({ indent, symbol: candidate });
  });
  closeStack(stack, -1, lines.length, true);
  setFallbackEndLines(roots, lines.length);
  return roots;
}

function parseJson(lines) {
  const roots = [];
  const stack = [];
  lines.forEach((line, index) => {
    const match = line.match(/^\s*"([^"]+)"\s*:\s*/);
    if (!match) return;
    const indent = indentation(line);
    closeStack(stack, indent, index);
    const parent = stack.at(-1)?.symbol || null;
    const symbol = createSymbol('object', match[1], index + 1, indent, match[1]);
    appendSymbol(roots, parent, symbol);
    if (/(?:\{|\[)\s*,?\s*$/.test(line)) stack.push({ indent, symbol });
  });
  closeStack(stack, -1, lines.length, true);
  setFallbackEndLines(roots, lines.length);
  return roots;
}

function createSymbol(kind, name, line, indent, label) {
  return { id: `${kind}:${line}:${name}`, kind, name, label, line, endLine: line, indent, children: [] };
}

function appendSymbol(roots, parent, symbol) {
  (parent ? parent.children : roots).push(symbol);
}

function closeStack(stack, indent, endIndex, closeAll = false) {
  while (stack.length && (closeAll || indent <= stack.at(-1).indent)) {
    const entry = stack.pop();
    entry.symbol.endLine = Math.max(entry.symbol.line, endIndex);
  }
}

function setFallbackEndLines(symbols, fileEnd) {
  symbols.forEach((symbol, index) => {
    const next = symbols[index + 1];
    if (symbol.endLine <= symbol.line) symbol.endLine = next ? next.line - 1 : fileEnd;
    setFallbackEndLines(symbol.children, symbol.endLine);
  });
}

function indentation(line) {
  const whitespace = String(line).match(/^\s*/)?.[0] || '';
  return whitespace.replaceAll('\t', '    ').length;
}

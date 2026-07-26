import { apiGet, apiPost, apiPut, initSettings } from './api.js';
import { parseSourceSymbols, symbolPathAtLine } from './sourceSymbols.js';

export async function initializeSourceBrowsers() {
  const roots = Array.from(document.querySelectorAll('[data-source-browser]'));
  await Promise.all(roots.map(initializeSourceBrowser));
}

async function initializeSourceBrowser(root) {
  if (root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';
  const tree = root.querySelector('[data-source-tree]');
  if (!tree) return;

  const query = new URLSearchParams(window.location.search);
  const role = query.get('role') || localStorage.getItem('active_role') || localStorage.getItem('leerpret.poc.role') || 'guest';
  if (role !== 'technologist') {
    tree.textContent = 'De codebrowser is beschikbaar voor de Leerprettechnoloog.';
    return;
  }

  initSettings();
  root._sourceRole = role;
  root._sourceFiles = [];
  root._sourceFilter = root.dataset.sourceReviewEnabled === 'true' ? 'todo' : 'all';
  bindReviewControls(root);
  bindSourceTestControls(root);
  bindSymbolNavigation(root);
  bindExternalSourceOpen(root);
  await refreshSourceCatalog(root);
}

function bindExternalSourceOpen(root) {
  root.addEventListener('leerpret-open-source', async (event) => {
    const detail = event.detail || {};
    const path = String(detail.path || '');
    if (!path) return;
    if (root._sourceFilter !== 'all') {
      root._sourceFilter = 'all';
      root.querySelectorAll('[data-source-filter]').forEach((item) => {
        const active = item.dataset.sourceFilter === 'all';
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      renderSourceExplorer(root);
    }
    await loadSourceFile(root, path);
    if (detail.symbol) {
      const symbol = findSymbolByLabel(root._activeSymbols || [], String(detail.symbol));
      if (symbol) {
        jumpToSymbol(root, symbol);
        return;
      }
    }
    if (detail.search) jumpToSearch(root, String(detail.search));
  });
}

function findSymbolByLabel(symbols, label) {
  for (const symbol of symbols || []) {
    if (String(symbol.label || '').includes(label)) return symbol;
    const nested = findSymbolByLabel(symbol.children || [], label);
    if (nested) return nested;
  }
  return null;
}

function jumpToSearch(root, search) {
  const lineList = root.querySelector('[data-source-lines]');
  if (!lineList) return;
  const needle = search.toLowerCase();
  const lines = Array.from(lineList.children || []);
  const index = lines.findIndex((line) => String(line.textContent || '').toLowerCase().includes(needle));
  if (index < 0) return;
  const line = lines[index];
  lineList.querySelectorAll('.source-line-target').forEach((item) => item.classList.remove('source-line-target'));
  line.classList.add('source-line-target');
  line.scrollIntoView({ behavior: 'smooth', block: 'center' });
  line.focus({ preventScroll: true });
  root._activeLine = index + 1;
  root._breadcrumbKey = '';
  renderBreadcrumbs(root, index + 1);
  updateActiveOutlineSymbol(root, index + 1);
}

function bindReviewControls(root) {
  root.querySelectorAll('[data-source-filter]').forEach((button) => {
    button.addEventListener('click', async () => {
      root._sourceFilter = button.dataset.sourceFilter || 'todo';
      root.querySelectorAll('[data-source-filter]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      await refreshSourceCatalog(root);
    });
  });

  root.querySelector('[data-source-approve]')?.addEventListener('click', () => toggleSourceApproval(root));
}

function bindSourceTestControls(root) {
  root.querySelector('[data-source-test]')?.addEventListener('click', () => runSourceTest(root));
}

async function refreshSourceCatalog(root, preferredPath = '') {
  const tree = root.querySelector('[data-source-tree]');
  if (!tree) return;
  tree.textContent = 'Bestanden en reviewstatus laden…';
  const scope = root.dataset.sourceScope || 'engine';
  try {
    const response = await apiGet(`/developer/source-files?scope=${encodeURIComponent(scope)}`);
    root._sourceFiles = Array.isArray(response.files) ? response.files : [];
    const visibleFiles = renderSourceExplorer(root);
    const selected = visibleFiles.find((file) => file.path === preferredPath) || visibleFiles[0];
    if (selected) {
      await loadSourceFile(root, selected.path);
    } else {
      clearSourceEditor(root, root._sourceFiles.length ? 'Alle codebestanden zijn goedgekeurd.' : 'Geen bestanden voor dit onderdeel gevonden.');
    }
  } catch (error) {
    tree.textContent = `Codebestanden konden niet worden geladen: ${error.message || error}`;
  }
}

function renderSourceExplorer(root) {
  const tree = root.querySelector('[data-source-tree]');
  if (!tree) return [];
  tree.replaceChildren();

  const allFiles = Array.isArray(root._sourceFiles) ? root._sourceFiles : [];
  const visibleFiles = root._sourceFilter === 'todo'
    ? allFiles.filter((file) => !file.review?.checked)
    : allFiles;
  updateReviewSummary(root, allFiles);

  const rootNode = { folders: new Map(), files: [] };
  visibleFiles.forEach((file) => {
    const parts = String(file.folder || 'backend').split('/').filter(Boolean);
    let node = rootNode;
    parts.forEach((part) => {
      if (!node.folders.has(part)) node.folders.set(part, { folders: new Map(), files: [] });
      node = node.folders.get(part);
    });
    node.files.push(file);
  });

  renderFolders(tree, rootNode, root, 0);
  if (!visibleFiles.length) tree.textContent = allFiles.length ? 'Alles is veilig/gekeurd.' : 'Geen bestanden voor dit onderdeel gevonden.';
  return visibleFiles;
}

function updateReviewSummary(root, files) {
  const summary = root.querySelector('[data-source-review-summary]');
  if (!summary) return;
  const approved = files.filter((file) => file.review?.checked).length;
  summary.textContent = `${files.length - approved} te doen · ${approved} gekeurd · ${files.length} totaal`;
}

function renderFolders(container, node, browserRoot, depth) {
  Array.from(node.folders.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([folder, child]) => {
    const details = document.createElement('details');
    details.className = 'source-folder';
    details.open = depth < 3;
    const summary = document.createElement('summary');
    summary.textContent = folder;
    summary.style.setProperty('--source-depth', String(depth));
    details.appendChild(summary);

    child.files.sort((a, b) => a.name.localeCompare(b.name)).forEach((file) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'source-file-button';
      button.dataset.sourcePath = file.path;
      button.title = file.path;
      button.style.setProperty('--source-depth', String(depth + 1));
      if (browserRoot.dataset.sourceReviewEnabled === 'true') button.append(createReviewIcon(file.review));
      const icon = document.createElement('span');
      icon.className = 'source-python-icon';
      icon.textContent = 'PY';
      const name = document.createElement('span');
      name.textContent = file.name;
      button.append(icon, name);
      button.addEventListener('click', () => loadSourceFile(browserRoot, file.path, button));
      details.appendChild(button);
    });
    renderFolders(details, child, browserRoot, depth + 1);
    container.appendChild(details);
  });
}

function createReviewIcon(review) {
  const icon = document.createElement('span');
  const approved = Boolean(review?.checked);
  icon.className = `source-review-icon ${approved ? 'is-approved' : 'is-pending'}`;
  icon.textContent = approved ? '✓' : '!';
  icon.title = approved ? 'Gecheckt' : (review?.changed_since_approval ? 'Gewijzigd sinds de check' : 'Nog niet gecheckt');
  return icon;
}

async function loadSourceFile(root, path, selectedButton = null) {
  const lineList = root.querySelector('[data-source-lines]');
  const tab = root.querySelector('[data-source-tab]');
  const activePath = root.querySelector('[data-source-path]');
  const meta = root.querySelector('[data-source-meta]');
  if (!lineList || !tab || !activePath || !meta) return;

  root.querySelectorAll('.source-file-button').forEach((button) => {
    button.classList.toggle('active', button === selectedButton || button.dataset.sourcePath === path);
  });
  lineList.replaceChildren(createSourceLine('Bestand laden…'));

  try {
    const scope = root.dataset.sourceScope || 'engine';
    const file = await apiGet(`/developer/source-file?scope=${encodeURIComponent(scope)}&path=${encodeURIComponent(path)}`);
    tab.textContent = file.name;
    activePath.textContent = file.path;
    meta.textContent = `${file.language || 'code'} · ${file.line_count || 0} regels · SHA-256 gecontroleerd`;
    root._activeSourcePath = file.path;
    const testButton = root.querySelector('[data-source-test]');
    if (testButton) {
      testButton.hidden = false;
      testButton.textContent = 'Unittest';
      testButton.title = `Voer unittests uit voor ${file.path}`;
    }
    const testResult = root.querySelector('[data-source-test-result]');
    if (testResult) {
      testResult.hidden = true;
      testResult.replaceChildren();
    }
    updateLocalReview(root, file.path, file.review);
    updateApprovalControl(root, file.review, file.path);
    updateTreeButton(root, file.path, file.review);
    const fragment = document.createDocumentFragment();
    const content = String(file.content || '');
    content.split(/\r?\n/).forEach((line) => fragment.appendChild(createSourceLine(line)));
    lineList.replaceChildren(fragment);
    root._activeSymbols = parseSourceSymbols(content, file.language || 'python');
    root._activeLine = 1;
    root._breadcrumbKey = '';
    renderOutline(root);
    renderBreadcrumbs(root, 1);
  } catch (error) {
    lineList.replaceChildren(createSourceLine(`Bestand kon niet worden geladen: ${error.message || error}`));
  }
}

async function runSourceTest(root) {
  const path = root._activeSourcePath;
  const button = root.querySelector('[data-source-test]');
  const result = root.querySelector('[data-source-test-result]');
  if (!path || !button || !result) return;

  button.disabled = true;
  button.textContent = 'Testen...';
  result.hidden = false;
  result.textContent = `Unittests voor ${path} worden uitgevoerd...`;
  try {
    const scope = root.dataset.sourceScope || 'engine';
    const payload = await apiPost(
      `/developer/source-test?scope=${encodeURIComponent(scope)}&path=${encodeURIComponent(path)}&role=${encodeURIComponent(root._sourceRole || 'technologist')}`,
      {},
    );
    renderSourceTestResult(result, payload);
  } catch (error) {
    result.replaceChildren();
    const header = document.createElement('div');
    header.className = 'source-test-result-header';
    const title = document.createElement('strong');
    title.textContent = `Unittest kon niet worden uitgevoerd voor ${path}`;
    const badge = document.createElement('span');
    badge.className = 'source-test-badge failed';
    badge.textContent = 'fout';
    header.append(title, badge);
    const message = document.createElement('pre');
    message.textContent = String(error.message || error);
    result.append(header, message);
  } finally {
    button.disabled = false;
    button.textContent = 'Unittest';
  }
}

function renderSourceTestResult(container, payload) {
  const input = payload?.input || {};
  const output = payload?.output || {};
  container.replaceChildren();

  const header = document.createElement('div');
  header.className = 'source-test-result-header';
  const title = document.createElement('strong');
  title.textContent = `${output.tests_run || 0} unittest(s) · ${output.duration_ms || 0} ms`;
  const badge = document.createElement('span');
  badge.className = `source-test-badge ${output.status || 'failed'}`;
  badge.textContent = output.status === 'passed' ? 'geslaagd' : (output.status || 'mislukt');
  header.append(title, badge);

  const io = document.createElement('div');
  io.className = 'source-test-io';
  io.append(
    createTestIoPanel('Input', {
      scope: input.scope,
      path: input.path,
      language: input.language,
      tests: input.tests || [],
      classes: input.classes || [],
    }),
    createTestIoPanel('Output', {
      status: output.status,
      successful: output.successful,
      exit_code: output.exit_code,
      tests_run: output.tests_run,
      failures: output.failures,
      errors: output.errors,
      skipped: output.skipped,
      duration_ms: output.duration_ms,
      classes_found: output.classes_found,
      classes_checked: output.classes_checked,
      class_coverage_percent: output.class_coverage_percent,
    }),
  );

  const streams = document.createElement('div');
  streams.className = 'source-test-streams';
  streams.append(createTestStream('stdout', output.stdout), createTestStream('stderr / unittestverslag', output.stderr));
  container.append(header, io, streams);
}

function createTestIoPanel(titleText, value) {
  const panel = document.createElement('article');
  const title = document.createElement('h4');
  title.textContent = titleText;
  const content = document.createElement('pre');
  content.textContent = JSON.stringify(value, null, 2);
  panel.append(title, content);
  return panel;
}

function createTestStream(titleText, value) {
  const details = document.createElement('details');
  details.open = titleText.startsWith('stderr');
  const summary = document.createElement('summary');
  summary.textContent = titleText;
  const content = document.createElement('pre');
  content.textContent = String(value || '(geen uitvoer)');
  details.append(summary, content);
  return details;
}

async function toggleSourceApproval(root) {
  const button = root.querySelector('[data-source-approve]');
  const path = root._activeSourcePath;
  if (!button || !path) return;
  const current = root._sourceFiles.find((file) => file.path === path)?.review;
  const checked = !current?.checked;
  button.disabled = true;
  try {
    const scope = root.dataset.sourceScope || 'engine';
    const review = await apiPut(
      `/developer/source-review?scope=${encodeURIComponent(scope)}&path=${encodeURIComponent(path)}&role=${encodeURIComponent(root._sourceRole || 'technologist')}`,
      { checked },
    );
    updateLocalReview(root, path, review);
    if (root._sourceFilter === 'todo' && review.checked) {
      await refreshSourceCatalog(root);
    } else {
      renderSourceExplorer(root);
      const activeButton = Array.from(root.querySelectorAll('.source-file-button')).find((item) => item.dataset.sourcePath === path);
      activeButton?.classList.add('active');
      updateApprovalControl(root, review, path);
      updateTreeButton(root, path, review);
    }
  } catch (error) {
    button.textContent = `Opslaan mislukt: ${error.message || error}`;
  } finally {
    button.disabled = false;
  }
}

function updateLocalReview(root, path, review) {
  const file = root._sourceFiles.find((item) => item.path === path);
  if (file) file.review = review;
  updateReviewSummary(root, root._sourceFiles);
}

function updateTreeButton(root, path, review) {
  const button = Array.from(root.querySelectorAll('.source-file-button')).find((item) => item.dataset.sourcePath === path);
  if (!button) return;
  button.querySelector('.source-review-icon')?.replaceWith(createReviewIcon(review));
}

function updateApprovalControl(root, review, path) {
  const button = root.querySelector('[data-source-approve]');
  if (!button) return;
  button.hidden = !path;
  button.dataset.sourcePath = path || '';
  button.classList.toggle('is-approved', Boolean(review?.checked));
  button.textContent = review?.checked ? '✓ Gecheckt' : 'Gecheckt';
  button.title = review?.changed_since_approval ? 'De code is gewijzigd; een nieuwe controle is nodig.' : '';
}

function clearSourceEditor(root, message) {
  root._activeSourcePath = '';
  const testButton = root.querySelector('[data-source-test]');
  if (testButton) testButton.hidden = true;
  const testResult = root.querySelector('[data-source-test-result]');
  if (testResult) {
    testResult.hidden = true;
    testResult.replaceChildren();
  }
  root.querySelector('[data-source-tab]').textContent = 'Geen bestand geselecteerd';
  root.querySelector('[data-source-path]').textContent = 'Geen bestand geselecteerd';
  root.querySelector('[data-source-meta]').textContent = 'Python · alleen-lezen';
  root.querySelector('[data-source-lines]').replaceChildren(createSourceLine(message));
  root._activeSymbols = [];
  root.querySelector('[data-source-outline-tree]').innerHTML = '<p class="source-outline-empty">Open een bestand om de symbolen te bekijken.</p>';
  root.querySelector('[data-source-breadcrumbs]').innerHTML = '<span>Geen bestand geselecteerd</span>';
  updateApprovalControl(root, null, '');
}

function bindSymbolNavigation(root) {
  const scroll = root.querySelector('.source-editor-scroll');
  scroll?.addEventListener('scroll', () => {
    if (root._symbolScrollFrame) return;
    root._symbolScrollFrame = requestAnimationFrame(() => {
      root._symbolScrollFrame = null;
      const lines = root.querySelector('[data-source-lines]');
      if (!lines?.children.length) return;
      const viewportTop = scroll.getBoundingClientRect().top + 4;
      let low = 0;
      let high = lines.children.length - 1;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (lines.children[middle].getBoundingClientRect().bottom < viewportTop) low = middle + 1;
        else high = middle;
      }
      const line = low + 1;
      root._activeLine = line;
      renderBreadcrumbs(root, line);
      updateActiveOutlineSymbol(root, line);
    });
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest?.('.source-breadcrumb-item')) closeBreadcrumbMenus(root);
  });
}

function renderOutline(root) {
  const tree = root.querySelector('[data-source-outline-tree]');
  if (!tree) return;
  tree.replaceChildren();
  const symbols = root._activeSymbols || [];
  if (!symbols.length) {
    tree.innerHTML = '<p class="source-outline-empty">Geen klassen, functies of definities gevonden.</p>';
    return;
  }
  appendOutlineSymbols(tree, symbols, root, 0);
}

function appendOutlineSymbols(container, symbols, root, depth) {
  symbols.forEach((symbol) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'source-symbol-button';
    button.dataset.symbolId = symbol.id;
    button.style.setProperty('--symbol-depth', String(depth));
    button.title = `${symbol.label} · regel ${symbol.line}`;
    button.append(symbolIcon(symbol.kind));
    const label = document.createElement('span');
    label.textContent = symbol.label;
    button.append(label);
    button.addEventListener('click', () => jumpToSymbol(root, symbol));
    container.appendChild(button);
    appendOutlineSymbols(container, symbol.children || [], root, depth + 1);
  });
}

function jumpToSymbol(root, symbol) {
  const lineList = root.querySelector('[data-source-lines]');
  const line = lineList?.children?.[symbol.line - 1];
  if (!line) return;
  lineList.querySelectorAll('.source-line-target').forEach((item) => item.classList.remove('source-line-target'));
  line.classList.add('source-line-target');
  line.scrollIntoView({ behavior: 'smooth', block: 'center' });
  line.focus({ preventScroll: true });
  root._activeLine = symbol.line;
  root._breadcrumbKey = '';
  renderBreadcrumbs(root, symbol.line);
  updateActiveOutlineSymbol(root, symbol.line);
}

function updateActiveOutlineSymbol(root, line) {
  const path = symbolPathAtLine(root._activeSymbols || [], line);
  const activeId = path.at(-1)?.id || '';
  root.querySelectorAll('.source-symbol-button').forEach((button) => button.classList.toggle('active', button.dataset.symbolId === activeId));
}

function renderBreadcrumbs(root, line) {
  const navigation = root.querySelector('[data-source-breadcrumbs]');
  const activePath = root._activeSourcePath;
  if (!navigation || !activePath) return;
  const symbolPath = symbolPathAtLine(root._activeSymbols || [], line);
  const key = `${activePath}:${symbolPath.map((symbol) => symbol.id).join('/')}`;
  if (root._breadcrumbKey === key) return;
  root._breadcrumbKey = key;
  navigation.replaceChildren();

  const parts = activePath.split('/').filter(Boolean);
  const files = visibleSourceFiles(root);
  parts.forEach((part, index) => {
    const isFile = index === parts.length - 1;
    let options;
    if (isFile) {
      const folder = parts.slice(0, -1).join('/');
      options = files.filter((file) => file.folder === folder).map((file) => ({ label: file.name, action: () => loadSourceFile(root, file.path) }));
    } else {
      const prefix = parts.slice(0, index).join('/');
      const choices = new Map();
      files.forEach((file) => {
        const fileParts = file.path.split('/');
        if (fileParts.slice(0, index).join('/') !== prefix || !fileParts[index]) return;
        if (!choices.has(fileParts[index])) choices.set(fileParts[index], file);
      });
      options = Array.from(choices.entries()).map(([label, file]) => ({ label, action: () => loadSourceFile(root, file.path) }));
    }
    navigation.appendChild(createBreadcrumbItem(root, part, options, isFile ? 'object' : null));
  });

  symbolPath.forEach((symbol, index) => {
    const siblings = index === 0 ? root._activeSymbols : symbolPath[index - 1].children;
    const options = siblings.map((item) => ({ label: item.label, kind: item.kind, action: () => jumpToSymbol(root, item) }));
    navigation.appendChild(createBreadcrumbItem(root, symbol.label, options, symbol.kind));
  });
}

function createBreadcrumbItem(root, label, options, kind) {
  const item = document.createElement('span');
  item.className = 'source-breadcrumb-item';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'source-breadcrumb-button';
  button.setAttribute('aria-haspopup', 'menu');
  button.setAttribute('aria-expanded', 'false');
  button.textContent = `${label} ▾`;
  const menu = document.createElement('span');
  menu.className = 'source-breadcrumb-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  (options || []).forEach((option) => {
    const optionButton = document.createElement('button');
    optionButton.type = 'button';
    optionButton.className = 'source-breadcrumb-option';
    optionButton.setAttribute('role', 'menuitem');
    if (option.kind || kind) optionButton.append(symbolIcon(option.kind || kind));
    const text = document.createElement('span');
    text.textContent = option.label;
    optionButton.append(text);
    optionButton.addEventListener('click', (event) => {
      event.stopPropagation();
      closeBreadcrumbMenus(root);
      option.action();
    });
    menu.appendChild(optionButton);
  });
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const opening = menu.hidden;
    closeBreadcrumbMenus(root);
    if (!opening) return;
    const rect = button.getBoundingClientRect();
    menu.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`;
    menu.style.top = `${rect.bottom + 2}px`;
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
  });
  item.append(button, menu);
  return item;
}

function closeBreadcrumbMenus(root) {
  root.querySelectorAll('.source-breadcrumb-menu').forEach((menu) => { menu.hidden = true; });
  root.querySelectorAll('.source-breadcrumb-button').forEach((button) => button.setAttribute('aria-expanded', 'false'));
}

function visibleSourceFiles(root) {
  const files = Array.isArray(root._sourceFiles) ? root._sourceFiles : [];
  return root._sourceFilter === 'todo' ? files.filter((file) => !file.review?.checked) : files;
}

function symbolIcon(kind) {
  const icon = document.createElement('span');
  icon.className = `source-symbol-icon ${kind || 'object'}`;
  const paths = {
    class: '<path d="M4 7h16v12H4z"/><path d="M8 7V4h8v3M8 11h8M8 15h5"/>',
    function: '<path d="M5 19c3 0 4-2 4-5V7c0-2 1-3 3-3h2"/><path d="M6 10h7M15 13l4 4M19 13l-4 4"/>',
    object: '<circle cx="8" cy="15" r="3"/><path d="m10 13 8-8 2 2-2 2 1 1-2 2-1-1-4 4"/>',
  };
  icon.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[kind] || paths.object}</svg>`;
  return icon;
}

function createSourceLine(text) {
  const item = document.createElement('li');
  item.tabIndex = -1;
  const code = document.createElement('code');
  code.textContent = text || ' ';
  item.appendChild(code);
  return item;
}

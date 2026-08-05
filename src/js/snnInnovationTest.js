import { apiGet } from './api.js';

const simulation = {
  games: [],
  selectedGameId: '',
  selectedMode: 'lom-live',
  live: {
    lom: { cursor: 0, events: [] },
    phile: { cursor: 0, events: [] },
  },
  timer: 0,
  stopped: false,
};

const liveSources = Object.freeze([
  {
    id: 'lom', tabId: 'lom-live', title: 'LOM Live', surface: 'LOM',
    endpoint: '/innovation-tests/lom/live', configKey: 'learngameOmUrl', fallbackUrl: 'http://127.0.0.1:47113/',
  },
  {
    id: 'phile', tabId: 'phile-live', title: 'Phile Live', surface: 'Phile',
    endpoint: '/innovation-tests/phile/live', configKey: 'phileUrl', fallbackUrl: 'http://127.0.0.1:47115/',
  },
]);

const liveSource = (id) => liveSources.find((source) => source.id === id) || liveSources[0];
const selectedLiveSource = () => liveSource(simulation.selectedMode.replace(/-live$/, ''));
const selectedLiveState = () => simulation.live[selectedLiveSource().id];

const byId = (id) => document.getElementById(id);

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value == null || value === '' ? '—' : String(value);
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('nl-NL') : '—';
}

function formatLatency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number >= 1000 ? `${(number / 1000).toFixed(1)} s` : `${Math.round(number)} ms`;
}

function setStatus(kind, label) {
  const status = byId('simulation-status');
  if (!status) return;
  status.className = `connection-pill ${kind}`;
  status.innerHTML = '<i aria-hidden="true"></i>';
  status.append(document.createTextNode(` ${label}`));
}

function setMetricLabels(labels) {
  labels.forEach(([label, detail], index) => {
    setText(`metric-label-${index + 1}`, label);
    setText(`metric-detail-${index + 1}`, detail);
  });
}

function selectTab(id) {
  document.querySelectorAll('[data-monitor-tab]').forEach((button) => {
    const active = button.dataset.monitorTab === id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatPeriod(start, end) {
  const first = new Date(start);
  const last = new Date(end);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) return '—';
  const date = first.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${date} · ${formatTime(start)}–${formatTime(end)}`;
}

function evidenceProgress(validity = {}) {
  if (validity.geldig) return 100;
  const details = validity.details || {};
  const ratios = [
    Number(details.acties_ontvangen || 0) / Math.max(1, Number(details.min_acties_vereist || 5)),
    Number(details.duur_seconden || 0) / Math.max(1, Number(details.min_duur_vereist || 300)),
    Number(details.variatie || 0) / Math.max(1, Number(details.min_variatie_vereist || 3)),
  ];
  return Math.max(0, Math.min(100, Math.round(Math.min(...ratios) * 100)));
}

function renderFeed(game) {
  const list = byId('simulation-action-feed');
  if (!list) return;
  list.replaceChildren();
  const feed = Array.isArray(game.feed) ? game.feed : [];
  feed.forEach((action) => {
    const item = document.createElement('li');
    const cells = [
      ['time', formatTime(action.action_at), ''],
      ['span', action.action_type || 'interaction', 'feed-action'],
      ['span', action.leerobject_id || '—', 'feed-object'],
      ['span', action.object_role || 'other', 'feed-role'],
    ];
    cells.forEach(([tag, value, className]) => {
      const cell = document.createElement(tag);
      cell.className = className;
      cell.textContent = value;
      item.append(cell);
    });
    list.append(item);
  });
  if (!feed.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-feed';
    empty.textContent = 'Deze actiereeks bevat geen toonbare acties.';
    list.append(empty);
  }
  setText('simulation-feed-count', `${game.step_1?.action_count || 0} acties · laatste ${feed.length} getoond`);
}

function renderGame(game) {
  if (!game) return;
  simulation.selectedMode = 'historical';
  simulation.selectedGameId = game.id;
  selectTab(game.id);
  document.querySelectorAll('[data-simulation-step]').forEach((step) => step.classList.add('active'));
  const liveLink = byId('open-live-test');
  if (liveLink) liveLink.hidden = true;
  setStatus('historical', 'Historisch archief');
  setMetricLabels([
    ['Bronacties', 'alle geregistreerde events'],
    ['Actiereeksen', 'na splitsing op actiepauze'],
    ['Deelnemers', 'pseudonieme broncodes'],
    ['Engineverwerking', 'representatieve reeks'],
  ]);
  setText('simulation-step-one-title', 'Historische actiereeks geladen');
  setText('simulation-field-label-1', 'Game');
  setText('simulation-field-label-2', 'Dataset');
  setText('simulation-field-label-3', 'Periode');
  setText('simulation-feed-eyebrow', 'OpenGameData · Field Day Lab');
  setText('simulation-feed-title', 'Historische actiereeks');

  const received = game.step_1 || {};
  const transformed = game.step_2 || {};
  const measurement = game.step_3 || {};
  const statistics = game.source_statistics || {};
  setText('simulation-game-title', game.title);
  setText('simulation-game-description', `Representatieve historische actiereeks uit ${game.source}. Dit is geen live data.`);
  setText('simulation-game', game.title);
  setText('simulation-dataset', game.dataset);
  setText('simulation-period', formatPeriod(received.started_at, received.ended_at));
  setText('simulation-session-id', game.session_id);
  setText('simulation-source-actions', formatNumber(statistics.actions));
  setText('simulation-source-sequences', formatNumber(statistics.sequences));
  setText('simulation-source-people', formatNumber(statistics.people));
  setText('simulation-processing-time', `${Number(game.processing_ms || 0).toFixed(1)} ms`);

  ['T', 'A', 'V', 'R', 'S'].forEach((marker) => {
    const target = document.querySelector(`[data-marker="${marker}"]`);
    const value = Number(transformed.markers?.[marker]);
    if (target) target.textContent = Number.isFinite(value) ? value.toFixed(3) : '—';
  });

  const validity = transformed.validity || {};
  const details = validity.details || {};
  setText(
    'simulation-series-status',
    `${transformed.action_count || 0} acties · ${details.variatie || 0} unieke leerobjecten · ${validity.geldig ? 'geldige historische reeks' : 'onvoldoende gedragsbewijs'}`,
  );
  const progress = evidenceProgress(validity);
  const progressBar = byId('simulation-evidence-progress');
  if (progressBar) progressBar.style.width = `${progress}%`;
  const calculated = measurement.status === 'calculated' && Number.isFinite(Number(measurement.score));
  setText('simulation-score', calculated ? Number(measurement.score).toFixed(3) : '—');
  setText('simulation-measurement-state', calculated ? 'Historische meting berekend' : `Onvoldoende bewijs · ${progress}%`);
  setText('simulation-archetype', calculated ? measurement.analytic_archetype : 'Nog onbepaald');
  setText(
    'simulation-measurement-detail',
    calculated
      ? 'De representatieve actiereeks is opnieuw door de huidige Leerpretformule verwerkt.'
      : 'De historische actiereeks voldoet niet aan alle huidige geldigheidscriteria.',
  );
  const orb = byId('simulation-score-orb');
  if (orb) orb.style.setProperty('--score-angle', `${calculated ? Number(measurement.score) * 360 : 0}deg`);
  renderFeed(game);
}

function renderLiveFeed() {
  const list = byId('simulation-action-feed');
  if (!list) return;
  list.replaceChildren();
  const source = selectedLiveSource();
  const liveState = selectedLiveState();
  const events = [...liveState.events].reverse().slice(0, 30);
  events.forEach((event) => {
    const item = document.createElement('li');
    const cells = [
      ['time', formatTime(event.recorded_at), ''],
      ['span', event.step_1?.action_type || 'interaction', 'feed-action'],
      ['span', event.step_1?.leerobject_id || '—', 'feed-object'],
      ['span', event.step_1?.object_role || 'other', 'feed-role'],
    ];
    cells.forEach(([tag, value, className]) => {
      const cell = document.createElement(tag);
      cell.className = className;
      cell.textContent = value;
      item.append(cell);
    });
    list.append(item);
  });
  if (!events.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-feed';
    empty.textContent = `Start ${source.surface} en voer een actie uit; de gebeurtenis verschijnt hier direct.`;
    list.append(empty);
  }
  setText('simulation-feed-count', `${liveState.events.length} gebeurtenis${liveState.events.length === 1 ? '' : 'sen'}`);
}

function renderLiveEvent(event) {
  if (!event) return;
  const received = event.step_1 || {};
  const transformed = event.step_2 || {};
  const measurement = event.step_3 || {};
  document.querySelectorAll('[data-simulation-step]').forEach((step) => step.classList.add('active'));
  setText('simulation-game', received.action_type);
  setText('simulation-dataset', received.leerobject_id);
  setText('simulation-period', received.object_role);
  setText('simulation-session-id', event.source?.session);
  setText('simulation-source-actions', formatNumber(transformed.action_count || selectedLiveState().events.length));
  setText('simulation-source-sequences', formatLatency(received.transport_latency_ms));
  setText('simulation-source-people', formatLatency(event.processing_ms));
  const dashboardLatency = Date.now() - new Date(event.recorded_at).getTime();
  setText('simulation-processing-time', formatLatency(Math.max(0, dashboardLatency)));

  ['T', 'A', 'V', 'R', 'S'].forEach((marker) => {
    const target = document.querySelector(`[data-marker="${marker}"]`);
    const value = Number(transformed.markers?.[marker]);
    if (target) target.textContent = Number.isFinite(value) ? value.toFixed(3) : '—';
  });
  const validity = transformed.validity || {};
  const details = validity.details || {};
  setText('simulation-series-status', `${transformed.active_series_count || 0} acties · ${details.variatie || 0} unieke leerobjecten · ${validity.geldig ? 'reeks geldig' : 'markers worden nog verzameld'}`);
  const progress = evidenceProgress(validity);
  const progressBar = byId('simulation-evidence-progress');
  if (progressBar) progressBar.style.width = `${progress}%`;
  const calculated = measurement.status === 'calculated' && Number.isFinite(Number(measurement.score));
  setText('simulation-score', calculated ? Number(measurement.score).toFixed(3) : '—');
  setText('simulation-measurement-state', calculated ? 'Live meting berekend' : `Markers verzamelen · ${progress}%`);
  setText('simulation-archetype', calculated ? measurement.analytic_archetype : 'Nog onbepaald');
  setText('simulation-measurement-detail', calculated
    ? 'De geldige live actiereeks is door de Leerpretformule verwerkt.'
    : 'De Engine wacht tot acties, duur en variatie samen voldoende bewijs vormen.');
  const orb = byId('simulation-score-orb');
  if (orb) orb.style.setProperty('--score-angle', `${calculated ? Number(measurement.score) * 360 : 0}deg`);
  renderLiveFeed();
}

function selectLive(sourceId = 'lom') {
  const source = liveSource(sourceId);
  const liveState = simulation.live[source.id];
  simulation.selectedMode = source.tabId;
  simulation.selectedGameId = '';
  selectTab(source.tabId);
  setText('simulation-game-title', source.title);
  setText('simulation-game-description', `Volg iedere ${source.surface}-actie live door ontvangst, transformatie en Leerpret-meting.`);
  setMetricLabels([
    ['Ontvangen acties', 'deze Engine-runtime'],
    ['Transmissie', `${source.surface} → Engine`],
    ['Verwerking', 'in de Engine'],
    ['Dashboardlevering', 'Engine → Dashboard'],
  ]);
  setText('simulation-step-one-title', `Live uit ${source.surface}`);
  setText('simulation-field-label-1', 'Actie');
  setText('simulation-field-label-2', 'Leerobject');
  setText('simulation-field-label-3', 'Objectrol');
  setText('simulation-feed-eyebrow', 'Engine-auditbuffer');
  setText('simulation-feed-title', 'Live datastroom');
  const liveLink = byId('open-live-test');
  if (liveLink) {
    liveLink.hidden = false;
    liveLink.href = window.LEERPRET_CONFIG?.[source.configKey] || source.fallbackUrl;
    liveLink.textContent = `Open ${source.surface} ↗`;
  }
  if (liveState.events.length) {
    setStatus('live', 'Live verbonden');
    renderLiveEvent(liveState.events.at(-1));
  } else {
    setStatus('live', `Verbonden · wacht op ${source.surface}`);
    setText('simulation-source-actions', '0');
    setText('simulation-source-sequences', '—');
    setText('simulation-source-people', '—');
    setText('simulation-processing-time', '—');
    setText('simulation-game', 'Wachten op actie…');
    setText('simulation-dataset', '—');
    setText('simulation-period', '—');
    setText('simulation-session-id', '—');
    renderLiveFeed();
  }
}

async function pollLive() {
  if (simulation.stopped) return;
  await Promise.all(liveSources.map(async (source) => {
    const liveState = simulation.live[source.id];
    try {
      const payload = await apiGet(`${source.endpoint}?after=${liveState.cursor}&limit=50`);
      liveState.cursor = Number(payload.cursor || liveState.cursor);
      const incoming = Array.isArray(payload.events) ? payload.events : [];
      if (incoming.length) {
        liveState.events.push(...incoming);
        liveState.events = liveState.events.slice(-100);
        if (simulation.selectedMode === source.tabId) {
          setStatus('live', 'Live verbonden');
          renderLiveEvent(liveState.events.at(-1));
        }
      } else if (simulation.selectedMode === source.tabId) {
        setStatus('live', liveState.events.length ? 'Live verbonden' : `Verbonden · wacht op ${source.surface}`);
      }
    } catch (error) {
      if (simulation.selectedMode === source.tabId) {
        setStatus('error', error?.status === 403 ? 'Geen toegang tot monitor' : 'Engineverbinding verbroken');
      }
    }
  }));
  simulation.timer = window.setTimeout(pollLive, 1000);
}

function renderTabs() {
  const tabs = byId('open-game-tabs');
  if (!tabs) return;
  tabs.replaceChildren();
  liveSources.forEach((source) => {
    const liveButton = document.createElement('button');
    liveButton.type = 'button';
    liveButton.dataset.monitorTab = source.tabId;
    liveButton.setAttribute('role', 'tab');
    liveButton.setAttribute('aria-selected', String(simulation.selectedMode === source.tabId));
    liveButton.textContent = source.title;
    liveButton.addEventListener('click', () => selectLive(source.id));
    tabs.append(liveButton);
  });
  simulation.games.forEach((game) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.openGameId = game.id;
    button.dataset.monitorTab = game.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', 'false');
    button.textContent = game.title;
    button.addEventListener('click', () => renderGame(game));
    tabs.append(button);
  });
}

async function loadHistoricalGames() {
  try {
    const payload = await apiGet('/innovation-tests/open-game/history');
    simulation.games = Array.isArray(payload.games) ? payload.games : [];
    if (!simulation.games.length) throw new Error('Geen historische games gevonden');
    renderTabs();
    selectLive('lom');
  } catch (error) {
    renderTabs();
    selectLive('lom');
    console.warn('Historische Open Game-data niet beschikbaar', error);
  }
}

function selectTest(type) {
  document.querySelectorAll('[data-test-type]').forEach((button) => {
    const active = button.dataset.testType === type;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
  document.querySelectorAll('[data-test-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.testPanel !== type;
  });
}

function initialize() {
  document.querySelectorAll('[data-test-type]').forEach((button) => {
    button.addEventListener('click', () => selectTest(button.dataset.testType));
  });
  selectTest('practice');
  renderTabs();
  selectLive('lom');
  loadHistoricalGames();
  pollLive();
}

window.addEventListener('DOMContentLoaded', initialize);
window.addEventListener('pagehide', () => {
  simulation.stopped = true;
  window.clearTimeout(simulation.timer);
});

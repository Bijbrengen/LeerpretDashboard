import { apiGet } from './api.js';

const monitor = {
  cursor: 0,
  events: [],
  timer: 0,
  stopped: false,
};

const byId = (id) => document.getElementById(id);

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value == null || value === '' ? '—' : String(value);
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatLatency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number >= 1000 ? `${(number / 1000).toFixed(1)} s` : `${Math.round(number)} ms`;
}

function setConnection(kind, label) {
  const status = byId('phile-live-status');
  if (!status) return;
  status.className = `connection-pill ${kind}`;
  status.innerHTML = '<i aria-hidden="true"></i>';
  status.append(document.createTextNode(` ${label}`));
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

function renderLatest(event) {
  if (!event) return;
  document.querySelectorAll('.pipeline-step').forEach((step) => step.classList.add('active'));
  const received = event.step_1 || {};
  const transformed = event.step_2 || {};
  const measurement = event.step_3 || {};

  setText('live-action-type', received.action_type);
  setText('live-object-id', received.leerobject_id);
  setText('live-object-role', received.object_role);
  setText('live-session-id', event.source?.session);
  setText('live-action-count', transformed.action_count || monitor.events.length);
  setText('live-transport-latency', formatLatency(received.transport_latency_ms));
  setText('live-processing-latency', formatLatency(event.processing_ms));
  const dashboardLatency = Date.now() - new Date(event.recorded_at).getTime();
  setText('live-last-signal', formatLatency(Math.max(0, dashboardLatency)));

  ['T', 'A', 'V', 'R', 'S'].forEach((marker) => {
    const target = document.querySelector(`[data-marker="${marker}"]`);
    const value = Number(transformed.markers?.[marker]);
    if (target) target.textContent = Number.isFinite(value) ? value.toFixed(3) : '—';
  });

  const validity = transformed.validity || {};
  const details = validity.details || {};
  setText(
    'live-series-status',
    validity.geldig
      ? `${transformed.active_series_count} acties · ${details.variatie || 0} unieke leerobjecten · reeks geldig`
      : `${transformed.active_series_count || 0} acties · ${details.variatie || 0} unieke leerobjecten · markers worden nog verzameld`,
  );

  const progress = evidenceProgress(validity);
  const progressBar = byId('live-evidence-progress');
  if (progressBar) progressBar.style.width = `${progress}%`;
  const calculated = measurement.status === 'calculated' && Number.isFinite(Number(measurement.score));
  setText('live-score', calculated ? Number(measurement.score).toFixed(3) : '—');
  setText('live-measurement-state', calculated ? 'Meting berekend' : `Markers verzamelen · ${progress}%`);
  setText('live-archetype', calculated ? measurement.analytic_archetype : 'Nog onbepaald');
  setText(
    'live-measurement-detail',
    calculated
      ? 'De geldige actiereeks is door de Leerpretformule verwerkt.'
      : 'De Engine wacht tot acties, duur en variatie samen voldoende bewijs vormen.',
  );
  const orb = byId('live-score-orb');
  if (orb) orb.style.setProperty('--score-angle', `${calculated ? Number(measurement.score) * 360 : 0}deg`);
}

function renderFeed() {
  const list = byId('phile-live-feed');
  if (!list) return;
  list.replaceChildren();
  [...monitor.events].reverse().slice(0, 30).forEach((event) => {
    const item = document.createElement('li');
    const score = event.step_3?.score;
    const cells = [
      ['time', formatTime(event.recorded_at), ''],
      ['span', event.step_1?.action_type || 'interaction', 'feed-action'],
      ['span', event.step_1?.leerobject_id || '—', 'feed-object'],
      ['span', `${event.processing_ms ?? '—'} ms`, 'feed-stage'],
      ['span', Number.isFinite(Number(score)) ? Number(score).toFixed(3) : 'verzamelen', 'feed-score'],
    ];
    cells.forEach(([tag, value, className]) => {
      const cell = document.createElement(tag);
      cell.className = className;
      cell.textContent = value;
      item.append(cell);
    });
    list.append(item);
  });
  setText('live-feed-count', `${monitor.events.length} gebeurtenis${monitor.events.length === 1 ? '' : 'sen'}`);
}

async function poll() {
  if (monitor.stopped) return;
  try {
    const payload = await apiGet(`/innovation-tests/phile/live?after=${monitor.cursor}&limit=50`);
    monitor.cursor = Number(payload.cursor || monitor.cursor);
    const incoming = Array.isArray(payload.events) ? payload.events : [];
    if (incoming.length) {
      monitor.events.push(...incoming);
      monitor.events = monitor.events.slice(-100);
      renderLatest(monitor.events.at(-1));
      renderFeed();
      setConnection('live', 'Live verbonden');
    } else {
      setConnection('live', monitor.events.length ? 'Live verbonden' : 'Verbonden · wacht op Phile');
    }
  } catch (error) {
    setConnection('error', error?.status === 403 ? 'Geen toegang tot monitor' : 'Engineverbinding verbroken');
  } finally {
    monitor.timer = window.setTimeout(poll, 1000);
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
  const phileLink = byId('open-phile-test');
  if (phileLink) phileLink.href = window.LEERPRET_CONFIG?.phileUrl || 'http://127.0.0.1:47115/';
  selectTest('practice');
  poll();
}

window.addEventListener('DOMContentLoaded', initialize);
window.addEventListener('pagehide', () => {
  monitor.stopped = true;
  window.clearTimeout(monitor.timer);
});

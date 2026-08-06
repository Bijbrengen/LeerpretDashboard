import * as d3 from 'd3';
import { activeBlockRole, loadBlockAccess } from './pageBlocks.js';

const TYPE_STYLE = {
  account: { label: 'Google-account', color: '#db2777', icon: 'G' },
  person: { label: 'Person-ID', color: '#e11d48', icon: 'P' },
  attraction: { label: 'Leerattractie', color: '#65a30d', icon: 'T' },
  action: { label: 'Actie', color: '#7c3aed', icon: 'A' },
  learningbox: { label: 'Leerbox', color: '#059669', icon: 'L' },
  learningobject: { label: 'Leerobject', color: '#2563eb', icon: 'O' },
  resistance: { label: 'Weerstand', color: '#d97706', icon: 'W' },
  measurement: { label: 'Leerpretmeting', color: '#0891b2', icon: 'M' },
  service: { label: 'Servicedata', color: '#ea580c', icon: 'S' },
  static: { label: 'Vaste data', color: '#0d9488', icon: 'D' },
  runtime: { label: 'Runtime data', color: '#64748b', icon: 'V' },
};

export const mockNodes = [
  { id: 'account-1', type: 'account', label: 'Google-account (pseudoniem)', domains: ['personalized'], data: { google_account_id: 'google-a84e…', person_ids: ['nfc-1042:3'], raw_google_sub_stored: false } },
  { id: 'person-1042-3', type: 'person', label: 'Tijdelijk Person-ID', domains: ['raw_actions', 'personalized'], data: { person_id: 'nfc-1042:3', google_account_link: 'afgeschermd', leerbox_id: 'phile', issuance: 3 } },
  { id: 'attraction-1', type: 'attraction', label: 'Voorbeeld-leerattractie', domains: ['personalized'], data: { leerattractie_id: 'voorbeeld-attractie', google_account_ids: ['google-a84e…'], leerbox_count: 1, illustrative: true } },
  { id: 'box-example', type: 'learningbox', label: 'Voorbeeld-leerbox', domains: ['personalized'], data: { leerbox_id: 'voorbeeld-leerbox', leerattractie_id: 'voorbeeld-attractie', illustrative: true } },
  { id: 'box-phile', type: 'learningbox', label: 'Phile · digitale leerbox', domains: ['raw_actions', 'personalized', 'services'], data: { leerbox_id: 'phile', status: 'pilot', leerattractie_id: null, note: 'De feitelijke leerattractie is nog niet geregistreerd.' } },
  { id: 'object-raster', type: 'learningobject', label: 'Rasterbrein', domains: ['raw_actions', 'personalized'], data: { leerobject_id: 'rasterbrein', globally_unique: true, leerbox_id: 'phile', description: '' } },
  { id: 'object-cards', type: 'learningobject', label: 'Kaartkeuze', domains: ['raw_actions', 'personalized'], data: { leerobject_id: 'kaartkeuze', globally_unique: true, leerbox_id: 'phile', description: 'Keuze uit filosoofkaarten' } },
  { id: 'resistance-grid', type: 'resistance', label: 'Geblokkeerde route', domains: ['raw_actions'], data: { resistance_id: 'route-block-7', leerobject_id: 'rasterbrein', derived_on_the_fly: true } },
  { id: 'action-select', type: 'action', label: 'Selecteer kaart', domains: ['raw_actions'], data: { event_id: 'act-9f31', person_id: 'nfc-1042:3', leerbox_id: 'phile', leerobject_id: 'kaartkeuze', timestamp: '2026-07-15T08:41:12Z' } },
  { id: 'action-retry', type: 'action', label: 'Probeer route opnieuw', domains: ['raw_actions'], data: { event_id: 'act-9f38', person_id: 'nfc-1042:3', leerbox_id: 'phile', leerobject_id: 'rasterbrein', timestamp: '2026-07-15T08:43:31Z', action_type: 'retry' } },
  { id: 'measurement-1', type: 'measurement', label: 'Dynamische analytics', domains: ['raw_actions'], data: { persisted: false, calculation: 'on_the_fly', alpha_score: 0.73, leerpret_score: 0.78 } },
  { id: 'service-phile', type: 'service', label: 'Phile spelstatus', domains: ['services'], data: { path: 'var/services/phile/phile/game_state.json', owns: ['voortgang', 'levels', 'spelinstellingen'], analytics_mixed_in: false } },
  { id: 'static-data', type: 'static', label: 'data/ · versieerbaar', domains: ['static_dynamic'], data: { root: 'data/', git: true, content: ['configuratie', 'vaste servicedata', 'historische testdata', 'artikelen'] } },
  { id: 'runtime-data', type: 'runtime', label: 'var/ · leegbaar', domains: ['static_dynamic'], data: { root: 'var/', git: false, auto_created: true, content: ['JSON-tabellen', 'service-status', 'sessies', 'previews'] } },
];

export const mockEdges = [
  { id: 'e1', source: 'person-1042-3', target: 'action-select', label: 'activeert' },
  { id: 'e2', source: 'person-1042-3', target: 'action-retry', label: 'activeert' },
  { id: 'e3', source: 'action-select', target: 'object-cards', label: 'richt zich op' },
  { id: 'e4', source: 'action-retry', target: 'object-raster', label: 'richt zich op' },
  { id: 'e5', source: 'action-retry', target: 'resistance-grid', label: 'ontmoet' },
  { id: 'e6', source: 'object-cards', target: 'box-phile', label: 'onderdeel van' },
  { id: 'e7', source: 'object-raster', target: 'box-phile', label: 'onderdeel van' },
  { id: 'e8', source: 'resistance-grid', target: 'object-raster', label: 'belemmert' },
  { id: 'e9', source: 'action-retry', target: 'measurement-1', label: 'draagt bij aan' },
  { id: 'e10', source: 'measurement-1', target: 'person-1042-3', label: 'berekend voor' },
  { id: 'e11', source: 'measurement-1', target: 'box-phile', label: 'meet binnen' },
  { id: 'e12', source: 'account-1', target: 'person-1042-3', label: 'kan koppelen aan' },
  { id: 'e13', source: 'account-1', target: 'attraction-1', label: 'heeft rechten op' },
  { id: 'e14', source: 'attraction-1', target: 'box-example', label: 'bevat 1:n' },
  { id: 'e15', source: 'service-phile', target: 'box-phile', label: 'status voor' },
  { id: 'e16', source: 'static-data', target: 'box-phile', label: 'levert vaste basis' },
  { id: 'e17', source: 'runtime-data', target: 'action-select', label: 'slaat dynamisch op' },
  { id: 'e18', source: 'runtime-data', target: 'service-phile', label: 'isoleert per client' },
];

export const schemaModels = [
  { id: 'Person', type: 'account', domains: ['personalized'], fields: [{ name: 'google_account_id', type: 'string', key: 'PK' }, { name: 'person_ids', type: 'PersonLink[]', key: '' }, { name: 'name', type: 'string?', key: '' }, { name: 'email', type: 'string?', key: '' }] },
  { id: 'Leerattractie', type: 'attraction', domains: ['personalized'], fields: [{ name: 'leerattractie_id', type: 'string', key: 'PK' }, { name: 'google_account_ids', type: 'string[]', key: 'FK' }, { name: 'name', type: 'string', key: '' }] },
  { id: 'Leerbox', type: 'learningbox', domains: ['personalized', 'services'], fields: [{ name: 'leerbox_id', type: 'string', key: 'PK' }, { name: 'leerattractie_id', type: 'string', key: 'FK' }, { name: 'name', type: 'string', key: '' }, { name: 'twin_type', type: 'enum', key: '' }] },
  { id: 'Leerobject', type: 'learningobject', domains: ['personalized', 'raw_actions'], fields: [{ name: 'leerobject_id', type: 'string', key: 'PK' }, { name: 'leerbox_id', type: 'string', key: 'FK' }, { name: 'description', type: 'string', key: '' }] },
  { id: 'LeerpretActie', type: 'action', domains: ['raw_actions'], fields: [{ name: 'event_id', type: 'uuid', key: 'PK' }, { name: 'person_id', type: 'string', key: 'IDX' }, { name: 'leerbox_id', type: 'string', key: 'FK' }, { name: 'leerobject_id', type: 'string', key: 'FK' }, { name: 'timestamp', type: 'datetime', key: '' }, { name: 'action_type', type: 'string?', key: '' }] },
  { id: 'ServiceState', type: 'service', domains: ['services'], fields: [{ name: 'id', type: 'string', key: 'PK' }, { name: 'client_id', type: 'string', key: 'IDX' }, { name: 'leerbox_id', type: 'string', key: 'FK' }, { name: 'state', type: 'object', key: '' }] },
];

export const schemaRelations = [
  { source: ['Leerattractie', 'google_account_ids'], target: ['Person', 'google_account_id'], label: 'rechten voor' },
  { source: ['Leerbox', 'leerattractie_id'], target: ['Leerattractie', 'leerattractie_id'], label: 'behoort tot' },
  { source: ['Leerobject', 'leerbox_id'], target: ['Leerbox', 'leerbox_id'], label: 'behoort tot' },
  { source: ['LeerpretActie', 'leerbox_id'], target: ['Leerbox', 'leerbox_id'], label: 'binnen' },
  { source: ['LeerpretActie', 'leerobject_id'], target: ['Leerobject', 'leerobject_id'], label: 'activeert' },
  { source: ['ServiceState', 'leerbox_id'], target: ['Leerbox', 'leerbox_id'], label: 'status voor' },
];

let activeView = 'network';
let activeScope = 'all';
let networkSimulation;
let networkZoom;
let erdZoom;
let architectureSnapshot;

export async function initializeDataStructureViewer() {
  const root = document.querySelector('[data-structure-viewer]');
  if (!root) return;
  try {
    const policy = await loadBlockAccess(activeBlockRole(), 'data');
    const blocks = policy.pages?.data?.blocks;
    if (!blocks) {
      return;
    }
    applyBlockAccess(blocks);
  } catch (error) {
    root.innerHTML = '<section class="mobile-card"><h2>Datastructuur niet beschikbaar</h2><p class="muted-text">De toegangsrechten konden niet bij de backend worden opgehaald.</p></section>';
    console.warn('Data structure block access could not be loaded.', error);
    return;
  }

  try {
    const { apiGet } = await import('./api.js');
    architectureSnapshot = await apiGet('/data/architecture');
    const tableCount = architectureSnapshot?.tables?.length || 0;
    const label = document.querySelector('[data-snapshot-label]');
    if (label) label.textContent = `${tableCount} live JSON-tabellen + demonstratieset`;
  } catch (error) {
    console.warn('Live data architecture snapshot unavailable; using the demonstratieset.', error);
  }

  renderNetwork();
  renderErd();
  bindControls();
  updateView('network');
  updateScope('all');
}

function applyBlockAccess(blocks) {
  const allowed = new Set(Object.keys(blocks));
  const blockByView = { network: 'data_network', erd: 'data_erd' };
  document.querySelectorAll('[data-structure-view]').forEach((button) => {
    button.hidden = !allowed.has(blockByView[button.dataset.structureView]);
  });
  document.querySelectorAll('[data-structure-panel]').forEach((panel) => {
    panel.dataset.allowed = String(allowed.has(blockByView[panel.dataset.structurePanel]));
  });
  document.querySelector('[data-structure-legend]')?.toggleAttribute('hidden', !allowed.has('data_legend'));
  document.querySelector('[data-metadata-panel]')?.toggleAttribute('data-disabled', !allowed.has('data_metadata'));
}

function bindControls() {
  document.querySelectorAll('[data-structure-view]').forEach((button) => button.addEventListener('click', () => updateView(button.dataset.structureView)));
  document.querySelectorAll('[data-structure-scope]').forEach((button) => button.addEventListener('click', () => updateScope(button.dataset.structureScope)));
  document.querySelector('[data-reset-view]')?.addEventListener('click', resetActiveView);
  document.querySelector('[data-close-metadata]')?.addEventListener('click', clearSelection);
  const search = document.querySelector('[data-node-search]');
  search?.addEventListener('input', () => searchNodes(search.value));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') clearSelection(); });
}

const SCOPE_COPY = {
  all: ['Datastroom en verbindingen', 'Volg de volledige keten van account en tijdelijk Person-ID tot Acties, leercontext en servicedata.'],
  raw_actions: ['Geanonimiseerde ruwe acties', 'De vier verplichte velden blijven zichtbaar; afgeleide analytics worden on-the-fly berekend.'],
  personalized: ['Gepersonaliseerde betekenislaag', 'Bekijk hoe één gepseudonimiseerd Google-account meerdere tijdelijke Person-ID’s en rechten kan dragen.'],
  services: ['Data per service en leerbox', 'Spelvoortgang, levels en clientinstellingen blijven gescheiden van algemene Learning Analytics.'],
  static_dynamic: ['Statisch versus dynamisch', 'data/ blijft versieerbaar en minimaal; var/ is leegbaar, gitignored en wordt automatisch opgebouwd.'],
};

function updateScope(scope) {
  activeScope = SCOPE_COPY[scope] ? scope : 'all';
  document.querySelectorAll('[data-structure-scope]').forEach((button) => {
    const active = button.dataset.structureScope === activeScope;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  applyScopeVisibility();
  const [title, description] = SCOPE_COPY[activeScope];
  document.querySelector('[data-view-title]').textContent = activeView === 'erd' ? `${title} · schema` : title;
  document.querySelector('[data-view-description]').textContent = description;
  clearSelection();
}

function appliesToScope(item) {
  return activeScope === 'all' || (item.domains || []).includes(activeScope);
}

function applyScopeVisibility() {
  const visibleNodeIds = new Set(mockNodes.filter(appliesToScope).map((node) => node.id));
  const visibleModels = new Set(schemaModels.filter(appliesToScope).map((model) => model.id));
  d3.selectAll('.network-node').classed('scope-hidden', (node) => !visibleNodeIds.has(node.id));
  d3.selectAll('.network-edges > g').classed('scope-hidden', (edge) => {
    const source = typeof edge.source === 'object' ? edge.source.id : edge.source;
    const target = typeof edge.target === 'object' ? edge.target.id : edge.target;
    return !visibleNodeIds.has(source) || !visibleNodeIds.has(target);
  });
  d3.selectAll('.erd-model').classed('scope-hidden', (model) => !visibleModels.has(model.id));
  d3.selectAll('.erd-relations > g').classed('scope-hidden', (relation) => !visibleModels.has(relation.source[0]) || !visibleModels.has(relation.target[0]));
  const visibleEdges = mockEdges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
  setText('[data-footer-nodes]', visibleNodeIds.size);
  setText('[data-footer-edges]', visibleEdges.length);
  setText('[data-footer-models]', visibleModels.size);
}

function setText(selector, value) {
  const target = document.querySelector(selector);
  if (target) target.textContent = String(value);
}

function updateView(view) {
  const requested = document.querySelector(`[data-structure-view="${view}"]:not([hidden])`);
  const fallback = document.querySelector('[data-structure-view]:not([hidden])');
  activeView = requested ? view : fallback?.dataset.structureView || 'network';
  document.querySelectorAll('[data-structure-view]').forEach((button) => {
    const active = button.dataset.structureView === activeView;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
  document.querySelectorAll('[data-structure-panel]').forEach((panel) => {
    const active = panel.dataset.structurePanel === activeView && panel.dataset.allowed !== 'false';
    panel.hidden = !active;
  });
  const [title, description] = SCOPE_COPY[activeScope];
  document.querySelector('[data-view-title]').textContent = activeView === 'network' ? title : `${title} · schema`;
  document.querySelector('[data-view-description]').textContent = activeView === 'network'
    ? description
    : `${description} Bekijk primaire sleutels en verwijzingen tussen de JSON-tabellen.`;
  requestAnimationFrame(() => activeView === 'network' ? networkSimulation?.alpha(.25).restart() : null);
  applyScopeVisibility();
  clearSelection();
}

function renderNetwork() {
  const svg = d3.select('#data-network-svg');
  svg.selectAll('*').remove();
  svg.attr('viewBox', '0 0 1000 650');
  const defs = svg.append('defs');
  defs.append('marker').attr('id', 'network-arrow').attr('viewBox', '0 -5 10 10').attr('refX', 47).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#94a3b8');
  const viewport = svg.append('g').attr('class', 'network-viewport');
  networkZoom = d3.zoom().scaleExtent([.45, 2.2]).on('zoom', (event) => viewport.attr('transform', event.transform));
  svg.call(networkZoom).on('dblclick.zoom', null).on('click', (event) => { if (event.target === svg.node()) clearSelection(); });

  const links = mockEdges.map((edge) => ({ ...edge }));
  const nodes = mockNodes.map((node) => ({ ...node }));
  const edgeGroup = viewport.append('g').attr('class', 'network-edges').selectAll('g').data(links).join('g').attr('data-edge-id', (edge) => edge.id);
  edgeGroup.append('line').attr('marker-end', 'url(#network-arrow)');
  edgeGroup.append('text').attr('class', 'network-edge-label').attr('text-anchor', 'middle').text((edge) => edge.label);
  const nodeGroup = viewport.append('g').attr('class', 'network-nodes').selectAll('g').data(nodes).join('g').attr('class', 'network-node').attr('data-node-id', (node) => node.id).on('click', (event, node) => { event.stopPropagation(); selectNetworkNode(node.id); });
  nodeGroup.append('circle').attr('r', 37).attr('fill', (node) => TYPE_STYLE[node.type].color);
  nodeGroup.append('circle').attr('r', 28).attr('class', 'network-node-core');
  nodeGroup.append('text').attr('class', 'network-node-icon').attr('text-anchor', 'middle').attr('dy', '.35em').attr('fill', (node) => TYPE_STYLE[node.type].color).text((node) => TYPE_STYLE[node.type].icon);
  nodeGroup.append('text').attr('class', 'network-node-label').attr('text-anchor', 'middle').attr('y', 56).text((node) => node.label);
  nodeGroup.append('text').attr('class', 'network-node-type').attr('text-anchor', 'middle').attr('y', 72).text((node) => TYPE_STYLE[node.type].label);
  nodeGroup.call(d3.drag().on('start', (event, node) => { if (!event.active) networkSimulation.alphaTarget(.25).restart(); node.fx = node.x; node.fy = node.y; }).on('drag', (event, node) => { node.fx = event.x; node.fy = event.y; }).on('end', (event, node) => { if (!event.active) networkSimulation.alphaTarget(0); node.fx = null; node.fy = null; }));

  networkSimulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((node) => node.id).distance(165).strength(.75))
    .force('charge', d3.forceManyBody().strength(-560))
    .force('center', d3.forceCenter(500, 320))
    .force('collision', d3.forceCollide(82))
    .on('tick', () => {
      edgeGroup.select('line').attr('x1', (edge) => edge.source.x).attr('y1', (edge) => edge.source.y).attr('x2', (edge) => edge.target.x).attr('y2', (edge) => edge.target.y);
      edgeGroup.select('text').attr('x', (edge) => (edge.source.x + edge.target.x) / 2).attr('y', (edge) => (edge.source.y + edge.target.y) / 2 - 7);
      nodeGroup.attr('transform', (node) => `translate(${node.x},${node.y})`);
    });
}

function selectNetworkNode(id) {
  const connected = connectedNodeIds(id);
  d3.selectAll('.network-node').classed('selected', (node) => node.id === id).classed('dimmed', (node) => !connected.has(node.id));
  d3.selectAll('.network-edges > g').classed('highlighted', (edge) => edge.source.id === id || edge.target.id === id).classed('dimmed', (edge) => edge.source.id !== id && edge.target.id !== id);
  const node = mockNodes.find((item) => item.id === id);
  if (node) showMetadata(node.label, TYPE_STYLE[node.type].label, { id: node.id, type: node.type, ...node.data }, TYPE_STYLE[node.type].color);
}

export function connectedNodeIds(id, edges = mockEdges) {
  const connected = new Set([id]);
  edges.forEach((edge) => {
    const source = typeof edge.source === 'object' ? edge.source.id : edge.source;
    const target = typeof edge.target === 'object' ? edge.target.id : edge.target;
    if (source === id) connected.add(target);
    if (target === id) connected.add(source);
  });
  return connected;
}

function renderErd() {
  const svg = d3.select('#data-erd-svg');
  svg.selectAll('*').remove();
  svg.attr('viewBox', '0 0 1040 720');
  const defs = svg.append('defs');
  defs.append('marker').attr('id', 'erd-arrow').attr('viewBox', '0 -5 10 10').attr('refX', 9).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#64748b');
  const viewport = svg.append('g').attr('class', 'erd-viewport');
  erdZoom = d3.zoom().scaleExtent([.5, 2]).on('zoom', (event) => viewport.attr('transform', event.transform));
  svg.call(erdZoom).on('dblclick.zoom', null).on('click', (event) => { if (event.target === svg.node()) clearSelection(); });
  const positions = {
    Person: [30, 36],
    LeerpretActie: [395, 28],
    Leerobject: [760, 36],
    Leerattractie: [30, 390],
    Leerbox: [395, 378],
    ServiceState: [760, 390],
  };
  const cardWidth = 250;
  const headerHeight = 42;
  const rowHeight = 27;

  const fieldPoint = ([modelId, fieldName], towardModelId) => {
    const model = schemaModels.find((item) => item.id === modelId);
    const [x, y] = positions[modelId];
    const [towardX] = positions[towardModelId];
    const index = model.fields.findIndex((field) => field.name === fieldName);
    return { x: towardX >= x ? x + cardWidth : x, y: y + headerHeight + index * rowHeight + rowHeight / 2, modelId };
  };
  const relationPoints = (relation) => ({
    source: fieldPoint(relation.source, relation.target[0]),
    target: fieldPoint(relation.target, relation.source[0]),
  });
  const relationGroup = viewport.append('g').attr('class', 'erd-relations').selectAll('g').data(schemaRelations).join('g').attr('data-source-model', (relation) => relation.source[0]).attr('data-target-model', (relation) => relation.target[0]);
  relationGroup.append('path').attr('d', (relation) => {
    const { source, target } = relationPoints(relation); const bend = (source.x + target.x) / 2;
    return `M${source.x},${source.y} C${bend},${source.y} ${bend},${target.y} ${target.x},${target.y}`;
  }).attr('marker-end', 'url(#erd-arrow)');
  relationGroup.append('text').attr('x', (relation) => { const { source, target } = relationPoints(relation); return (source.x + target.x) / 2; }).attr('y', (relation) => { const { source, target } = relationPoints(relation); return (source.y + target.y) / 2 - 5; }).attr('text-anchor', 'middle').text((relation) => relation.label);

  const cards = viewport.append('g').attr('class', 'erd-models').selectAll('g').data(schemaModels).join('g').attr('class', 'erd-model').attr('data-model-id', (model) => model.id).attr('transform', (model) => `translate(${positions[model.id][0]},${positions[model.id][1]})`).on('click', (event, model) => { event.stopPropagation(); selectErdModel(model.id); });
  cards.append('rect').attr('class', 'erd-card-bg').attr('width', cardWidth).attr('height', (model) => headerHeight + model.fields.length * rowHeight + 8).attr('rx', 10);
  cards.append('rect').attr('class', 'erd-card-head').attr('width', cardWidth).attr('height', headerHeight).attr('rx', 10).attr('fill', (model) => TYPE_STYLE[model.type].color);
  cards.append('rect').attr('y', 32).attr('width', cardWidth).attr('height', 10).attr('fill', (model) => TYPE_STYLE[model.type].color);
  cards.append('text').attr('class', 'erd-card-title').attr('x', 14).attr('y', 27).text((model) => model.id);
  cards.each(function(model) {
    const rows = d3.select(this).append('g').attr('transform', `translate(0,${headerHeight})`).selectAll('g').data(model.fields).join('g').attr('class', 'erd-field').attr('transform', (_, index) => `translate(0,${index * rowHeight})`);
    rows.append('line').attr('x1', 0).attr('x2', cardWidth).attr('y1', rowHeight).attr('y2', rowHeight);
    rows.append('text').attr('class', 'erd-field-key').attr('x', 10).attr('y', 18).text((field) => field.key);
    rows.append('text').attr('class', 'erd-field-name').attr('x', 42).attr('y', 18).text((field) => field.name);
    rows.append('text').attr('class', 'erd-field-type').attr('x', cardWidth - 10).attr('y', 18).attr('text-anchor', 'end').text((field) => field.type);
  });
}

function selectErdModel(id) {
  d3.selectAll('.erd-model').classed('selected', (model) => model.id === id).classed('dimmed', (model) => model.id !== id && !schemaRelations.some((relation) => (relation.source[0] === id && relation.target[0] === model.id) || (relation.target[0] === id && relation.source[0] === model.id)));
  d3.selectAll('.erd-relations > g').classed('highlighted', (relation) => relation.source[0] === id || relation.target[0] === id).classed('dimmed', (relation) => relation.source[0] !== id && relation.target[0] !== id);
  const model = schemaModels.find((item) => item.id === id);
  if (model) showMetadata(model.id, 'Datamodel', { table: model.id, fields: model.fields, relations: schemaRelations.filter((relation) => relation.source[0] === id || relation.target[0] === id) }, TYPE_STYLE[model.type].color);
}

function showMetadata(title, type, data, color) {
  const panel = document.querySelector('[data-metadata-panel]');
  if (!panel || panel.hasAttribute('data-disabled')) return;
  panel.hidden = false;
  panel.style.setProperty('--metadata-color', color);
  panel.querySelector('[data-metadata-title]').textContent = title;
  panel.querySelector('[data-metadata-type]').textContent = type;
  panel.querySelector('[data-metadata-json]').textContent = JSON.stringify(data, null, 2);
}

function clearSelection() {
  d3.selectAll('.network-node,.network-edges > g,.erd-model,.erd-relations > g').classed('selected', false).classed('highlighted', false).classed('dimmed', false);
  const panel = document.querySelector('[data-metadata-panel]');
  if (panel) panel.hidden = true;
}

function searchNodes(value) {
  const query = value.trim().toLowerCase();
  d3.selectAll('.network-node').classed('search-miss', (node) => query && !`${node.label} ${node.id} ${TYPE_STYLE[node.type].label}`.toLowerCase().includes(query));
  if (!query) return;
  const match = mockNodes.find((node) => `${node.label} ${node.id} ${TYPE_STYLE[node.type].label}`.toLowerCase().includes(query));
  if (match && activeView === 'network') selectNetworkNode(match.id);
}

function resetActiveView() {
  clearSelection();
  const svg = d3.select(activeView === 'network' ? '#data-network-svg' : '#data-erd-svg');
  const zoom = activeView === 'network' ? networkZoom : erdZoom;
  if (zoom) svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
}

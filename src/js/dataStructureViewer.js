import * as d3 from 'd3';
import { activeBlockRole, loadBlockAccess } from './pageBlocks.js';

const TYPE_STYLE = {
  person: { label: 'Person-ID', color: '#e11d48', icon: 'P' },
  action: { label: 'Actie', color: '#7c3aed', icon: 'A' },
  learningbox: { label: 'Leerbox', color: '#059669', icon: 'L' },
  learningobject: { label: 'Leerobject', color: '#2563eb', icon: 'O' },
  resistance: { label: 'Weerstand', color: '#d97706', icon: 'W' },
  measurement: { label: 'Leerpretmeting', color: '#0891b2', icon: 'M' },
};

export const mockNodes = [
  { id: 'person-1042-3', type: 'person', label: 'Person 1042 · sessie 3', data: { person_id: 'nfc-1042:3', account_id: null, session_index: 3, linked: false, released_at: null } },
  { id: 'box-phile', type: 'learningbox', label: 'Phile', data: { leerbox_id: 'phile', status: 'pilot', version: '0.8.2', attraction_id: 'filosofiepark' } },
  { id: 'object-raster', type: 'learningobject', label: 'Rasterbrein', data: { leerobject_id: 'rasterbrein', leerbox_id: 'phile', sequence: 3, marker_focus: ['V', 'R'] } },
  { id: 'object-cards', type: 'learningobject', label: 'Kaartkeuze', data: { leerobject_id: 'kaartkeuze', leerbox_id: 'phile', sequence: 2, marker_focus: ['A', 'S'] } },
  { id: 'resistance-grid', type: 'resistance', label: 'Geblokkeerde route', data: { resistance_id: 'route-block-7', leerobject_id: 'rasterbrein', severity: 0.72, resolved: false } },
  { id: 'action-select', type: 'action', label: 'Selecteer kaart', data: { action_id: 'act-9f31', person_id: 'nfc-1042:3', leerbox_id: 'phile', leerobject_id: 'kaartkeuze', timestamp: '2026-07-15T08:41:12Z', duration_ms: 1840 } },
  { id: 'action-retry', type: 'action', label: 'Probeer route opnieuw', data: { action_id: 'act-9f38', person_id: 'nfc-1042:3', leerbox_id: 'phile', leerobject_id: 'rasterbrein', resistance_id: 'route-block-7', timestamp: '2026-07-15T08:43:31Z', duration_ms: 6240 } },
  { id: 'measurement-1', type: 'measurement', label: 'Leerpretmeting 9f40', data: { measurement_id: 'measure-9f40', person_id: 'nfc-1042:3', leerbox_id: 'phile', alpha_score: 0.73, leerpret_score: 0.78, calculated_at: '2026-07-15T08:44:02Z' } },
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
];

export const schemaModels = [
  { id: 'Person', type: 'person', fields: [{ name: 'id', type: 'string', key: 'PK' }, { name: 'account_id', type: 'string?', key: '' }, { name: 'session_index', type: 'integer', key: '' }, { name: 'released_at', type: 'datetime?', key: '' }] },
  { id: 'Leerbox', type: 'learningbox', fields: [{ name: 'id', type: 'string', key: 'PK' }, { name: 'attraction_id', type: 'string', key: 'FK' }, { name: 'status', type: 'enum', key: '' }, { name: 'version', type: 'string', key: '' }] },
  { id: 'Leerobject', type: 'learningobject', fields: [{ name: 'id', type: 'string', key: 'PK' }, { name: 'leerbox_id', type: 'string', key: 'FK' }, { name: 'sequence', type: 'integer', key: '' }, { name: 'marker_focus', type: 'string[]', key: '' }] },
  { id: 'Actie', type: 'action', fields: [{ name: 'id', type: 'uuid', key: 'PK' }, { name: 'person_id', type: 'string', key: 'FK' }, { name: 'leerbox_id', type: 'string', key: 'FK' }, { name: 'leerobject_id', type: 'string', key: 'FK' }, { name: 'resistance_id', type: 'string?', key: 'FK' }, { name: 'timestamp', type: 'datetime', key: '' }, { name: 'duration_ms', type: 'integer', key: '' }] },
  { id: 'Weerstand', type: 'resistance', fields: [{ name: 'id', type: 'string', key: 'PK' }, { name: 'leerobject_id', type: 'string', key: 'FK' }, { name: 'severity', type: 'decimal', key: '' }, { name: 'resolved', type: 'boolean', key: '' }] },
  { id: 'LeerpretMeting', type: 'measurement', fields: [{ name: 'id', type: 'uuid', key: 'PK' }, { name: 'person_id', type: 'string', key: 'FK' }, { name: 'leerbox_id', type: 'string', key: 'FK' }, { name: 'alpha_score', type: 'decimal', key: '' }, { name: 'leerpret_score', type: 'decimal', key: '' }, { name: 'calculated_at', type: 'datetime', key: '' }] },
];

export const schemaRelations = [
  { source: ['Actie', 'person_id'], target: ['Person', 'id'], label: 'uitgevoerd door' },
  { source: ['Actie', 'leerbox_id'], target: ['Leerbox', 'id'], label: 'binnen' },
  { source: ['Actie', 'leerobject_id'], target: ['Leerobject', 'id'], label: 'activeert' },
  { source: ['Actie', 'resistance_id'], target: ['Weerstand', 'id'], label: 'ontmoet' },
  { source: ['Leerobject', 'leerbox_id'], target: ['Leerbox', 'id'], label: 'behoort tot' },
  { source: ['Weerstand', 'leerobject_id'], target: ['Leerobject', 'id'], label: 'blokkeert' },
  { source: ['LeerpretMeting', 'person_id'], target: ['Person', 'id'], label: 'meet voor' },
  { source: ['LeerpretMeting', 'leerbox_id'], target: ['Leerbox', 'id'], label: 'meet in' },
];

let activeView = 'network';
let networkSimulation;
let networkZoom;
let erdZoom;

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

  renderNetwork();
  renderErd();
  bindControls();
  updateView('network');
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
  document.querySelector('[data-reset-view]')?.addEventListener('click', resetActiveView);
  document.querySelector('[data-close-metadata]')?.addEventListener('click', clearSelection);
  const search = document.querySelector('[data-node-search]');
  search?.addEventListener('input', () => searchNodes(search.value));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') clearSelection(); });
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
  document.querySelector('[data-view-title]').textContent = activeView === 'network' ? 'Datastroom en verbindingen' : 'Schema en veldrelaties';
  document.querySelector('[data-view-description]').textContent = activeView === 'network'
    ? 'Volg actuele objecten van Person-ID via Acties naar de Leerbox en meting.'
    : 'Bekijk modellen, primaire sleutels en verwijzingen tussen velden.';
  requestAnimationFrame(() => activeView === 'network' ? networkSimulation?.alpha(.25).restart() : null);
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
  const positions = { Person:[30,40], Leerbox:[395,28], Leerobject:[760,40], Actie:[30,350], LeerpretMeting:[395,390], Weerstand:[760,350] };
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

import assert from 'node:assert/strict';
import {
  connectedNodeIds,
  mockEdges,
  mockNodes,
  schemaModels,
  schemaRelations,
} from '../src/js/dataStructureViewer.js';

const nodeIds = new Set(mockNodes.map((node) => node.id));
for (const edge of mockEdges) {
  assert(nodeIds.has(edge.source), `Unknown edge source: ${edge.source}`);
  assert(nodeIds.has(edge.target), `Unknown edge target: ${edge.target}`);
}

const actionPath = connectedNodeIds('action-retry');
assert(actionPath.has('person-1042-3'));
assert(actionPath.has('object-raster'));
assert(actionPath.has('resistance-grid'));
assert(actionPath.has('measurement-1'));
assert(!actionPath.has('object-cards'));

const modelById = new Map(schemaModels.map((model) => [model.id, model]));
for (const relation of schemaRelations) {
  for (const [modelId, fieldName] of [relation.source, relation.target]) {
    const model = modelById.get(modelId);
    assert(model, `Unknown relation model: ${modelId}`);
    assert(model.fields.some((field) => field.name === fieldName), `Unknown relation field: ${modelId}.${fieldName}`);
  }
}

console.log('Data structure tests passed.');

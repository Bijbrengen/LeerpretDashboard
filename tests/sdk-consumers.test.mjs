import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';

import { objectClockLabelGeometry, ringSegmentPath } from '../src/js/objectClockGeometry.js';
import { parkPosition } from '../src/js/parkLayout.js';
import { generateRadarSvg } from '../src/js/serviceRadar.js';
import { clockSliderY } from '../src/js/editorClockGeometry.js';

const parkSource = fs.readFileSync(new URL('../src/pages/park.astro', import.meta.url), 'utf8');
const parkLayoutSource = fs.readFileSync(new URL('../src/js/parkLayout.js', import.meta.url), 'utf8');
const learningboxSource = fs.readFileSync(new URL('../src/pages/learningbox.astro', import.meta.url), 'utf8');
const objectClockSource = fs.readFileSync(new URL('../src/js/objectClockGeometry.js', import.meta.url), 'utf8');
const serviceSource = fs.readFileSync(new URL('../src/pages/service.astro', import.meta.url), 'utf8');
const editorSource = fs.readFileSync(new URL('../src/pages/editor.astro', import.meta.url), 'utf8');
const radarSource = fs.readFileSync(new URL('../src/js/serviceRadar.js', import.meta.url), 'utf8');

function radarSpatialFixture() {
  const calls = { radialPoint: [], radialAxes: [], radarSeriesPoints: [] };
  const point = (angle, options = {}) => {
    const center = options.center || [options.centerX || 0, options.centerY ?? options.centerX ?? 0];
    const radius = options.radius ?? 1;
    const radiusX = options.radiusX ?? radius;
    const radiusY = options.radiusY ?? radius;
    const deltaX = Math.cos(angle) * radiusX;
    const deltaY = Math.sin(angle) * radiusY;
    return { angle, deltaX, deltaY, x: center[0] + deltaX, y: center[1] + deltaY };
  };
  const axes = (axisCount, options = {}) => {
    const startAngle = options.startAngle ?? -Math.PI / 2;
    const sweepAngle = options.sweepAngle ?? Math.PI * 2;
    return Array.from({ length: axisCount }, (_, index) => {
      const angle = startAngle + index * (sweepAngle / axisCount);
      return { index, ...point(angle, options) };
    });
  };
  return {
    calls,
    component: {
      radialPoint(angle, options) {
        calls.radialPoint.push({ angle, options });
        return point(angle, options);
      },
      radialAxes(axisCount, options) {
        calls.radialAxes.push({ axisCount, options });
        return axes(axisCount, options);
      },
      radarSeriesPoints(values, options = {}) {
        calls.radarSeriesPoints.push({ values: [...values], options });
        const center = options.center || [options.centerX || 0, options.centerY ?? options.centerX ?? 0];
        const valueScale = options.valueScale ?? 1;
        return axes(values.length, options).map((axis, index) => {
          const value = Number(values[index]) || 0;
          const fraction = value * valueScale;
          return {
            index,
            angle: axis.angle,
            value,
            fraction,
            x: center[0] + axis.deltaX * fraction,
            y: center[1] + axis.deltaY * fraction,
            axisX: axis.x,
            axisY: axis.y,
          };
        });
      },
    },
  };
}

test('de radaradapter delegeert alle poolwiskunde en behoudt de bestaande SVG-bytes', () => {
  const { calls, component } = radarSpatialFixture();
  const fixtures = [
    [{ T: 0, A: 0, V: 0, R: 0, S: 0 }, '38678c20a797b5f80d4fddcb40639933cd1b58e10b504aaf1f0d6d59468e71db'],
    [{ T: 0.6, A: 0.6, V: 0.33, R: 0.67, S: 1 }, '9b187e403d1d525dea798ee31e2f948060104aec0fc089f5d5e5900779aa956c'],
    [{ T: 0.818, A: 0.88, V: 0.581, R: 0.907, S: 0.807 }, '56cef535832975ff85cec39f84fd9c572db64480b28de6a30868e567a988ce22'],
  ];

  fixtures.forEach(([markers, expectedHash]) => {
    const markup = generateRadarSvg(markers, component);
    assert.equal(crypto.createHash('sha256').update(markup).digest('hex'), expectedHash);
    assert.equal(markup.length, 3377);
  });

  assert.ok(calls.radialAxes.length >= fixtures.length * 2);
  assert.ok(calls.radarSeriesPoints.length >= fixtures.length * 9);
  assert.doesNotMatch(radarSource, /Math\.(?:cos|sin)/);
  assert.doesNotMatch(serviceSource, /Math\.(?:cos|sin)/);
});

test('de service laadt lego-spatial voordat de eerste radar wordt gerenderd', () => {
  assert.match(serviceSource, /loadSdkComponents\('lego-spatial'\)/);
  assert.match(serviceSource, /radarSpatialComponent = components\['lego-spatial'\]/);
  const loadIndex = serviceSource.indexOf("await loadSdkComponents('lego-spatial')");
  const firstRenderAfterLoad = serviceSource.indexOf('resetResultsCardToEmpty();', loadIndex);
  assert.ok(loadIndex >= 0 && firstRenderAfterLoad > loadIndex);
});

test('de parkellips delegeert anisotrope posities en behoudt alle bestaande procentcoordinaten', () => {
  const { calls, component } = radarSpatialFixture();
  const positions = Array.from({ length: 32 }, (_, index) => parkPosition(index, component));
  assert.equal(
    crypto.createHash('sha256').update(JSON.stringify(positions)).digest('hex'),
    '5115728f5ea76eeae8c14eb60e05cb1f140ae1c3636b866602f435d038cd68ad'
  );
  assert.deepEqual(positions.slice(8, 12), [
    { x: 83, y: 56 },
    { x: 65, y: 75 },
    { x: 38, y: 76 },
    { x: 19, y: 60 },
  ]);
  assert.equal(calls.radialPoint.length, 24);
  assert.ok(calls.radialPoint.every(call => (
    call.options.radiusX === 34
    && call.options.radiusY === 30
  )));
  assert.doesNotMatch(parkSource, /Math\.(?:cos|sin)/);
  assert.doesNotMatch(parkLayoutSource, /Math\.(?:cos|sin)/);
  assert.match(parkSource, /await loadSdkComponents\('lego-spatial'\)/);
});

test('de objectklok delegeert willekeurige poolhoeken en behoudt paden en labelankers bytegelijk', () => {
  const { calls, component } = radarSpatialFixture();
  const rings = [
    { center: [260, 260], outerRadius: 144, innerRadius: 92, startDegrees: 0.6, endDegrees: 89.4 },
    { center: [260, 260], outerRadius: 144, innerRadius: 92, startDegrees: 90.6, endDegrees: 359.4 },
    { center: [60, 40], outerRadius: 25, innerRadius: 12, startDegrees: -20.5, endDegrees: 200.25 },
  ].map(options => ringSegmentPath(component, options));
  const labels = [0, 45, 135, 180, 225, 315].map(angleDegrees => {
    const label = objectClockLabelGeometry(component, {
      center: [260, 260],
      outerRadius: 144,
      angleDegrees,
    });
    return {
      rechts: label.right,
      line: `M ${label.x1.toFixed(1)} ${label.y1.toFixed(1)} L ${label.x2.toFixed(1)} ${label.y2.toFixed(1)} L ${label.x3.toFixed(1)} ${label.y2.toFixed(1)}`,
      textX: label.textX.toFixed(1),
      textY: label.textY.toFixed(1),
    };
  });
  assert.equal(
    crypto.createHash('sha256').update(JSON.stringify({ rings, labels })).digest('hex'),
    '0116bee08383d836302726598af54fdd464bdfc029e231c009899db3a0e08bac'
  );
  assert.equal(calls.radialPoint.length, rings.length * 4 + labels.length * 3);
  assert.doesNotMatch(learningboxSource, /Math\.(?:cos|sin)/);
  assert.doesNotMatch(objectClockSource, /Math\.(?:cos|sin)/);
  assert.match(learningboxSource, /await loadSdkComponents\('lego-spatial'\)/);
});

test('de editor-klok delegeert clientrectmapping met exact dezelfde schaal en begrenzing', () => {
  const calls = [];
  const spatial = {
    mapPointBetweenRects(point, sourceRect, targetRect, options) {
      calls.push({ point, sourceRect, targetRect, options });
      const x = targetRect.x + (Number(point.clientX ?? point.x) - sourceRect.left) / Math.max(1, sourceRect.width) * targetRect.width;
      const y = targetRect.y + (Number(point.clientY ?? point.y) - sourceRect.top) / Math.max(1, sourceRect.height) * targetRect.height;
      return { x, y };
    },
  };
  const rect = { left: 20, top: 100, width: 200, height: 400 };
  const values = [50, 100, 200, 300, 500, 550]
    .map(clientY => clockSliderY(spatial, { clientX: 20, clientY }, rect));

  assert.deepEqual(values, [18, 18, 46, 110, 202, 202]);
  assert.equal(calls.length, values.length);
  assert.ok(calls.every(call => (
    call.targetRect.x === 0
    && call.targetRect.y === -18
    && call.targetRect.width === 1
    && call.targetRect.height === 256
    && call.options.minimumSourceExtent === 1
  )));
  assert.match(editorSource, /loadSdkComponents\('lego-spatial'\)/);
  assert.match(editorSource, /clockSliderY\(editorSpatial, event, rect\)/);
  assert.doesNotMatch(editorSource, /\(event\.clientY - rect\.top\) \/ rect\.height \* 256/);
});

test('de gedeelde SDK-loader injecteert en laadt gelijktijdige componenten maar eenmaal', async () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
  let scriptCount = 0;
  let loaderCreateCount = 0;
  let clientCreateCount = 0;
  const componentLoads = [];

  globalThis.localStorage = storage;
  globalThis.sessionStorage = storage;
  globalThis.window = {
    LEERPRET_CONFIG: {
      apiBase: 'https://engine.example/api',
      editorUrl: 'https://editor.example/',
    },
    location: { href: 'https://dashboard.example/', search: '' },
  };
  globalThis.document = {
    createElement(name) {
      assert.equal(name, 'script');
      return {};
    },
    head: {
      appendChild(script) {
        scriptCount += 1;
        assert.match(script.src, /^https:\/\/engine\.example\/api\/sdk\/sdk-loader\/loader\.js\?bootstrap=\d+$/);
        queueMicrotask(() => {
          const components = {};
          const loader = {
            async load(componentName) {
              componentLoads.push(componentName);
              await Promise.resolve();
              components[componentName] = Object.freeze({ name: componentName });
            },
          };
          window.LeerpretSDK = {
            components,
            Loader: {
              create({ base }) {
                loaderCreateCount += 1;
                assert.equal(base, 'https://engine.example/api');
                return loader;
              },
            },
            create(options) {
              clientCreateCount += 1;
              assert.equal(options.apiBase, 'https://engine.example/api');
              return {
                async request() {
                  return {
                    ok: true,
                    async json() { return { status: 'ok' }; },
                  };
                },
              };
            },
          };
          script.onload();
        });
      },
    },
  };

  const api = await import(`../src/js/api.js?sdk-loader-test=${Date.now()}`);
  const [first, second, third] = await Promise.all([
    api.loadSdkComponents('lego-spatial'),
    api.loadSdkComponents(['lego-spatial']),
    api.loadSdkComponents('lego-spatial', 'lego-spatial'),
  ]);
  assert.equal(first['lego-spatial'], second['lego-spatial']);
  assert.equal(first['lego-spatial'], third['lego-spatial']);

  assert.deepEqual(await api.apiGet('/health'), { status: 'ok' });
  await api.loadSdkComponents('api-client', 'lego-spatial');
  assert.equal(scriptCount, 1);
  assert.equal(loaderCreateCount, 1);
  assert.equal(clientCreateCount, 1);
  assert.deepEqual(componentLoads.sort(), ['api-client', 'lego-spatial']);
});

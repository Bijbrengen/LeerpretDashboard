const RADAR_CENTER = 60;
const RADAR_RADIUS = 45;
const RADAR_AXES = Object.freeze(['T', 'A', 'V', 'R', 'S']);
const RADAR_OPTIONS = Object.freeze({ center: [RADAR_CENTER, RADAR_CENTER], radius: RADAR_RADIUS });

const ARCHETYPE_VECTORS = Object.freeze({
  "Veroveraar": Object.freeze({ T: 0.818, A: 0.880, V: 0.581, R: 0.907, S: 0.807 }),
  "Verwerver": Object.freeze({ T: 0.740, A: 0.778, V: 0.556, R: 0.615, S: 0.765 }),
  "Verkenner": Object.freeze({ T: 0.830, A: 0.833, V: 0.854, R: 0.719, S: 0.790 }),
  "Volger": Object.freeze({ T: 0.764, A: 0.700, V: 0.359, R: 0.553, S: 0.594 })
});

const ARCHETYPE_COLORS = Object.freeze({
  "Veroveraar": "#FF4B4B",
  "Verwerver": "#0068C9",
  "Verkenner": "#FF8C00",
  "Volger": "#29B09D"
});

function radarGeometry(spatial) {
  if (!spatial?.radialAxes || !spatial?.radarSeriesPoints) {
    throw new Error("De centrale LeerpretSDK-radargeometrie is niet geladen.");
  }
  return spatial;
}

function valuesFor(source) {
  return RADAR_AXES.map(axis => source?.[axis] ?? 0);
}

export function generateRadarSvg(markers, spatialComponent) {
  const spatial = radarGeometry(spatialComponent);
  const center = RADAR_CENTER;
  const maxRadius = RADAR_RADIUS;
  const axes = RADAR_AXES;
  const axisPoints = spatial.radialAxes(axes.length, RADAR_OPTIONS);
  const labelPoints = spatial.radialAxes(axes.length, {
    center: RADAR_OPTIONS.center,
    radius: maxRadius + 10
  });
  const points = spatial.radarSeriesPoints(valuesFor(markers), RADAR_OPTIONS)
    .map((point, index) => ({ ...point, label: axes[index] }));

  let gridHtml = '';
  [0.25, 0.5, 0.75, 1.0].forEach(level => {
    const levelPoints = spatial.radarSeriesPoints(
      axes.map(() => level),
      RADAR_OPTIONS
    ).map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
    gridHtml += `<polygon points="${levelPoints}" class="radar-grid-line" stroke="#cbd5e1" stroke-width="0.75" fill="none" />`;
  });

  let standardPolysHtml = '';
  Object.entries(ARCHETYPE_VECTORS).forEach(([name, vec]) => {
    const polyPoints = spatial.radarSeriesPoints(valuesFor(vec), RADAR_OPTIONS)
      .map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
    standardPolysHtml += `
          <polygon points="${polyPoints}" stroke="${ARCHETYPE_COLORS[name]}" stroke-width="1.2" stroke-dasharray="1.5,1.5" fill="none" style="opacity: 0.65;" />
        `;
  });

  let axesHtml = '';
  points.forEach((pt, i) => {
    const axisPoint = axisPoints[i];
    const labelPoint = labelPoints[i];
    const lineX = axisPoint.x;
    const lineY = axisPoint.y;
    const labelX = labelPoint.x;
    const labelY = labelPoint.y + 3;

    axesHtml += `
          <line x1="${center}" y1="${center}" x2="${lineX.toFixed(1)}" y2="${lineY.toFixed(1)}" class="radar-axis-line" stroke="#94a3b8" stroke-width="0.75" stroke-dasharray="2,2" />
          <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" class="radar-axis-label" text-anchor="middle" font-size="8" font-weight="800" fill="#475569">${pt.label}</text>
        `;
  });

  const polyPoints = points.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

  return `
        <svg class="radar-chart-svg" viewBox="0 0 120 120" style="width: 100%; height: 100%;">
          ${gridHtml}
          ${standardPolysHtml}
          ${axesHtml}
          <polygon points="${polyPoints}" class="radar-value-poly" fill="rgba(15, 118, 110, 0.22)" stroke="var(--green)" stroke-width="2.5" />
          ${points.map(pt => `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="2.5" fill="var(--green)" />`).join('')}
        </svg>
      `;
}

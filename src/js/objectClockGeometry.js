function spatialGeometry(spatial) {
  if (!spatial?.radialPoint) {
    throw new Error("De centrale LeerpretSDK-radiale puntgeometrie is niet geladen.");
  }
  return spatial;
}

function clockAngleRadians(degrees) {
  return ((Number(degrees) - 90) * Math.PI) / 180;
}

function clockPoint(spatial, center, radius, degrees) {
  return spatialGeometry(spatial).radialPoint(clockAngleRadians(degrees), { center, radius });
}

export function ringSegmentPath(spatial, options = {}) {
  const center = options.center || [0, 0];
  const outerRadius = Number(options.outerRadius);
  const innerRadius = Number(options.innerRadius);
  const startDegrees = Number(options.startDegrees);
  const endDegrees = Number(options.endDegrees);
  const largeArc = endDegrees - startDegrees > 180 ? 1 : 0;
  const outerStart = clockPoint(spatial, center, outerRadius, startDegrees);
  const outerEnd = clockPoint(spatial, center, outerRadius, endDegrees);
  const innerEnd = clockPoint(spatial, center, innerRadius, endDegrees);
  const innerStart = clockPoint(spatial, center, innerRadius, startDegrees);
  return `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`
    + ` A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`
    + ` L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`
    + ` A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)} Z`;
}

export function objectClockLabelGeometry(spatial, options = {}) {
  const center = options.center || [0, 0];
  const outerRadius = Number(options.outerRadius);
  const angleDegrees = Number(options.angleDegrees);
  const startOffset = Number(options.startOffset ?? 7);
  const endOffset = Number(options.endOffset ?? 31);
  const horizontalLength = Number(options.horizontalLength ?? 22);
  const textOffset = Number(options.textOffset ?? 5);
  const textBaselineOffset = Number(options.textBaselineOffset ?? 3.5);
  const direction = clockPoint(spatial, [0, 0], 1, angleDegrees);
  const right = direction.deltaX >= 0;
  const start = clockPoint(spatial, center, outerRadius + startOffset, angleDegrees);
  const end = clockPoint(spatial, center, outerRadius + endOffset, angleDegrees);
  const x3 = end.x + (right ? horizontalLength : -horizontalLength);
  return Object.freeze({
    right,
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
    x3,
    textX: x3 + (right ? textOffset : -textOffset),
    textY: end.y + textBaselineOffset,
  });
}

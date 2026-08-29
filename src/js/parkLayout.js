const PARK_PRESETS = Object.freeze([
  Object.freeze({ x: 17, y: 28 }),
  Object.freeze({ x: 39, y: 20 }),
  Object.freeze({ x: 64, y: 24 }),
  Object.freeze({ x: 78, y: 44 }),
  Object.freeze({ x: 58, y: 66 }),
  Object.freeze({ x: 31, y: 70 }),
  Object.freeze({ x: 15, y: 58 }),
  Object.freeze({ x: 82, y: 72 }),
]);

const PARK_ELLIPSE = Object.freeze({ center: [50, 48], radiusX: 34, radiusY: 30 });

export function parkPosition(index, spatial) {
  if (PARK_PRESETS[index]) return PARK_PRESETS[index];
  if (!spatial?.radialPoint) {
    throw new Error("De centrale LeerpretSDK-radiale geometrie is niet geladen.");
  }
  const point = spatial.radialPoint((index * 47 * Math.PI) / 180, {
    ...PARK_ELLIPSE,
  });
  return {
    x: Math.round(point.x),
    y: Math.round(point.y),
  };
}

const CLOCK_SLIDER_PROFILE = Object.freeze({
  minimumY: 18,
  maximumY: 202,
  sourceViewY: -18,
  sourceViewHeight: 256,
});

export function clockSliderY(spatial, point, clientRect, options = {}) {
  if (!spatial?.mapPointBetweenRects) {
    throw new Error("De centrale LeerpretSDK-rechthoekmapping is niet geladen.");
  }
  const profile = { ...CLOCK_SLIDER_PROFILE, ...options };
  const mapped = spatial.mapPointBetweenRects(
    point,
    clientRect,
    { x: 0, y: profile.sourceViewY, width: 1, height: profile.sourceViewHeight },
    { minimumSourceExtent: 1 }
  );
  return Math.max(profile.minimumY, Math.min(profile.maximumY, mapped.y));
}

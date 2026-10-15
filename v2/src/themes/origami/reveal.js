// How things rise out of the map as it unrolls. Pure functions of the roll
// front `u`, so scrolling back folds everything down again and reduced
// motion needs no special state.

export const clamp01 = (x) => Math.min(1, Math.max(0, x))

/** 0 while a thing at `s` is still under the roll, 1 once it stands; `span` units of unroll in between. */
export const revealT = (u, s, stagger = 0, span = 3) => clamp01((u - s - 2 - stagger) / span)

/** Overshoots a little before settling, like card springing up. */
export const backOut = (t, c = 1.70158) => {
  const x = t - 1
  return 1 + (c + 1) * x * x * x + c * x * x
}

/** How scenery rises: settles with the slightest give, no bounce to watch. */
export const rise = (t) => backOut(t, 0.6)

/** Lying flat on the paper at 0, upright from 0.7 on: a pop-up book hinge. */
export const hinge = (t) => (1 - Math.min(1, t * 1.4)) * -Math.PI / 2

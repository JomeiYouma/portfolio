// Geometry of the journey. The map lies on the XZ plane; `s` is the distance
// along it from its head and world z = -s, so the visitor travels toward -z.
// Three-free: OrigamiTheme reaches this file eagerly.

export const WIDTH = 10
export const COUNT = 7
export const HEAD = 8 // s of the first stop
export const STATION_GAP = 14
export const STATION_S = Array.from({ length: COUNT }, (_, i) => HEAD + i * STATION_GAP) // 8 … 92
export const LENGTH = STATION_S[COUNT - 1] + 12 // a tail of map after the last stop
// The roll front stays this far ahead of the focus
export const LEAD = 9

// The visitor stands high and a little behind the focus, looking down the road
export const EYE = { height: 8.5, back: 9.5, ahead: 1.2 }
export const FOV = 42
export const FOV_PORTRAIT = 60

// Where the road passes at each stop, and where its name is lettered: a
// caption a little before the stop, on the other side of the road from
// what stands there
export const ROAD_X = [0, 2, 3.2, -3.5, -1, -3.6, 2.4]
export const LETTER_X = [0, -0.3, 0.3, -0.3, 0.3, -0.3, 0]
export const LETTER_DS = -1.6

/** Each name lettered on the map: its centre and size on the paper. */
export const LETTERS = STATION_S.map((s, i) => (i === 0
  ? { index: 0, x: LETTER_X[0], s, width: 6, height: 2.4 }
  : { index: i, x: LETTER_X[i], s: s + LETTER_DS, width: 4.6, height: 1.5 }))

/** Whether a point of the paper falls on a name, `margin` included. */
export const onLettering = (x, s, margin = 0) => LETTERS.some((l) =>
  Math.abs(x - l.x) <= l.width / 2 + margin && Math.abs(s - l.s) <= l.height / 2 + margin)

/** Eases in and out with no jolt at either end (zero speed and acceleration). */
export const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10)

/**
 * Splits a progress in [0, 1] into the leg it is on and how far along it:
 * { i, f } with f in [0, 1], or outside it during the opening.
 */
export const legAt = (progress) => {
  const span = COUNT - 1
  const x = progress * span
  const i = Math.max(0, Math.min(span - 1, Math.floor(x)))
  return { i, f: x - i }
}

/**
 * s of the focus for a progress in [0, 1] (a little outside it during the
 * opening). The page holds the progress still while a note is read
 * (useStations.js); here each leg between two stops is one smooth journey.
 */
export const sAt = (progress) => {
  const { i, f } = legAt(progress)
  const eased = f < 0 || f > 1 ? f : smoother(f)
  return STATION_S[i] + eased * STATION_GAP
}

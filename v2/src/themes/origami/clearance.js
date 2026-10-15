import { ALBUM, PRINT } from './album'
import { FURNITURE } from './furniture'
import { STOPS } from './stops'
import { EYE, LETTERS, STATION_S } from './track'

// What may stand near the names lettered on the map without hiding a letter
// of them. Three-free; the scene runs the check in development and logs
// what it finds.

// Seen from the camera settled at a stop, a thing of height `y` at `s` hides
// the paper up to where the ray over its top meets the ground; it also
// spreads sideways, away from the middle of the view
const reach = (camera, s, y) => camera + ((s - camera) * EYE.height) / (EYE.height - Math.min(y, EYE.height - 0.5))
const spread = (x, y) => (x * EYE.height) / (EYE.height - Math.min(y, EYE.height - 0.5))

const MARGIN = 0.15

/**
 * Everything standing on the map or the desk that hides part of a name as
 * seen from that name's own stop. `sizeOf(type, seed)` gives a prop's
 * extent: { h (top), y0 (bottom), r (footprint radius) } at scale 1.
 */
export const clearanceReport = (sizeOf) => {
  const things = []
  STOPS.forEach((stop, i) => {
    stop.deco.forEach((item) => things.push({ ...item, s: STATION_S[i] + item.ds, what: `deco ${item.type} @${i}` }))
    stop.landmarks.forEach((item) => things.push({ ...item, s: STATION_S[i] + item.ds, what: `landmark ${item.id}` }))
  })
  FURNITURE.forEach((item) => things.push({ ...item, what: `furniture ${item.type}` }))

  const conflicts = []
  const test = (what, x, s, r, y0, y1) => LETTERS.forEach((l) => {
    const camera = STATION_S[l.index] - EYE.back
    if (s - r <= camera) return
    const near = y0 > 0 ? reach(camera, s - r, y0) : s - r
    const far = reach(camera, s + r, y1)
    const left = Math.min(x - r, spread(x - r, y1))
    const right = Math.max(x + r, spread(x + r, y1))
    const hit = near <= l.s + l.height / 2 + MARGIN && far >= l.s - l.height / 2 - MARGIN
      && left <= l.x + l.width / 2 + MARGIN && right >= l.x - l.width / 2 - MARGIN
    if (hit) conflicts.push(`${what} (x ${x.toFixed(1)}, s ${s.toFixed(1)}) hides the name of stop ${l.index}`)
  })

  things.forEach((item) => {
    const size = sizeOf(item.type, item.seed ?? 1)
    const scale = item.scale ?? 1
    const y = item.y ?? 0
    test(item.what, item.x, item.s, size.r * scale, y + size.y0 * scale, y + size.h * scale + 0.2)
  })
  // The prints lie flat, their pin stands a little
  ALBUM.forEach((print) => test(`print ${print.id}`, print.x, print.s, PRINT.width / 2 + PRINT.border, 0, 0.35))
  return conflicts
}

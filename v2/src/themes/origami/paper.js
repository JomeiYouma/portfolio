// Paper shapes for the HTML side: torn edges and tilts of the cartouches, the
// strip of the folded map in the rail. Three-free: imported eagerly.

const hash = (i, j) => {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// Degrees of tilt of each cartouche; the widest (projects) tilts least
export const TILTS = [0.6, -0.8, 0.35, -0.6, 0.8, -0.5, 0.7]

/**
 * A CSS polygon with torn edges: `notches` per edge, each cut up to `depth`
 * px deep. Positions along an edge are percentages, cuts are pixels, so the
 * tear looks the same on a small note and on a long one.
 */
export const deckle = (seed, notches = 28, depth = 5) => {
  const points = []
  const cut = (k) => (hash(k, seed) * depth).toFixed(1)
  for (let i = 0; i <= notches; i++) {
    const p = ((i / notches) * 100).toFixed(2)
    points.push(`${p}% ${cut(i)}px`)
  }
  for (let i = 1; i <= notches; i++) {
    const p = ((i / notches) * 100).toFixed(2)
    points.push(`calc(100% - ${cut(100 + i)}px) ${p}%`)
  }
  for (let i = notches - 1; i >= 0; i--) {
    const p = ((i / notches) * 100).toFixed(2)
    points.push(`${p}% calc(100% - ${cut(200 + i)}px)`)
  }
  for (let i = notches - 1; i >= 1; i--) {
    const p = ((i / notches) * 100).toFixed(2)
    points.push(`${cut(300 + i)}px ${p}%`)
  }
  return `polygon(${points.join(', ')})`
}

/**
 * The back of the folded map in the rail, as SVG polygon points in a 36 × 100
 * box (or 100 × 36 across): the long sides are torn, the short ends straight.
 * Only the short axis is jittered, so stretching the long axis keeps the look.
 */
export const stripPoints = (horizontal = false, notches = 25) => {
  const along = (i) => (i / notches) * 100
  const left = []
  const right = []
  for (let i = 0; i <= notches; i++) {
    left.push([3 + (hash(i, 5) - 0.5) * 3.2, along(i)])
    right.push([33 + (hash(i, 7) - 0.5) * 3.2, along(i)])
  }
  const ring = [...left, ...right.reverse()]
  return ring.map(([x, y]) => (horizontal ? `${y.toFixed(1)},${x.toFixed(1)}` : `${x.toFixed(1)},${y.toFixed(1)}`)).join(' ')
}

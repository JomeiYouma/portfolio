// The screen breaking like glass: the last frame of the scene is cut into
// a crack web around the impact and the pieces fall away, showing the theme
// that was painted behind. Pure functions here; Shatter.jsx renders them.

const mulberry = (seed) => {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Cuts the viewport into cells around (cx, cy): rays with jittered angles,
 * rings with jittered radii, a kink on every radial edge so nothing is a
 * straight fan. Shared vertices keep the tiling exact. The outer ring reaches
 * past the corners; each cell's box is clipped to the viewport.
 */
export const makeShardPolygons = (cx, cy, w, h, { sectors = 12, rings = 3, seed = 1 } = {}) => {
  const rnd = mulberry(seed)
  const corners = [[0, 0], [w, 0], [w, h], [0, h]]
  const dMax = Math.max(...corners.map(([x, y]) => Math.hypot(x - cx, y - cy)))
  const thetas = []
  for (let i = 0; i < sectors; i++) thetas.push((i / sectors) * Math.PI * 2 + ((rnd() - 0.5) * 0.7 * Math.PI * 2) / sectors)
  thetas.sort((a, b) => a - b)

  const r0 = 0.07 * Math.min(w, h)
  const rLast = 0.55 * dMax
  const growth = rings > 1 ? Math.pow(rLast / r0, 1 / (rings - 1)) : 1
  const radii = [0]
  for (let k = 0; k < rings; k++) radii.push(r0 * Math.pow(growth, k))
  radii.push(1.45 * dMax)

  // vertices[k][i], kinks[k][i] on the edge from ring k-1 to ring k along ray i
  const vertices = radii.map((R, k) =>
    thetas.map((th) => {
      const r = k === 0 ? 0 : R * (1 + (rnd() - 0.5) * 0.45)
      return [cx + Math.cos(th) * r, cy + Math.sin(th) * r]
    }),
  )
  const kinks = radii.map((R, k) =>
    thetas.map((th, i) => {
      if (k === 0) return null
      const a = vertices[k - 1][i]
      const b = vertices[k][i]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const nx = -Math.sin(th)
      const ny = Math.cos(th)
      const off = (rnd() - 0.5) * 0.35 * len
      return [(a[0] + b[0]) / 2 + nx * off, (a[1] + b[1]) / 2 + ny * off]
    }),
  )

  const cells = []
  for (let k = 1; k < radii.length; k++) {
    for (let i = 0; i < sectors; i++) {
      const j = (i + 1) % sectors
      let points = k === 1
        ? [vertices[0][i], kinks[k][i], vertices[k][i], vertices[k][j], kinks[k][j]]
        : [vertices[k - 1][i], kinks[k][i], vertices[k][i], vertices[k][j], kinks[k][j], vertices[k - 1][j]]
      // Grown by a pixel and a half around its centre, so no hairline of the
      // theme shows between neighbours before they move
      const mx = points.reduce((a, p) => a + p[0], 0) / points.length
      const my = points.reduce((a, p) => a + p[1], 0) / points.length
      points = points.map(([x, y]) => {
        const dx = x - mx
        const dy = y - my
        const len = Math.hypot(dx, dy) || 1
        return [x + (dx / len) * 1.5, y + (dy / len) * 1.5]
      })
      const xs = points.map((p) => p[0])
      const ys = points.map((p) => p[1])
      const x0 = Math.max(0, Math.min(...xs))
      const y0 = Math.max(0, Math.min(...ys))
      const x1 = Math.min(w, Math.max(...xs))
      const y1 = Math.min(h, Math.max(...ys))
      if (x1 - x0 < 1 || y1 - y0 < 1) continue
      const centroid = [xs.reduce((s, v) => s + v, 0) / xs.length, ys.reduce((s, v) => s + v, 0) / ys.length]
      cells.push({
        points,
        bbox: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
        centroid,
        dist: Math.hypot(centroid[0] - cx, centroid[1] - cy),
        ring: k,
      })
    }
  }
  return cells
}

/**
 * Copies the WebGL canvas into a JPEG blob. Called right after the frame
 * was rendered, in the same task, so the buffer is still intact and no
 * preserveDrawingBuffer is needed.
 */
export const captureCanvas = (canvas, maxWidth = 1920) =>
  new Promise((resolve, reject) => {
    const scale = Math.min(1, maxWidth / canvas.width)
    const w = Math.max(1, Math.round(canvas.width * scale))
    const h = Math.max(1, Math.round(canvas.height * scale))
    const copy = document.createElement('canvas')
    copy.width = w
    copy.height = h
    copy.getContext('2d').drawImage(canvas, 0, 0, w, h)
    const vw = window.innerWidth
    const vh = window.innerHeight
    copy.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('snapshot: no blob'))
          return
        }
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => resolve({ url, w, h, vw, vh })
        img.onerror = () => reject(new Error('snapshot: decode'))
        img.src = url
      },
      'image/jpeg',
      0.9,
    )
  })

export const requestSnapshot = (rig) => {
  if (rig.snapshot === 'idle') rig.snapshot = 'request'
}

/** Takes the snapshot the rig asked for and hands it to whoever listens */
export const takeSnapshot = (rig, canvas) => {
  rig.snapshot = 'taking'
  captureCanvas(canvas)
    .then((shot) => {
      rig.snapshot = 'taken'
      rig.onSnapshot?.(shot)
    })
    .catch(() => {
      rig.snapshot = 'failed'
      rig.onSnapshot?.(null)
    })
}

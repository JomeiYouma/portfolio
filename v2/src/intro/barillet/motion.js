// Small motion helpers shared by the timeline and the scene

/** Critically-ish damped spring on a { x, v } state, stepped by dt seconds */
export const spring = (s, target, stiffness, damping, dt) => {
  const step = Math.min(dt, 1 / 30)
  const a = (target - s.x) * stiffness - s.v * damping
  s.v += a * step
  s.x += s.v * step
  return s.x
}

/** Frame-rate independent lerp */
export const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt))

const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** 1D value noise in -1..1, smooth, period-free enough for tremor */
export const noise1 = (t, seed = 0) => {
  const i = Math.floor(t)
  const f = t - i
  const u = f * f * (3 - 2 * f)
  const a = hash(i + seed * 57)
  const b = hash(i + 1 + seed * 57)
  return (a + (b - a) * u) * 2 - 1
}

/**
 * Ease of a wheel spun then left to friction: exponential decay of the
 * angular speed, normalised so the tween still lands on its end value.
 * k = duration / time constant.
 */
export const spinEase = (k) => {
  const norm = 1 - Math.exp(-k)
  return (t) => (1 - Math.exp(-k * t)) / norm
}

/** Quadratic bezier into `out` */
export const bezier = (out, a, c, b, t) => {
  const u = 1 - t
  out.x = u * u * a.x + 2 * u * t * c.x + t * t * b.x
  out.y = u * u * a.y + 2 * u * t * c.y + t * t * b.y
  out.z = u * u * a.z + 2 * u * t * c.z + t * t * b.z
  return out
}

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const smoothstep = (e0, e1, v) => {
  const t = clamp01((v - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}

/** Writes where an object sits on screen into `out`, as 0..1 from the top-left */
export const projectOnScreen = (object, camera, v, out) => {
  v.setFromMatrixPosition(object.matrixWorld).project(camera)
  out.x = (v.x + 1) / 2
  out.y = (1 - v.y) / 2
  out.depth = v.z
  return out
}

/** Writes how far `corner` (another projection) sits from `out`'s centre, as the HUD's lock radius */
export const writeExtent = (out, corner) => {
  out.rx = Math.abs(corner.x - out.x)
  out.ry = Math.abs(corner.y - out.y)
  return out
}

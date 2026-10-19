// The shared state of the opening sequence. GSAP tweens these plain numbers
// (see timeline.js and shots.js); the scene reads them every frame and layers
// its own procedural motion on top (breathing, tremor, springs, smears).
// Nothing in here is a React state: it changes sixty times a second. The
// helpers at the bottom are how React code writes into it.

export const CHAMBERS = 6
// Where the chambers sit on the cylinder, and how big everything is (metres)
export const PITCH_RADIUS = 0.0135
export const CYL_RADIUS = 0.02
export const CYL_LENGTH = 0.041
export const CHAMBER_RADIUS = 0.0048
export const BARREL_LENGTH = 0.152
export const CART_LENGTH = 0.041

// The chamber facing the loading hand while the cylinder is swung out, as a
// rotation of the cylinder (radians). Chamber k is presented when
// cyl = LOAD_ANGLE - k * STEP.
export const STEP = (Math.PI * 2) / CHAMBERS
export const LOAD_ANGLE = -0.35

// The gun's poses, in camera space (metres, radians). Roll turns about the
// barrel: positive roll drops the gun's left side, where the cylinder swings
// out, toward the bottom of the frame.
export const POSES = {
  // Low ready, muzzle up and to the left, before anything happens
  low: { x: 0.06, y: -0.1, z: -0.3, pitch: -0.15, yaw: 0.45, roll: -0.1 },
  // Wound up: raised to the eye and tilted the other way, the wrist loading its flick
  wind: { x: 0.035, y: -0.03, z: -0.26, pitch: -0.2, yaw: 0.75, roll: -0.5 },
  // Thrown sideways: the cylinder flies out and hangs below the frame
  present: { x: 0.04, y: -0.015, z: -0.25, pitch: -0.25, yaw: 0.85, roll: 1.2 },
  // Rolled back to a three-quarter view so the rear of the open cylinder faces the eye
  presentOpen: { x: 0.05, y: -0.045, z: -0.3, pitch: -0.45, yaw: 1.0, roll: 0.35 },
  // Closed, still in a three-quarter view
  hold: { x: 0.05, y: -0.045, z: -0.29, pitch: -0.3, yaw: 0.9, roll: 0.25 },
  // Close-up: the fluted side of the cylinder fills the frame while it spins
  spinClose: { x: 0.0, y: -0.025, z: -0.21, pitch: -0.15, yaw: 1.35, roll: 0.15 },
  // Hip aim: lower right, canted, the barrel then pointed by the aim spring
  hip: { x: 0.1, y: -0.05, z: -0.34, pitch: 0.0, yaw: -0.12, roll: 0.3 },
}

export const createRig = (count) => ({
  phase: 'ready',
  gun: { ...POSES.low },
  // Short-lived offsets layered on the pose: anticipation, dips, the wrist flick
  off: { x: 0, y: 0, z: 0, pitch: 0, roll: 0 },
  // 0: still below the frame, 1: in hand
  rise: 0,
  // Articulations
  crane: 0, // cylinder swing-out, radians
  cyl: LOAD_ANGLE, // cylinder rotation about its own axis, radians
  latch: 0, // release latch travel, 0..1
  hammer: 0, // 0 down, 1 cocked
  trigger: 0,
  // The hand: blend weights of its poses
  hand: { grip: 1, latch: 0, cock: 0, flick: 0, trigger: 0 },
  // Camera: push-in (zoom divides the field of view), a dutch tilt, and how
  // much it turns to frame the bottle
  cam: { dolly: 0, pitch: 0, yaw: 0, roll: 0, zoom: 1, look: 0 },
  // Head parallax from the pointer, 0 while aiming
  look: 1,
  breath: 1,
  // The cartridges: one per theme
  carts: Array.from({ length: count }, () => ({
    spawn: 0, // 0..1 materialising
    flight: 0, // 0..1 along the path to the chamber
    seat: 0, // 0..1 pushed home
    hover: 1, // floating amplitude
    mark: 0, // 0..1 marked by the visitor
  })),
  // The chamber each cartridge went into, the cartridge the visitor marked,
  // the one under the hammer, and the last chamber that fired
  chamberOf: Array.from({ length: count }, (_, i) => i),
  marked: -1,
  chosen: -1,
  lastFired: -1,
  // The spin: progress 0..1 along a friction curve, and the travel it covers
  spinT: 0,
  spinTravel: 0,
  detent: 0,
  spinning: 0,
  // Light sweep along the frame, -1..2
  sweep: -1,
  // Aiming: how much the spring aim overrides the pose, how much the barrel is
  // pulled onto the bottle, and what the scene found under the pointer
  aimBlend: 0,
  aimForce: 0,
  aim: { yaw: 0, pitch: 0, onBottle: false, point: { x: 0, y: 0, z: 0 } },
  // Shots fired, the outcome of the current one, and where its bullet landed
  shots: 0,
  shot: { outcome: null, point: { x: 0, y: 0, z: 0 } },
  // Shot and reveal
  flash: 0,
  tracer: 0,
  gap: 0,
  smoke: 0,
  recoil: 0,
  shock: 0,
  impact: 0,
  aberr: 0,
  bloom: 0,
  white: 0,
  reveal: 0,
  kick: 0,
  // The bottle: its light, the flash when it breaks
  bottleLight: 0.6,
  bottleFlash: 0,
  // Time scale of the current shot, for the simulations
  slow: 1,
  // One-shot triggers consumed by the scene
  burst: false,
  shatter: false,
  miss: false,
  // Snapshot of the canvas for the screen-level shatter: idle, request, taking, taken, failed
  snapshot: 'idle',
  onSnapshot: null,
  // Screen-space projections, written by the scene for the HUD and the post pass
  screen: {
    carts: Array.from({ length: count }, () => ({ x: 0, y: 0, depth: 0 })),
    cyl: { x: 0, y: 0 },
    muzzle: { x: 0.5, y: 0.45 },
    bottle: { x: 0.5, y: 0.5, rx: 0.02, ry: 0.06 },
    impact: { x: 0.5, y: 0.5 },
  },
})

/** The visitor marked a round: the spin will stop on it */
export const markRound = (rig, k) => {
  rig.marked = k
  rig.carts.forEach((c, i) => {
    c.mark = i === k ? 1 : 0
  })
}

/** Chambers the cylinder must turn through to bring the next loaded round under the hammer */
export const stepsToNext = (rig, count) => {
  if (rig.lastFired < 0) return 0
  const next = (rig.lastFired + 1) % count
  return (((next - rig.lastFired) % CHAMBERS) + CHAMBERS) % CHAMBERS
}

export const setAimForce = (rig, value) => {
  rig.aimForce = value
}

/** The chamber under the hammer is about to fire */
export const recordShot = (rig) => {
  rig.lastFired = rig.chosen
}

/** After a miss, the next live round is what the trigger will bring under the hammer */
export const nextRound = (rig, count) => {
  rig.chosen = (rig.chosen + 1) % count
  return rig.chosen
}

/** The bullet lands: the bottle breaks, or the wall takes it */
export const landShot = (rig, outcome) => {
  if (outcome === 'hit') rig.shatter = true
  else rig.miss = true
}

export const listenSnapshot = (rig, fn) => {
  rig.onSnapshot = fn
}

export const setPhaseOf = (rig, phase) => {
  rig.phase = phase
}

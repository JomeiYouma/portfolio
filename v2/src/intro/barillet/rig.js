// The shared state of the opening sequence. GSAP tweens these plain numbers
// (see timeline.js); the scene reads them every frame and layers its own
// procedural motion on top (breathing, tremor, springs, smears). Nothing in
// here is a React state: it changes sixty times a second.

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

// The gun's three poses, in camera space: low ready, presenting the open
// cylinder to the eye, and lined up on the sights
export const POSES = {
  low: { x: 0.08, y: -0.1, z: -0.3, pitch: 0.12, yaw: -0.5, roll: 0.1 },
  present: { x: 0.05, y: -0.04, z: -0.31, pitch: -0.45, yaw: 1.0, roll: 0.35 },
  hold: { x: 0.05, y: -0.045, z: -0.29, pitch: -0.3, yaw: 0.9, roll: 0.25 },
  aim: { x: 0.0, y: -0.085, z: -0.36, pitch: 0.02, yaw: 0.0, roll: 0.0 },
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
  // Camera
  cam: { dolly: 0, pitch: 0, roll: 0, zoom: 1 },
  breath: 1,
  focus: 0.33,
  // The cartridges: one per theme
  carts: Array.from({ length: count }, () => ({
    spawn: 0, // 0..1 materialising
    flight: 0, // 0..1 along the path to the chamber
    seat: 0, // 0..1 pushed home
    hover: 1, // floating amplitude
    mark: 0, // 0..1 marked by the visitor
  })),
  // The chamber each cartridge went into, the cartridge the visitor marked,
  // and the one that will fire
  chamberOf: Array.from({ length: count }, (_, i) => i),
  marked: -1,
  chosen: -1,
  // The spin: progress 0..1 along a friction curve, and the travel it covers
  spinT: 0,
  spinTravel: 0,
  detent: 0,
  // Light sweep along the frame, -1..2
  sweep: -1,
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
  // Spin, for the HUD speed lines and the ratchet
  spinning: 0,
  // One-shot triggers consumed by the scene
  burst: false,
  // Screen-space projections, written by the scene for the HUD
  screen: {
    carts: Array.from({ length: count }, () => ({ x: 0, y: 0, depth: 0 })),
    cyl: { x: 0, y: 0 },
    muzzle: { x: 0.5, y: 0.45 },
  },
})

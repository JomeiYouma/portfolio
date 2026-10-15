import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { PRINT } from './album'
import { PROPS } from './palette'

// Low-poly props built from primitives: each piece is welded, nudged so it
// looks cut by hand, and coloured one tint per face, like card stock. Every
// prop shares one material; the colours live in the geometry.

/** Deterministic random (mulberry32): a prop looks the same on every visit. */
export const rng = (seed) => {
  let a = Math.imul(seed + 1, 2654435761) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const CARD = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0 })

const tint = new THREE.Color()

/**
 * One piece of a prop. `j` nudges the vertices, `v` is the lightness spread
 * between faces; `sx sy sz` then `rx ry rz` then `x y z` place the piece.
 */
const part = (geometry, hex, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, j = 0, v = 0.05, r = Math.random } = {}) => {
  geometry.deleteAttribute('uv')
  geometry.deleteAttribute('normal')
  let geo = mergeVertices(geometry)
  if (j) {
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i, pos.getX(i) + (r() - 0.5) * 2 * j, pos.getY(i) + (r() - 0.5) * 2 * j, pos.getZ(i) + (r() - 0.5) * 2 * j)
    }
  }
  geo = geo.toNonIndexed()
  geo.scale(sx, sy, sz)
  geo.rotateX(rx)
  geo.rotateY(ry)
  geo.rotateZ(rz)
  geo.translate(x, y, z)
  const count = geo.attributes.position.count
  const colors = new Float32Array(count * 3)
  const base = new THREE.Color(hex)
  for (let f = 0; f < count; f += 3) {
    tint.copy(base).offsetHSL(0, 0, (r() - 0.5) * 2 * v)
    for (let k = 0; k < 3; k++) {
      colors[(f + k) * 3] = tint.r
      colors[(f + k) * 3 + 1] = tint.g
      colors[(f + k) * 3 + 2] = tint.b
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

const merge = (parts) => mergeGeometries(parts)

// Upright pieces stand on y = 0; `y` then lifts them
const box = (w, h, d, hex, o = {}) => part(new THREE.BoxGeometry(w, h, d), hex, { ...o, y: h / 2 + (o.y ?? 0) })
const cyl = (rt, rb, h, seg, hex, o = {}) => part(new THREE.CylinderGeometry(rt, rb, h, seg), hex, { ...o, y: h / 2 + (o.y ?? 0) })
const cone = (rad, h, seg, hex, o = {}) => part(new THREE.ConeGeometry(rad, h, seg), hex, { ...o, y: h / 2 + (o.y ?? 0) })
const ico = (rad, detail, hex, o = {}) => part(new THREE.IcosahedronGeometry(rad, detail), hex, o)
const dodeca = (rad, hex, o = {}) => part(new THREE.DodecahedronGeometry(rad, 0), hex, o)

/** A gable: a triangle `w` wide and `h` high, extruded `d` along z, base on y = 0, centred. */
const gable = (w, h, d, hex, o = {}) => {
  const shape = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, h)])
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false })
  geo.translate(0, 0, -d / 2)
  return part(geo, hex, o)
}

const extrude = (points, depth, hex, o = {}) => {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  geo.translate(0, 0, -depth / 2)
  return part(geo, hex, o)
}

const pip = (r, x, y, z, rx = 0) => part(new THREE.BoxGeometry(0.07, 0.02, 0.07), '#2a2118', { r, x, y, z, rx, v: 0 })
const torus = (rad, tube, seg, hex, o = {}) => part(new THREE.TorusGeometry(rad, tube, 6, seg, o.arc ?? Math.PI * 2), hex, o)

/** A rod from a to b in the XY plane (a bicycle frame, a quill) */
const rod = ([ax, ay], [bx, by], radius, hex, r) => {
  const length = Math.hypot(bx - ax, by - ay)
  return part(new THREE.CylinderGeometry(radius, radius, length, 5), hex, {
    r, rz: Math.atan2(by - ay, bx - ax) - Math.PI / 2, x: (ax + bx) / 2, y: (ay + by) / 2, v: 0.03,
  })
}

/** A flat triangle lying on the ground, pointing along -z at `radius` from the origin, turned by `angle` */
const mark = (radius, length, hex, angle, r) => {
  const geo = new THREE.ConeGeometry(0.05, length, 3)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, -radius)
  geo.rotateY(angle)
  return part(geo, hex, { r, v: 0 })
}

const INK = '#2a2118'
const LAYERS = [PROPS.mountain, '#b89a6e', PROPS.rock, '#8f7c62', PROPS.mountain, '#c4a982']

const BUILDERS = {
  pine: (r) => merge([
    cyl(0.07, 0.11, 0.5, 5, PROPS.bark, { r, j: 0.01 }),
    cone(0.62, 0.8, 6, PROPS.leaf, { r, y: 0.35, j: 0.05, v: 0.06 }),
    cone(0.48, 0.7, 6, PROPS.leafDark, { r, y: 0.82, ry: 0.4, j: 0.05, v: 0.06 }),
    cone(0.33, 0.6, 6, PROPS.leaf, { r, y: 1.24, ry: 0.8, j: 0.04, v: 0.06 }),
  ]),
  tree: (r) => merge([
    cyl(0.09, 0.13, 0.7, 5, PROPS.bark, { r, j: 0.01 }),
    ico(0.56, 0, PROPS.leaf, { r, y: 1.08, j: 0.09, v: 0.07 }),
    ico(0.38, 0, PROPS.leafDark, { r, x: 0.32, y: 0.86, z: 0.22, j: 0.06, v: 0.07 }),
  ]),
  rock: (r) => dodeca(0.4, PROPS.rock, { r, y: 0.22, j: 0.1, sy: 0.7, v: 0.07 }),
  mountain: (r) => merge([
    cone(1.7, 2.6, 7, PROPS.mountain, { r, j: 0.22, v: 0.06 }),
    cone(0.64, 0.95, 7, PROPS.snow, { r, y: 1.72, j: 0.07, v: 0.03 }),
  ]),
  cloud: (r) => merge([
    ico(0.5, 1, PROPS.cloud, { r, j: 0.03, v: 0.03 }),
    ico(0.38, 1, PROPS.cloud, { r, x: -0.52, y: -0.08, j: 0.03, v: 0.03 }),
    ico(0.42, 1, PROPS.cloud, { r, x: 0.52, y: -0.05, z: 0.1, j: 0.03, v: 0.03 }),
  ]),
  crate: (r) => box(0.42, 0.42, 0.42, PROPS.wood, { r, j: 0.015, v: 0.08 }),
  lighthouse: (r) => merge([
    ...[0, 1, 2, 3].map((i) => cyl(0.29 - i * 0.03, 0.33 - i * 0.03, 0.56, 8, i % 2 ? PROPS.stripe : PROPS.snow, { r, y: i * 0.55, j: 0.008, v: 0.03 })),
    box(0.46, 0.4, 0.46, PROPS.screen, { r, y: 2.2, v: 0.08 }),
    cone(0.38, 0.4, 8, PROPS.roof, { r, y: 2.6 }),
  ]),

  signpost: (r) => merge([
    cyl(0.045, 0.06, 1.7, 5, PROPS.bark, { r, j: 0.008 }),
    box(0.95, 0.22, 0.05, PROPS.sail, { r, x: 0.25, y: 1.25, ry: 0.15, v: 0.03 }),
    box(0.75, 0.22, 0.05, PROPS.sail, { r, x: -0.15, y: 0.95, ry: -0.3, v: 0.03 }),
  ]),
  boat: (r) => merge([
    extrude([[-0.45, 0], [0.35, 0], [0.56, 0.14], [0.35, 0.27], [-0.45, 0.27]], 0.36, PROPS.sail, { r, j: 0.008, v: 0.03 }),
    box(0.04, 0.6, 0.04, PROPS.bark, { r, y: 0.2 }),
    extrude([[0, 0], [0.44, 0], [0, 0.62]], 0.02, PROPS.stripe, { r, x: 0.03, y: 0.3, v: 0.04 }),
  ]),
  house: (r) => merge([
    box(1.0, 0.8, 0.9, PROPS.wall, { r, j: 0.01, v: 0.04 }),
    gable(1.2, 0.55, 1.05, PROPS.roof, { r, y: 0.8, j: 0.015, v: 0.06 }),
    box(0.16, 0.36, 0.16, PROPS.rock, { r, x: 0.3, y: 1.0, z: 0.2 }),
    box(0.2, 0.2, 0.03, PROPS.screen, { r, x: -0.25, y: 0.4, z: 0.45, v: 0.08 }),
  ]),
  // Hinged on its left edge, at the origin
  houseDoor: (r) => box(0.28, 0.46, 0.05, PROPS.door, { r, x: 0.14, v: 0.04 }),
  windmill: (r) => merge([
    cyl(0.32, 0.48, 1.7, 6, PROPS.wall, { r, j: 0.012, v: 0.04 }),
    cone(0.5, 0.55, 6, PROPS.roof, { r, y: 1.7, v: 0.05 }),
    box(0.2, 0.32, 0.05, PROPS.door, { r, z: 0.44, v: 0.04 }),
  ]),
  blades: (r) => merge([
    part(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 6), PROPS.bark, { r, rx: Math.PI / 2 }),
    part(new THREE.BoxGeometry(1.15, 0.14, 0.03), PROPS.sail, { r, v: 0.03 }),
    part(new THREE.BoxGeometry(0.14, 1.15, 0.03), PROPS.sail, { r, v: 0.03 }),
  ]),
  building: (r) => {
    const h = 1.1 + r() * 1.5
    const walls = [PROPS.wall, PROPS.sail, PROPS.snow, '#e9d5b3']
    const roofs = [PROPS.roof, PROPS.metal, PROPS.gold]
    const parts = [
      box(0.9, h, 0.9, walls[Math.floor(r() * walls.length)], { r, j: 0.01, v: 0.04 }),
      box(0.98, 0.1, 0.98, roofs[Math.floor(r() * roofs.length)], { r, y: h, v: 0.05 }),
    ]
    for (let y = 0.3; y < h - 0.3; y += 0.42) {
      for (const x of [-0.22, 0.22]) parts.push(box(0.16, 0.2, 0.03, PROPS.screen, { r, x, y, z: 0.45, v: 0.1 }))
    }
    return merge(parts)
  },
  arcade: (r) => merge([
    box(0.62, 1.25, 0.6, PROPS.metal, { r, j: 0.008, v: 0.05 }),
    part(new THREE.BoxGeometry(0.52, 0.42, 0.08), PROPS.screen, { r, y: 1.0, z: 0.28, rx: -0.35, v: 0.08 }),
    box(0.66, 0.22, 0.5, PROPS.gold, { r, y: 1.25, z: 0.02, v: 0.06 }),
    box(0.5, 0.06, 0.2, PROPS.stripe, { r, y: 0.72, z: 0.32, v: 0.03 }),
  ]),
  // Centred: the landmark lifts it by half its size
  dice: (r) => merge([
    part(new THREE.BoxGeometry(0.5, 0.5, 0.5, 2, 2, 2), PROPS.snow, { r, j: 0.012, v: 0.03 }),
    pip(r, 0, 0.255, 0),
    pip(r, -0.13, 0.255, -0.13),
    pip(r, 0.13, 0.255, 0.13),
    pip(r, -0.1, 0.1, 0.255, Math.PI / 2),
    pip(r, 0.1, -0.1, 0.255, Math.PI / 2),
  ]),
  campfire: (r) => merge([
    ...[0.3, 1.4, 2.5].map((a) => part(new THREE.CylinderGeometry(0.06, 0.075, 0.85, 5), PROPS.bark, { r, rz: Math.PI / 2, ry: a, y: 0.07, j: 0.01 })),
    ...[0, 1, 2, 3, 4, 5].map((i) => dodeca(0.1, PROPS.rock, { r, x: Math.cos(i * 1.05) * 0.52, z: Math.sin(i * 1.05) * 0.52, y: 0.06, j: 0.03, v: 0.08 })),
  ]),
  flames: (r) => merge([
    cone(0.24, 0.62, 5, PROPS.fire, { r, j: 0.04, v: 0.08 }),
    cone(0.14, 0.42, 5, PROPS.flame, { r, y: 0.06, ry: 0.6, j: 0.03, v: 0.08 }),
  ]),
  figure: (r) => {
    const cloaks = [PROPS.water, PROPS.leaf, PROPS.gold, PROPS.roof]
    return merge([
      cone(0.26, 0.78, 6, cloaks[Math.floor(r() * cloaks.length)], { r, j: 0.015, v: 0.05 }),
      ico(0.17, 0, PROPS.sail, { r, y: 0.92, j: 0.015, v: 0.03 }),
    ])
  },
  bubble: (r) => merge([
    part(new THREE.BoxGeometry(0.62, 0.36, 0.1), PROPS.snow, { r, v: 0.02 }),
    part(new THREE.ConeGeometry(0.08, 0.16, 4), PROPS.snow, { r, x: -0.18, y: -0.24, rx: Math.PI, v: 0.02 }),
    ...[-0.14, 0, 0.14].map((x) => part(new THREE.BoxGeometry(0.06, 0.06, 0.02), '#2a2118', { r, x, z: 0.06, v: 0 })),
  ]),
  stall: (r) => merge([
    box(1.25, 0.55, 0.85, PROPS.wall, { r, j: 0.01, v: 0.04 }),
    ...[[-0.58, -0.38], [0.58, -0.38], [-0.58, 0.38], [0.58, 0.38]].map(([x, z]) => cyl(0.035, 0.04, 1.25, 5, PROPS.wood, { r, x, z })),
    box(0.25, 0.25, 0.25, PROPS.wood, { r, x: 0.3, y: 0.55, z: 0.1, v: 0.08 }),
  ]),
  // Hinged along its back edge, at the origin; hangs toward +z
  awning: (r) => merge(
    [0, 1, 2, 3, 4, 5].map((i) => gable(1.4, 0.38, 0.17, i % 2 ? PROPS.stripe : PROPS.snow, { r, z: 0.085 + i * 0.17, v: 0.03 })),
  ),
  plane: (r) => {
    const dart = new THREE.ConeGeometry(0.26, 1.0, 3)
    dart.rotateX(-Math.PI / 2)
    dart.rotateZ(Math.PI)
    dart.scale(1.4, 0.5, 1)
    return part(dart, PROPS.snow, { r, v: 0.04 })
  },
  mailbox: (r) => merge([
    cyl(0.04, 0.05, 0.95, 5, PROPS.wood, { r }),
    box(0.46, 0.26, 0.3, PROPS.stripe, { r, y: 0.95, v: 0.05 }),
    part(new THREE.CylinderGeometry(0.15, 0.15, 0.46, 8), PROPS.stripe, { r, rz: Math.PI / 2, y: 1.21, v: 0.05 }),
  ]),
  // Pivots at its foot
  flag: (r) => box(0.05, 0.28, 0.03, PROPS.gold, { r, v: 0.03 }),

  // ─── On the desk ─────────────────────────────────────────────────────────
  pencil: (r) => merge([
    part(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 6), PROPS.gold, { r, rz: Math.PI / 2, y: 0.06, v: 0.03 }),
    part(new THREE.ConeGeometry(0.06, 0.18, 6), PROPS.wood, { r, rz: -Math.PI / 2, x: 0.74, y: 0.06, v: 0.03 }),
    part(new THREE.ConeGeometry(0.02, 0.05, 6), INK, { r, rz: -Math.PI / 2, x: 0.845, y: 0.06, v: 0 }),
    part(new THREE.CylinderGeometry(0.062, 0.062, 0.1, 6), PROPS.metal, { r, rz: Math.PI / 2, x: -0.68, y: 0.06 }),
    part(new THREE.CylinderGeometry(0.058, 0.058, 0.08, 6), PROPS.roof, { r, rz: Math.PI / 2, x: -0.76, y: 0.06 }),
  ]),
  magnifier: (r) => merge([
    torus(0.42, 0.06, 16, PROPS.gold, { r, rx: Math.PI / 2, y: 0.07, v: 0.04 }),
    part(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 16), '#cfe3ea', { r, y: 0.06, v: 0.02 }),
    part(new THREE.CylinderGeometry(0.06, 0.07, 0.9, 6), PROPS.bark, { r, rz: Math.PI / 2, x: 0.9, y: 0.07, v: 0.04 }),
  ]),
  mug: (r) => merge([
    cyl(0.28, 0.24, 0.6, 10, PROPS.sail, { r, v: 0.03 }),
    part(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 10), '#5a3a22', { r, y: 0.59, v: 0.03 }),
    torus(0.16, 0.045, 12, PROPS.sail, { r, x: 0.32, y: 0.32, v: 0.03 }),
  ]),
  spoon: (r) => merge([
    part(new THREE.BoxGeometry(0.7, 0.025, 0.07), PROPS.metal, { r, y: 0.015, v: 0.04 }),
    part(new THREE.SphereGeometry(0.11, 8, 6), PROPS.metal, { r, x: 0.4, y: 0.02, sy: 0.3, v: 0.04 }),
  ]),
  ruler: (r) => merge([
    part(new THREE.BoxGeometry(1.8, 0.03, 0.26), PROPS.wood, { r, y: 0.015, v: 0.04 }),
    ...Array.from({ length: 17 }, (_, i) =>
      part(new THREE.BoxGeometry(0.02, 0.035, i % 4 === 0 ? 0.14 : 0.08), INK, { r, x: -0.8 + i * 0.1, y: 0.02, z: -0.06, v: 0 })),
  ]),
  inkpot: (r) => merge([
    cyl(0.22, 0.26, 0.34, 8, '#2f3a4a', { r, v: 0.05 }),
    cyl(0.12, 0.14, 0.12, 8, PROPS.metal, { r, y: 0.34 }),
    cyl(0.14, 0.12, 0.05, 8, PROPS.gold, { r, y: 0.46 }),
  ]),
  quill: (r) => merge([
    part(new THREE.CylinderGeometry(0.015, 0.025, 1.1, 5), PROPS.sail, { r, rz: 1.1, x: 0.3, y: 0.3, v: 0.03 }),
    extrude([[0, 0.15], [0.12, 0.3], [0.17, 0.75], [0.1, 1.0], [-0.02, 0.8], [-0.06, 0.3]], 0.02, PROPS.snow, { r, rz: 1.1, x: 0.3, y: 0.3, v: 0.04 }),
  ]),
  stamp: (r) => merge([
    box(0.4, 0.08, 0.3, PROPS.roof, { r, v: 0.05 }),
    box(0.36, 0.06, 0.26, PROPS.wood, { r, y: 0.08, v: 0.05 }),
    cyl(0.07, 0.09, 0.3, 6, PROPS.wood, { r, y: 0.14 }),
    part(new THREE.SphereGeometry(0.1, 8, 6), PROPS.wood, { r, y: 0.5, v: 0.05 }),
  ]),
  rolledMap: (r) => merge([
    part(new THREE.CylinderGeometry(0.22, 0.22, 1.4, 10), PROPS.sail, { r, rz: Math.PI / 2, y: 0.22, v: 0.03 }),
    torus(0.225, 0.035, 12, PROPS.stripe, { r, ry: Math.PI / 2, y: 0.22, v: 0.03 }),
  ]),
  envelope: (r) => merge([
    part(new THREE.BoxGeometry(0.9, 0.03, 0.6), PROPS.snow, { r, y: 0.015, v: 0.02 }),
    extrude([[-0.45, 0], [0.45, 0], [0, -0.32]], 0.02, PROPS.sail, { r, rx: -Math.PI / 2, y: 0.045, z: -0.3, v: 0.03 }),
    part(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 8), PROPS.stripe, { r, y: 0.06, z: -0.02 }),
  ]),
  compass: (r) => merge([
    cyl(0.5, 0.52, 0.12, 12, PROPS.gold, { r, v: 0.04 }),
    cyl(0.44, 0.44, 0.03, 12, PROPS.snow, { r, y: 0.12, v: 0.02 }),
    ...[0, 1, 2, 3].map((i) => mark(0.3, 0.2, i === 0 ? PROPS.stripe : INK, (i * Math.PI) / 2, r)).map((g) => g.translate(0, 0.15, 0)),
  ]),
  // The needle pivots at its origin
  needle: (r) => merge([
    mark(0.18, 0.36, PROPS.stripe, 0, r),
    mark(0.18, 0.36, PROPS.snow, Math.PI, r),
    part(new THREE.SphereGeometry(0.04, 8, 6), PROPS.metal, { r }),
  ]),

  // ─── The journey ─────────────────────────────────────────────────────────
  outcrop: (r) => merge(
    LAYERS.map((hex, i) => box(1.4 - i * 0.04, 0.18, 0.9, hex, { r, x: i * 0.05, y: i * 0.18, rz: 0.12, j: 0.02, v: 0.06 })),
  ),
  hammer: (r) => merge([
    part(new THREE.CylinderGeometry(0.035, 0.04, 0.9, 6), PROPS.wood, { r, rz: Math.PI / 2, y: 0.04, v: 0.04 }),
    part(new THREE.BoxGeometry(0.14, 0.12, 0.36), PROPS.metal, { r, x: 0.5, y: 0.07, v: 0.04 }),
    part(new THREE.ConeGeometry(0.05, 0.22, 4), PROPS.metal, { r, rx: -Math.PI / 2, x: 0.5, y: 0.07, z: -0.28, v: 0.04 }),
  ]),
  geode: (r) => merge([
    dodeca(0.42, PROPS.rock, { r, y: 0.3, j: 0.08, sy: 0.75, v: 0.07 }),
    ...Array.from({ length: 7 }, () =>
      part(new THREE.ConeGeometry(0.07, 0.22 + r() * 0.18, 5), '#a27bd6', {
        r, x: (r() - 0.5) * 0.4, y: 0.5, z: (r() - 0.5) * 0.3, rx: (r() - 0.5) * 0.6, rz: (r() - 0.5) * 0.6, v: 0.1,
      })),
  ]),
  // The cap cut off the geode, hinged at the origin
  geodeLid: (r) => dodeca(0.3, PROPS.rock, { r, x: 0.28, y: 0.12, j: 0.08, sy: 0.5, v: 0.07 }),
  bike: (r) => merge([
    torus(0.34, 0.035, 18, INK, { r, x: -0.55, y: 0.37, v: 0.02 }),
    torus(0.34, 0.035, 18, INK, { r, x: 0.55, y: 0.37, v: 0.02 }),
    part(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 6), PROPS.metal, { r, rx: Math.PI / 2, x: -0.55, y: 0.37 }),
    part(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 6), PROPS.metal, { r, rx: Math.PI / 2, x: 0.55, y: 0.37 }),
    rod([-0.55, 0.37], [0.0, 0.3], 0.025, PROPS.roof, r),
    rod([0.0, 0.3], [-0.2, 0.9], 0.025, PROPS.roof, r),
    rod([-0.55, 0.37], [-0.2, 0.9], 0.02, PROPS.roof, r),
    rod([-0.2, 0.9], [0.4, 0.85], 0.025, PROPS.roof, r),
    rod([0.4, 0.85], [0.0, 0.3], 0.025, PROPS.roof, r),
    rod([0.4, 0.85], [0.55, 0.37], 0.02, PROPS.metal, r),
    part(new THREE.BoxGeometry(0.22, 0.05, 0.1), INK, { r, x: -0.22, y: 0.94, v: 0.02 }),
    part(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), PROPS.metal, { r, rx: Math.PI / 2, x: 0.42, y: 0.9 }),
  ]),
  racket: (r) => merge([
    torus(0.26, 0.025, 16, PROPS.metal, { r, rx: Math.PI / 2, x: 0.45, y: 0.04, sy: 1.25, v: 0.03 }),
    part(new THREE.CylinderGeometry(0.24, 0.24, 0.01, 16), PROPS.snow, { r, x: 0.45, y: 0.04, sz: 1.25, v: 0.02 }),
    part(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 5), PROPS.metal, { r, rz: Math.PI / 2, x: 0.0, y: 0.04 }),
    part(new THREE.CylinderGeometry(0.035, 0.035, 0.35, 6), INK, { r, rz: Math.PI / 2, x: -0.4, y: 0.04, v: 0.02 }),
  ]),
  shuttle: (r) => merge([
    part(new THREE.SphereGeometry(0.06, 8, 6), PROPS.snow, { r, v: 0.02 }),
    part(new THREE.ConeGeometry(0.11, 0.22, 8, 1, true), PROPS.sail, { r, rx: Math.PI, y: 0.17, v: 0.03 }),
  ]),
  scroll: (r) => merge([
    part(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 10), PROPS.sail, { r, rz: Math.PI / 2, y: 0.1, v: 0.03 }),
    part(new THREE.BoxGeometry(0.9, 0.02, 0.5), PROPS.sail, { r, y: 0.01, z: 0.4, v: 0.03 }),
    part(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 10), PROPS.stripe, { r, y: 0.03, z: 0.45 }),
    ...[0, 1, 2].map((i) => part(new THREE.BoxGeometry(0.5 - i * 0.1, 0.005, 0.03), INK, { r, x: -0.1 + i * 0.05, y: 0.025, z: 0.22 + i * 0.08, v: 0 })),
  ]),
  laptop: (r) => merge([
    part(new THREE.BoxGeometry(0.9, 0.04, 0.62), PROPS.metal, { r, y: 0.02, v: 0.04 }),
    part(new THREE.BoxGeometry(0.72, 0.01, 0.3), INK, { r, y: 0.045, z: 0.02, v: 0.03 }),
  ]),
  // Hinged along its back edge at the origin; the screen is on its underside
  lid: (r) => merge([
    part(new THREE.BoxGeometry(0.9, 0.03, 0.6), PROPS.metal, { r, y: 0.02, z: 0.3, v: 0.04 }),
    part(new THREE.BoxGeometry(0.8, 0.005, 0.5), PROPS.screen, { r, y: 0.0, z: 0.3, v: 0.08 }),
  ]),

  // ─── Flagship projects ───────────────────────────────────────────────────
  globe: (r) => merge([
    cyl(0.32, 0.38, 0.08, 10, PROPS.wood, { r, v: 0.04 }),
    cyl(0.05, 0.06, 0.5, 6, PROPS.metal, { r, y: 0.08 }),
    torus(0.62, 0.035, 20, PROPS.metal, { r, rz: 0.4, y: 0.98, v: 0.03 }),
  ]),
  // The ball spins at its origin
  globeBall: (r) => merge([
    ico(0.5, 1, PROPS.water, { r, j: 0.02, v: 0.06 }),
    ...[[0.42, 0.2, 0.1], [-0.3, 0.3, 0.3], [0.1, -0.35, -0.35], [-0.2, -0.1, 0.45]].map(([x, y, z]) =>
      dodeca(0.17, PROPS.leaf, { r, x, y, z, j: 0.04, v: 0.08 })),
  ]),
  strata: (r) => merge([
    ...LAYERS.slice(0, 5).map((hex, i) => box(1.2 - i * 0.06, 0.14, 0.8 - i * 0.04, hex, { r, y: i * 0.14, j: 0.015, v: 0.05 })),
    torus(0.22, 0.06, 14, PROPS.snow, { r, rx: Math.PI / 2, y: 0.76, v: 0.04 }),
    torus(0.13, 0.05, 12, PROPS.snow, { r, rx: Math.PI / 2, x: 0.06, y: 0.77, v: 0.04 }),
    torus(0.06, 0.04, 10, PROPS.snow, { r, rx: Math.PI / 2, x: 0.1, y: 0.78, v: 0.04 }),
  ]),
  qr: (r) => {
    const parts = [box(0.7, 0.7, 0.7, PROPS.snow, { r, j: 0.006, v: 0.02 })]
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const corner = (i < 3 || i > 3) && (j < 3 || j > 3) && (i < 3 || j < 3)
        const on = corner ? (i === 1 && j === 1) || i === 0 || i === 2 || j === 0 || j === 2 || (i > 3 && j < 3 && (i === 4 || i === 6 || j === 0 || j === 2)) : r() < 0.45
        if (!on) continue
        parts.push(part(new THREE.BoxGeometry(0.08, 0.01, 0.08), INK, { r, x: -0.27 + i * 0.09, y: 0.705, z: -0.27 + j * 0.09, v: 0 }))
        parts.push(part(new THREE.BoxGeometry(0.08, 0.08, 0.01), INK, { r, x: -0.27 + i * 0.09, y: 0.08 + j * 0.09, z: 0.355, v: 0 }))
      }
    }
    return merge(parts)
  },
  pixel: (r) => {
    const palette = [PROPS.roof, PROPS.gold, PROPS.water, PROPS.leaf, INK, PROPS.stripe]
    const parts = [
      rod([-0.45, 0], [-0.15, 1.3], 0.025, PROPS.wood, r),
      rod([0.45, 0], [0.15, 1.3], 0.025, PROPS.wood, r),
      part(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 5), PROPS.wood, { r, rx: 0.35, y: 0.65, z: -0.2, v: 0.03 }),
      part(new THREE.BoxGeometry(0.9, 0.9, 0.04), PROPS.snow, { r, rx: -0.1, y: 0.85, z: 0.02, v: 0.02 }),
    ]
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (r() < 0.3) continue
        parts.push(part(new THREE.BoxGeometry(0.12, 0.12, 0.01), palette[Math.floor(r() * palette.length)], {
          r, rx: -0.1, x: -0.3 + i * 0.12, y: 0.55 + j * 0.12 + (0.5 + 0.3 * j) * 0.0, z: 0.045 + j * 0.012, v: 0.05,
        }))
      }
    }
    return merge(parts)
  },
  neon: (r) => merge([
    torus(0.75, 0.05, 20, '#ff5fd2', { r, y: 1.0, arc: Math.PI, v: 0.05 }),
    torus(0.62, 0.035, 20, '#4de3ff', { r, y: 1.0, arc: Math.PI, v: 0.05 }),
    cyl(0.06, 0.07, 1.0, 6, PROPS.metal, { r, x: -0.75 }),
    cyl(0.06, 0.07, 1.0, 6, PROPS.metal, { r, x: 0.75 }),
  ]),
  ticket: (r) => merge([
    box(0.9, 1.1, 0.8, PROPS.gold, { r, j: 0.01, v: 0.04 }),
    box(0.5, 0.4, 0.04, PROPS.screen, { r, y: 0.55, z: 0.4, v: 0.06 }),
    box(1.0, 0.08, 0.9, PROPS.roof, { r, y: 1.1, v: 0.04 }),
    ...[0, 1, 2, 3, 4].map((i) => gable(1.1, 0.22, 0.14, i % 2 ? PROPS.stripe : PROPS.snow, { r, y: 1.18, z: 0.2 + i * 0.14, v: 0.03 })),
  ]),

  // ─── The prints ──────────────────────────────────────────────────────────
  mount: (r) => part(new THREE.BoxGeometry(PRINT.width + 2 * PRINT.border, 0.02, PRINT.height + 2 * PRINT.border), PROPS.snow, { r, y: 0.01, v: 0.015 }),
  pin: (r) => merge([
    part(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), PROPS.metal, { r, y: 0.08 }),
    part(new THREE.SphereGeometry(0.06, 8, 6), PROPS.stripe, { r, y: 0.18, v: 0.04 }),
  ]),
}

const cache = new Map()

/** The geometry of a prop type, built once per seed and shared. */
export const geometryOf = (type, seed = 1) => {
  const key = `${type}:${seed}`
  if (!cache.has(key)) cache.set(key, BUILDERS[type](rng(seed)))
  return cache.get(key)
}

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clamp01 } from './reveal'
import { PAPER_TILE, useTile } from './tiles'
import { LENGTH, WIDTH } from './track'

// The map: a long strip of faceted paper whose far end is rolled up. Each
// frame the roll front moves, the flat part keeps its creases and the rest
// is wound into a spiral; only vertex positions change, flat shading takes
// care of the normals.

const COLS = 12
// Radius of the roll with the whole map wound, and with almost none left
const R_MAX = 1.1
const R_MIN = 0.65
// Thickness of one turn of paper, and how many turns are modelled before the
// rest piles onto one point inside the roll
const PLY = 0.045
const TURNS = 4
// Creases flatten over this much map before the front, so the paper lifts off cleanly
const FLAT = 2

const hash = (i, j) => {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const build = (rows, palette) => {
  const plane = new THREE.PlaneGeometry(WIDTH, LENGTH, COLS, rows)
  // One colour per face: every face needs its own vertices
  const geometry = plane.toNonIndexed()
  plane.dispose()
  // The UVs stay: the paper grain tiles over them
  geometry.deleteAttribute('normal')
  const position = geometry.attributes.position
  const count = position.count
  // Rest pose of each vertex: x across the map, s along it, relief above it
  const rest = new Float32Array(count * 3)
  const dx = WIDTH / COLS
  const dsz = LENGTH / rows
  for (let i = 0; i < count; i++) {
    const x0 = position.getX(i)
    const s = position.getY(i) + LENGTH / 2
    const ix = Math.round((x0 + WIDTH / 2) / dx)
    const iy = Math.round(s / dsz)
    const edge = ix === 0 || ix === COLS
    // Deckle edge: the two sides are torn, not cut
    const x = edge ? x0 + (hash(ix, iy) - 0.5) * 0.26 : x0
    const inner = !edge && iy > 0 && iy < rows
    // Creases: a fine random grain and a slow fold pattern
    const relief = inner ? (hash(ix + 7, iy + 3) - 0.5) * 0.02 + 0.014 * Math.sin(s * 0.9) * Math.sin(x0 * 0.7) : 0
    rest[i * 3] = x
    rest[i * 3 + 1] = s
    rest[i * 3 + 2] = relief
  }

  const colors = new Float32Array(count * 3)
  const paper = new THREE.Color(palette.paper)
  const deep = new THREE.Color(palette.paperDeep)
  const tint = new THREE.Color()
  for (let f = 0; f < count; f += 3) {
    const cx = (rest[f * 3] + rest[f * 3 + 3] + rest[f * 3 + 6]) / 3
    const cs = (rest[f * 3 + 1] + rest[f * 3 + 4] + rest[f * 3 + 7]) / 3
    // A diamond tessellation under a random grain: paper folded and unfolded
    const diamond = (Math.floor((cx + cs) / 1.9) + Math.floor((cs - cx) / 1.9)) & 1
    const k = clamp01(0.12 + 0.22 * diamond + (hash(f, 11) - 0.5) * 0.3)
    tint.copy(paper).lerp(deep, k)
    for (let v = 0; v < 3; v++) {
      colors[(f + v) * 3] = tint.r
      colors[(f + v) * 3 + 1] = tint.g
      colors[(f + v) * 3 + 2] = tint.b
    }
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, -LENGTH / 2), LENGTH / 2 + 6)
  return { geometry, rest }
}

/** Lays the map flat up to the front `u` and winds the rest into the roll. */
const unroll = (position, rest, u) => {
  const array = position.array
  const count = position.count
  const R = R_MIN + (R_MAX - R_MIN) * clamp01((LENGTH - u) / LENGTH)
  const cap = TURNS * 2 * Math.PI * R
  for (let i = 0; i < count; i++) {
    const x = rest[i * 3]
    const s = rest[i * 3 + 1]
    if (s <= u) {
      const k = Math.min(1, (u - s) / FLAT)
      array[i * 3] = x
      array[i * 3 + 1] = rest[i * 3 + 2] * k * k
      array[i * 3 + 2] = -s
    } else {
      // Arc length into the roll becomes an angle; each turn sits one ply
      // inside the last. phi = 0 touches the ground at s = u: no seam.
      const a = Math.min(s - u, cap)
      const phi = a / R
      const r = R - (PLY * phi) / (2 * Math.PI)
      array[i * 3] = x
      array[i * 3 + 1] = R - r * Math.cos(phi)
      array[i * 3 + 2] = -u + r * Math.sin(phi)
    }
  }
  position.needsUpdate = true
}

// Units of map covered by one tile of grain
const TILE = 5

const Parchment = ({ store, palette, lowPerf, textured }) => {
  const rows = lowPerf ? 230 : 345
  const { geometry, rest } = useMemo(() => build(rows, palette), [rows, palette])
  const fresh = useRef(true)
  const grain = useTile(PAPER_TILE, WIDTH / TILE, LENGTH / TILE)
  const map = textured ? grain : null

  useEffect(() => {
    fresh.current = true
    store.wake()
    return () => geometry.dispose()
  }, [geometry, store])

  useFrame(() => {
    if (!store.moving && !fresh.current) return
    fresh.current = false
    unroll(geometry.attributes.position, rest, store.u)
  })

  return (
    <mesh geometry={geometry} castShadow receiveShadow frustumCulled={false}>
      {/* A new material once the grain is there: a map added later needs a recompile */}
      <meshStandardMaterial
        key={map ? 'grain' : 'plain'}
        vertexColors
        flatShading
        side={THREE.DoubleSide}
        roughness={0.95}
        map={map}
        bumpMap={lowPerf ? null : map}
        bumpScale={0.02}
      />
    </mesh>
  )
}

export default Parchment

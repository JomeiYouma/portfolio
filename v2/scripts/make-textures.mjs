import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// Generates the two tileable grain textures of the Origami theme, as
// near-white luminance maps meant for a multiply blend: 255 leaves the colour
// underneath untouched, darker pixels are fibres, mottle, rings and seams.
// Everything tiles by construction: lattice noises whose cell counts divide
// the tile, sines with an integer number of periods, and a per-pixel hash.

const OUT = new URL('../public/assets/textures/', import.meta.url)
const SIZE = 512

const hash = (x, y, seed) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const smooth = (t) => t * t * (3 - 2 * t)
const wrap = (i, n) => ((i % n) + n) % n

// Value noise on a lattice of cx × cy cells over the tile; the lattice wraps, so the tile does
const value = (x, y, cx, cy, seed) => {
  const gx = (x / SIZE) * cx
  const gy = (y / SIZE) * cy
  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const fx = smooth(gx - x0)
  const fy = smooth(gy - y0)
  const n = (i, j) => hash(wrap(i, cx), wrap(j, cy), seed)
  return (n(x0, y0) * (1 - fx) + n(x0 + 1, y0) * fx) * (1 - fy) + (n(x0, y0 + 1) * (1 - fx) + n(x0 + 1, y0 + 1) * fx) * fy
}

// Fractal sum centred on 0, amplitude ±0.5
const fbm = (x, y, seed, octaves, base) => {
  let sum = 0
  let amp = 0.5
  let total = 0
  let cells = base
  for (let o = 0; o < octaves; o++) {
    sum += (value(x, y, cells, cells, seed + o) - 0.5) * amp
    total += amp
    amp *= 0.5
    cells *= 2
  }
  return sum / total
}

const write = async (name, pixels, options) => {
  await mkdir(OUT, { recursive: true })
  const info = await sharp(pixels, { raw: { width: SIZE, height: SIZE, channels: 1 } })
    .toColourspace('b-w')
    .webp(options)
    .toFile(fileURLToPath(new URL(name, OUT)))
  console.log(`${name.padEnd(20)} ${(info.size / 1024).toFixed(0)} KB`)
}

// Paper: a slow mottle, a per-pixel grain and two families of long thin fibres
const paper = () => {
  const px = new Uint8Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const mottle = fbm(x, y, 1, 4, 6)
      const grain = hash(x, y, 9) - 0.5
      const fx = Math.max(0, value(x, y, 6, 160, 21) - 0.62) * 2.6
      const fy = Math.max(0, value(x, y, 160, 6, 33) - 0.66) * 2.2
      const dark = 0.05 * (mottle + 0.5) + 0.035 * (grain + 0.5) + 0.06 * fx + 0.04 * fy
      px[y * SIZE + x] = Math.round(255 * (1 - Math.min(0.1, dark)))
    }
  }
  return px
}

// Wood: four planks along y, rings warped by noise, pores, dark seams between planks
const wood = () => {
  const px = new Uint8Array(SIZE * SIZE)
  const PLANK = SIZE / 4
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const p = Math.floor(x / PLANK)
      const warp = fbm(x, y, 40 + p, 3, 4) * 60
      const rings = 0.5 + 0.5 * Math.sin(((y + warp) * 2 * Math.PI * 9) / SIZE + p * 1.7)
      const pores = Math.max(0, value(x, y, 24, 220, 50 + p) - 0.7) * 2
      const seam = Math.min(1, Math.min(x % PLANK, PLANK - 1 - (x % PLANK)) / 2.5)
      const dark = 0.09 * rings ** 3 + 0.05 * pores + 0.03 * hash(x, y, 7) + 0.25 * (1 - seam)
      px[y * SIZE + x] = Math.round(255 * (1 - Math.min(0.38, dark)))
    }
  }
  return px
}

await write('paper-grain.webp', paper(), { nearLossless: true, quality: 60, effort: 6 })
await write('wood-grain.webp', wood(), { quality: 80, effort: 6, smartSubsample: true })

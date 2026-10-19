import * as THREE from 'three'

// Every map of the sequence is painted here, in canvas: no image to download,
// and the look stays tunable in code. Textures are cached per key for the
// lifetime of the intro and disposed with the scene.

const cache = new Map()
const canvas = (w, h) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}
const rand = (seed) => {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const texture = (c, opts = {}) => {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = opts.data ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.wrapS = t.wrapT = opts.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
  t.anisotropy = 4
  if (opts.repeat) t.repeat.set(opts.repeat, opts.repeat)
  return t
}

const memo = (key, make) => {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key)
}

export const disposeTextures = () => {
  cache.forEach((t) => t.dispose())
  cache.clear()
}

/** Turns a grey height canvas into a tangent-space normal map */
const heightToNormal = (src, strength) => {
  const w = src.width
  const h = src.height
  const sctx = src.getContext('2d')
  const data = sctx.getImageData(0, 0, w, h).data
  const out = canvas(w, h)
  const octx = out.getContext('2d')
  const img = octx.createImageData(w, h)
  const at = (x, y) => data[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * w + x) * 4
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = (1 / len) * 0.5 * 255 + 127
      img.data[i + 3] = 255
    }
  }
  octx.putImageData(img, 0, 0)
  return out
}

/** Brushed steel: fine horizontal streaks, a few deeper scratches */
export const brushedNormal = () =>
  memo('brushed', () => {
    const size = 512
    const c = canvas(size, size)
    const ctx = c.getContext('2d')
    const r = rand(7)
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 2600; i++) {
      const y = r() * size
      const g = 110 + r() * 90
      ctx.strokeStyle = `rgba(${g},${g},${g},${0.25 + r() * 0.5})`
      ctx.lineWidth = 0.5 + r() * 1.2
      ctx.beginPath()
      ctx.moveTo(-10, y)
      ctx.lineTo(size + 10, y + (r() - 0.5) * 2)
      ctx.stroke()
    }
    for (let i = 0; i < 40; i++) {
      const x = r() * size
      const y = r() * size
      const a = (r() - 0.5) * 0.6
      ctx.strokeStyle = `rgba(40,40,40,${0.4 + r() * 0.4})`
      ctx.lineWidth = 0.6 + r()
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(a) * (20 + r() * 80), y + Math.sin(a) * (20 + r() * 80))
      ctx.stroke()
    }
    return texture(heightToNormal(c, 1.6), { data: true, repeat: 3 })
  })

/** Roughness: mostly polished, rougher along scratches and worn edges */
export const wearRoughness = () =>
  memo('wear', () => {
    const size = 512
    const c = canvas(size, size)
    const ctx = c.getContext('2d')
    const r = rand(11)
    ctx.fillStyle = '#4a4a4a'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 1200; i++) {
      const x = r() * size
      const y = r() * size
      const a = r() * Math.PI
      const g = 90 + r() * 110
      ctx.strokeStyle = `rgba(${g},${g},${g},${0.15 + r() * 0.35})`
      ctx.lineWidth = 0.5 + r() * 1.5
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(a) * (4 + r() * 40), y + Math.sin(a) * (4 + r() * 40))
      ctx.stroke()
    }
    // Soft clouds of haze, like fingerprints and oil
    for (let i = 0; i < 60; i++) {
      const x = r() * size
      const y = r() * size
      const rad = 20 + r() * 60
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      g.addColorStop(0, `rgba(120,120,120,${0.12 + r() * 0.15})`)
      g.addColorStop(1, 'rgba(120,120,120,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }
    return texture(c, { data: true, repeat: 3 })
  })

/** Walnut grip: grain with a chequered field in the middle */
export const walnut = () =>
  memo('walnut', () => {
    const w = 256
    const h = 512
    const c = canvas(w, h)
    const ctx = c.getContext('2d')
    const r = rand(23)
    ctx.fillStyle = '#5a3418'
    ctx.fillRect(0, 0, w, h)
    const img = ctx.getImageData(0, 0, w, h)
    const d = img.data
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const wave = Math.sin(y * 0.11 + Math.sin(x * 0.035) * 3 + Math.sin(y * 0.021) * 2)
        const fine = Math.sin(y * 0.9 + x * 0.05) * 0.15
        const v = 0.55 + wave * 0.22 + fine + (r() - 0.5) * 0.08
        const i = (y * w + x) * 4
        d[i] = Math.min(255, 120 * v + 40)
        d[i + 1] = Math.min(255, 62 * v + 18)
        d[i + 2] = Math.min(255, 30 * v + 8)
      }
    }
    ctx.putImageData(img, 0, 0)
    // Chequering: two sets of diagonal cuts
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(28, 70, w - 56, h - 150, 24)
    ctx.clip()
    ctx.strokeStyle = 'rgba(20,8,2,0.55)'
    ctx.lineWidth = 1.2
    for (let i = -h; i < w + h; i += 9) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + h * 0.7, h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i - h * 0.7, h)
      ctx.stroke()
    }
    ctx.restore()
    return texture(c)
  })

/** Muzzle flash: a spiky star, white heart to orange tips */
export const flashSprite = (seed = 1) =>
  memo(`flash${seed}`, () => {
    const size = 256
    const c = canvas(size, size)
    const ctx = c.getContext('2d')
    const r = rand(seed * 101)
    const cx = size / 2
    const cy = size / 2
    ctx.translate(cx, cy)
    ctx.globalCompositeOperation = 'lighter'
    const spikes = 14 + Math.floor(r() * 6)
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2 + r() * 0.3
      const len = 50 + r() * 70
      const wdt = 4 + r() * 10
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len)
      g.addColorStop(0, 'rgba(255,240,200,0.9)')
      g.addColorStop(0.5, 'rgba(255,160,60,0.6)')
      g.addColorStop(1, 'rgba(255,90,20,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(Math.cos(a + Math.PI / 2) * wdt, Math.sin(a + Math.PI / 2) * wdt)
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len)
      ctx.lineTo(Math.cos(a - Math.PI / 2) * wdt, Math.sin(a - Math.PI / 2) * wdt)
      ctx.closePath()
      ctx.fill()
    }
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 46)
    core.addColorStop(0, 'rgba(255,255,255,1)')
    core.addColorStop(0.35, 'rgba(255,230,170,0.9)')
    core.addColorStop(1, 'rgba(255,140,40,0)')
    ctx.fillStyle = core
    ctx.fillRect(-60, -60, 120, 120)
    return texture(c)
  })

/** Soft puff for the smoke particles */
export const smokeSprite = () =>
  memo('smoke', () => {
    const size = 128
    const c = canvas(size, size)
    const ctx = c.getContext('2d')
    const r = rand(5)
    for (let i = 0; i < 6; i++) {
      const x = size / 2 + (r() - 0.5) * 36
      const y = size / 2 + (r() - 0.5) * 36
      const rad = 26 + r() * 22
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      g.addColorStop(0, 'rgba(255,255,255,0.35)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, size, size)
    }
    return texture(c)
  })

/** A single soft dot, for dust and sparks */
export const dotSprite = () =>
  memo('dot', () => {
    const size = 32
    const c = canvas(size, size)
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return texture(c)
  })

/** Expanding ring behind a cartridge that just appeared */
export const ringSprite = () =>
  memo('ring', () => {
    const size = 128
    const c = canvas(size, size)
    const ctx = c.getContext('2d')
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(64, 64, 52, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(64, 64, 42, 0, Math.PI * 2)
    ctx.stroke()
    return texture(c)
  })

/** The base of a cartridge: primer, ring, and the theme's name around the rim */
export const headstamp = (name, { metal, ink, primer }) =>
  memo(`stamp-${name}`, () => {
    const size = 256
    const c = canvas(size, size)
    const ctx = c.getContext('2d')
    const cx = size / 2
    ctx.fillStyle = metal
    ctx.beginPath()
    ctx.arc(cx, cx, cx, 0, Math.PI * 2)
    ctx.fill()
    // Extractor groove and primer
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(cx, cx, cx - 12, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = primer
    ctx.beginPath()
    ctx.arc(cx, cx, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'
    ctx.lineWidth = 3
    ctx.stroke()
    // The name, engraved along the upper arc, the year along the lower
    ctx.fillStyle = ink
    ctx.font = '700 30px "Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const arc = (text, radius, start, dir) => {
      const step = 0.19 * dir
      let a = start - ((text.length - 1) * step) / 2
      for (const ch of text) {
        ctx.save()
        ctx.translate(cx + Math.cos(a) * radius, cx + Math.sin(a) * radius)
        ctx.rotate(a + (dir > 0 ? Math.PI / 2 : -Math.PI / 2))
        ctx.fillText(ch, 0, 0)
        ctx.restore()
        a += step
      }
    }
    arc(name.toUpperCase(), 84, -Math.PI / 2, 1)
    ctx.font = '600 22px "Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif'
    arc('.357 · 2026', 84, Math.PI / 2, -1)
    return texture(c)
  })

/** Riso case: paper, two inks slightly out of register, a dotted screen */
export const risoCase = ({ paper, blue, red }) =>
  memo('riso-case', () => {
    const w = 512
    const h = 256
    const c = canvas(w, h)
    const ctx = c.getContext('2d')
    ctx.fillStyle = paper
    ctx.fillRect(0, 0, w, h)
    const r = rand(31)
    // Paper grain
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = `rgba(80,60,30,${r() * 0.08})`
      ctx.fillRect(r() * w, r() * h, 1.5, 1.5)
    }
    const screen = (color, dx, dy, density) => {
      ctx.fillStyle = color
      ctx.globalAlpha = 0.85
      for (let y = 0; y < h; y += 7) {
        for (let x = 0; x < w; x += 7) {
          const band = Math.sin((y / h) * Math.PI * 2) * 0.5 + 0.5
          const rad = density(x / w, band) * 3.2
          if (rad < 0.3) continue
          ctx.beginPath()
          ctx.arc(x + dx + (r() - 0.5) * 0.8, y + dy + (r() - 0.5) * 0.8, rad, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }
    screen(blue, 0, 0, (u, band) => band * (u > 0.08 && u < 0.9 ? 1 : 0.2))
    screen(red, 3, 2, (u, band) => (1 - band) * (u > 0.08 && u < 0.6 ? 0.9 : 0.15))
    // Lettering printed in both inks, shifted like a bad registration
    ctx.font = '800 64px "Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = red
    ctx.fillText('RISO', 300, h / 2 + 4)
    ctx.fillStyle = blue
    ctx.fillText('RISO', 296, h / 2)
    ctx.globalCompositeOperation = 'source-over'
    return texture(c)
  })

/** Origami case: kraft paper with crease lines and lighter facets */
export const origamiCase = ({ kraft, ink }) =>
  memo('origami-case', () => {
    const w = 512
    const h = 256
    const c = canvas(w, h)
    const ctx = c.getContext('2d')
    ctx.fillStyle = kraft
    ctx.fillRect(0, 0, w, h)
    const r = rand(41)
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(90,60,20,${r() * 0.1})`
      ctx.fillRect(r() * w, r() * h, 2, 1)
    }
    // Facets: alternating light and shade between the creases
    const cols = 8
    for (let i = 0; i < cols; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
      ctx.fillRect((i * w) / cols, 0, w / cols, h)
    }
    ctx.strokeStyle = ink
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 2
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath()
      ctx.moveTo((i * w) / cols, 0)
      ctx.lineTo((i * w) / cols, h)
      ctx.stroke()
    }
    // Diagonal valley folds
    ctx.setLineDash([6, 5])
    for (let i = 0; i < cols; i++) {
      ctx.beginPath()
      ctx.moveTo((i * w) / cols, h * 0.2)
      ctx.lineTo(((i + 1) * w) / cols, h * 0.8)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    return texture(c)
  })

/** The room behind the hand: a dark gradient with a pool of light */
export const backdrop = () =>
  memo('backdrop', () => {
    const size = 512
    const c = canvas(size, size)
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#07090c'
    ctx.fillRect(0, 0, size, size)
    const g = ctx.createRadialGradient(size * 0.38, size * 0.3, 10, size * 0.38, size * 0.3, size * 0.75)
    g.addColorStop(0, 'rgba(70,62,52,0.9)')
    g.addColorStop(0.35, 'rgba(34,32,30,0.7)')
    g.addColorStop(1, 'rgba(7,9,12,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return texture(c)
  })

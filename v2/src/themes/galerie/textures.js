import * as THREE from 'three'
import { INK } from './room'

// Wall lettering and prints are drawn on a 2D canvas with the theme's web
// fonts, then used as textures. Drawing units are centimetres.

export const SERIF = '"Bodoni Moda Variable", Didot, "Bodoni MT", serif'
export const SANS = '"Schibsted Grotesk Variable", Arial, sans-serif'

// The canvas only knows the fonts once the browser has loaded these faces
export const loadFonts = () =>
  Promise.all([
    document.fonts.load(`700 40px ${SERIF}`),
    document.fonts.load(`italic 500 40px ${SERIF}`),
    document.fonts.load(`500 40px ${SANS}`),
  ])

const wrap = (ctx, text, maxWidth) => {
  const rows = []
  let row = ''
  text.split(' ').forEach((word) => {
    const attempt = row ? `${row} ${word}` : word
    if (row && ctx.measureText(attempt).width > maxWidth) {
      rows.push(row)
      row = word
    } else {
      row = attempt
    }
  })
  if (row) rows.push(row)
  return rows
}

/**
 * Sets a column of text lines from the top of the canvas.
 * line: { text, size (cm), sans?, weight?, italic?, upper?, color?, tracking? (em),
 *         leading?, wrap?, gap? (cm after the line) }
 * A line that is too wide and does not wrap is shrunk to fit. `ink` is the
 * colour of every line that does not set its own.
 */
export const drawLines = (ctx, { lines, w, align = 'left', pad = 0, ink = INK }) => {
  const maxWidth = w - 2 * pad
  let top = pad
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = align
  lines.forEach((line) => {
    const text = line.upper ? line.text.toUpperCase() : line.text
    const setFont = (size) => {
      ctx.font = `${line.italic ? 'italic ' : ''}${line.weight ?? 400} ${size}px ${line.sans ? SANS : SERIF}`
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${(line.tracking ?? 0) * size}px`
    }
    let size = line.size
    setFont(size)
    let rows = [text]
    if (line.wrap) {
      rows = wrap(ctx, text, maxWidth)
    } else {
      const measured = ctx.measureText(text).width
      if (measured > maxWidth) {
        size = (size * maxWidth) / measured
        setFont(size)
      }
    }
    ctx.fillStyle = line.color ?? ink
    const lineHeight = size * (line.leading ?? 1.08)
    const x = align === 'center' ? w / 2 : align === 'right' ? w - pad : pad
    rows.forEach((row) => {
      ctx.fillText(row, x, top + size * 0.82)
      top += lineHeight
    })
    top += line.gap ?? 0
  })
}

/** Canvas texture of `width` × `height` metres; `draw(ctx)` works in centimetres. */
export const paint = (width, height, draw, { density = 256, background } = {}) => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * density)
  canvas.height = Math.round(height * density)
  const ctx = canvas.getContext('2d')
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.scale(density / 100, density / 100)
  draw(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** Crops a loaded image texture to `aspect`, like CSS object-fit: cover. */
export const coverTexture = (texture, aspect) => {
  const imageAspect = texture.image.width / texture.image.height
  if (imageAspect > aspect) {
    texture.repeat.set(aspect / imageAspect, 1)
    texture.offset.set((1 - aspect / imageAspect) / 2, 0)
  } else {
    texture.repeat.set(1, imageAspect / aspect)
    texture.offset.set(0, (1 - imageAspect / aspect) / 2)
  }
}

/**
 * Soft-edged dark square, stretched behind frames and under plinths as a fake
 * shadow: far cheaper than shadow maps, and free of their artefacts on walls
 * lit at a grazing angle.
 */
export const softShadowTexture = () => {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  // Only the blurred shadow of the square is kept: the square itself is drawn off-canvas
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 22
  ctx.shadowOffsetX = size * 2
  ctx.fillRect(-size * 2 + 30, 30, size - 60, size - 60)
  return new THREE.CanvasTexture(canvas)
}

/**
 * One slice of a giant figure painted across wall and floor. The glyph is
 * `glyph` cm tall and aligned to the right edge; this canvas shows the slice
 * that starts `offset` cm below the top of the glyph. On the floor the slice
 * is stretched to `fill` cm, so that seen from the middle of the room, at a
 * grazing angle, the figure reads as one piece folded over the foot of the wall.
 */
export const drawGiant = (ctx, { text, color, w, glyph, offset = 0, fill }) => {
  ctx.font = `700 100px ${SERIF}`
  const probe = ctx.measureText(text)
  let size = (glyph / probe.actualBoundingBoxAscent) * 100
  const width = (probe.width / 100) * size
  if (width > w) size *= w / width
  const ascent = (probe.actualBoundingBoxAscent / 100) * size
  ctx.font = `700 ${size}px ${SERIF}`
  ctx.fillStyle = color
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  if (fill) ctx.scale(1, fill / (ascent - offset))
  ctx.fillText(text, w, ascent - offset)
}

/** Horizontal bands in two colours, for the striped column. */
export const stripeTexture = (first, second, bands) => {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = bands * 16
  const ctx = canvas.getContext('2d')
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = i % 2 ? second : first
    ctx.fillRect(0, i * 16, 4, 16)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  return texture
}

import * as THREE from 'three'

// Text drawn on a 2D canvas with web fonts, then used as a texture. Drawing
// units are centimetres. Each theme binds its own faces with createTypesetter.

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
 * Binds a serif and a sans family and a default ink. `faces` are the font
 * shorthands (weight, style, family) the drawings use: the canvas only knows
 * a face once the browser has loaded it, which `loadFonts` waits for.
 */
export const createTypesetter = ({ serif, sans, ink, faces }) => {
  const loadFonts = () => Promise.all(faces.map((face) => document.fonts.load(face)))

  /**
   * Sets a column of text lines from the top of the canvas.
   * line: { text, size (cm), sans?, weight?, italic?, upper?, color?, tracking? (em),
   *         leading?, wrap?, gap? (cm after the line) }
   * A line that is too wide and does not wrap is shrunk to fit. `ink` is the
   * colour of every line that does not set its own.
   */
  const drawLines = (ctx, { lines, w, align = 'left', pad = 0, ink: color = ink }) => {
    const maxWidth = w - 2 * pad
    let top = pad
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = align
    lines.forEach((line) => {
      const text = line.upper ? line.text.toUpperCase() : line.text
      const setFont = (size) => {
        ctx.font = `${line.italic ? 'italic ' : ''}${line.weight ?? 400} ${size}px ${line.sans ? sans : serif}`
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
      ctx.fillStyle = line.color ?? color
      const lineHeight = size * (line.leading ?? 1.08)
      const x = align === 'center' ? w / 2 : align === 'right' ? w - pad : pad
      rows.forEach((row) => {
        ctx.fillText(row, x, top + size * 0.82)
        top += lineHeight
      })
      top += line.gap ?? 0
    })
    return top
  }

  return { drawLines, loadFonts }
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

/**
 * Soft-edged dark square, stretched under things as a fake shadow: far
 * cheaper than shadow maps, and free of their artefacts at grazing angles.
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

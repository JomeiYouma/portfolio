import * as THREE from 'three'
import { INK } from './room'
import { createTypesetter, paint, softShadowTexture } from '../../utils/canvasText'

// Wall lettering and prints are drawn on a 2D canvas with the theme's web
// fonts, then used as textures (utils/canvasText.js). Drawing units are centimetres.

export const SERIF = '"Bodoni Moda Variable", Didot, "Bodoni MT", serif'
export const SANS = '"Schibsted Grotesk Variable", Arial, sans-serif'

const typesetter = createTypesetter({
  serif: SERIF,
  sans: SANS,
  ink: INK,
  faces: [`700 40px ${SERIF}`, `italic 500 40px ${SERIF}`, `500 40px ${SANS}`],
})

export const { drawLines, loadFonts } = typesetter
export { paint, softShadowTexture }

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

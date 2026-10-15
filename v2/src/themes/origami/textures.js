import { createTypesetter, paint } from '../../utils/canvasText'

// What is lettered on the map, drawn on canvases with the theme's web fonts

// The theme's two faces: names of places engraved in IM Fell English, the
// rest in EB Garamond (the typesetter's `sans` slot)
export const DISPLAY = '"IM Fell English", "EB Garamond Variable", Georgia, serif'
export const TEXT = '"EB Garamond Variable", Garamond, Georgia, serif'

const typesetter = createTypesetter({
  serif: DISPLAY,
  sans: TEXT,
  ink: '#2a2118',
  faces: [`400 40px ${DISPLAY}`, `600 40px ${TEXT}`, `italic 400 40px ${TEXT}`],
})

export const { drawLines, loadFonts } = typesetter
export { paint }

/** A compass rose: eight points, the north one in the accent colour. */
const drawCompass = (ctx, { x, y, r, ink, accent }) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.lineWidth = 1.2
  ctx.strokeStyle = ink
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2)
  ctx.stroke()
  for (let i = 0; i < 8; i++) {
    const long = i % 2 === 0
    const len = long ? r : r * 0.55
    ctx.save()
    ctx.rotate((i * Math.PI) / 4)
    ctx.fillStyle = i === 0 ? accent : ink
    ctx.beginPath()
    ctx.moveTo(0, -len)
    ctx.lineTo(len * 0.14, 0)
    ctx.lineTo(0, len * 0.14)
    ctx.lineTo(-len * 0.14, 0)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

/** Name of a stop: its number, its title, its tagline. Canvas 460 × 150 cm. */
export const drawStation = (ctx, { number, title, tagline, ink, accent }) =>
  drawLines(ctx, {
    w: 460,
    ink,
    lines: [
      { text: number, sans: true, upper: true, weight: 600, size: 13, tracking: 0.16, color: accent, gap: 4 },
      { text: title, weight: 400, size: 60, leading: 1, gap: 6 },
      { text: tagline, sans: true, italic: true, weight: 400, size: 22, leading: 1.15, wrap: true },
    ],
  })

/** The head of the map: the name in large, a compass rose, the invitation. Canvas 600 × 240 cm. */
export const drawHero = (ctx, { title, subtitle, tagline, ink, accent }) => {
  drawLines(ctx, {
    w: 600,
    align: 'center',
    ink,
    lines: [
      { text: title, weight: 400, size: 116, leading: 0.9, gap: 8 },
      { text: subtitle, sans: true, upper: true, weight: 600, size: 16, tracking: 0.22, gap: 10 },
      { text: tagline, sans: true, italic: true, weight: 400, size: 26, leading: 1.1, wrap: true },
    ],
  })
  drawCompass(ctx, { x: 548, y: 40, r: 30, ink, accent })
}

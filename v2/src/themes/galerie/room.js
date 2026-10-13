// Geometry of the rotunda: a regular polygon with one wall ("bay") per section.
// Metres, Y up. Bay 0 is the wall at -Z; bays follow clockwise seen from above.
export const BAYS = 7
export const STEP = (2 * Math.PI) / BAYS
// Distance from the centre of the room to the middle of a wall
export const APOTHEM = 9
export const WALL_H = 5.2
export const SIDE = 2 * APOTHEM * Math.tan(Math.PI / BAYS)
// Camera height
export const EYE = 1.9
export const FOV = 50

// ─── Colour ──────────────────────────────────────────────────────────────────
// One room, one colour: wall, floor and ceiling of a bay are painted the same
// hue, and the interface takes that colour while the visitor faces it.
export const INK = '#141311'
export const PAPER = '#f6f3ec'

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
export const mix = (from, to, amount) => {
  const b = channels(to)
  return `#${channels(from).map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, '0')).join('')}`
}

// Floor and ceiling are the wall colour, a touch deeper, so the room still
// reads as a volume; `tone` is for the giant figures painted tone on tone.
// A dark room shades toward white instead of black.
const room = (wall, ink, dark = false) => {
  const toward = dark ? '#ffffff' : '#000000'
  return {
    wall,
    ink,
    floor: mix(wall, toward, dark ? 0.07 : 0.1),
    ceiling: mix(wall, toward, dark ? 0.035 : 0.05),
    tone: mix(wall, toward, dark ? 0.15 : 0.17),
  }
}

export const YELLOW = '#ffd400'
export const BLUE = '#2238f5'
export const RED = '#ff4a26'
export const PINK = '#ff8fc7'
export const GREEN = '#00b266'

// In section order: hero, about, projects, games, testimonials, services, contact
export const PALETTE = [
  room(YELLOW, INK),
  room(BLUE, '#ffffff'),
  room(RED, INK),
  room(INK, PAPER, true),
  room(PINK, INK),
  room(GREEN, INK),
  room(PAPER, INK),
]

import projects from '../../data/projects.json'
import { LETTERS, STATION_S } from './track'

// Where each project's print lies on the map: three rows along the Works
// stop, pins and tilts drawn from a hash so the album looks the same on
// every visit. Three-free: imported eagerly.

const hash = (i, j) => {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// A print: the capture at 16:10 on a card mount
export const PRINT = { width: 1.36, height: 0.85, border: 0.08 }

const ROWS = [-4.1, -2.45, 0.9]
const FIRST = STATION_S[2] - 6.5 // 29.5
const PITCH = 1.6
const PER_ROW = 10

// No print on the name of the stop, nor just before it, where its pin would
// stand in front of the letters
const NAME = LETTERS[2]
const onName = (x, s) =>
  Math.abs(x - NAME.x) < NAME.width / 2 + PRINT.width / 2 + 0.2
  && s + PRINT.height / 2 > NAME.s - NAME.height / 2 - 1.2
  && s - PRINT.height / 2 < NAME.s + NAME.height / 2 + 0.4

const slots = []
for (let k = 0; k < PER_ROW; k++) {
  const s = FIRST + k * PITCH
  ROWS.forEach((x) => { if (!onName(x, s)) slots.push({ x, s }) })
}

export const ALBUM = projects.map((project, index) => {
  const slot = slots[Math.floor((index * slots.length) / projects.length)]
  return {
    index,
    id: project.id,
    image: project.image,
    x: slot.x + (hash(index, 1) - 0.5) * 0.12,
    s: slot.s + (hash(index, 2) - 0.5) * 0.12,
    yaw: (hash(index, 3) - 0.5) * 0.21,
    // Which corner the pin goes through
    pin: hash(index, 4) < 0.5 ? -1 : 1,
  }
})

import { STATION_S } from './track'

// What lies on the desk around the map, outside its 10 units of width: a
// small set per stop, echoing it. Never under the roll, so never revealed:
// Props.jsx places these as they are. Three-free: imported eagerly.

const at = (type, x, s, extra = {}) => ({ type, x, s, yaw: 0, scale: 1, y: 0, always: true, lite: true, ...extra })
const S = STATION_S

// Beside the map the desk only shows some way ahead of a stop, on the side the
// map slid away from: right of it at even stops, left at odd ones
export const FURNITURE = [
  // Home: pencils beside the compass (the compass is a landmark, see stops.js)
  at('pencil', 6.9, S[0] + 7.2, { yaw: 0.45 }),
  at('pencil', 7.3, S[0] + 8.0, { yaw: 0.3, scale: 0.9, lite: false }),
  // About: rock samples
  at('rock', -6.4, S[1] + 4.5, { scale: 0.9, yaw: 0.3 }),
  at('rock', -7.0, S[1] + 5.8, { scale: 0.6, yaw: 1.4 }),
  at('rock', -6.2, S[1] + 6.6, { scale: 0.7, yaw: 2.1, lite: false }),
  // Works: a magnifier and rubber stamps
  at('magnifier', 6.6, S[2] + 5, { yaw: -0.5 }),
  at('stamp', 7.2, S[2] + 7.5, { yaw: 0.2 }),
  at('stamp', 6.4, S[2] + 8.6, { yaw: 0.9, lite: false }),
  // Games: a mug
  at('mug', -6.6, S[3] + 5.5, { yaw: 0.6 }),
  // Testimonials: coffee and a spoon
  at('mug', 6.5, S[4] + 5, { yaw: 2.4 }),
  at('spoon', 7.2, S[4] + 6.2, { yaw: 0.9, lite: false }),
  // Services: a ruler, an ink pot and a quill
  at('ruler', -6.6, S[5] + 4.5, { yaw: 0.1 }),
  at('inkpot', -7.2, S[5] + 6.5),
  at('quill', -6.3, S[5] + 7.4, { yaw: 0.8, lite: false }),
  // Contact: a spare rolled map and an envelope
  at('rolledMap', 6.6, S[6] + 4, { yaw: 0.3 }),
  at('envelope', 7.4, S[6] + 6, { yaw: -0.4 }),
  at('stamp', 6.5, S[6] + 7.5, { yaw: 0.5, scale: 0.9, lite: false }),
]

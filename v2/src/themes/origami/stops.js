import projects from '../../data/projects.json'
import games from '../../data/games.json'
import { asset } from '../../utils/asset'
import { QUOTES, SERVICES } from './stations'

// What stands on the map at each stop. `x` is across the map, `ds` along it
// from the stop itself. Decorative props are instanced by type (Props.jsx);
// landmarks are single meshes that answer the pointer (Landmarks.jsx).
// Three-free: OrigamiTheme reaches this file eagerly.

const pick = (value, lang) => value[lang] || value.en

// Decorative props dropped on low-perf devices carry `lite: false`
const deco = (type, x, ds, extra = {}) => ({ type, x, ds, scale: 1, yaw: 0, y: 0, lite: true, ...extra })

const cloud = (x, ds, y = 5.6, scale = 1) => deco('cloud', x, ds, { y, scale, lite: false })

// The paper city, along the far edge of the Works stop
const BUILDINGS = [
  { x: 3.9, ds: -5.7 },
  { x: 4.5, ds: -3.9 },
  { x: 4.2, ds: -2.0 },
  { x: 4.4, ds: 0.2 },
  { x: 3.9, ds: 2.3 },
  { x: 4.5, ds: 4.4 },
  { x: 4.0, ds: 6.6 },
]

// Five projects stand as objects among the prints: [project index, type, ds, yaw].
// Neon Horizon, a game, stands at the arcade instead.
const FLAGSHIPS = [
  [0, 'ticket', -6.4, 0.2],
  [1, 'strata', -4.6, 0.3],
  [5, 'globe', 1.4, 0],
  [7, 'qr', 3.8, 0.4],
  [9, 'pixel', 6.2, -0.2],
]

const ARCADES = [
  { x: 1.2, ds: 0.3 },
  { x: 2.1, ds: 0.25 },
  { x: 3.0, ds: 0.3 },
  { x: 2.1, ds: 2.2 },
]

const FIGURES = [
  { x: -4.25, ds: -0.5, yaw: 1.3 },
  { x: -2.5, ds: -0.4, yaw: -0.9 },
  { x: -3.2, ds: 1.7, yaw: Math.PI },
]

export const STOPS = [
  // 00 Home: the head of the map, mountains at the far edges, a pond with a paper boat
  {
    deco: [
      deco('mountain', -4.3, 4.6, { scale: 1.1 }),
      deco('mountain', 4.6, 4.0, { scale: 0.9, yaw: 0.6 }),
      deco('mountain', -3.6, 6.4, { scale: 0.7, yaw: 1.2, lite: false }),
      deco('pine', -4.4, -2.6, { scale: 1.1 }),
      deco('pine', -4.3, -1.0, { scale: 0.8, yaw: 1 }),
      deco('pine', 4.1, 1.8, { scale: 1 }),
      deco('pine', 3.4, 2.6, { scale: 0.7, yaw: 2, lite: false }),
      deco('rock', 3.0, -2.9, { scale: 0.8 }),
      cloud(-4.6, 5, 4, 0.5),
    ],
    landmarks: [
      { id: 'signpost', type: 'signpost', x: 4.3, ds: 0.6, yaw: -0.35, action: 'station', payload: 1, label: (t) => t('origami.landmarks.start') },
      { id: 'boat', type: 'boat', x: -3.2, ds: 2.4, yaw: 0.5, action: null, label: () => null },
      // On the desk beside the map, never under the roll
      { id: 'compass', type: 'compass', x: 6.4, ds: 5.5, yaw: 0.4, always: true, action: 'station', payload: 0, label: (t) => t('origami.landmarks.compass') },
    ],
  },
  // 01 About: a house and a windmill, and the things of a life laid on the map
  {
    deco: [
      deco('tree', -4.6, 3.7, { scale: 1.0 }),
      deco('tree', -4.7, -2.6, { scale: 0.9, yaw: 1.4 }),
      deco('tree', 4.4, -2.6, { scale: 0.8, yaw: 0.7, lite: false }),
      deco('pine', 2.5, 3.1, { scale: 0.8 }),
      deco('rock', 2.9, 2.6, { scale: 0.9, yaw: 2.2 }),
    ],
    landmarks: [
      { id: 'house', type: 'house', x: 3.0, ds: -1.1, yaw: -0.55, action: 'station', payload: 1, label: (t) => t('origami.landmarks.about') },
      { id: 'windmill', type: 'windmill', x: 3.5, ds: 1.6, yaw: -0.4, action: null, label: () => null },
      { id: 'outcrop', type: 'outcrop', x: -2.7, ds: 0.6, yaw: 0.3, action: null, label: (t) => t('origami.landmarks.outcrop') },
      { id: 'hammer', type: 'hammer', x: -1.0, ds: 1.7, yaw: -0.6, action: null, label: (t) => t('origami.landmarks.hammer') },
      { id: 'geode', type: 'geode', x: -3.2, ds: 2.8, yaw: 1.0, action: null, label: (t) => t('origami.landmarks.geode') },
      { id: 'laptop', type: 'laptop', x: -0.3, ds: 0.2, yaw: -0.2, action: null, label: (t) => t('origami.landmarks.laptop') },
      { id: 'scroll', type: 'scroll', x: 2.4, ds: 0.9, yaw: 0.2, action: 'link', payload: asset('assets/documents/opquast_certificate_2026.pdf'), label: (t) => t('origami.landmarks.scroll') },
      { id: 'bike', type: 'bike', x: 0.6, ds: 2.4, yaw: 0.5, action: null, label: (t) => t('origami.landmarks.bike') },
      { id: 'racket', type: 'racket', x: 1.6, ds: 0.1, yaw: -0.3, action: null, label: (t) => t('origami.landmarks.racket') },
    ],
  },
  // 02 Works: an album of prints along the road, a paper city on the far edge,
  // six projects standing as objects (the prints are placed by album.js)
  {
    deco: [
      ...BUILDINGS.map((spot, i) => deco('building', spot.x, spot.ds, { seed: i + 1, lite: i % 2 === 0 })),
      deco('pine', 4.6, -7.5, { scale: 0.9 }),
      deco('pine', 4.5, 8.4, { scale: 1.0, yaw: 2, lite: false }),
      cloud(4.6, 6, 4.2, 0.45),
    ],
    landmarks: FLAGSHIPS.map(([index, type, ds, yaw]) => ({
      id: `flagship-${projects[index].id}`,
      type,
      x: -0.75,
      ds,
      yaw,
      action: 'project',
      payload: index,
      label: (t, lang) => `${t('origami.landmarks.project')} : ${pick(projects[index].title, lang)}`,
    })),
  },
  // 03 Games: an arcade row, the neon arch of Neon Horizon behind it, a die
  {
    deco: [
      deco('tree', -4.3, -2.4, { scale: 0.9, yaw: 1 }),
      deco('pine', -4.4, 2.7, { scale: 0.8 }),
      deco('crate', 4.6, 2.8, { scale: 0.7, yaw: 0.6, lite: false }),
    ],
    landmarks: [
      ...games.map((game, i) => ({
        id: `game-${game.id}`,
        type: game.id === 'neon-horizon' ? 'neon' : 'arcade',
        seed: i + 1,
        ...ARCADES[i],
        yaw: 0,
        action: 'link',
        payload: game.link,
        label: (t, lang) => `${t('origami.landmarks.play')} : ${pick(game.title, lang)}`,
      })),
      { id: 'dice', type: 'dice', x: 0.6, ds: 2.6, y: 0.25, yaw: 0.6, action: null, label: () => null },
    ],
  },
  // 04 Testimonials: three figures around a campfire
  {
    deco: [
      deco('pine', 4.2, 2.4, { scale: 1 }),
      deco('pine', -4.6, 3.0, { scale: 0.9, yaw: 1 }),
      deco('pine', -0.6, 2.9, { scale: 0.7, yaw: 2.4, lite: false }),
      deco('rock', -3.0, -2.6, { scale: 0.7 }),
      deco('rock', 4.4, 0.6, { scale: 0.9, yaw: 1.1 }),
    ],
    landmarks: [
      { id: 'campfire', type: 'campfire', x: -3.2, ds: 0.4, yaw: 0, action: null, label: () => null },
      ...QUOTES.map((key, i) => ({
        id: `quote-${key}`,
        type: 'figure',
        seed: i + 1,
        ...FIGURES[i],
        action: 'testimonial',
        payload: key,
        label: (t) => `${t('origami.landmarks.testimonial')} : ${t(`testimonials.items.${key}.name`)}`,
      })),
    ],
  },
  // 05 Services: a row of market stalls, one per offer
  {
    deco: [
      deco('crate', 4.4, -2.4, { scale: 0.8 }),
      deco('crate', 4.5, 2.5, { scale: 0.7, yaw: 0.5 }),
      deco('crate', 4.2, 2.9, { scale: 0.5, yaw: 1.2, lite: false }),
      deco('tree', -4.2, 2.5, { scale: 1, yaw: 0.8 }),
      deco('pine', -4.4, -2.5, { scale: 0.9 }),
    ],
    landmarks: SERVICES.map((key, i) => ({
      id: `service-${key}`,
      type: 'stall',
      seed: i + 1,
      x: 2.9,
      ds: -1.55 + i * 1.55,
      yaw: -Math.PI / 2,
      action: 'quote',
      payload: key,
      label: (t) => `${t('origami.landmarks.service')} : ${t(`services.items.${key}.title`)}`,
    })),
  },
  // 06 Contact: a paper plane ready to fly, a mailbox, the lighthouse at the end of the map
  {
    deco: [
      deco('lighthouse', 3.9, 4.0, { scale: 1 }),
      deco('rock', 3.2, 4.4, { scale: 0.8 }),
      deco('rock', 4.5, 3.3, { scale: 0.6, yaw: 1.3, lite: false }),
      deco('pine', -4.2, 3.2, { scale: 1 }),
      deco('pine', -3.5, 4.3, { scale: 0.7, yaw: 1.5, lite: false }),
      cloud(-4.5, 6, 4, 0.5),
    ],
    landmarks: [
      { id: 'plane', type: 'plane', x: 3.0, ds: -1.3, y: 0.35, yaw: 0.3, action: 'quote', payload: null, label: (t) => t('origami.landmarks.quote') },
      { id: 'mailbox', type: 'mailbox', x: 2.2, ds: 1.1, yaw: 0.2, action: 'mail', payload: null, label: (t) => t('origami.landmarks.mail') },
    ],
  },
]

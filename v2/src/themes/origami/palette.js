// Colours of the Origami theme. origami.css repeats the ones it needs (keep
// them in sync); the scene reads them from here. Three-free on purpose: this
// file is imported eagerly by OrigamiTheme, and three.js must only load with
// the scene.

export const ORIGAMI = {
  cream: '#f4ead8', // cartouches and bar; also the ground colour in base.css
  paper: '#efe4cc', // the map itself
  paperDeep: '#d9c9a5', // its darker facets
  kraft: '#d8bd93', // folds, map-view ground
  table: '#c6a97c', // map-view ground under the wood grain
  desk: '#3e2816', // the dark of the desk: scene background and fog
  deskLit: '#9a6a3f', // the wood under the lamp, before the grain tile darkens it
  ink: '#2a2118',
  inkSoft: '#6b5b47',
  accent: '#b8381f', // vermilion seal
}

export const ORIGAMI_AAA = {
  ...ORIGAMI,
  cream: '#ffffff',
  paper: '#ffffff',
  paperDeep: '#ececec',
  kraft: '#ffffff',
  table: '#d9d9d9',
  desk: '#d9d9d9',
  deskLit: '#e6e6e6',
  ink: '#000000',
  inkSoft: '#000000',
  accent: '#7a2000',
}

// Card stock of the low-poly props: a little desaturated, like coloured paper
export const PROPS = {
  leaf: '#6d9b5a',
  leafDark: '#4f7d46',
  bark: '#8b5e3c',
  wood: '#a9774b',
  rock: '#a79f91',
  mountain: '#9c8f7a',
  snow: '#f6f2ea',
  wall: '#f3e6cf',
  roof: '#c9533a',
  door: '#5b3a29',
  water: '#7fa7c4',
  cloud: '#ffffff',
  fire: '#f28c28',
  flame: '#f6c344',
  metal: '#5c6670',
  screen: '#2b7a78',
  stripe: '#b8381f',
  sail: '#f6f2ea',
  gold: '#e0b84b',
}

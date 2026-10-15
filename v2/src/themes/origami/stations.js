import sections from '../../data/sections.json'

// The seven stops of the map, in the order of sections.json
export const STATIONS = sections.map((section, index) => ({ ...section, index }))
export const COUNT = STATIONS.length

// Heading of each cartouche (same keys as the other themes)
export const TITLES = {
  hero: 'hero.title',
  about: 'about.title',
  projects: 'projects.title',
  games: 'games.title',
  testimonials: 'testimonials.title',
  services: 'services.title',
  contact: 'contact.title',
}

// Short name lettered on the map at each stop
export const MAP_TITLES = {
  hero: 'hero.title',
  about: 'about.eyebrow',
  projects: 'projects.title',
  games: 'games.title',
  testimonials: 'testimonials.eyebrow',
  services: 'services.eyebrow',
  contact: 'contact.title',
}

export const EMAIL = 'raphael.madore.pro@mailo.com'

// The projects shown in the Works note, as indexes in projects.json; the
// others are pinned on the 3D map and listed in the note's index
export const FEATURED = [0, 1, 2, 8, 9, 10]
export const QUOTES = ['navy', 'eric', 'caroline']
export const SERVICES = ['create', 'update', 'gamify']

export const stationNumber = (index) => String(index).padStart(2, '0')

// Which side of the window each cartouche sits on; the map slides to the other
export const SIDES = STATIONS.map((_, index) => (index % 2 ? 'left' : 'right'))

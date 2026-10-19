import { lazy } from 'react'
import NeonTheme from './neon/NeonTheme'

// A theme is a root component that owns its whole layout and navigation; the
// content (translations, projects, games, skills) is shared. The order here is
// the Shift+click cycle order. The first entry is the default and ships in the
// main bundle; the others are separate chunks, loaded on first use. `preload`
// fetches a chunk ahead of time: the opening sequence calls it while the
// visitor is still loading the revolver, so the chosen theme is painted
// before the shot reveals it.
const loadRiso = () => import('./riso/RisoTheme')
const loadGalerie = () => import('./galerie/GalerieTheme')
const loadOrigami = () => import('./origami/OrigamiTheme')

export const THEMES = [
  { id: 'neon', Component: NeonTheme, preload: () => Promise.resolve() },
  { id: 'riso', Component: lazy(loadRiso), preload: loadRiso },
  { id: 'galerie', Component: lazy(loadGalerie), preload: loadGalerie },
  { id: 'origami', Component: lazy(loadOrigami), preload: loadOrigami },
]

export const DEFAULT_THEME_ID = THEMES[0].id

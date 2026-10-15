import { lazy } from 'react'
import NeonTheme from './neon/NeonTheme'

// A theme is a root component that owns its whole layout and navigation; the
// content (translations, projects, games, skills) is shared. The order here is
// the Shift+click cycle order. The first entry is the default and ships in the
// main bundle; the others are separate chunks, loaded on first use.
export const THEMES = [
  { id: 'neon', Component: NeonTheme },
  { id: 'riso', Component: lazy(() => import('./riso/RisoTheme')) },
  { id: 'galerie', Component: lazy(() => import('./galerie/GalerieTheme')) },
  { id: 'origami', Component: lazy(() => import('./origami/OrigamiTheme')) },
]

export const DEFAULT_THEME_ID = THEMES[0].id

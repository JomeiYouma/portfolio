import NeonTheme from './neon/NeonTheme'

// A theme is a root component that owns its whole layout and navigation; the
// content (translations, projects, games, skills) is shared. The order here is
// the Shift+click cycle order, and the first entry is the default.
export const THEMES = [
  { id: 'neon', Component: NeonTheme },
]

export const DEFAULT_THEME_ID = THEMES[0].id

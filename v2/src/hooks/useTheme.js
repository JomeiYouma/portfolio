import { useCallback, useEffect, useState } from 'react'
import { THEMES, DEFAULT_THEME_ID } from '../themes/registry'

// Same key as the inline bootstrap script in index.html
const STORAGE_KEY = 'portfolio-theme'

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return THEMES.some((theme) => theme.id === stored) ? stored : DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}

export const useTheme = () => {
  const [themeId, setThemeId] = useState(readStoredTheme)

  // <html data-theme> is what every theme stylesheet scopes itself on
  useEffect(() => {
    document.documentElement.dataset.theme = themeId
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      // Storage blocked (private mode): the theme still applies for this visit
    }
  }, [themeId])

  const cycleTheme = useCallback(() => {
    setThemeId((current) => {
      const index = THEMES.findIndex((theme) => theme.id === current)
      return THEMES[(index + 1) % THEMES.length].id
    })
  }, [])

  return {
    theme: THEMES.find((theme) => theme.id === themeId) ?? THEMES[0],
    cycleTheme,
  }
}

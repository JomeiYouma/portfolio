import { useEffect, useState } from 'react'
import translations from '../data/translations.json'

const detectDefaultLang = () => {
  if (typeof navigator === 'undefined') return 'fr'
  const lang = (navigator.language || '').toLowerCase()
  return lang.startsWith('en') ? 'en' : 'fr'
}

const resolveInitialLang = () => {
  if (typeof window === 'undefined') return 'fr'
  return window.localStorage?.getItem('preferred-language') || detectDefaultLang()
}

let currentLang = typeof window === 'undefined' ? 'fr' : resolveInitialLang()

export const useI18n = () => {
  const [lang, setLang] = useState(currentLang)

  useEffect(() => {
    const resolved = resolveInitialLang()
    if (resolved !== currentLang) {
      currentLang = resolved
      setLang(resolved)
    }
    document.documentElement.lang = resolved
  }, [])

  const t = (path) => {
    const keys = path.split('.')
    let value = translations[currentLang]
    for (const key of keys) {
      value = value?.[key]
    }
    return value || path
  }

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'fr' : 'en'
    currentLang = newLang
    localStorage.setItem('preferred-language', newLang)
    setLang(newLang)
    document.documentElement.lang = newLang
  }

  return { lang, t, toggleLanguage, isLoaded: true }
}

export const getCurrentLanguage = () => currentLang

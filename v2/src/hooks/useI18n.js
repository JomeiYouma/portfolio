import { useEffect, useState } from 'react'

let translations = {}
let currentLang = 'en'

export const useI18n = () => {
  const [lang, setLang] = useState('en')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch('/data/translations.json')
        translations = await response.json()
        const storedLang = localStorage.getItem('preferred-language')
        currentLang = storedLang || 'en'
        setLang(currentLang)
        setIsLoaded(true)
      } catch (error) {
        console.error('Error loading translations:', error)
        setIsLoaded(true)
      }
    }
    loadTranslations()
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

  return { lang, t, toggleLanguage, isLoaded }
}

export const getCurrentLanguage = () => currentLang

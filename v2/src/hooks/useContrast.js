import { useState, useEffect } from 'react'

export const useContrast = () => {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const storedMode = localStorage.getItem('contrast-mode')
    const initialMode = storedMode === 'true'
    setIsActive(initialMode)
    if (initialMode) {
      document.body.classList.add('aaa-contrast')
    }
  }, [])

  const toggle = () => {
    const newMode = !isActive
    setIsActive(newMode)
    localStorage.setItem('contrast-mode', newMode.toString())
    if (newMode) {
      document.body.classList.add('aaa-contrast')
    } else {
      document.body.classList.remove('aaa-contrast')
    }
  }

  return { isActive, toggle }
}

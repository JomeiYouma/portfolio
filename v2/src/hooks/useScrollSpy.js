import { useEffect, useState } from 'react'

export const useScrollSpy = (sectionIds = []) => {
  const [activeId, setActiveId] = useState(sectionIds[0] || '')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!sectionIds.length) return

    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window

    if (!isMobile) {
      // Desktop: driven by sectionChange events from scroll.js
      const handler = (e) => {
        const index = e.detail.index
        if (sectionIds[index]) setActiveId(sectionIds[index])
        const p = sectionIds.length > 1 ? index / (sectionIds.length - 1) : 0
        setProgress(p)
      }
      window.addEventListener('sectionChange', handler)
      return () => window.removeEventListener('sectionChange', handler)
    } else {
      // Mobile: IntersectionObserver
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id)
              const index = sectionIds.indexOf(entry.target.id)
              if (index !== -1) {
                const p = sectionIds.length > 1 ? index / (sectionIds.length - 1) : 0
                setProgress(p)
                document.documentElement.style.setProperty('--scroll-progress', p.toFixed(3))
              }
            }
          })
        },
        { threshold: 0.5 }
      )
      sectionIds.forEach((id) => {
        const el = document.getElementById(id)
        if (el) observer.observe(el)
      })
      return () => observer.disconnect()
    }
  }, [sectionIds])

  useEffect(() => {
    document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(3))
  }, [progress])

  return { activeId, progress }
}
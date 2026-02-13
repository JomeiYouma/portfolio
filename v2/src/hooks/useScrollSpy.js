import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const useScrollSpy = (sectionIds = []) => {
  const [activeId, setActiveId] = useState(sectionIds[0] || '')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!sectionIds.length) {
      setProgress(0)
      return undefined
    }

    // For horizontal scroll, we track based on scroll position
    const updateProgress = () => {
      const scrolled = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const newProgress = maxScroll > 0 ? scrolled / maxScroll : 0
      setProgress(newProgress)

      // Update active section based on horizontal position
      const main = document.querySelector('main')
      if (main) {
        const mainX = gsap.getProperty(main, 'x')
        const sectionWidth = window.innerWidth
        const currentIndex = Math.round(Math.abs(mainX) / sectionWidth)
        const clampedIndex = Math.max(0, Math.min(currentIndex, sectionIds.length - 1))
        setActiveId(sectionIds[clampedIndex])
      }
    }

    const scrollListener = () => {
      requestAnimationFrame(updateProgress)
    }

    window.addEventListener('scroll', scrollListener)
    updateProgress()

    return () => {
      window.removeEventListener('scroll', scrollListener)
    }
  }, [sectionIds])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--scroll-progress',
      progress.toFixed(3),
    )
  }, [progress])

  return { activeId, progress }
}

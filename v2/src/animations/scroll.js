import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

const prefersReducedMotion = () =>
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

let horizontalScroll = null
let scrollTriggerInstance = null

export const initScrollEffects = () => {
  // Mobile: vertical scroll
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
  
  if (isMobile || prefersReducedMotion()) {
    // Remove horizontal constraints for mobile
    document.documentElement.style.setProperty('--scroll-mode', 'vertical')
    return () => {}
  }

  document.documentElement.style.setProperty('--scroll-mode', 'horizontal')

  const main = document.querySelector('main')
  const sections = gsap.utils.toArray('section[data-section]')
  
  if (!main || sections.length < 2) {
    return () => {}
  }

  // Calculate total width
  const getScrollWidth = () => main.scrollWidth - window.innerWidth

  // Create horizontal scroll animation
  horizontalScroll = gsap.to(main, {
    x: () => -getScrollWidth(),
    ease: 'none',
    scrollTrigger: {
      trigger: '.app',
      start: 'top top',
      end: () => `+=${getScrollWidth()}`,
      scrub: 0.8,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Dispatch custom event for scroll progress
        window.dispatchEvent(new CustomEvent('horizontalScroll', { 
          detail: { progress: self.progress }
        }))
      }
    },
  })

  scrollTriggerInstance = horizontalScroll.scrollTrigger

  // Section entrance animations
  sections.forEach((section) => {
    gsap.fromTo(
      section.querySelectorAll('.section-inner > *'),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          containerAnimation: horizontalScroll,
          start: 'left 80%',
          toggleActions: 'play none none reverse',
        },
      }
    )
  })

  // Handle resize
  const handleResize = () => {
    ScrollTrigger.refresh()
  }
  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill()
    }
    if (horizontalScroll) {
      horizontalScroll.kill()
    }
    ScrollTrigger.getAll().forEach(st => st.kill())
  }
}

export const scrollToSection = (id) => {
  const target = document.getElementById(id)
  const main = document.querySelector('main')
  
  if (!target || !main) return

  const sections = Array.from(document.querySelectorAll('section[data-section]'))
  const index = sections.findIndex((s) => s.id === id)
  
  if (index === -1) return

  // Mobile or reduced motion: simple scroll
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
  
  if (isMobile || prefersReducedMotion()) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }

  // Desktop: calculate horizontal position
  const totalScrollWidth = main.scrollWidth - window.innerWidth
  const sectionCount = sections.length - 1
  const scrollPerSection = totalScrollWidth / sectionCount
  const targetScrollY = scrollPerSection * index

  gsap.to(window, {
    duration: 1,
    scrollTo: { y: targetScrollY, autoKill: false },
    ease: 'power2.inOut',
  })
}

// Helper to get current section index
export const getCurrentSectionIndex = () => {
  if (!scrollTriggerInstance) return 0
  const progress = scrollTriggerInstance.progress
  const sections = document.querySelectorAll('section[data-section]')
  return Math.round(progress * (sections.length - 1))
}

import { gsap } from 'gsap'

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// ─── State ────────────────────────────────────────────────────────────────────
let currentIndex = 0
let isAnimating  = false
let sectionEls   = []

const DURATION = 0.75
const EASE     = 'power3.inOut'

// ─── Core snap ───────────────────────────────────────────────────────────────
const goToIndex = (index, duration = DURATION) => {
  if (isAnimating) return
  const clamped = Math.max(0, Math.min(index, sectionEls.length - 1))
  if (clamped === currentIndex && duration !== 0) return

  isAnimating  = true
  currentIndex = clamped

  gsap.to(document.querySelector('main'), {
    x: -(window.innerWidth * clamped),
    duration,
    ease: EASE,
    onComplete: () => { isAnimating = false },
  })

  const p = sectionEls.length > 1 ? clamped / (sectionEls.length - 1) : 0
  document.documentElement.style.setProperty('--scroll-progress', p.toFixed(3))
  window.dispatchEvent(new CustomEvent('sectionChange', { detail: { index: clamped } }))
}

// ─── Wheel / Trackpad ────────────────────────────────────────────────────────
// Strategy: fire on the FIRST wheel event that crosses the threshold.
// Then lock (isAnimating) until the snap animation completes.
// This works for both mouse wheels (large deltaY) and trackpads (small deltaY).

const WHEEL_THRESHOLD = 30   // px — enough to distinguish intent from noise

const onWheel = (e) => {
  e.preventDefault()

  // Already animating → swallow all events until done
  if (isAnimating) return

  const delta = e.deltaY + e.deltaX   // trackpad can send horizontal too

  if (Math.abs(delta) >= WHEEL_THRESHOLD) {
    goToIndex(currentIndex + (delta > 0 ? 1 : -1))
  }
}

// ─── Touch ────────────────────────────────────────────────────────────────────
let touchStartX = 0
let touchStartY = 0

const onTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

const onTouchEnd = (e) => {
  const dx = touchStartX - e.changedTouches[0].clientX
  const dy = touchStartY - e.changedTouches[0].clientY
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
    goToIndex(currentIndex + (dx > 0 ? 1 : -1))
  }
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────
const onKeyDown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) { e.preventDefault(); goToIndex(currentIndex + 1) }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goToIndex(currentIndex - 1) }
  else if (e.key === 'Home') { e.preventDefault(); goToIndex(0) }
  else if (e.key === 'End')  { e.preventDefault(); goToIndex(sectionEls.length - 1) }
}

// ─── Resize ───────────────────────────────────────────────────────────────────
let resizeTimer = null
const onResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => goToIndex(currentIndex, 0), 150)
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export const initScrollEffects = () => {
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
  if (isMobile || prefersReducedMotion()) {
    document.documentElement.style.setProperty('--scroll-mode', 'vertical')
    return () => {}
  }

  document.documentElement.style.setProperty('--scroll-mode', 'horizontal')

  const main = document.querySelector('main')
  sectionEls = Array.from(document.querySelectorAll('section[data-section]'))
  if (!main || sectionEls.length < 2) return () => {}

  currentIndex = 0
  isAnimating  = false
  gsap.set(main, { x: 0 })

  // Non-passive wheel so we can preventDefault and block native scroll
  window.addEventListener('wheel',      onWheel,      { passive: false })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchend',   onTouchEnd,   { passive: true })
  window.addEventListener('keydown',    onKeyDown)
  window.addEventListener('resize',     onResize)

  return () => {
    window.removeEventListener('wheel',      onWheel)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend',   onTouchEnd)
    window.removeEventListener('keydown',    onKeyDown)
    window.removeEventListener('resize',     onResize)
    clearTimeout(resizeTimer)
  }
}

// ─── Public ───────────────────────────────────────────────────────────────────
export const scrollToSection = (id) => {
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
  if (isMobile || prefersReducedMotion()) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  const all   = Array.from(document.querySelectorAll('section[data-section]'))
  const index = all.findIndex((s) => s.id === id)
  if (index !== -1) goToIndex(index)
}

export const getCurrentSectionIndex = () => currentIndex
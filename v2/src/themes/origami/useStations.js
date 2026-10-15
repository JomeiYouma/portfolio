import { useEffect, useState } from 'react'

// The stop crossing the middle of the window is the current one
const MIDDLE = { rootMargin: '-45% 0px -50% 0px' }
// While a note is read the map holds still: it sets off once the end of the
// note has risen to this height of the window
const HOLD_LINE = 0.55

/** Index of the current stop: navigation state and the scene's focus. */
export const useActiveStation = (mainRef) => {
  const [station, setStation] = useState(0)
  useEffect(() => {
    const main = mainRef.current
    if (!main) return undefined
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) setStation(Number(entry.target.dataset.station))
      }),
      MIDDLE,
    )
    main.querySelectorAll('.ori-station').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [mainRef])
  return station
}

/**
 * Feeds the scroll store. Progress runs from 0 at the first stop to 1 at the
 * last. It stays on a stop while its note is being read, then runs from one
 * stop to the next across the blank between two notes: one pause, one
 * journey, whatever the height of the notes. Measured again whenever the
 * page reflows (fonts, GitHub lists, resize).
 */
export const useScrollProgress = (mainRef, store) => {
  useEffect(() => {
    const main = mainRef.current
    if (!main) return undefined
    // Per stop: where its section starts, and where the map sets off from it
    let stops = []
    let end = 1
    let pad = 0
    // The rail's folded map reads the same progress from a CSS variable,
    // written once per frame: nothing in React renders on scroll
    let frame = 0
    const paint = () => {
      frame = 0
      document.documentElement.style.setProperty('--ori-progress', store.target.toFixed(4))
    }

    const onScroll = () => {
      // The snap and scrollIntoView both leave a stop `pad` below the top of the window
      const y = window.scrollY + pad
      let i = stops.length - 1
      while (i > 0 && stops[i].top > y) i--
      const next = i + 1 < stops.length ? stops[i + 1].top : end
      const start = Math.min(stops[i].hold, next - 1)
      const frac = Math.min(1, Math.max(0, (y - start) / Math.max(1, next - start)))
      store.setTarget((i + frac) / Math.max(1, stops.length - 1))
      if (!frame) frame = requestAnimationFrame(paint)
    }

    const measure = () => {
      pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const scrollY = window.scrollY
      const line = window.innerHeight * HOLD_LINE
      stops = Array.from(main.querySelectorAll('.ori-station'), (el) => {
        const top = el.getBoundingClientRect().top + scrollY
        const note = el.querySelector('.ori-cartouche')
        const bottom = note ? note.getBoundingClientRect().bottom + scrollY : top
        return { top, hold: Math.max(top, bottom - line + pad) }
      })
      end = document.documentElement.scrollHeight - window.innerHeight + pad
      // The room each note leaves free beside it, between the rail and the
      // note or the note and the edge: the map slides to its middle
      const width = window.innerWidth
      const rail = document.querySelector('.ori-rail')?.getBoundingClientRect()
      const railEdge = rail && rail.height > rail.width ? rail.right : 0
      store.setShifts(Array.from(main.querySelectorAll('.ori-cartouche'), (note) => {
        const r = note.getBoundingClientRect()
        const [from, to] = (r.left + r.right) / 2 > width / 2 ? [railEdge, r.left] : [r.right, width]
        return (width / 2 - (from + to) / 2) / width
      }))
      onScroll()
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    const ro = new ResizeObserver(measure)
    ro.observe(main)
    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.style.removeProperty('--ori-progress')
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      ro.disconnect()
    }
  }, [mainRef, store])
}

import { useEffect, useRef } from 'react'

const MIN_THUMB = 48

/**
 * Vertical scrollbar of the theme: a dithered rail on the right edge with a
 * solid thumb, standing in for the native bar (hidden in riso.css for mouse
 * users only). Drag the thumb or press the rail to scroll. It is aria-hidden:
 * keyboard and assistive tech keep using native scrolling, which is untouched.
 */
const ScrollRail = () => {
  const railRef = useRef(null)
  const thumbRef = useRef(null)
  // Distance from the top of the thumb to the pointer while dragging, else null
  const grab = useRef(null)

  useEffect(() => {
    const rail = railRef.current
    const thumb = thumbRef.current
    let frame = 0

    const update = () => {
      frame = 0
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      const railHeight = rail.clientHeight
      const thumbHeight = Math.max(MIN_THUMB, Math.round((railHeight * window.innerHeight) / doc.scrollHeight))
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0
      thumb.style.height = `${thumbHeight}px`
      thumb.style.transform = `translateY(${Math.round(progress * (railHeight - thumbHeight))}px)`
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // The page grows and shrinks without any scroll or resize (project list unfolding)
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ro.disconnect()
    }
  }, [])

  const scrollToPointer = (clientY) => {
    const rail = railRef.current
    const thumbHeight = thumbRef.current.offsetHeight
    const rect = rail.getBoundingClientRect()
    const travel = rect.height - thumbHeight
    const ratio = travel > 0 ? Math.min(1, Math.max(0, (clientY - rect.top - grab.current) / travel)) : 0
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    // 'instant': the theme sets scroll-behavior: smooth, which would lag behind the pointer
    window.scrollTo({ top: ratio * scrollable, behavior: 'instant' })
  }

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    const thumbRect = thumbRef.current.getBoundingClientRect()
    const onThumb = e.clientY >= thumbRect.top && e.clientY <= thumbRect.bottom
    // Pressing the bare rail centres the thumb under the pointer
    grab.current = onThumb ? e.clientY - thumbRect.top : thumbRect.height / 2
    railRef.current.setPointerCapture(e.pointerId)
    scrollToPointer(e.clientY)
    e.preventDefault() // no text selection while dragging
  }
  const onPointerMove = (e) => { if (grab.current !== null) scrollToPointer(e.clientY) }
  const release = () => { grab.current = null }

  return (
    <div
      className="rz-rail"
      ref={railRef}
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <span className="rz-rail-thumb" ref={thumbRef} />
    </div>
  )
}

export default ScrollRail

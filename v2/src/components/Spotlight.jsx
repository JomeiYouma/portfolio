import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useMotionTemplate, useSpring } from 'motion/react'
import './Spotlight.css'

/**
 * Spotlight — a soft accent radial that follows the cursor inside its parent.
 * Mount it as the first child of any positioned wrapper.
 */
const Spotlight = ({ size = 520, intensity = 0.12, color = '0,255,179' }) => {
  const ref = useRef(null)
  const x = useMotionValue(-9999)
  const y = useMotionValue(-9999)
  const opacity = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 120, damping: 24, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 120, damping: 24, mass: 0.6 })

  const background = useMotionTemplate`radial-gradient(${size}px circle at ${sx}px ${sy}px, rgba(${color}, ${intensity}), transparent 60%)`

  useEffect(() => {
    const parent = ref.current?.parentElement
    if (!parent) return

    const onMove = (e) => {
      const r = parent.getBoundingClientRect()
      x.set(e.clientX - r.left)
      y.set(e.clientY - r.top)
    }
    const onEnter = () => opacity.set(1)
    const onLeave = () => opacity.set(0)

    parent.addEventListener('mousemove', onMove)
    parent.addEventListener('mouseenter', onEnter)
    parent.addEventListener('mouseleave', onLeave)

    return () => {
      parent.removeEventListener('mousemove', onMove)
      parent.removeEventListener('mouseenter', onEnter)
      parent.removeEventListener('mouseleave', onLeave)
    }
  }, [x, y, opacity])

  return (
    <motion.span
      ref={ref}
      aria-hidden="true"
      className="spotlight-overlay"
      style={{ background, opacity }}
    />
  )
}

export default Spotlight

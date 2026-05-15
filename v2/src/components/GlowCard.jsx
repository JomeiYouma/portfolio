import { useRef } from 'react'
import { motion, useMotionValue, useMotionTemplate, useSpring } from 'motion/react'
import './GlowCard.css'

/**
 * Wraps any block in a frame that:
 *   - tracks the pointer and reveals a soft accent gradient under the cursor
 *   - keeps the underlying child markup untouched (only adds wrapper + overlay)
 *
 * Usage: <GlowCard className="hero-card">…</GlowCard>
 */
const GlowCard = ({
  as: Tag = 'div',
  className = '',
  children,
  size = 360,
  intensity = 0.18,
  ...rest
}) => {
  const ref = useRef(null)
  const x = useMotionValue(-9999)
  const y = useMotionValue(-9999)
  const opacity = useMotionValue(0)

  // Spring smoothing keeps the glow from snapping when re-entering
  const sx = useSpring(x, { stiffness: 220, damping: 28, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 28, mass: 0.4 })

  const background = useMotionTemplate`radial-gradient(${size}px circle at ${sx}px ${sy}px, rgba(0,255,179,${intensity}), transparent 65%)`

  const handleMove = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
  }

  return (
    <Tag
      ref={ref}
      className={`glow-card${className ? ` ${className}` : ''}`}
      onMouseMove={handleMove}
      onMouseEnter={() => opacity.set(1)}
      onMouseLeave={() => opacity.set(0)}
      {...rest}
    >
      <motion.span
        aria-hidden="true"
        className="glow-card__halo"
        style={{ background, opacity }}
      />
      <span className="glow-card__content">{children}</span>
    </Tag>
  )
}

export default GlowCard

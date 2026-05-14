import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

/**
 * MagneticButton — wraps any clickable so it gently follows the cursor.
 * Forwards all native props/events to the inner motion element.
 *
 * `as` controls the rendered tag (button | a | div).
 * `strength` (px) caps how far the element drifts toward the cursor.
 */
const MagneticButton = ({
  as = 'button',
  strength = 14,
  className = '',
  children,
  ...rest
}) => {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 })

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const dx = ((e.clientX - r.left) / r.width - 0.5) * 2
    const dy = ((e.clientY - r.top) / r.height - 0.5) * 2
    x.set(dx * strength)
    y.set(dy * strength)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  const Component = motion[as] ?? motion.button

  return (
    <Component
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      {...rest}
    >
      {children}
    </Component>
  )
}

export default MagneticButton

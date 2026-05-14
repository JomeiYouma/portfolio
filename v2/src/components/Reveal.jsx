import { motion, useReducedMotion } from 'motion/react'

const baseTransition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] }

/**
 * Reveal — fade + slide-up on first scroll into view.
 * Stagger children by wrapping them in <Reveal.Item> inside a <Reveal stagger>.
 */
const Reveal = ({
  as: Tag = 'div',
  children,
  delay = 0,
  y = 24,
  stagger = false,
  className = '',
  ...rest
}) => {
  const reduce = useReducedMotion()
  const MotionTag = motion[Tag] ?? motion.div

  if (reduce) {
    const Plain = Tag
    return <Plain className={className} {...rest}>{children}</Plain>
  }

  if (stagger) {
    return (
      <MotionTag
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-12% 0px' }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: delay } },
        }}
        {...rest}
      >
        {children}
      </MotionTag>
    )
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ ...baseTransition, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

const Item = ({ as: Tag = 'div', children, y = 18, className = '', ...rest }) => {
  const reduce = useReducedMotion()
  const MotionTag = motion[Tag] ?? motion.div

  if (reduce) {
    const Plain = Tag
    return <Plain className={className} {...rest}>{children}</Plain>
  }

  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: baseTransition },
      }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

Reveal.Item = Item

export default Reveal

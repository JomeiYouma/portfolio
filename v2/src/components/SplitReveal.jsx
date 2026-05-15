import { motion, useReducedMotion } from 'motion/react'

/**
 * SplitReveal — animates a string character-by-character on mount.
 * Spaces preserved with a non-breaking-space-like inline-block to keep kerning.
 */
const SplitReveal = ({
  text,
  as: Tag = 'span',
  className = '',
  delay = 0,
  stagger = 0.04,
  duration = 0.6,
  ...rest
}) => {
  const reduce = useReducedMotion()
  const MotionTag = motion[Tag] ?? motion.span

  if (reduce) {
    const Plain = Tag
    return <Plain className={className} {...rest}>{text}</Plain>
  }

  const chars = Array.from(text)

  return (
    <MotionTag
      className={className}
      aria-label={text}
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      {...rest}
    >
      {chars.map((c, i) => (
        <motion.span
          key={`${c}-${i}`}
          aria-hidden="true"
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
          variants={{
            hidden: { opacity: 0, y: '0.6em', filter: 'blur(6px)' },
            show: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: { duration, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          {c === ' ' ? ' ' : c}
        </motion.span>
      ))}
    </MotionTag>
  )
}

export default SplitReveal

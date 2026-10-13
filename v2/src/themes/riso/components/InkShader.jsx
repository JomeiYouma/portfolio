import { useRef } from 'react'
import { useInView } from 'motion/react'
import { IS_LOW_PERF } from '../../../utils/perf'

/**
 * Mounts a WebGL shader only while its box is near the viewport. Browsers cap
 * the number of live WebGL contexts, and an off-screen shader would keep
 * drawing for nothing. On low-perf devices the shader is skipped altogether and
 * the box keeps whatever static CSS texture its class gives it.
 */
const InkShader = ({ className = '', children }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '200px 0px' })
  const live = inView && !IS_LOW_PERF

  return (
    <div ref={ref} className={`${className} ${live ? 'is-live' : 'is-static'}`} aria-hidden="true">
      {live ? children : null}
    </div>
  )
}

export default InkShader

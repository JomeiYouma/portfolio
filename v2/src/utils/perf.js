// Low-perf detection.
// Runs once at module load and tags <html> so CSS can drop expensive effects
// (backdrop-filter mainly). JS callers also read the boolean to downscale
// canvases / WebGL renderers.
//
// Signals: low core count, low device memory, Save-Data, reduced-motion.
// Any signal flips us to low-perf. The check is conservative on purpose: the
// goal is to keep frame budget on entry-level Windows laptops with iGPU.

const detect = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const cores = navigator.hardwareConcurrency
  if (typeof cores === 'number' && cores > 0 && cores <= 4) return true

  const mem = navigator.deviceMemory
  if (typeof mem === 'number' && mem > 0 && mem <= 4) return true

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (conn?.saveData) return true
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return true

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true

  return false
}

export const IS_LOW_PERF = detect()

if (typeof document !== 'undefined' && IS_LOW_PERF) {
  document.documentElement.classList.add('low-perf')
}

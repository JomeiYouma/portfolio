import { useEffect, useState } from 'react'

const MIN_WIDTH = 480
const MIN_HEIGHT = 500

const isTooSmall = () =>
  typeof window !== 'undefined' &&
  (window.innerWidth < MIN_WIDTH || window.innerHeight < MIN_HEIGHT)

const ViewportGate = ({ children }) => {
  const [tooSmall, setTooSmall] = useState(isTooSmall)
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 0))
  const [h, setH] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 0))

  useEffect(() => {
    let timer = null
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        setW(window.innerWidth)
        setH(window.innerHeight)
        setTooSmall(isTooSmall())
      }, 120)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
    }
  }, [])

  if (!tooSmall) return children

  return (
    <div className="viewport-gate" role="alert" aria-live="polite">
      <div className="viewport-gate-card">
        <p className="viewport-gate-eyebrow">// system_check</p>
        <h1 className="viewport-gate-title">Viewport insuffisant</h1>
        <p className="viewport-gate-lead">
          Cette expérience demande un écran plus grand. Agrandis la fenêtre ou
          tourne ton appareil pour continuer.
        </p>
        <p className="viewport-gate-lead-en">
          Increase the viewport size to view this experience.
        </p>

        <div className="viewport-gate-grid">
          <div className={`viewport-gate-cell${w >= MIN_WIDTH ? ' ok' : ''}`}>
            <span className="viewport-gate-label">Width</span>
            <span className="viewport-gate-value">{w}</span>
            <span className="viewport-gate-target">/ {MIN_WIDTH} px</span>
          </div>
          <div className={`viewport-gate-cell${h >= MIN_HEIGHT ? ' ok' : ''}`}>
            <span className="viewport-gate-label">Height</span>
            <span className="viewport-gate-value">{h}</span>
            <span className="viewport-gate-target">/ {MIN_HEIGHT} px</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewportGate

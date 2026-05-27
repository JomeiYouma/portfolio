import { useEffect, useState } from 'react'

// Two supported viewport ranges; anything in between is unsupported.
// Mobile range stacks vertically; desktop range uses the horizontal-scroll layout.
// Aspect ratio bounds keep us out of the in-between formats where the layouts
// (panoramic ultrawide, near-square desktop, landscape phone) visibly break.
const MOBILE_MIN_W = 360
const MOBILE_MAX_W = 768
const MOBILE_MIN_H = 600
const MOBILE_MAX_AR = 0.95
const DESKTOP_MIN_W = 1024
const DESKTOP_MIN_H = 640
const DESKTOP_MIN_AR = 1.10
const DESKTOP_MAX_AR = 3.60

const getMode = (w, h) => {
  if (!w || !h) return null
  const ar = w / h
  if (
    w >= MOBILE_MIN_W && w <= MOBILE_MAX_W &&
    h >= MOBILE_MIN_H && ar <= MOBILE_MAX_AR
  ) return 'mobile'
  if (
    w >= DESKTOP_MIN_W && h >= DESKTOP_MIN_H &&
    ar >= DESKTOP_MIN_AR && ar <= DESKTOP_MAX_AR
  ) return 'desktop'
  return null
}

const ViewportGate = ({ children }) => {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 0))
  const [h, setH] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 0))

  useEffect(() => {
    let timer = null
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        setW(window.innerWidth)
        setH(window.innerHeight)
      }, 120)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
    }
  }, [])

  const mode = getMode(w, h)
  if (mode) return children

  // Point the user toward the closer of the two supported ranges.
  const targetW = w > MOBILE_MAX_W ? DESKTOP_MIN_W : MOBILE_MIN_W
  const targetH = w > MOBILE_MAX_W ? DESKTOP_MIN_H : MOBILE_MIN_H

  return (
    <div className="viewport-gate" role="alert" aria-live="polite">
      <div className="viewport-gate-card">
        <p className="viewport-gate-eyebrow">// system_check</p>
        <h1 className="viewport-gate-title">Viewport non supporté</h1>
        <p className="viewport-gate-lead">
          Cette expérience est calibrée pour deux plages d'écran précises.
          Agrandis la fenêtre, tourne ton appareil ou ouvre le site sur un
          ordinateur.
        </p>
        <p className="viewport-gate-lead-en">
          Resize the window to one of the supported ranges to view this experience.
        </p>

        <ul className="viewport-gate-ranges">
          <li>Desktop : largeur ≥ {DESKTOP_MIN_W} px, hauteur ≥ {DESKTOP_MIN_H} px (ratio {DESKTOP_MIN_AR.toFixed(2)} – {DESKTOP_MAX_AR.toFixed(2)})</li>
          <li>Mobile : {MOBILE_MIN_W} – {MOBILE_MAX_W} px de large, hauteur ≥ {MOBILE_MIN_H} px (portrait)</li>
        </ul>

        <div className="viewport-gate-grid">
          <div className={`viewport-gate-cell${w >= targetW ? ' ok' : ''}`}>
            <span className="viewport-gate-label">Width</span>
            <span className="viewport-gate-value">{w}</span>
            <span className="viewport-gate-target">/ {targetW} px</span>
          </div>
          <div className={`viewport-gate-cell${h >= targetH ? ' ok' : ''}`}>
            <span className="viewport-gate-label">Height</span>
            <span className="viewport-gate-value">{h}</span>
            <span className="viewport-gate-target">/ {targetH} px</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewportGate

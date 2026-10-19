import { useEffect, useRef } from 'react'
import { lookOf } from './cartridges'

// The flat layer over the scene: item cards pinned to the rounds, the chamber
// counter, the prompts, the speed lines, the onomatopoeia, the cracks of the
// bullet hole. Positions follow the scene through the rig, sixty times a
// second, without touching React state.

const Hud = ({ rig, themes, cards, phase, loaded, chosen, marked, onoma, cracks, portrait, rootRef, onMark, t }) => {
  const cardRefs = useRef([])
  const speedRef = useRef(null)
  const total = 6

  useEffect(() => {
    let frame
    const tick = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      rig.screen.carts.forEach((p, k) => {
        const el = cardRefs.current[k]
        if (!el) return
        const seated = cards[k] === 'seated'
        const at = seated ? rig.screen.cyl : p
        // On a phone the cards stack in a column; a seated one still folds into the cylinder
        let x
        let y
        if (portrait && !seated) {
          x = 12
          y = 78 + k * 64
        } else {
          x = Math.max(8, Math.min(w - 180, at.x * w + (portrait ? -66 : -196)))
          y = Math.max(64, Math.min(h - 90, at.y * h + (portrait ? -30 : -26)))
        }
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
      })
      if (speedRef.current) {
        speedRef.current.style.left = `${(rig.screen.cyl.x * w).toFixed(1)}px`
        speedRef.current.style.top = `${(rig.screen.cyl.y * h).toFixed(1)}px`
      }
      const root = rootRef.current
      if (root && phase === 'reveal') {
        root.style.setProperty('--bar-hx', `${(rig.screen.muzzle.x * 100).toFixed(2)}%`)
        root.style.setProperty('--bar-hy', `${(rig.screen.muzzle.y * 100).toFixed(2)}%`)
        root.style.setProperty('--bar-hr', `${(rig.reveal * Math.hypot(w, h) * 0.8).toFixed(1)}px`)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [rig, cards, phase, portrait, rootRef])

  const canMark = phase === 'spawn' || phase === 'open'
  const chosenTheme = chosen >= 0 ? themes[chosen] : null

  return (
    <div className="bar-hud">
      <p className="bar-title">Raphaël Madoré · portfolio</p>

      {themes.map((theme, k) => {
        const state = cards[k]
        if (!state) return null
        const look = lookOf(theme.id)
        const cls = ['bar-card', `is-${state}`, marked === k ? 'is-marked' : '', chosen === k ? 'is-chosen' : ''].join(' ')
        return (
          <div
            key={theme.id}
            ref={(el) => {
              cardRefs.current[k] = el
            }}
            className={cls}
            style={{ '--bar-accent': look.accent }}
          >
            <button
              type="button"
              className="bar-card__box"
              disabled={!canMark || state !== 'in'}
              onPointerEnter={() => canMark && onMark(k)}
              onFocus={() => canMark && onMark(k)}
              onClick={() => canMark && onMark(k)}
            >
              <span className="bar-card__index">{String(k + 1).padStart(2, '0')}</span>
              <span className="bar-card__name">{t(`themes.${theme.id}`)}</span>
              <span className="bar-card__tag">{marked === k ? t('intro.marked') : t(`intro.taglines.${theme.id}`)}</span>
            </button>
          </div>
        )
      })}

      {(phase === 'spawn' || phase === 'closed' || phase === 'open') && (
        <div className="bar-count" style={{ '--bar-accent': lookOf(themes[Math.max(0, loaded - 1)]?.id).accent }}>
          <span key={loaded} className={`bar-count__n ${loaded ? 'is-bump' : ''}`}>{loaded}</span>
          <span>/ {total}</span>
          <span>{t('intro.chambers')}</span>
        </div>
      )}

      <div ref={speedRef} className={`bar-speed ${phase === 'spin' ? 'is-on' : ''}`} />

      {phase === 'ready' && <p className="bar-prompt">{t('intro.start')}</p>}
      {phase === 'aim' && <p className="bar-prompt bar-prompt--fire">{t('intro.fire')}</p>}
      {(phase === 'aim' || phase === 'shot') && chosenTheme && (
        <p className="bar-chosen" style={{ '--bar-accent': lookOf(chosenTheme.id).accent }}>
          {t('intro.underHammer')}
          <strong>{t(`themes.${chosenTheme.id}`)}</strong>
        </p>
      )}

      {onoma.map((o) => (
        <span
          key={o.id}
          className={`bar-onoma bar-onoma--${o.size}`}
          style={{ left: `${o.x * 100}%`, top: `${o.y * 100}%`, '--bar-accent': o.accent }}
        >
          {o.text}
        </span>
      ))}

      {cracks && (
        <svg className={`bar-cracks ${phase === 'shot' || phase === 'reveal' ? 'is-on' : ''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {cracks.map((d, i) => (
            <path key={i} d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      )}
    </div>
  )
}

export default Hud

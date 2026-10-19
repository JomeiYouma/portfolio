import { useEffect, useRef } from 'react'
import { lookOf } from './cartridges'
import { spring } from './motion'

// The flat layer over the scene: item cards pinned to the rounds, the chamber
// counter, the prompts, the speed lines, the aim reticle, the rounds left,
// the cracks of the fallback reveal. Positions follow the scene through the
// rig, sixty times a second, without touching React state.

const Hud = ({
  rig, themes, cards, phase, loaded, chosen, marked, cracks, portrait, coarse, rootRef, pointer, fireKey, missKey, shots, fired, onMark, t,
}) => {
  const cardRefs = useRef([])
  const speedRef = useRef(null)
  const reticleRef = useRef(null)
  const reticle = useRef({ x: { x: 0, v: 0 }, y: { x: 0, v: 0 }, at: 0 })
  const total = 6
  const aiming = (phase === 'aim' || phase === 'shot') && !coarse

  useEffect(() => {
    let frame
    const tick = (now) => {
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
      // The reticle chases the pointer on a spring and locks when it covers the bottle
      const ret = reticleRef.current
      if (ret) {
        const s = reticle.current
        const dt = s.at ? Math.min(0.05, (now - s.at) / 1000) : 1 / 60
        s.at = now
        const px = ((pointer.x + 1) / 2) * w
        const py = ((pointer.y + 1) / 2) * h
        spring(s.x, px, 320, 26, dt)
        spring(s.y, py, 320, 26, dt)
        ret.style.transform = `translate(${s.x.x.toFixed(1)}px, ${s.y.x.toFixed(1)}px)`
        const b = rig.screen.bottle
        const locked = Math.abs(s.x.x - b.x * w) < b.rx * w * 1.3 && Math.abs(s.y.x - b.y * h) < b.ry * h * 1.2
        ret.classList.toggle('is-locked', locked)
      }
      // The fallback reveal: a hole growing from the impact
      const root = rootRef.current
      if (root && phase === 'reveal') {
        root.style.setProperty('--bar-hx', `${(rig.screen.impact.x * 100).toFixed(2)}%`)
        root.style.setProperty('--bar-hy', `${(rig.screen.impact.y * 100).toFixed(2)}%`)
        root.style.setProperty('--bar-hr', `${(rig.reveal * Math.hypot(w, h) * 0.8).toFixed(1)}px`)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [rig, cards, phase, portrait, rootRef, pointer])

  // A spark on the reticle for the few frames of a shot
  useEffect(() => {
    const ret = reticleRef.current
    if (!ret || !fireKey) return undefined
    ret.classList.add('is-fire')
    const id = setTimeout(() => ret.classList.remove('is-fire'), 180)
    return () => clearTimeout(id)
  }, [fireKey])

  const canMark = phase === 'spawn' || phase === 'open'
  const chosenTheme = chosen >= 0 ? themes[chosen] : null
  const accent = chosenTheme ? lookOf(chosenTheme.id).accent : '#9fb3c8'
  const lastRound = shots >= themes.length - 1

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

      {(phase === 'aim' || phase === 'shot' || phase === 'spin') && (
        <div className="bar-rounds" aria-hidden="true">
          {themes.map((theme, k) => (
            <span
              key={theme.id}
              className={`bar-rounds__dot ${fired.includes(k) ? 'is-spent' : ''} ${chosen === k ? 'is-next' : ''}`}
              style={{ '--bar-accent': lookOf(theme.id).accent }}
            />
          ))}
        </div>
      )}

      <div ref={speedRef} className={`bar-speed ${phase === 'spin' ? 'is-on' : ''}`} />

      {phase === 'ready' && <p className="bar-prompt">{t('intro.start')}</p>}
      {phase === 'aim' && (
        <p className="bar-prompt bar-prompt--aim" style={{ '--bar-accent': accent }}>
          {lastRound ? t('intro.lastRound') : coarse ? t('intro.touchFire') : t('intro.aimPrompt')}
        </p>
      )}
      {(phase === 'aim' || phase === 'shot') && chosenTheme && (
        <p className="bar-chosen" style={{ '--bar-accent': accent }}>
          {t('intro.underHammer')}
          <strong>{t(`themes.${chosenTheme.id}`)}</strong>
        </p>
      )}
      {missKey > 0 && phase === 'aim' && chosenTheme && (
        <p key={missKey} className="bar-miss" style={{ '--bar-accent': accent }}>
          {t('intro.miss').replace('{name}', t(`themes.${chosenTheme.id}`))}
        </p>
      )}

      {aiming && (
        <div ref={reticleRef} className="bar-reticle" style={{ '--bar-accent': accent }} aria-hidden="true">
          <span className="bar-reticle__tick bar-reticle__tick--tl" />
          <span className="bar-reticle__tick bar-reticle__tick--tr" />
          <span className="bar-reticle__tick bar-reticle__tick--br" />
          <span className="bar-reticle__tick bar-reticle__tick--bl" />
          <span className="bar-reticle__dot" />
          <span className="bar-reticle__spark" />
        </div>
      )}

      {cracks && (
        <svg className={`bar-cracks ${phase === 'reveal' ? 'is-on' : ''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {cracks.map((d, i) => (
            <path key={i} d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      )}
    </div>
  )
}

export default Hud

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useI18n } from '../hooks/useI18n'
import Waves from '../components/Waves'
import Reveal from '../components/Reveal'
import games from '../data/games.json'
import { asset } from '../utils/asset'

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
  </svg>
)

const Games = () => {
  const { lang, t } = useI18n()
  const reduce = useReducedMotion()
  const sectionRef = useRef(null)

  // Tracks section center vs viewport center (-1 entering from right → 0 centered → +1 leaving left)
  const offsetX = useMotionValue(0)
  const rotateYRaw = useTransform(offsetX, [-1, 0, 1], [24, 0, -24])
  const rotateY = useSpring(rotateYRaw, { stiffness: 70, damping: 22, mass: 0.6 })

  // Last known mouse position (module-level via ref). Read from rAF so we can
  // re-evaluate inside-screen state when the section slides under a stationary
  // cursor (horizontal scroll), which produces no mousemove events.
  const mouseRef = useRef({ x: -1, y: -1 })
  const insideRef = useRef(false)

  useEffect(() => {
    if (reduce) return
    const el = sectionRef.current
    if (!el) return
    const screen = el.querySelector('.games-screen')

    let rafId = null
    let active = false

    const evaluateInside = () => {
      if (!screen) return
      const r = screen.getBoundingClientRect()
      const { x, y } = mouseRef.current
      if (x < 0) return
      const isIn = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
      if (isIn === insideRef.current) return
      insideRef.current = isIn
      document.body.classList.toggle('inside-games-screen', isIn)
      if (isIn) window.dispatchEvent(new CustomEvent('targetcursor:reset'))
    }

    const tick = () => {
      const rect = el.getBoundingClientRect()
      const sectionCenter = rect.left + rect.width / 2
      const viewportCenter = window.innerWidth / 2
      const normalized = (viewportCenter - sectionCenter) / (window.innerWidth / 2)
      offsetX.set(Math.max(-1, Math.min(1, normalized)))
      // Catches the case where the section scrolled into / out of the cursor
      // without any mousemove — pure mousemove tracking misses this entirely.
      evaluateInside()
      if (active) rafId = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !active) {
          active = true
          rafId = requestAnimationFrame(tick)
        } else if (!entry.isIntersecting && active) {
          active = false
          if (rafId) cancelAnimationFrame(rafId)
          if (insideRef.current) {
            insideRef.current = false
            document.body.classList.remove('inside-games-screen')
          }
        }
      },
      { root: null, threshold: 0, rootMargin: '50% 0px' },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [reduce, offsetX])

  // Pure mouse-position tracker. mouseenter/leave proved unreliable on rapid
  // hovers over .cursor-target children (TargetCursor JS intercepted and the
  // leave fired spuriously on the rightmost card), and they don't fire at all
  // when the section slides under a stationary cursor — which is why the
  // rAF tick above also re-evaluates from the cached position.
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }
    const onLeaveWindow = () => {
      if (insideRef.current) {
        insideRef.current = false
        document.body.classList.remove('inside-games-screen')
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeaveWindow)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeaveWindow)
      document.body.classList.remove('inside-games-screen')
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="games"
      data-section
      className="section games-section"
      aria-labelledby="games-heading"
    >
      <div className="section-inner games-inner">
        <Reveal as="div" className="games-monitor-stage">
          <aside className="games-side-label" aria-hidden="false">
            <p className="eyebrow games-eyebrow">{t('games.eyebrow')}</p>
            <h2 id="games-heading" className="games-side-title">
              {t('games.title')}
            </h2>
            <span className="games-side-bar" aria-hidden="true" />
          </aside>

          <motion.div
            className="games-monitor"
            style={reduce ? undefined : { rotateY }}
          >
            <div className="games-monitor-frame">
              <span className="games-monitor-led" aria-hidden="true" />
              <div className="games-screen">
                <Waves
                  lineColor="#00ffb3"
                  backgroundColor="transparent"
                  waveSpeedX={0.02}
                  waveSpeedY={0.01}
                  waveAmpX={40}
                  waveAmpY={20}
                  friction={0.9}
                  tension={0.01}
                  maxCursorMove={120}
                  xGap={12}
                  yGap={36}
                  opacity={0.45}
                />

                <span className="games-screen-corner games-screen-corner--tl" aria-hidden="true" />
                <span className="games-screen-corner games-screen-corner--tr" aria-hidden="true" />
                <span className="games-screen-corner games-screen-corner--bl" aria-hidden="true" />
                <span className="games-screen-corner games-screen-corner--br" aria-hidden="true" />

                <span className="games-screen-scanlines" aria-hidden="true" />

                <div className="games-screen-content">
            <ul className="games-grid">
              {games.map((game) => {
                const title = game.title[lang] || game.title.en
                const description = game.description[lang] || game.description.en
                return (
                  <li key={game.id} className="game-card-wrap">
                    <a
                      href={game.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="game-card cursor-target"
                      aria-label={`${t('games.play')} — ${title} (${t('accessibility.opensNewTab')})`}
                    >
                      <div className="game-card-media">
                        <img
                          src={asset(`assets/images/${game.image}`)}
                          alt={lang === 'fr' ? `Aperçu du jeu ${title}` : `${title} game screenshot`}
                          loading="lazy"
                          className="game-card-img"
                        />
                        <span className="game-card-overlay" aria-hidden="true">
                          <span className="game-play-btn">
                            <PlayIcon />
                            <span>{t('games.play')}</span>
                          </span>
                        </span>
                        <span className="game-card-corner game-card-corner--tl" aria-hidden="true" />
                        <span className="game-card-corner game-card-corner--br" aria-hidden="true" />
                      </div>
                      <div className="game-card-foot">
                        <span className="game-card-title">{title}</span>
                        <span className="game-card-tech">{game.tech}</span>
                      </div>
                      <span className="sr-only">{description}</span>
                    </a>
                  </li>
                )
              })}
                  </ul>
                </div>
              </div>
            </div>
            <div className="games-monitor-stand" aria-hidden="true">
              <span className="games-monitor-neck" />
              <span className="games-monitor-base" />
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}

export default Games

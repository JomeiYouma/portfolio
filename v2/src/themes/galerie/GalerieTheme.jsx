import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import '@fontsource-variable/bodoni-moda/wght.css'
import '@fontsource-variable/bodoni-moda/wght-italic.css'
import '@fontsource-variable/schibsted-grotesk/wght.css'
import './galerie.css'
import AccessibilityControls from '../../components/AccessibilityControls'
import ProjectDetailModal from '../../components/ProjectDetailModal'
import SkipLink from '../../components/SkipLink'
import sections from '../../data/sections.json'
import { projects } from '../../data/projects'
import games from '../../data/games.json'
import { useI18n } from '../../hooks/useI18n'
import { IS_LOW_PERF } from '../../utils/perf'
import FloorPlan from './FloorPlan'
import { useMediaQuery, useViewportWidth } from './hooks'
import { PALETTE } from './room'
import { AboutSheet, ContactSheet, GamesSheet, HeroSheet, ProjectsSheet, ServicesSheet, TestimonialsSheet } from './sheets'

// three.js only loads when the 3D view is actually shown
const Scene = lazy(() => import('./Scene'))

const HAS_WEBGL = (() => {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'))
  } catch {
    return false
  }
})()

// Under this the rotunda is too cramped next to a content sheet: plan view only
const ROOMY = '(min-width: 900px) and (min-height: 560px)'
const WHEEL_THRESHOLD = 30
const TURN_COOLDOWN_MS = 650

const SHEETS = {
  hero: HeroSheet,
  about: AboutSheet,
  projects: ProjectsSheet,
  games: GamesSheet,
  testimonials: TestimonialsSheet,
  services: ServicesSheet,
  contact: ContactSheet,
}

const TITLES = {
  hero: 'hero.title',
  about: 'about.title',
  projects: 'projects.title',
  games: 'games.title',
  testimonials: 'testimonials.title',
  services: 'services.title',
  contact: 'contact.title',
}

// Short name of each room: what is lettered on its wall (Scene.jsx) and on its cartel
const WALL_TITLES = {
  hero: 'hero.subtitle',
  about: 'about.title',
  projects: 'projects.title',
  games: 'games.title',
  testimonials: 'testimonials.eyebrow',
  services: 'services.eyebrow',
  contact: 'contact.title',
}

// French sets a space before ? ! : ; — keep it from stranding the mark on the
// next line — and a word joiner keeps hyphenated words in one piece.
const typeset = (text) => text.replace(/ ([?!:;])/g, '\u00a0$1').replace(/-(?=\S)/g, '-\u2060')

const roomNumber = (index) => String(index).padStart(2, '0')

// The colours of a room, handed to the stylesheet: ground, ink, and the deeper
// tone used for giant figures. The interface wears them while that room is in view.
const roomColors = (index) => ({
  '--ga-a': PALETTE[index].wall,
  '--ga-b': PALETTE[index].ink,
  '--ga-tone': PALETTE[index].tone,
})

/**
 * Galerie theme: the portfolio as an exhibition. With WebGL and enough room it
 * is a 3D rotunda with one wall per section; otherwise, or on request, the same
 * content laid out as a plain page ("plan view").
 */
const GalerieTheme = ({ lang, onOpenQuote, onOpenLegal, controlsProps }) => {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const roomy = useMediaQuery(ROOMY)
  const viewportWidth = useViewportWidth()
  const can3d = HAS_WEBGL && roomy
  const [prefers3d, setPrefers3d] = useState(!IS_LOW_PERF)
  const immersive = can3d && prefers3d

  const [room, setRoom] = useState(0)
  const [entered, setEntered] = useState(false)
  // Plan view: the room currently crossing the middle of the window
  const [planRoom, setPlanRoom] = useState(0)
  const [openProject, setOpenProject] = useState(null)
  // Kept after closing, so the dialog still has content during its exit animation
  const [lastProject, setLastProject] = useState(0)
  const sheetTitleRef = useRef(null)
  const enterRef = useRef(null)
  const lastTurn = useRef(0)
  // Focus follows the visitor from room to room, but not before they have moved
  const moved = useRef(false)

  const rooms = sections.map((section, index) => ({
    ...section,
    index,
    label: lang === 'fr' ? section.labelFr : section.label,
    title: typeset(t(TITLES[section.id])),
    wallTitle: t(WALL_TITLES[section.id]),
  }))
  const current = rooms[room]

  useEffect(() => {
    // Another theme may leave the document scrolled
    window.scrollTo(0, 0)
  }, [])

  const pickProject = useCallback((index) => {
    setLastProject(index)
    setOpenProject(index)
  }, [])

  const goTo = useCallback((index) => {
    moved.current = true
    if (!immersive) {
      document.getElementById(sections[index].id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      return
    }
    setRoom(index)
    // The title wall has no room behind it: its content is the cartel itself
    setEntered(index !== 0)
  }, [immersive, reduceMotion])

  const turn = useCallback((direction) => {
    moved.current = true
    setRoom((value) => (value + direction + rooms.length) % rooms.length)
  }, [rooms.length])

  const enter = useCallback((index) => {
    moved.current = true
    setRoom(index)
    setEntered(index !== 0)
  }, [])

  const leave = useCallback(() => {
    moved.current = true
    setEntered(false)
  }, [])

  useEffect(() => {
    if (immersive) return undefined
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) setPlanRoom(sections.findIndex((section) => section.id === entry.target.id))
      }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((section) => {
      const el = document.getElementById(section.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [immersive])

  // Arrows turn, Escape steps back out of a room
  useEffect(() => {
    if (!immersive) return undefined
    const onKey = (e) => {
      if (document.body.classList.contains('is-modal-open')) return
      if (e.target.closest?.('input, textarea, select')) return
      if (e.key === 'ArrowRight') { e.preventDefault(); turn(1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1) }
      else if (e.key === 'Escape' && entered) leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [immersive, entered, turn, leave])

  // Escape also closes the project dialog (it only has its own button)
  useEffect(() => {
    if (openProject === null) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpenProject(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openProject])

  // Entering a room (or changing room while inside) moves focus to its title;
  // stepping back out returns it to the cartel. Merely turning in the rotunda
  // leaves focus where it is, so the arrows can be pressed repeatedly.
  const wasEntered = useRef(false)
  useEffect(() => {
    if (!immersive || !moved.current) return
    if (entered) sheetTitleRef.current?.focus()
    else if (wasEntered.current) enterRef.current?.focus({ preventScroll: true })
    wasEntered.current = entered
  }, [immersive, entered, room])

  // In the rotunda the wheel turns the visitor; inside a room it scrolls the sheet
  const onWheel = (e) => {
    if (entered) return
    const delta = e.deltaY + e.deltaX
    const now = performance.now()
    if (Math.abs(delta) < WHEEL_THRESHOLD || now - lastTurn.current < TURN_COOLDOWN_MS) return
    lastTurn.current = now
    turn(delta > 0 ? 1 : -1)
  }

  const sheetProps = { lang, onOpenQuote, onOpenLegal, openProject: pickProject, goTo }
  // Half the share of the screen the sheet covers: how far the picture slides aside
  const sheetWidth = Math.min(680, Math.max(420, viewportWidth * 0.5))
  const shift = sheetWidth / viewportWidth / 2

  const cartelLead = {
    hero: t('hero.description'),
    about: t('about.bio'),
    projects: t('projects.sectionLead'),
    games: games.map((game) => game.title[lang] || game.title.en).join(' · '),
    testimonials: t('testimonials.intro'),
    services: t('services.intro'),
    contact: 'raphael.madore.pro@mailo.com',
  }[current.id]

  const bar = (
    <header className="ga-bar">
      <button type="button" className="ga-brand" onClick={() => goTo(0)}>Raphaël Madoré</button>
      <nav className="ga-nav" aria-label={t('accessibility.mainNav')}>
        <ol>
          {rooms.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-current={item.index === (immersive ? room : planRoom) ? 'location' : undefined}
                onClick={() => goTo(item.index)}
              >
                <span className="ga-nav-num" aria-hidden="true">{roomNumber(item.index)}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {can3d && (
        <button type="button" className="ga-mode" onClick={() => setPrefers3d((value) => !value)}>
          {immersive ? t('galerie.viewPlan') : t('galerie.view3d')}
        </button>
      )}
      <AccessibilityControls {...controlsProps} />
    </header>
  )

  const projectDialog = (
    <ProjectDetailModal
      open={openProject !== null}
      onClose={() => setOpenProject(null)}
      project={projects[openProject ?? lastProject]}
      lang={lang}
      t={t}
    />
  )

  if (!immersive) {
    return (
      <div className="ga-app is-plan" style={roomColors(planRoom)}>
        <SkipLink targetId="main-content" label={t('accessibility.skipToContent')} />
        {bar}
        <main id="main-content" className="ga-plan" tabIndex={-1}>
          {rooms.map((item) => {
            const Sheet = SHEETS[item.id]
            const hero = item.index === 0
            return (
              <section
                key={item.id}
                id={item.id}
                className={`ga-room ${hero ? 'ga-room--title' : ''}`}
                style={roomColors(item.index)}
                aria-labelledby={`ga-room-${item.id}`}
              >
                {!hero && <span className="ga-room-num" aria-hidden="true">{roomNumber(item.index)}</span>}
                <div className="ga-room-inner">
                <header className="ga-room-head">
                  <p className="ga-label">{hero ? t('galerie.permanent') : `${t('galerie.room')} ${roomNumber(item.index)}`}</p>
                  {hero && <h1 className="sr-only">{t('hero.seoH1')}</h1>}
                  <h2 id={`ga-room-${item.id}`} className="ga-title">{item.title}</h2>
                  {hero && <p className="ga-subhead">{t('hero.subtitle')}</p>}
                </header>
                <div className="ga-room-body">
                  <Sheet {...sheetProps} />
                </div>
                </div>
              </section>
            )
          })}
        </main>
        {projectDialog}
      </div>
    )
  }

  const Sheet = SHEETS[current.id]
  const previous = rooms[(room - 1 + rooms.length) % rooms.length]
  const next = rooms[(room + 1) % rooms.length]

  return (
    <div className="ga-app is-3d" style={roomColors(room)} onWheel={onWheel}>
      <SkipLink targetId="main-content" label={t('accessibility.skipToContent')} />
      <div className="ga-stage">
        <Suspense fallback={null}>
          <Scene
            room={room}
            entered={entered}
            shift={shift}
            instant={Boolean(reduceMotion)}
            lang={lang}
            lowPerf={IS_LOW_PERF}
            onEnterRoom={enter}
            onPickProject={pickProject}
          />
        </Suspense>
      </div>
      {bar}

      <main id="main-content" className="ga-overlay" tabIndex={-1}>
        {!entered ? (
          <>
            <section className="ga-cartel" key={current.id} aria-labelledby="ga-cartel-title">
              {room === 0 && <h1 className="sr-only">{t('hero.seoH1')}</h1>}
              <p className="ga-label">
                {room === 0 ? t('galerie.permanent') : `${t('galerie.room')} ${roomNumber(room)}`}
              </p>
              <h2 id="ga-cartel-title" className="ga-cartel-title">{current.wallTitle}</h2>
              <p className="ga-cartel-lead">{cartelLead}</p>
              <div className="ga-actions">
                {room === 0 ? (
                  <>
                    <button type="button" className="ga-btn" ref={enterRef} onClick={() => enter(1)}>
                      {t('galerie.start')} <span aria-hidden="true">→</span>
                    </button>
                    <button type="button" className="ga-btn ga-btn--ghost" onClick={() => onOpenQuote()}>
                      {t('hero.servicesCta')}
                    </button>
                  </>
                ) : (
                  <button type="button" className="ga-btn" ref={enterRef} onClick={() => enter(room)}>
                    {t('galerie.enter')} <span aria-hidden="true">→</span>
                  </button>
                )}
              </div>
            </section>

            <div className="ga-turn">
              <button type="button" onClick={() => turn(-1)} aria-label={`${t('galerie.previous')} : ${previous.label}`}>
                <span aria-hidden="true">←</span>
              </button>
              <FloorPlan room={room} onSelect={(index) => { moved.current = true; setRoom(index) }} />
              <button type="button" onClick={() => turn(1)} aria-label={`${t('galerie.next')} : ${next.label}`}>
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <p className="ga-hint">{t('galerie.hint')}</p>
          </>
        ) : (
          <article className="ga-sheet" key={current.id} aria-labelledby="ga-sheet-title">
            <header className="ga-sheet-head">
              <button type="button" className="ga-link" onClick={leave}>
                <span aria-hidden="true">←</span> {t('galerie.back')}
              </button>
              <p className="ga-label">{`${t('galerie.room')} ${roomNumber(room)}`}</p>
              <h2 id="ga-sheet-title" className="ga-title" ref={sheetTitleRef} tabIndex={-1}>{current.title}</h2>
            </header>
            <div className="ga-sheet-body">
              <Sheet {...sheetProps} />
            </div>
            <footer className="ga-sheet-foot">
              <button type="button" className="ga-link" onClick={() => enter(previous.index)}>
                <span aria-hidden="true">←</span> {previous.label}
              </button>
              <button type="button" className="ga-link" onClick={() => enter(next.index)}>
                {next.label} <span aria-hidden="true">→</span>
              </button>
            </footer>
          </article>
        )}
      </main>
      {projectDialog}
    </div>
  )
}

export default GalerieTheme

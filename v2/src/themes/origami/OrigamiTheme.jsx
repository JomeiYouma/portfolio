import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import '@fontsource-variable/eb-garamond/wght.css'
import '@fontsource-variable/eb-garamond/wght-italic.css'
import '@fontsource/im-fell-english/latin-400.css'
import './origami.css'
import ProjectDetailModal from '../../components/ProjectDetailModal'
import SkipLink from '../../components/SkipLink'
import projects from '../../data/projects.json'
import { useI18n } from '../../hooks/useI18n'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { asset } from '../../utils/asset'
import { IS_LOW_PERF } from '../../utils/perf'
import {
  AboutCartouche, ContactCartouche, GamesCartouche, HeroCartouche, ProjectsCartouche, ServicesCartouche, TestimonialsCartouche,
} from './cartouches'
import { ORIGAMI, ORIGAMI_AAA } from './palette'
import { deckle, TILTS } from './paper'
import Rail from './Rail'
import { createScrollStore } from './scrollStore'
import { EMAIL, SIDES, STATIONS, TITLES, stationNumber } from './stations'
import { useActiveStation, useScrollProgress } from './useStations'

// three.js only loads when the 3D view is actually shown
const Scene = lazy(() => import('./Scene'))

const HAS_WEBGL = (() => {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'))
  } catch {
    return false
  }
})()

const CARTOUCHES = {
  hero: HeroCartouche,
  about: AboutCartouche,
  projects: ProjectsCartouche,
  games: GamesCartouche,
  testimonials: TestimonialsCartouche,
  services: ServicesCartouche,
  contact: ContactCartouche,
}

// How each cartouche is fastened to the map: tape, or a wax seal on the first and last
const VARIANTS = {
  hero: 'sealed',
  about: 'note',
  projects: 'note',
  games: 'note',
  testimonials: 'note',
  services: 'note',
  contact: 'sealed',
}

// Torn edges, cut once per cartouche, and two small cuts shared by the
// photographs and the paper labels
const DECKLES = STATIONS.map((station) => deckle(station.index + 11))
const TORN = { '--ori-torn-photo': deckle(7, 10, 2.5), '--ori-torn-label': deckle(13, 6, 2.5) }

// French sets a space before ? ! : ; — keep it from stranding the mark on the next line
const typeset = (text) => text.replace(/ ([?!:;])/g, ' $1')

/**
 * Origami theme: the portfolio as a paper map that unrolls under the visitor
 * as they scroll, on an explorer's desk. With WebGL the map is a 3D scene
 * behind pinned paper notes, one per stop, alternating sides; otherwise, or
 * on request, the same notes on the desk ("map view").
 */
const OrigamiTheme = ({ lang, contrastActive, onOpenQuote, onOpenLegal, controlsProps }) => {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const narrow = useMediaQuery('(max-width: 760px)')
  const coarse = useMediaQuery('(pointer: coarse)')
  const [prefers3d, setPrefers3d] = useState(!IS_LOW_PERF)
  const immersive = HAS_WEBGL && prefers3d
  // Phones render the scene at device pixel ratio 1 with less scenery
  const lowPerf = IS_LOW_PERF || narrow

  const mainRef = useRef(null)
  const titleRefs = useRef([])
  const tipRef = useRef(null)
  const [store] = useState(createScrollStore)
  useScrollProgress(mainRef, store)
  const active = useActiveStation(mainRef)

  const [openProject, setOpenProject] = useState(null)
  // Kept after closing, so the dialog still has content during its exit animation
  const [lastProject, setLastProject] = useState(0)
  // The quote a figure of the scene pointed at: { key, at }
  const [lit, setLit] = useState(null)
  // Name of the landmark under the pointer
  const [tip, setTip] = useState(null)

  const pickProject = useCallback((index) => {
    setLastProject(index)
    setOpenProject(index)
  }, [])

  // Explicit navigation moves focus to the stop's title; scrolling never does
  const goTo = useCallback((index, focus = true) => {
    const el = document.getElementById(STATIONS[index].id)
    el?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    if (focus) titleRefs.current[index]?.focus({ preventScroll: true })
  }, [reduceMotion])

  // What a landmark of the scene does once its animation has played
  const onAction = useCallback((id, payload) => {
    switch (id) {
      case 'station': goTo(payload); break
      case 'project': pickProject(payload); break
      case 'quote': onOpenQuote(payload ?? null); break
      case 'mail': window.location.href = `mailto:${EMAIL}`; break
      case 'link': window.open(payload, '_blank', 'noopener'); break
      case 'testimonial':
        goTo(4, false)
        setLit({ key: payload, at: Date.now() })
        break
      default: break
    }
  }, [goTo, pickProject, onOpenQuote])

  useEffect(() => {
    // Another theme may leave the document scrolled
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    // The headless checks read the store and drive actions from here
    if (import.meta.env.DEV) {
      window.__ori = store
      window.__oriAct = onAction
    }
  }, [store, onAction])

  // Hover label: its text is state, its position is written straight to the
  // element, so moving the pointer over a landmark never re-renders the page
  const onHover = useCallback((label, x, y) => {
    const el = tipRef.current
    if (el && label) {
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`
      // Low in the window the label goes above the pointer, off the lettering under it
      el.classList.toggle('is-above', y > window.innerHeight * 0.5)
    }
    setTip((current) => (current === label ? current : label))
  }, [])

  // Escape closes the project dialog (it only has its own button)
  useEffect(() => {
    if (openProject === null) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpenProject(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openProject])

  const stations = STATIONS.map((station) => ({
    ...station,
    label: lang === 'fr' ? station.labelFr : station.label,
    title: typeset(t(TITLES[station.id])),
  }))
  const cartoucheProps = { lang, onOpenQuote, onOpenLegal, openProject: pickProject, goTo, immersive, lit }

  // Real paper and wood grain and torn edges; high contrast does without
  const paper = contrastActive ? undefined : {
    ...TORN,
    '--ori-grain': `url("${asset('assets/textures/paper-grain.webp')}")`,
    '--ori-wood': `url("${asset('assets/textures/wood-grain.webp')}")`,
  }

  return (
    <div className={`ori-app ${immersive ? 'is-3d' : 'is-map'}`} style={paper}>
      <SkipLink targetId="main-content" label={t('accessibility.skipToContent')} />

      {immersive && (
        <div className="ori-stage" aria-hidden="true">
          <Suspense fallback={<p className="ori-stage-loading">{t('origami.loadingScene')}</p>}>
            <Scene
              store={store}
              lang={lang}
              lowPerf={lowPerf}
              narrow={narrow}
              reduceMotion={Boolean(reduceMotion)}
              coarse={coarse}
              palette={contrastActive ? ORIGAMI_AAA : ORIGAMI}
              textured={!contrastActive}
              sides={SIDES}
              onAction={onAction}
              onHover={onHover}
            />
          </Suspense>
          <p className={`ori-tip ${tip ? 'is-on' : ''}`} ref={tipRef}>{tip}</p>
        </div>
      )}

      <Rail
        stations={stations}
        active={active}
        goTo={goTo}
        immersive={immersive}
        hasWebgl={HAS_WEBGL}
        onToggleView={() => setPrefers3d((value) => !value)}
        controlsProps={controlsProps}
        horizontal={narrow}
      />

      <main id="main-content" className="ori-main" tabIndex={-1} ref={mainRef}>
        {stations.map((station) => {
          const Cartouche = CARTOUCHES[station.id]
          const hero = station.index === 0
          const variant = VARIANTS[station.id]
          const previous = stations[station.index - 1]
          const next = stations[station.index + 1]
          return (
            <section
              key={station.id}
              id={station.id}
              className={`ori-station ori-station--${station.id} ori-station--${SIDES[station.index]}`}
              data-station={station.index}
              aria-labelledby={`ori-${station.id}-title`}
              style={{ '--ori-tilt': `${TILTS[station.index]}deg`, '--ori-deckle': DECKLES[station.index] }}
            >
              <div className={`ori-cartouche ori-cartouche--${variant} ${station.index === active ? 'is-in' : ''}`}>
                <div className={`ori-paper ori-paper--${variant}`}>
                  <header className="ori-cartouche-head">
                    <p className="ori-stamp">
                      {hero ? t('origami.departure') : `${t('origami.station')} ${stationNumber(station.index)}`}
                    </p>
                    {hero && <h1 className="sr-only">{t('hero.seoH1')}</h1>}
                    <h2
                      id={`ori-${station.id}-title`}
                      className="ori-title"
                      ref={(el) => { titleRefs.current[station.index] = el }}
                      tabIndex={-1}
                    >
                      {station.title}
                    </h2>
                    <p className="ori-tagline">{typeset(t(`origami.taglines.${station.id}`))}</p>
                  </header>
                  <div className="ori-cartouche-body">
                    <Cartouche {...cartoucheProps} />
                  </div>
                  <footer className="ori-cartouche-foot">
                    {previous ? (
                      <button type="button" className="ori-link" onClick={() => goTo(previous.index)}>
                        <span aria-hidden="true">←</span> {previous.label}
                      </button>
                    ) : <span />}
                    {next ? (
                      <button type="button" className="ori-link" onClick={() => goTo(next.index)}>
                        {next.label} <span aria-hidden="true">→</span>
                      </button>
                    ) : (
                      <button type="button" className="ori-link" onClick={() => goTo(0)}>
                        {t('origami.backToStart')} <span aria-hidden="true">↑</span>
                      </button>
                    )}
                  </footer>
                </div>
              </div>
            </section>
          )
        })}
      </main>

      <ProjectDetailModal
        open={openProject !== null}
        onClose={() => setOpenProject(null)}
        project={projects[openProject ?? lastProject]}
        lang={lang}
        t={t}
      />
    </div>
  )
}

export default OrigamiTheme

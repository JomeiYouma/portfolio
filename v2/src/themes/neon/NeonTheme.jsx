import { useEffect } from 'react'
import SkipLink from '../../components/SkipLink'
import Nav from '../../components/Nav'
import ScrollProgress from '../../components/ScrollProgress'
import AccessibilityControls from '../../components/AccessibilityControls'
import TargetCursor from '../../components/TargetCursor'
import SnapDots from '../../components/SnapDots'
import ViewportGate from '../../components/ViewportGate'
import Hero from '../../sections/Hero'
import About from '../../sections/About'
import Projects from '../../sections/Projects'
import Games from '../../sections/Games'
import Testimonials from '../../sections/Testimonials'
import Services from '../../sections/Services'
import Contact from '../../sections/Contact'
import sections from '../../data/sections.json'
import { projects } from '../../data/projects'
import { useScrollSpy } from '../../hooks/useScrollSpy'
import { useI18n } from '../../hooks/useI18n'
import { initScrollEffects } from '../../animations/scroll'
import { IS_LOW_PERF } from '../../utils/perf'

const SECTION_IDS = sections.map((s) => s.id)

/**
 * Default theme: dark, neon green, seven pages snapped on a horizontal strip.
 */
const NeonTheme = ({ lang, contrastActive, onOpenQuote, controlsProps }) => {
  const { t } = useI18n()
  const { activeId } = useScrollSpy(SECTION_IDS)

  useEffect(() => {
    let cleanup = null
    const timer = setTimeout(() => { cleanup = initScrollEffects() }, 100)
    return () => { clearTimeout(timer); if (cleanup) cleanup() }
  }, [])

  // Add data-index attr to sections for the CSS ghost number
  useEffect(() => {
    document.querySelectorAll('section[data-section]').forEach((el, i) => {
      el.setAttribute('data-index', String(i + 1).padStart(2, '0'))
    })
  }, [])

  const navSections = sections.map((s) => ({
    ...s,
    label: lang === 'fr' ? s.labelFr : s.label,
  }))

  return (
    <ViewportGate>
    <div className="app">
      <SkipLink targetId="main-content" label={t('accessibility.skipToContent')} />
      <TargetCursor
        targetSelector=".cursor-target, .btn, .nav-link, a"
        disableSpin={contrastActive || IS_LOW_PERF}
      />
      <Nav sections={navSections} activeId={activeId} />
      <ScrollProgress />
      <SnapDots sections={navSections} />
      <AccessibilityControls {...controlsProps} alignRight={activeId === 'about'} />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <About />
        <Projects projects={projects} />
        <Games />
        <Testimonials />
        <Services onOpenQuote={onOpenQuote} />
        <Contact />
      </main>
    </div>
    </ViewportGate>
  )
}

export default NeonTheme

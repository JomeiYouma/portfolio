import { useEffect, useState, useCallback } from 'react'
import SkipLink from './components/SkipLink'
import Nav from './components/Nav'
import ScrollProgress from './components/ScrollProgress'
import AccessibilityControls from './components/AccessibilityControls'
import TargetCursor from './components/TargetCursor'
import SnapDots from './components/SnapDots'
import QuoteFormModal from './components/QuoteFormModal'
import LegalModal from './components/LegalModal'
import ViewportGate from './components/ViewportGate'
import Hero from './sections/Hero'
import About from './sections/About'
import Projects from './sections/Projects'
import Games from './sections/Games'
import Testimonials from './sections/Testimonials'
import Services from './sections/Services'
import Contact from './sections/Contact'
import sections from './data/sections.json'
import projects from './data/projects.json'
import { useScrollSpy } from './hooks/useScrollSpy'
import { useI18n } from './hooks/useI18n'
import { useContrast } from './hooks/useContrast'
import { initScrollEffects } from './animations/scroll'
import { IS_LOW_PERF } from './utils/perf'

function App() {
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteProjectType, setQuoteProjectType] = useState(null)
  const [legalOpen, setLegalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState('legal')
  const { activeId } = useScrollSpy(sections.map((s) => s.id))

  const openQuote = useCallback((projectType = null) => {
    setQuoteProjectType(projectType)
    setQuoteOpen(true)
  }, [])
  const closeQuote = useCallback(() => setQuoteOpen(false), [])
  const openLegal = useCallback((tab = 'legal') => {
    setLegalTab(tab)
    setLegalOpen(true)
  }, [])
  const closeLegal = useCallback(() => setLegalOpen(false), [])
  const { lang, toggleLanguage, isLoaded, t } = useI18n()
  const { isActive: contrastActive, toggle: toggleContrast } = useContrast()

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
  }, [isLoaded])

  const navSections = sections.map((s) => ({
    ...s,
    label: lang === 'fr' ? s.labelFr : s.label,
  }))

  if (!isLoaded) {
    return <div className="loading-screen" />
  }

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
      <AccessibilityControls
        lang={lang}
        onToggleLang={toggleLanguage}
        contrastActive={contrastActive}
        onToggleContrast={toggleContrast}
        onOpenLegal={openLegal}
      />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <About />
        <Projects projects={projects} />
        <Games />
        <Testimonials />
        <Services onOpenQuote={openQuote} />
        <Contact />
      </main>
      <QuoteFormModal
        isOpen={quoteOpen}
        onClose={closeQuote}
        initialProjectType={quoteProjectType}
      />
      <LegalModal
        isOpen={legalOpen}
        onClose={closeLegal}
        tab={legalTab}
      />
    </div>
    </ViewportGate>
  )
}

export default App
import { useEffect, useState, useCallback } from 'react'
import SkipLink from './components/SkipLink'
import Nav from './components/Nav'
import ScrollProgress from './components/ScrollProgress'
import AccessibilityControls from './components/AccessibilityControls'
import TargetCursor from './components/TargetCursor'
import KpiAdmin from './components/KpiAdmin'
import SnapDots from './components/SnapDots'
import Hero from './sections/Hero'
import About from './sections/About'
import Projects from './sections/Projects'
import Games from './sections/Games'
import Testimonials from './sections/Testimonials'
import Contact from './sections/Contact'
import sections from './data/sections.json'
import projects from './data/projects.json'
import { useScrollSpy } from './hooks/useScrollSpy'
import { useI18n } from './hooks/useI18n'
import { useContrast } from './hooks/useContrast'
import { initScrollEffects } from './animations/scroll'

function App() {
  const [showKpiAdmin, setShowKpiAdmin] = useState(false)
  const { activeId } = useScrollSpy(sections.map((s) => s.id))
  const { lang, toggleLanguage, isLoaded, t } = useI18n()
  const { isActive: contrastActive, toggle: toggleContrast } = useContrast()

  // Keyboard shortcut: Alt + A + K
  const handleKeyDown = useCallback((e) => {
    if (!window.kpiKeySequence) window.kpiKeySequence = []
    if (e.altKey) {
      window.kpiKeySequence.push(e.key.toLowerCase())
      const seq = window.kpiKeySequence.join('')
      if (seq.includes('ak')) {
        e.preventDefault()
        setShowKpiAdmin((prev) => !prev)
        window.kpiKeySequence = []
      }
      clearTimeout(window.kpiKeyTimeout)
      window.kpiKeyTimeout = setTimeout(() => { window.kpiKeySequence = [] }, 1000)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

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
    <div className="app">
      <SkipLink targetId="main-content" label={t('accessibility.skipToContent')} />
      <TargetCursor
        targetSelector=".cursor-target, .btn, .nav-link, a"
        disableSpin={contrastActive}
      />
      <Nav sections={navSections} activeId={activeId} />
      <ScrollProgress />
      <SnapDots sections={navSections} />
      <AccessibilityControls
        lang={lang}
        onToggleLang={toggleLanguage}
        contrastActive={contrastActive}
        onToggleContrast={toggleContrast}
      />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <About />
        <Projects projects={projects} />
        <Games />
        <Testimonials />
        <Contact />
      </main>
      {showKpiAdmin && <KpiAdmin onClose={() => setShowKpiAdmin(false)} />}
    </div>
  )
}

export default App
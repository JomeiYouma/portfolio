import { useEffect, useState, useCallback } from 'react'
import Nav from './components/Nav'
import ScrollProgress from './components/ScrollProgress'
import AccessibilityControls from './components/AccessibilityControls'
import TargetCursor from './components/TargetCursor'
import KpiAdmin from './components/KpiAdmin'
import Hero from './sections/Hero'
import About from './sections/About'
import Projects from './sections/Projects'
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
  const { activeId } = useScrollSpy(
    sections.map((section) => section.id),
  )
  const { lang, toggleLanguage, isLoaded, t } = useI18n()
  const { isActive: contrastActive, toggle: toggleContrast } = useContrast()

  // Keyboard shortcut: Alt + A + K for KPI admin
  const handleKeyDown = useCallback((e) => {
    // Track key sequence
    if (!window.kpiKeySequence) window.kpiKeySequence = []
    
    if (e.altKey) {
      window.kpiKeySequence.push(e.key.toLowerCase())
      
      // Check for 'a' then 'k' sequence while Alt is held
      const seq = window.kpiKeySequence.join('')
      if (seq.includes('ak')) {
        e.preventDefault()
        setShowKpiAdmin((prev) => !prev)
        window.kpiKeySequence = []
      }
      
      // Clear sequence after 1 second
      clearTimeout(window.kpiKeyTimeout)
      window.kpiKeyTimeout = setTimeout(() => {
        window.kpiKeySequence = []
      }, 1000)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    let cleanup = null
    // Wait for DOM to be ready before initializing scroll
    const timer = setTimeout(() => {
      cleanup = initScrollEffects()
    }, 100)
    
    return () => {
      clearTimeout(timer)
      if (cleanup) cleanup()
    }
  }, [])

  // Get nav labels based on language
  const navSections = sections.map((section) => ({
    ...section,
    label: lang === 'fr' ? section.labelFr : section.label,
  }))

  if (!isLoaded) {
    return <div className="loading-screen">Loading...</div>
  }

  return (
    <div className="app">
      <TargetCursor targetSelector=".cursor-target, .btn, .nav-link, a" disableSpin={contrastActive} />
      <Nav sections={navSections} activeId={activeId} />
      <ScrollProgress />
      <AccessibilityControls
        lang={lang}
        onToggleLang={toggleLanguage}
        contrastActive={contrastActive}
        onToggleContrast={toggleContrast}
      />
      <main>
        <Hero />
        <About />
        <Projects projects={projects} />
        <Testimonials />
        <Contact />
      </main>
      {showKpiAdmin && <KpiAdmin onClose={() => setShowKpiAdmin(false)} />}
    </div>
  )
}

export default App

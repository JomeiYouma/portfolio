import { Suspense, lazy, useState, useCallback } from 'react'
import QuoteFormModal from './components/QuoteFormModal'
import LegalModal from './components/LegalModal'
import { useI18n } from './hooks/useI18n'
import { useContrast } from './hooks/useContrast'
import { useTheme } from './hooks/useTheme'
import { markIntroDone, shouldPlayIntro } from './intro/barillet/gate'
import IntroLoader from './intro/barillet/IntroLoader'
import { THEMES } from './themes/registry'

// The opening sequence and its three.js only load when it plays
const BarilletIntro = lazy(() => import('./intro/barillet/BarilletIntro'))

// After the sequence, keyboard and screen-reader focus lands on the content
const focusContent = () => {
  requestAnimationFrame(() => {
    const main = document.getElementById('main-content')
    if (main) {
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
      main.focus({ preventScroll: true })
    }
  })
}

function App() {
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteProjectType, setQuoteProjectType] = useState(null)
  const [legalOpen, setLegalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState('legal')

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
  const { theme, cycleTheme, setTheme } = useTheme()

  // 'playing': the sequence covers an empty page; 'armed': the chosen theme is
  // mounted behind it, ready for the reveal; 'done': no sequence
  const [intro, setIntro] = useState(() => (shouldPlayIntro() ? 'playing' : 'done'))
  const armIntro = useCallback(
    (id) => {
      setTheme(id)
      setIntro('armed')
    },
    [setTheme],
  )
  const fireIntro = useCallback(
    (id) => {
      setTheme(id)
      markIntroDone()
    },
    [setTheme],
  )
  const endIntro = useCallback(() => {
    markIntroDone()
    setIntro('done')
    focusContent()
  }, [])

  if (!isLoaded) {
    return <div className="loading-screen" />
  }

  // Each theme places the controls itself: where they sit is part of its layout
  const controlsProps = {
    lang,
    onToggleLang: toggleLanguage,
    contrastActive,
    onToggleContrast: toggleContrast,
    onOpenLegal: openLegal,
    onCycleTheme: cycleTheme,
  }
  const ThemeRoot = theme.Component

  return (
    <>
      {intro !== 'playing' && (
        <Suspense fallback={<div className="loading-screen" />}>
          <ThemeRoot
            key={theme.id}
            lang={lang}
            contrastActive={contrastActive}
            onOpenQuote={openQuote}
            onOpenLegal={openLegal}
            controlsProps={controlsProps}
          />
        </Suspense>
      )}
      {intro !== 'done' && (
        <Suspense fallback={<IntroLoader label={t('intro.loading')} />}>
          <BarilletIntro
            themes={THEMES}
            lang={lang}
            onToggleLang={toggleLanguage}
            onArm={armIntro}
            onFire={fireIntro}
            onDone={endIntro}
            onSkip={endIntro}
          />
        </Suspense>
      )}
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
      <p className="sr-only" role="status" aria-live="polite">
        {`${t('accessibility.themeActive')} ${t(`themes.${theme.id}`)}`}
      </p>
    </>
  )
}

export default App

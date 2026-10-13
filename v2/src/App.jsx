import { Suspense, useState, useCallback } from 'react'
import QuoteFormModal from './components/QuoteFormModal'
import LegalModal from './components/LegalModal'
import { useI18n } from './hooks/useI18n'
import { useContrast } from './hooks/useContrast'
import { useTheme } from './hooks/useTheme'

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
  const { theme, cycleTheme } = useTheme()

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

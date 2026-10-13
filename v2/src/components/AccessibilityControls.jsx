import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../hooks/useI18n'

// Touch and pen have no Shift key: holding the button this long switches theme instead
const LONG_PRESS_MS = 550

// Switching theme remounts this component while Shift is still down, so the
// key state is kept at module level and each new instance starts from it.
let shiftDown = false

const AccessibilityControls = ({ lang, onToggleLang, contrastActive, onToggleContrast, onOpenLegal, onCycleTheme, alignRight = false }) => {
  const { t } = useI18n()
  const [shiftHeld, setShiftHeld] = useState(shiftDown)
  const longPress = useRef({ timer: null, fired: false })

  // While Shift is down the contrast button becomes the theme switch
  useEffect(() => {
    if (!onCycleTheme) return undefined
    const set = (held) => { shiftDown = held; setShiftHeld(held) }
    const onKey = (e) => { if (e.key === 'Shift') set(e.type === 'keydown') }
    const reset = () => set(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', reset)
    }
  }, [onCycleTheme])

  useEffect(() => {
    const state = longPress.current
    return () => clearTimeout(state.timer)
  }, [])

  const themeMode = shiftHeld && Boolean(onCycleTheme)

  const onContrastClick = (e) => {
    // The click that ends a long press has already switched theme
    if (longPress.current.fired) {
      longPress.current.fired = false
      return
    }
    // shiftHeld also covers keyboard activation, where e.shiftKey is not reliable
    if (onCycleTheme && (e.shiftKey || shiftHeld)) onCycleTheme()
    else onToggleContrast()
  }

  const onContrastPointerDown = (e) => {
    if (!onCycleTheme || e.pointerType === 'mouse') return
    longPress.current.fired = false
    clearTimeout(longPress.current.timer)
    longPress.current.timer = setTimeout(() => {
      longPress.current.fired = true
      onCycleTheme()
    }, LONG_PRESS_MS)
  }
  const cancelLongPress = () => clearTimeout(longPress.current.timer)
  const contrastLabel = contrastActive
    ? t('accessibility.contrastDisable')
    : t('accessibility.contrastEnable')
  const langLabel = lang === 'en'
    ? t('accessibility.switchToFrench')
    : t('accessibility.switchToEnglish')

  return (
    <div className={`accessibility-controls ${alignRight ? 'is-right' : ''}`} role="group" aria-label={t('accessibility.contrast')}>
      <button
        className={`contrast-toggle ${contrastActive ? 'active' : ''} ${themeMode ? 'is-theme-mode' : ''}`}
        aria-label={themeMode ? t('accessibility.themeSwitch') : contrastLabel}
        aria-pressed={themeMode ? undefined : contrastActive}
        onClick={onContrastClick}
        onPointerDown={onContrastPointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onContextMenu={(e) => { if (longPress.current.fired) e.preventDefault() }}
        type="button"
      >
        {/* Instant tooltip, styled per theme. It repeats the aria-label, hence aria-hidden. */}
        <span className="control-tooltip" aria-hidden="true">
          {themeMode ? t('accessibility.themeSwitch') : t('accessibility.contrastTooltip')}
        </span>
        {/* The square outline, detached from the button so it can spin in 3D around the icon */}
        {themeMode && <span className="contrast-frame" aria-hidden="true" />}
        {themeMode ? (
          // Dithered disc: a solid half fading into a checkerboard, i.e. "another rendering"
          <svg className="icon-contrast icon-theme" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
            <path d="M5 1h3v14H5v-1H3v-2H2v-1H1V5h1V4h1V2h2z" />
            <path d="M8 1h1v1H8zM10 1h1v1h-1zM9 2h1v1H9zM11 2h1v1h-1zM8 3h1v1H8zM10 3h1v1h-1zM12 3h1v1h-1zM9 4h1v1H9zM11 4h1v1h-1zM13 4h1v1h-1zM8 5h1v1H8zM10 5h1v1h-1zM12 5h1v1h-1zM14 5h1v1h-1zM9 6h1v1H9zM11 6h1v1h-1zM13 6h1v1h-1zM8 7h1v1H8zM10 7h1v1h-1zM12 7h1v1h-1zM14 7h1v1h-1zM9 8h1v1H9zM11 8h1v1h-1zM13 8h1v1h-1zM8 9h1v1H8zM10 9h1v1h-1zM12 9h1v1h-1zM14 9h1v1h-1zM9 10h1v1H9zM11 10h1v1h-1zM13 10h1v1h-1zM8 11h1v1H8zM10 11h1v1h-1zM12 11h1v1h-1zM9 12h1v1H9zM11 12h1v1h-1zM8 13h1v1H8zM10 13h1v1h-1zM9 14h1v1H9z" />
          </svg>
        ) : (
          <svg className="icon-contrast" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        )}
      </button>
      <button
        className="lang-toggle"
        aria-label={langLabel}
        onClick={onToggleLang}
        type="button"
        lang={lang === 'en' ? 'fr' : 'en'}
      >
        <span aria-hidden="true">{lang === 'en' ? 'FR' : 'ENG'}</span>
      </button>
      {onOpenLegal && (
        <div className="legal-pills" aria-label={t('legal.legal.tab')}>
          <button
            type="button"
            className="legal-pill cursor-target"
            onClick={() => onOpenLegal('legal')}
          >
            {t('legal.legal.short') || t('legal.legal.tab')}
          </button>
          <button
            type="button"
            className="legal-pill cursor-target"
            onClick={() => onOpenLegal('terms')}
          >
            {t('legal.terms.short') || t('legal.terms.tab')}
          </button>
          <button
            type="button"
            className="legal-pill cursor-target"
            onClick={() => onOpenLegal('privacy')}
          >
            {t('legal.privacy.short') || t('legal.privacy.tab')}
          </button>
        </div>
      )}
    </div>
  )
}

export default AccessibilityControls

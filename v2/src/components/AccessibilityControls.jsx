import { useI18n } from '../hooks/useI18n'

const AccessibilityControls = ({ lang, onToggleLang, contrastActive, onToggleContrast, onOpenLegal }) => {
  const { t } = useI18n()
  const contrastLabel = contrastActive
    ? t('accessibility.contrastDisable')
    : t('accessibility.contrastEnable')
  const langLabel = lang === 'en'
    ? t('accessibility.switchToFrench')
    : t('accessibility.switchToEnglish')

  return (
    <div className="accessibility-controls" role="group" aria-label={t('accessibility.contrast')}>
      <button
        className={`contrast-toggle ${contrastActive ? 'active' : ''}`}
        aria-label={contrastLabel}
        aria-pressed={contrastActive}
        onClick={onToggleContrast}
        type="button"
      >
        <svg className="icon-contrast" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
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

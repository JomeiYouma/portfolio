import { useEffect, useState } from 'react'
import { useI18n } from '../hooks/useI18n'

const STORAGE_KEY = 'cookie-consent-v1'

const CookieBanner = ({ onOpenLegal }) => {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const dismiss = (choice) => {
    try { localStorage.setItem(STORAGE_KEY, choice) } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label={t('cookies.title')}>
      <div className="cookie-banner-inner">
        <div className="cookie-banner-text">
          <p className="cookie-banner-title">{t('cookies.title')}</p>
          <p className="cookie-banner-body">
            {t('cookies.message')}{' '}
            <button
              type="button"
              className="cookie-banner-link cursor-target"
              onClick={() => onOpenLegal?.('privacy')}
            >
              {t('cookies.learn')}
            </button>
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="btn ghost cursor-target"
            onClick={() => dismiss('declined')}
          >
            {t('cookies.decline')}
          </button>
          <button
            type="button"
            className="btn primary cursor-target"
            onClick={() => dismiss('accepted')}
          >
            {t('cookies.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieBanner

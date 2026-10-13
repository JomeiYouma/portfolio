import { useEffect, useState } from 'react'
import AccessibilityControls from '../../../components/AccessibilityControls'
import { useI18n } from '../../../hooks/useI18n'

/**
 * Sticky top bar: wordmark, numbered index of the page, display controls.
 * Under 961px the index folds into a full-screen panel behind an "Index" button.
 */
const Masthead = ({ sections, activeId, controlsProps }) => {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className={`rz-mast ${open ? 'is-open' : ''}`}>
      <div className="rz-mast-inner rz-wrap">
        <a className="rz-mast-brand" href="#hero" onClick={() => setOpen(false)}>
          <span className="rz-mast-mark" aria-hidden="true" />
          <span>Raphaël Madoré</span>
        </a>

        <button
          type="button"
          className="rz-mast-toggle"
          aria-expanded={open}
          aria-controls="rz-index"
          onClick={() => setOpen((v) => !v)}
        >
          {t('riso.index')}
        </button>

        <nav className="rz-index" id="rz-index" aria-label={t('accessibility.mainNav')}>
          <ol>
            {sections.slice(1).map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={activeId === section.id ? 'location' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="rz-index-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  {section.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <AccessibilityControls {...controlsProps} />
      </div>
    </header>
  )
}

export default Masthead

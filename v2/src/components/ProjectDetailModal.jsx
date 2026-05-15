import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { asset } from '../utils/asset'
import './ProjectDetailModal.css'

/**
 * Accessible project detail dialog.
 * - role="dialog" + aria-modal + aria-labelledby for assistive tech
 * - Initial focus moves to the close button; restored to the trigger on close
 * - Body scroll is locked while the dialog is open
 */
const ProjectDetailModal = ({ open, onClose, project, lang, t }) => {
  const closeRef = useRef(null)
  const previousActiveRef = useRef(null)

  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement
      // Lock body scroll while the dialog is open
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      // Signal to TargetCursor (z-index 9999) that it must paint above the modal overlay (also 9999).
      document.body.classList.add('is-modal-open')
      // Move focus to the close button on next paint
      requestAnimationFrame(() => closeRef.current?.focus())
      return () => {
        document.body.style.overflow = prevOverflow
        document.body.classList.remove('is-modal-open')
        previousActiveRef.current?.focus?.()
      }
    }
  }, [open])

  if (!project) return null

  const title = project.title?.[lang] || project.title?.en || ''
  const type = project.type?.[lang] || project.type?.en || ''
  const description = project.description?.[lang] || project.description?.en || ''
  const role = project.role?.[lang] || project.role?.en || ''
  const highlights = project.highlights?.[lang] || project.highlights?.en || []

  // Portal to <body>: <main> uses `will-change: transform` for the horizontal
  // GSAP scroll, which creates a containing block for fixed descendants. That
  // anchors the modal to <main> instead of the viewport — so we render it
  // outside of <main> entirely.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="pdm-overlay"
          role="presentation"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="pdm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdm-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              ref={closeRef}
              type="button"
              className="pdm-close cursor-target"
              onClick={onClose}
              aria-label={t('projects.close')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>

            <div className="pdm-media">
              <img
                src={asset(`assets/images/${project.image}`)}
                alt={lang === 'fr'
                  ? `Capture du projet ${title}`
                  : `${title} project screenshot`}
                loading="lazy"
              />
            </div>

            <div className="pdm-body">
              <p className="eyebrow">{type}</p>
              <h3 id="pdm-title" className="pdm-title">{title}</h3>

              <p className="pdm-description">{description}</p>

              <dl className="pdm-meta">
                {project.year && (
                  <div className="pdm-meta-row">
                    <dt>{t('projects.year')}</dt>
                    <dd>{project.year}</dd>
                  </div>
                )}
                {role && (
                  <div className="pdm-meta-row">
                    <dt>{t('projects.role')}</dt>
                    <dd>{role}</dd>
                  </div>
                )}
                {project.tech && (
                  <div className="pdm-meta-row">
                    <dt>{t('projects.tech')}</dt>
                    <dd>{project.tech}</dd>
                  </div>
                )}
                {project.context && (
                  <div className="pdm-meta-row">
                    <dt>{t('projects.context')}</dt>
                    <dd>{project.context}</dd>
                  </div>
                )}
              </dl>

              {highlights.length > 0 && (
                <section className="pdm-highlights" aria-labelledby="pdm-highlights-title">
                  <h4 id="pdm-highlights-title">{t('projects.highlights')}</h4>
                  <ul>
                    {highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </section>
              )}

              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn primary cursor-target pdm-cta"
                  aria-label={`${t('projects.viewProject')} — ${title} (${lang === 'fr' ? 'nouvel onglet' : 'opens in new tab'})`}
                >
                  {t('projects.viewProject')}
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default ProjectDetailModal

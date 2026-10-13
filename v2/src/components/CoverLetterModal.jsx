import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useI18n } from '../hooks/useI18n'

/**
 * "Cover letter coming soon" dialog, shared by every theme.
 */
const CoverLetterModal = ({ open, onClose }) => {
  const { t } = useI18n()
  const modalCloseRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => modalCloseRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      previousFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  // Portal to <body>: the neon theme's <main> is transformed for the horizontal
  // scroll, which would otherwise re-anchor `position: fixed` on the overlay to
  // <main> instead of the viewport.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          role="presentation"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cover-letter-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 id="cover-letter-title">{t('coverLetterModal.title')}</h3>
            <p>{t('coverLetterModal.message')}</p>
            <button
              ref={modalCloseRef}
              type="button"
              className="btn primary cursor-target"
              onClick={onClose}
            >
              {t('coverLetterModal.ok')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default CoverLetterModal

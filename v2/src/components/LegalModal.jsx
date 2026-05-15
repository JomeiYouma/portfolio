import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useI18n } from '../hooks/useI18n'

const LegalModal = ({ isOpen, onClose, tab: initialTab = 'legal' }) => {
  const { t } = useI18n()
  const [tab, setTab] = useState(initialTab)
  const closeRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    setTab(initialTab)
    previousFocusRef.current = document.activeElement
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      previousFocusRef.current?.focus?.()
    }
  }, [isOpen, initialTab, onClose])

  if (!isOpen) return null

  const blocks = t(`legal.${tab}.blocks`)

  return createPortal(
    <AnimatePresence>
      {isOpen && (
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
            className="modal-content legal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              ref={closeRef}
              type="button"
              className="modal-close cursor-target"
              onClick={onClose}
              aria-label={t('legal.close')}
            >×</button>

            <div className="legal-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'legal'}
                className={`legal-tab cursor-target${tab === 'legal' ? ' is-active' : ''}`}
                onClick={() => setTab('legal')}
              >{t('legal.legal.tab')}</button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'privacy'}
                className={`legal-tab cursor-target${tab === 'privacy' ? ' is-active' : ''}`}
                onClick={() => setTab('privacy')}
              >{t('legal.privacy.tab')}</button>
            </div>

            <h3 id="legal-modal-title">{t(`legal.${tab}.title`)}</h3>
            <p className="legal-updated">{t('legal.updated')}</p>

            <div className="legal-body">
              {Array.isArray(blocks) && blocks.map((block, idx) => (
                <section key={idx} className="legal-block">
                  <h4>{block.heading}</h4>
                  {Array.isArray(block.body)
                    ? block.body.map((line, i) => <p key={i}>{line}</p>)
                    : <p>{block.body}</p>}
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default LegalModal

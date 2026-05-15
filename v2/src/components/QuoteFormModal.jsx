import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useI18n } from '../hooks/useI18n'

const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT
  || 'https://formspree.io/f/mrejngjj'

const initialState = {
  name: '',
  email: '',
  projectType: 'create',
  budget: '',
  timeline: '',
  message: '',
}

const QuoteFormModal = ({ isOpen, onClose, initialProjectType }) => {
  const { t } = useI18n()
  const [values, setValues] = useState(initialState)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const closeRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    previousFocusRef.current = document.activeElement
    setValues((v) => ({ ...v, projectType: initialProjectType || v.projectType }))
    setStatus('idle')
    setErrorMsg('')
    document.body.classList.add('is-modal-open')
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('is-modal-open')
      previousFocusRef.current?.focus?.()
    }
  }, [isOpen, initialProjectType, onClose])

  const update = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'loading') return
    setStatus('loading')
    setErrorMsg('')
    try {
      const projectLabel = t(`services.items.${values.projectType}.title`) || values.projectType
      const subject = `${t('services.cta')} : ${projectLabel}`
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          projectType: projectLabel,
          budget: values.budget,
          timeline: values.timeline,
          message: values.message,
          _subject: subject,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.errors?.[0]?.message || `HTTP ${res.status}`)
      }
      setStatus('success')
      setValues(initialState)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'unknown')
    }
  }

  if (!isOpen) return null

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
            className="modal-content quote-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-form-title"
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
              aria-label={t('quoteForm.close')}
            >×</button>

            <h3 id="quote-form-title">{t('quoteForm.title')}</h3>
            <p className="quote-modal-lead">{t('quoteForm.lead')}</p>

            {status === 'success' ? (
              <div className="quote-form-success" role="status">
                <p className="quote-form-success-title">{t('quoteForm.successTitle')}</p>
                <p>{t('quoteForm.successBody')}</p>
                <button
                  type="button"
                  className="btn primary cursor-target"
                  onClick={onClose}
                >{t('quoteForm.close')}</button>
              </div>
            ) : (
              <form className="quote-form" onSubmit={handleSubmit} noValidate>
                <label className="quote-field">
                  <span>{t('quoteForm.name')}</span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={values.name}
                    onChange={update('name')}
                    className="cursor-target"
                  />
                </label>

                <label className="quote-field">
                  <span>{t('quoteForm.email')}</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={values.email}
                    onChange={update('email')}
                    className="cursor-target"
                  />
                </label>

                <label className="quote-field">
                  <span>{t('quoteForm.projectType')}</span>
                  <select
                    value={values.projectType}
                    onChange={update('projectType')}
                    className="cursor-target"
                  >
                    <option value="create">{t('services.items.create.title')}</option>
                    <option value="update">{t('services.items.update.title')}</option>
                    <option value="gamify">{t('services.items.gamify.title')}</option>
                    <option value="other">{t('quoteForm.other')}</option>
                  </select>
                </label>

                <div className="quote-field-row">
                  <label className="quote-field">
                    <span>{t('quoteForm.budget')}</span>
                    <input
                      type="text"
                      placeholder={t('quoteForm.budgetPlaceholder')}
                      value={values.budget}
                      onChange={update('budget')}
                      className="cursor-target"
                    />
                  </label>

                  <label className="quote-field">
                    <span>{t('quoteForm.timeline')}</span>
                    <input
                      type="text"
                      placeholder={t('quoteForm.timelinePlaceholder')}
                      value={values.timeline}
                      onChange={update('timeline')}
                      className="cursor-target"
                    />
                  </label>
                </div>

                <label className="quote-field">
                  <span>{t('quoteForm.message')}</span>
                  <textarea
                    rows={5}
                    required
                    value={values.message}
                    onChange={update('message')}
                    className="cursor-target"
                  />
                </label>

                <p className="quote-form-privacy">{t('quoteForm.privacy')}</p>

                {status === 'error' && (
                  <p className="quote-form-error" role="alert">
                    {t('quoteForm.errorBody')} ({errorMsg})
                  </p>
                )}

                <div className="quote-form-actions">
                  <button
                    type="button"
                    className="btn ghost cursor-target"
                    onClick={onClose}
                  >{t('quoteForm.cancel')}</button>
                  <button
                    type="submit"
                    className="btn primary cursor-target"
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? t('quoteForm.sending') : t('quoteForm.send')}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default QuoteFormModal

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useI18n } from '../hooks/useI18n'
import GlowCard from '../components/GlowCard'
import MagneticButton from '../components/MagneticButton'
import Reveal from '../components/Reveal'

const Testimonials = () => {
  const { t } = useI18n()
  const [showModal, setShowModal] = useState(false)
  const modalCloseRef = useRef(null)
  const previousFocusRef = useRef(null)

  const testimonials = [
    { key: 'navy' },
    { key: 'eric' },
    { key: 'caroline' },
  ]

  useEffect(() => {
    if (!showModal) return
    previousFocusRef.current = document.activeElement
    const onKey = (e) => { if (e.key === 'Escape') setShowModal(false) }
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => modalCloseRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      previousFocusRef.current?.focus?.()
    }
  }, [showModal])

  return (
    <section id="testimonials" data-section className="section testimonials-section">
      <div className="section-inner">
        <Reveal as="div" stagger className="section-heading">
          <Reveal.Item as="p" className="eyebrow">{t('testimonials.eyebrow')}</Reveal.Item>
          <Reveal.Item as="h2">{t('testimonials.title')}</Reveal.Item>
          <Reveal.Item as="p" className="lead">{t('testimonials.intro')}</Reveal.Item>
        </Reveal>

        <Reveal as="div" stagger className="testimonials-grid">
          {testimonials.map(({ key }) => (
            <Reveal.Item key={key}>
              <GlowCard className="testimonial-card" intensity={0.14} size={300}>
                <div className="testimonial-quote">
                  <span className="quote-mark">"</span>
                  <blockquote>{t(`testimonials.items.${key}.quote`)}</blockquote>
                </div>
                <div className="testimonial-author">
                  <h4 className="author-name">{t(`testimonials.items.${key}.name`)}</h4>
                  <span className="author-role">{t(`testimonials.items.${key}.role`)}</span>
                </div>
              </GlowCard>
            </Reveal.Item>
          ))}
        </Reveal>

        <Reveal as="div" className="testimonials-cta" delay={0.1}>
          <MagneticButton
            as="a"
            href="mailto:raphael.madore.pro@mailo.com?subject=Let's work together!"
            className="btn primary cursor-target"
          >
            {t('testimonials.cta')}
          </MagneticButton>
          <div className="download-links">
            <a
              href="/assets/documents/cv_raphel_madore_2026.pdf"
              download
              className="download-item cursor-target"
            >
              <span className="icon" aria-hidden="true">⤓</span> {t('testimonials.cv')}
            </a>
            <button
              type="button"
              className="download-item cursor-target"
              onClick={() => setShowModal(true)}
              aria-haspopup="dialog"
              aria-expanded={showModal}
            >
              <span className="icon" aria-hidden="true">⤓</span> {t('testimonials.coverLetter')}
            </button>
          </div>
        </Reveal>
      </div>

      {/* Portal to <body>: <main> has `will-change: transform` for the GSAP
          horizontal scroll, which would otherwise re-anchor `position: fixed`
          on the overlay to <main> instead of the viewport. */}
      {createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="modal-overlay"
              role="presentation"
              onClick={() => setShowModal(false)}
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
                  onClick={() => setShowModal(false)}
                >
                  {t('coverLetterModal.ok')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  )
}

export default Testimonials

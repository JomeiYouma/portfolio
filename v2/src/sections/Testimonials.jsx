import { useState, useCallback } from 'react'
import { useI18n } from '../hooks/useI18n'
import CoverLetterModal from '../components/CoverLetterModal'
import GlowCard from '../components/GlowCard'
import MagneticButton from '../components/MagneticButton'
import Reveal from '../components/Reveal'
import { asset } from '../utils/asset'

const Testimonials = () => {
  const { t } = useI18n()
  const [showModal, setShowModal] = useState(false)
  const closeModal = useCallback(() => setShowModal(false), [])

  const testimonials = [
    { key: 'navy' },
    { key: 'eric' },
    { key: 'caroline' },
  ]

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
              href={asset('assets/documents/CV-20260615-RM.pdf')}
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

      <CoverLetterModal open={showModal} onClose={closeModal} />
    </section>
  )
}

export default Testimonials

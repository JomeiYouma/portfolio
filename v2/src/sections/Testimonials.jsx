import { useState } from 'react'
import { useI18n } from '../hooks/useI18n'

const Testimonials = () => {
  const { t } = useI18n()
  const [showModal, setShowModal] = useState(false)

  const testimonials = [
    { key: 'navy' },
    { key: 'eric' },
    { key: 'caroline' },
  ]

  return (
    <section id="testimonials" data-section className="section testimonials-section">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">{t('testimonials.eyebrow')}</p>
          <h2>{t('testimonials.title')}</h2>
          <p className="lead">{t('testimonials.intro')}</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map(({ key }) => (
            <div key={key} className="testimonial-card">
              <div className="testimonial-quote">
                <span className="quote-mark">"</span>
                <blockquote>{t(`testimonials.items.${key}.quote`)}</blockquote>
              </div>
              <div className="testimonial-author">
                <h4 className="author-name">{t(`testimonials.items.${key}.name`)}</h4>
                <span className="author-role">{t(`testimonials.items.${key}.role`)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="testimonials-cta">
          <a 
            href="mailto:raphael.madore.pro@mailo.com?subject=Let's work together!" 
            className="btn primary cursor-target"
          >
            {t('testimonials.cta')}
          </a>
          <div className="download-links">
            <a 
              href="/assets/documents/cv_raphel_madore_2026.pdf" 
              download 
              className="download-item cursor-target"
            >
              <span className="icon">⤓</span> {t('testimonials.cv')}
            </a>
            <button 
              className="download-item cursor-target" 
              onClick={() => setShowModal(true)}
            >
              <span className="icon">⤓</span> {t('testimonials.coverLetter')}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('coverLetterModal.title')}</h3>
            <p>{t('coverLetterModal.message')}</p>
            <button 
              className="btn primary cursor-target" 
              onClick={() => setShowModal(false)}
            >
              {t('coverLetterModal.ok')}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Testimonials

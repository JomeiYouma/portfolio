import { useCallback, useState } from 'react'
import SectionHead from '../components/SectionHead'
import CoverLetterModal from '../../../components/CoverLetterModal'
import { useI18n } from '../../../hooks/useI18n'
import { asset } from '../../../utils/asset'

const KEYS = ['navy', 'eric', 'caroline']

const Testimonials = ({ number }) => {
  const { t } = useI18n()
  const [letterOpen, setLetterOpen] = useState(false)
  const closeLetter = useCallback(() => setLetterOpen(false), [])

  return (
    <section id="testimonials" className="rz-section" aria-labelledby="rz-testimonials-title">
      <SectionHead number={number} eyebrow={t('testimonials.eyebrow')} title={t('testimonials.title')} titleId="rz-testimonials-title" />

      <div className="rz-wrap">
        <p className="rz-lead rz-section-lead" data-rz-reveal>{t('testimonials.intro')}</p>

        <div className="rz-quotes">
          {KEYS.map((key) => (
            <figure className="rz-quote" key={key} data-rz-reveal>
              <span className="rz-quote-mark" aria-hidden="true">“</span>
              <blockquote>{t(`testimonials.items.${key}.quote`)}</blockquote>
              <figcaption>
                <strong>{t(`testimonials.items.${key}.name`)}</strong>
                <span>{t(`testimonials.items.${key}.role`)}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="rz-actions rz-actions--spread" data-rz-reveal>
          <a className="rz-btn rz-btn--solid" href="mailto:raphael.madore.pro@mailo.com?subject=Let's work together!">
            {t('testimonials.cta')}
          </a>
          <a className="rz-link" href={asset('assets/documents/CV-20260615-RM.pdf')} download data-rz-torch>
            <span aria-hidden="true">↓ </span>{t('testimonials.cv')}
          </a>
          <button
            type="button"
            className="rz-link"
            onClick={() => setLetterOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={letterOpen}
            data-rz-torch
          >
            <span aria-hidden="true">↓ </span>{t('testimonials.coverLetter')}
          </button>
        </div>
      </div>

      <CoverLetterModal open={letterOpen} onClose={closeLetter} />
    </section>
  )
}

export default Testimonials

import { useI18n } from '../hooks/useI18n'
import GlowCard from '../components/GlowCard'
import MagneticButton from '../components/MagneticButton'
import Reveal from '../components/Reveal'

const Services = ({ onOpenQuote }) => {
  const { t } = useI18n()

  const items = [
    { key: 'create', marker: '01', icon: '✦' },
    { key: 'update', marker: '02', icon: '↻' },
    { key: 'gamify', marker: '03', icon: '◉' },
  ]

  return (
    <section id="services" data-section className="section services-section">
      <div className="section-inner">
        <Reveal as="div" stagger className="section-heading">
          <Reveal.Item as="p" className="eyebrow">{t('services.eyebrow')}</Reveal.Item>
          <Reveal.Item as="div" className="services-title-row">
            <h2>{t('services.title')}</h2>
            <span className="services-badge">{t('services.badge')}</span>
          </Reveal.Item>
          <Reveal.Item as="p" className="lead">{t('services.intro')}</Reveal.Item>
        </Reveal>

        <Reveal as="div" stagger className="services-grid">
          {items.map(({ key, marker, icon }) => {
            const title = t(`services.items.${key}.title`)
            const features = t(`services.items.${key}.features`)
            return (
              <Reveal.Item key={key}>
                <GlowCard
                  as="button"
                  type="button"
                  onClick={() => onOpenQuote?.(key)}
                  className="service-card cursor-target"
                  intensity={0.16}
                  size={300}
                  aria-label={`${t('services.cta')} : ${title}`}
                >
                  <div className="service-card-head">
                    <span className="service-marker">{marker}</span>
                    <span className="service-icon" aria-hidden="true">{icon}</span>
                  </div>
                  <h3 className="service-title">{title}</h3>
                  <p className="service-desc">{t(`services.items.${key}.description`)}</p>
                  <ul className="service-features">
                    {Array.isArray(features) && features.map((f) => (
                      <li key={f}><span aria-hidden="true">›</span> {f}</li>
                    ))}
                  </ul>
                  <div className="service-price">
                    <span className="service-price-label">{t(`services.items.${key}.priceLabel`)}</span>
                    <span className="service-price-value">{t(`services.items.${key}.price`)}</span>
                  </div>
                  <span className="service-cta-hint" aria-hidden="true">{t('services.cta')} <span className="arrow">❯</span></span>
                </GlowCard>
              </Reveal.Item>
            )
          })}
        </Reveal>

        <Reveal as="div" className="services-cta" delay={0.1}>
          <p className="services-note">{t('services.note')}</p>
          <MagneticButton
            type="button"
            onClick={() => onOpenQuote?.()}
            className="btn primary cursor-target"
          >
            {t('services.cta')}
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  )
}

export default Services

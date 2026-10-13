import SectionHead from '../components/SectionHead'
import { useI18n } from '../../../hooks/useI18n'

const KEYS = ['create', 'update', 'gamify']

const Services = ({ number, onOpenQuote }) => {
  const { t } = useI18n()

  return (
    <section id="services" className="rz-section" aria-labelledby="rz-services-title">
      <SectionHead number={number} eyebrow={t('services.eyebrow')} title={t('services.title')} titleId="rz-services-title" />

      <div className="rz-wrap">
        <div className="rz-services-intro" data-rz-reveal>
          <span className="rz-badge">{t('services.badge')}</span>
          <p className="rz-lead">{t('services.intro')}</p>
        </div>

        <ul className="rz-coupons">
          {KEYS.map((key, index) => {
            const title = t(`services.items.${key}.title`)
            const features = t(`services.items.${key}.features`)
            return (
              <li key={key} data-rz-reveal>
                <article className="rz-coupon rz-card">
                  <p className="rz-coupon-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</p>
                  <h3>{title}</h3>
                  <p>{t(`services.items.${key}.description`)}</p>
                  <ul className="rz-coupon-features">
                    {Array.isArray(features) && features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  <p className="rz-coupon-price">
                    <span>{t(`services.items.${key}.priceLabel`)}</span>
                    <strong>{t(`services.items.${key}.price`)}</strong>
                  </p>
                  <button
                    type="button"
                    className="rz-btn rz-btn--solid"
                    onClick={() => onOpenQuote(key)}
                    aria-label={`${t('services.cta')} : ${title}`}
                  >
                    {t('services.cta')}
                  </button>
                </article>
              </li>
            )
          })}
        </ul>

        <p className="rz-note" data-rz-reveal>{t('services.note')}</p>
      </div>
    </section>
  )
}

export default Services

import { Dithering } from '@paper-design/shaders-react'
import { useReducedMotion } from 'motion/react'
import InkShader from '../components/InkShader'
import { useI18n } from '../../../hooks/useI18n'

const Hero = ({ inks, onOpenQuote }) => {
  const { t } = useI18n()
  const reduce = useReducedMotion()

  return (
    <section id="hero" className="rz-hero rz-wrap">
      <div className="rz-hero-art" aria-hidden="true">
        <span className="rz-hero-disc" />
        <InkShader className="rz-hero-shader">
          <Dithering
            shape="sphere"
            type="8x8"
            size={3}
            scale={0.72}
            colorBack="#00000000"
            colorFront={inks.blue}
            speed={reduce ? 0 : 0.45}
            width="100%"
            height="100%"
          />
        </InkShader>
      </div>

      <div className="rz-hero-copy">
        <p className="rz-eyebrow">{t('hero.subtitle')}</p>
        <h1 className="sr-only">{t('hero.seoH1')}</h1>
        <p className="rz-hero-title rz-ink" data-text={t('hero.title')} aria-hidden="true">
          {t('hero.title')}
        </p>
        <p className="rz-hero-lead">{t('hero.description')}</p>
        <div className="rz-actions">
          <button type="button" className="rz-btn rz-btn--solid" onClick={() => onOpenQuote()}>
            {t('hero.servicesCta')}
          </button>
          <a className="rz-btn" href="#projects">{t('hero.cta')}</a>
        </div>
      </div>

      <aside className="rz-ticket" aria-label={t('hero.status')}>
        <p className="rz-ticket-status"><span className="rz-ticket-dot" aria-hidden="true" />{t('hero.status')}</p>
        <dl>
          <div>
            <dt>{t('contact.eyebrow')}</dt>
            <dd><a href="mailto:raphael.madore.pro@mailo.com">raphael.madore.pro@mailo.com</a></dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{t('hero.location')}</dd>
          </div>
        </dl>
        <p className="rz-ticket-links">
          <a href="https://www.linkedin.com/in/raphael-madore/" target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn — ${t('accessibility.opensNewTab')}`}>LinkedIn</a>
          <a href="https://github.com/JomeiYouma" target="_blank" rel="noopener noreferrer" aria-label={`GitHub — ${t('accessibility.opensNewTab')}`}>GitHub</a>
        </p>
      </aside>
    </section>
  )
}

export default Hero

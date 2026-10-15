import SectionHead from '../components/SectionHead'
import GithubPanel from '../components/GithubPanel'
import FooterLine from '../../../components/FooterLine'
import { useI18n } from '../../../hooks/useI18n'

const EMAIL = 'raphael.madore.pro@mailo.com'

const Contact = ({ number, lang, onOpenLegal }) => {
  const { t } = useI18n()
  const newTab = t('accessibility.opensNewTab')

  const cards = [
    { href: `mailto:${EMAIL}`, label: t('contact.email'), value: EMAIL, external: false },
    { href: 'https://www.linkedin.com/in/raphael-madore/', label: t('contact.linkedin'), value: '/in/raphael-madore', external: true },
    { href: 'https://github.com/JomeiYouma', label: t('contact.github'), value: 'github.com/JomeiYouma', external: true },
    { href: 'https://open.spotify.com/playlist/36Y3M007cqXXTBsHUbCS4B', label: t('contact.spotify'), value: t('contact.spotifyValue'), external: true },
  ]

  return (
    <section id="contact" className="rz-section rz-contact" aria-labelledby="rz-contact-title">
      <SectionHead number={number} eyebrow={t('contact.eyebrow')} title={t('contact.title')} titleId="rz-contact-title" />

      <div className="rz-wrap">
        <ul className="rz-contact-cards" data-rz-reveal>
          {cards.map((card) => (
            <li key={card.href}>
              <a
                className="rz-contact-card rz-card"
                href={card.href}
                {...(card.external
                  ? { target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${card.label}: ${card.value} — ${newTab}` }
                  : { 'aria-label': `${card.label}: ${card.value}` })}
              >
                <span className="rz-eyebrow">{card.label}</span>
                <span className="rz-contact-value">{card.value}</span>
                <span className="rz-contact-arrow" aria-hidden="true">{card.external ? '↗' : '→'}</span>
              </a>
            </li>
          ))}
        </ul>

        <GithubPanel lang={lang} />
      </div>

      {/* Closing plate: the paper dissolves into solid ink */}
      <footer className="rz-foot">
        <div className="rz-foot-band" aria-hidden="true" />
        <div className="rz-foot-plate">
          <div className="rz-foot-inner rz-wrap">
            <p className="rz-foot-name" aria-hidden="true">Raphaël Madoré</p>
            <p className="rz-foot-note"><FooterLine /></p>
            <ul className="rz-foot-links">
              {['legal', 'terms', 'privacy'].map((tab) => (
                <li key={tab}>
                  <button type="button" className="rz-link" onClick={() => onOpenLegal(tab)}>
                    {t(`legal.${tab}.short`) || t(`legal.${tab}.tab`)}
                  </button>
                </li>
              ))}
              <li>
                <a className="rz-link" href="#hero">{t('riso.backToTop')} <span aria-hidden="true">↑</span></a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </section>
  )
}

export default Contact

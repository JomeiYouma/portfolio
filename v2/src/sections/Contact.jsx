import { useI18n } from '../hooks/useI18n'
import GitHubActivity from '../components/GitHubActivity'
import GlowCard from '../components/GlowCard'
import Reveal from '../components/Reveal'

const Contact = () => {
  const { t } = useI18n()

  const cards = [
    { href: 'mailto:raphael.madore.pro@mailo.com', label: t('contact.email'),    value: 'raphael.madore.pro@mailo.com', external: false },
    { href: 'https://www.linkedin.com/in/raphaël-madoré/', label: t('contact.linkedin'), value: '/in/raphaelmadore',          external: true },
    { href: 'https://github.com/JomeiYouma',                label: t('contact.github'),   value: 'github.com/JomeiYouma',        external: true },
    { href: 'https://open.spotify.com/playlist/36Y3M007cqXXTBsHUbCS4B', label: t('contact.spotify'), value: t('contact.spotifyValue'), external: true },
  ]
  const newTab = t('accessibility.opensNewTab')

  return (
    <section id="contact" data-section className="section contact">
      <div className="section-inner contact-layout">
        <Reveal as="div" stagger className="contact-left">
          <Reveal.Item as="p" className="eyebrow">{t('contact.eyebrow')}</Reveal.Item>
          <Reveal.Item as="h2" className="contact-title">{t('contact.title')}</Reveal.Item>

          <Reveal.Item as="div" className="contact-grid">
            {cards.map((c) => (
              <GlowCard
                key={c.href}
                as="a"
                className="contact-card cursor-target"
                href={c.href}
                {...(c.external
                  ? { target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${c.label}: ${c.value} — ${newTab}` }
                  : { 'aria-label': `${c.label}: ${c.value}` })}
                intensity={0.16}
                size={260}
              >
                <div className="card-content">
                  <span className="card-label">{c.label}</span>
                  <span className="card-value">{c.value}</span>
                </div>
                <span className="card-arrow" aria-hidden="true">❯</span>
              </GlowCard>
            ))}
          </Reveal.Item>

          <Reveal.Item as="p" className="footer-note">
            {t('contact.footer')}
          </Reveal.Item>
        </Reveal>

        <Reveal as="div" className="contact-right" delay={0.15}>
          <GitHubActivity />
        </Reveal>
      </div>
    </section>
  )
}

export default Contact

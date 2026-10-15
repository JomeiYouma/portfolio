import { useCallback, useState } from 'react'
import ContributionGraph from '../../components/ContributionGraph'
import CoverLetterModal from '../../components/CoverLetterModal'
// The graph's own styles live with the neon block that first used it
import '../../components/GitHubActivity.css'
import { projects } from '../../data/projects'
import games from '../../data/games.json'
import skills from '../../data/skills.json'
import { useGitHub } from '../../hooks/useGitHub'
import { useI18n } from '../../hooks/useI18n'
import { asset } from '../../utils/asset'

// The content of each room, as plain HTML. The same sheets are shown beside
// the 3D wall when a room is entered and stacked down the page in plan view.

const EMAIL = 'raphael.madore.pro@mailo.com'

export const HeroSheet = ({ onOpenQuote, goTo }) => {
  const { t } = useI18n()
  return (
    <div className="ga-hero">
      <p className="ga-lead">{t('hero.description')}</p>
      <div className="ga-actions">
        <button type="button" className="ga-btn" onClick={() => onOpenQuote()}>{t('hero.servicesCta')}</button>
        <button type="button" className="ga-btn ga-btn--ghost" onClick={() => goTo(2)}>{t('hero.cta')}</button>
      </div>
      <dl className="ga-facts">
        <div><dt>{t('hero.status')}</dt><dd>{t('hero.location')}</dd></div>
        <div><dt>{t('contact.eyebrow')}</dt><dd><a className="ga-link" href={`mailto:${EMAIL}`}>{EMAIL}</a></dd></div>
      </dl>
    </div>
  )
}

const SKILL_LABELS = { Languages: 'about.languages', Frameworks: 'about.frameworks' }

export const AboutSheet = () => {
  const { t } = useI18n()
  return (
    <>
      <p className="ga-lead">{t('about.bio')}</p>
      <dl className="ga-skills">
        {skills.map((group) => (
          <div key={group.group}>
            <dt className="ga-label">{SKILL_LABELS[group.group] ? t(SKILL_LABELS[group.group]) : group.group}</dt>
            <dd>{group.items.map((item) => item.name).join(' · ')}</dd>
          </div>
        ))}
      </dl>
      <aside className="ga-note">
        <p className="ga-label">{t('about.certifications.title')}</p>
        <p>{t('about.certifications.description')}</p>
        <a className="ga-link" href={asset('assets/documents/opquast_certificate_2026.pdf')} download>
          {t('about.certifications.download')} <span aria-hidden="true">↓</span>
        </a>
      </aside>
    </>
  )
}

export const ProjectsSheet = ({ lang, openProject }) => {
  const { t } = useI18n()
  const pick = (value) => value[lang] || value.en
  return (
    <>
      <p className="ga-lead">{t('projects.sectionLead')}</p>
      <ul className="ga-works">
        {projects.map((project, index) => (
          <li key={project.id}>
            <button type="button" className="ga-work" onClick={() => openProject(index)} aria-haspopup="dialog">
              <span className="ga-work-shot">
                <img src={asset(`assets/images/${project.image}`)} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="ga-work-title">{pick(project.title)}</span>
              <span className="ga-work-meta">{pick(project.type)}, {project.year}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

export const GamesSheet = ({ lang }) => {
  const { t } = useI18n()
  return (
    <ul className="ga-works ga-works--wide">
      {games.map((game) => {
        const title = game.title[lang] || game.title.en
        return (
          <li key={game.id}>
            <a
              className="ga-work"
              href={game.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t('games.play')} : ${title} (${t('accessibility.opensNewTab')})`}
            >
              <span className="ga-work-shot">
                <img src={asset(`assets/images/${game.image}`)} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="ga-work-title">{title}</span>
              <span className="ga-work-text">{game.description[lang] || game.description.en}</span>
              <span className="ga-work-meta">{game.tech} — {t('games.play')} <span aria-hidden="true">↗</span></span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

const QUOTES = ['navy', 'eric', 'caroline']

export const TestimonialsSheet = () => {
  const { t } = useI18n()
  const [letterOpen, setLetterOpen] = useState(false)
  const closeLetter = useCallback(() => setLetterOpen(false), [])
  return (
    <>
      <p className="ga-lead">{t('testimonials.intro')}</p>
      {QUOTES.map((key) => (
        <figure className="ga-quote" key={key}>
          <blockquote>{t(`testimonials.items.${key}.quote`)}</blockquote>
          <figcaption>
            <strong>{t(`testimonials.items.${key}.name`)}</strong>, {t(`testimonials.items.${key}.role`)}
          </figcaption>
        </figure>
      ))}
      <div className="ga-actions">
        <a className="ga-btn" href="mailto:raphael.madore.pro@mailo.com?subject=Let's work together!">{t('testimonials.cta')}</a>
        <a className="ga-link" href={asset('assets/documents/CV-20260615-RM.pdf')} download>
          {t('testimonials.cv')} <span aria-hidden="true">↓</span>
        </a>
        <button type="button" className="ga-link" onClick={() => setLetterOpen(true)} aria-haspopup="dialog" aria-expanded={letterOpen}>
          {t('testimonials.coverLetter')} <span aria-hidden="true">↓</span>
        </button>
      </div>
      <CoverLetterModal open={letterOpen} onClose={closeLetter} />
    </>
  )
}

const SERVICES = ['create', 'update', 'gamify']

export const ServicesSheet = ({ onOpenQuote }) => {
  const { t } = useI18n()
  return (
    <>
      <p className="ga-label ga-badge">{t('services.badge')}</p>
      <p className="ga-lead">{t('services.intro')}</p>
      <ul className="ga-offers">
        {SERVICES.map((key) => {
          const title = t(`services.items.${key}.title`)
          const features = t(`services.items.${key}.features`)
          return (
            <li key={key}>
              <article className="ga-offer">
                <h3>{title}</h3>
                <p className="ga-offer-price">
                  <span className="ga-label">{t(`services.items.${key}.priceLabel`)}</span>
                  <strong>{t(`services.items.${key}.price`)}</strong>
                </p>
                <p>{t(`services.items.${key}.description`)}</p>
                <ul className="ga-offer-features">
                  {Array.isArray(features) && features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <button type="button" className="ga-btn" onClick={() => onOpenQuote(key)} aria-label={`${t('services.cta')} : ${title}`}>
                  {t('services.cta')}
                </button>
              </article>
            </li>
          )
        })}
      </ul>
      <p className="ga-note">{t('services.note')}</p>
    </>
  )
}

const PERIODS = [
  { scale: 'monthly', days: 30, label: 'contact.lastMonth', aria: 'contact.lastMonthAria' },
  { scale: 'quarterly', days: 90, label: 'contact.last3Months', aria: 'contact.last3MonthsAria' },
]

export const ContactSheet = ({ lang, onOpenLegal }) => {
  const { t } = useI18n()
  const { repos, loading, error, contributions, contributionsError, graphScale, setGraphScale } = useGitHub()
  const period = PERIODS.find((p) => p.scale === graphScale) ?? PERIODS[0]
  const newTab = t('accessibility.opensNewTab')
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const links = [
    { href: `mailto:${EMAIL}`, label: t('contact.email'), value: EMAIL, external: false },
    { href: 'https://www.linkedin.com/in/raphael-madore/', label: t('contact.linkedin'), value: '/in/raphael-madore', external: true },
    { href: 'https://github.com/JomeiYouma', label: t('contact.github'), value: 'github.com/JomeiYouma', external: true },
    { href: 'https://open.spotify.com/playlist/36Y3M007cqXXTBsHUbCS4B', label: t('contact.spotify'), value: t('contact.spotifyValue'), external: true },
  ]

  return (
    <>
      <ul className="ga-contacts">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              {...(link.external
                ? { target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${link.label}: ${link.value} — ${newTab}` }
                : { 'aria-label': `${link.label}: ${link.value}` })}
            >
              <span className="ga-label">{link.label}</span>
              <span className="ga-contact-value">{link.value}</span>
              <span aria-hidden="true">{link.external ? '↗' : '→'}</span>
            </a>
          </li>
        ))}
      </ul>

      <section className="ga-github" aria-labelledby="ga-github-title">
        <header>
          <h3 id="ga-github-title" className="ga-subtitle">{t('contact.githubStats')}</h3>
          <div className="ga-switch" role="group" aria-labelledby="ga-github-title">
            {PERIODS.map((p) => (
              <button key={p.scale} type="button" aria-pressed={graphScale === p.scale} aria-label={t(p.aria)} onClick={() => setGraphScale(p.scale)}>
                {t(p.label)}
              </button>
            ))}
          </div>
        </header>
        {contributions && (
          <ContributionGraph contributions={contributions} days={period.days} label={t(period.label)} alt={t('contact.githubGraphAlt')} />
        )}
        {!contributions && !contributionsError && <p className="ga-status">{t('galerie.loading')}</p>}
        {contributionsError && <p className="ga-status">{t('galerie.githubError')}</p>}

        <h3 className="ga-subtitle">{t('contact.latestActivity')}</h3>
        {loading && <p className="ga-status">{t('galerie.loading')}</p>}
        {error && <p className="ga-status">{t('galerie.githubError')}</p>}
        {!loading && !error && (
          <ul className="ga-repos">
            {repos.map((repo) => (
              <li key={repo.id}>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" aria-label={`${repo.name} — ${newTab}`}>
                  <span className="ga-repo-name">{repo.name}</span>
                  <time dateTime={repo.updated_at}>{formatDate(repo.updated_at)}</time>
                  {repo.description && <span className="ga-repo-desc">{repo.description}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="ga-legal">
        {['legal', 'terms', 'privacy'].map((tab) => (
          <li key={tab}>
            <button type="button" className="ga-link" onClick={() => onOpenLegal(tab)}>
              {t(`legal.${tab}.short`) || t(`legal.${tab}.tab`)}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

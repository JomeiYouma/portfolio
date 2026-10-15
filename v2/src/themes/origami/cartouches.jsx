import { useCallback, useEffect, useRef, useState } from 'react'
import ContributionGraph from '../../components/ContributionGraph'
import CoverLetterModal from '../../components/CoverLetterModal'
// The graph's own styles live with the neon block that first used it
import '../../components/GitHubActivity.css'
import projects from '../../data/projects.json'
import games from '../../data/games.json'
import skills from '../../data/skills.json'
import { useGitHub } from '../../hooks/useGitHub'
import { useI18n } from '../../hooks/useI18n'
import { asset } from '../../utils/asset'
import { EMAIL, FEATURED, QUOTES, SERVICES } from './stations'

// The content of each stop, as plain HTML: a paper cartouche laid over the
// map in the 3D view, stacked down the page in map view. Every action a
// landmark of the scene can trigger has its button here, so the canvas is
// never the only way in.

export const HeroCartouche = ({ onOpenQuote, goTo, immersive }) => {
  const { t } = useI18n()
  return (
    <div className="ori-hero">
      <p className="ori-lead">{t('hero.description')}</p>
      <div className="ori-actions">
        <button type="button" className="ori-btn" onClick={() => onOpenQuote()}>{t('hero.servicesCta')}</button>
        <button type="button" className="ori-btn ori-btn--ghost" onClick={() => goTo(2)}>{t('hero.cta')}</button>
      </div>
      <dl className="ori-facts">
        <div><dt>{t('hero.status')}</dt><dd>{t('hero.location')}</dd></div>
        <div><dt>{t('contact.eyebrow')}</dt><dd><a className="ori-mail" href={`mailto:${EMAIL}`}>{EMAIL}</a></dd></div>
      </dl>
      {immersive && (
        <p className="ori-hint">
          {t('origami.hint')} <span aria-hidden="true">↓</span>
          <br />
          {t('origami.landmarkHint')}
        </p>
      )}
    </div>
  )
}

const SKILL_LABELS = { Languages: 'about.languages', Frameworks: 'about.frameworks' }

export const AboutCartouche = () => {
  const { t } = useI18n()
  return (
    <>
      <p className="ori-lead">{t('about.bio')}</p>
      <dl className="ori-skills">
        {skills.map((group) => (
          <div key={group.group}>
            <dt className="ori-label">{SKILL_LABELS[group.group] ? t(SKILL_LABELS[group.group]) : group.group}</dt>
            <dd>
              {/* Logos printed in grey ink, like the rest of the map */}
              <ul className="ori-skill-list">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <img src={asset(item.icon)} alt="" width="18" height="18" loading="lazy" decoding="async" />
                    {item.name}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
      <aside className="ori-note">
        <p className="ori-label">{t('about.certifications.title')}</p>
        <p>{t('about.certifications.description')}</p>
        <a className="ori-link" href={asset('assets/documents/opquast_certificate_2026.pdf')} download>
          {t('about.certifications.download')} <span aria-hidden="true">↓</span>
        </a>
      </aside>
    </>
  )
}

// Six projects in pictures; every project, these included, in the index
// below them, since the prints on the 3D map are out of reach of a keyboard
// or a screen reader
export const ProjectsCartouche = ({ lang, openProject, immersive }) => {
  const { t } = useI18n()
  const pick = (value) => value[lang] || value.en
  return (
    <>
      <p className="ori-lead">{t('projects.sectionLead')}</p>
      <ul className="ori-works">
        {FEATURED.map((index) => {
          const project = projects[index]
          return (
            <li key={project.id}>
              <button type="button" className="ori-work" onClick={() => openProject(index)} aria-haspopup="dialog">
                <span className="ori-work-shot">
                  <span className="ori-work-mount">
                    <img src={asset(`assets/images/${project.image}`)} alt="" loading="lazy" decoding="async" />
                  </span>
                </span>
                <span className="ori-work-title">{pick(project.title)}</span>
                <span className="ori-work-meta">{pick(project.type)}, {project.year}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <details className="ori-index">
        <summary>
          <span className="ori-index-title">{t('origami.allProjects').replace('{count}', projects.length)}</span>
          {immersive && <span className="ori-index-hint">{t('origami.allProjectsHint')}</span>}
        </summary>
        <ul>
          {projects.map((project, index) => (
            <li key={project.id}>
              <button type="button" className="ori-index-item" onClick={() => openProject(index)} aria-haspopup="dialog">
                <span className="ori-index-name">{pick(project.title)}</span>
                <span className="ori-index-meta">{pick(project.type)}, {project.year}</span>
              </button>
            </li>
          ))}
        </ul>
      </details>
    </>
  )
}

export const GamesCartouche = ({ lang }) => {
  const { t } = useI18n()
  return (
    <ul className="ori-works ori-works--wide">
      {games.map((game) => {
        const title = game.title[lang] || game.title.en
        return (
          <li key={game.id}>
            <a
              className="ori-work"
              href={game.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t('games.play')} : ${title} (${t('accessibility.opensNewTab')})`}
            >
              <span className="ori-work-shot">
                <span className="ori-work-mount">
                  <img src={asset(`assets/images/${game.image}`)} alt="" loading="lazy" decoding="async" />
                </span>
              </span>
              <span className="ori-work-title">{title}</span>
              <span className="ori-work-text">{game.description[lang] || game.description.en}</span>
              <span className="ori-work-meta">{game.tech} — {t('games.play')} <span aria-hidden="true">↗</span></span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * `lit` is { key, at } when a figure of the scene was clicked: that quote is
 * brought into view and marked. The key of the figure restarts its flash.
 */
export const TestimonialsCartouche = ({ lit }) => {
  const { t } = useI18n()
  const [letterOpen, setLetterOpen] = useState(false)
  const closeLetter = useCallback(() => setLetterOpen(false), [])
  const litRef = useRef(null)

  useEffect(() => {
    if (!lit) return
    litRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    litRef.current?.focus({ preventScroll: true })
  }, [lit])

  return (
    <>
      <p className="ori-lead">{t('testimonials.intro')}</p>
      {QUOTES.map((key) => {
        const isLit = lit?.key === key
        return (
          <figure
            className={`ori-quote ${isLit ? 'is-lit' : ''}`}
            key={isLit ? `${key}-${lit.at}` : key}
            ref={isLit ? litRef : undefined}
            tabIndex={isLit ? -1 : undefined}
          >
            <blockquote><span className="ori-quote-text">{t(`testimonials.items.${key}.quote`)}</span></blockquote>
            <figcaption>
              <strong>{t(`testimonials.items.${key}.name`)}</strong>, {t(`testimonials.items.${key}.role`)}
            </figcaption>
          </figure>
        )
      })}
      <div className="ori-actions">
        <a className="ori-btn" href={`mailto:${EMAIL}?subject=Let's work together!`}>{t('testimonials.cta')}</a>
        <a className="ori-link" href={asset('assets/documents/CV-20260615-RM.pdf')} download>
          {t('testimonials.cv')} <span aria-hidden="true">↓</span>
        </a>
        <button type="button" className="ori-link" onClick={() => setLetterOpen(true)} aria-haspopup="dialog" aria-expanded={letterOpen}>
          {t('testimonials.coverLetter')} <span aria-hidden="true">↓</span>
        </button>
      </div>
      <CoverLetterModal open={letterOpen} onClose={closeLetter} />
    </>
  )
}

export const ServicesCartouche = ({ onOpenQuote }) => {
  const { t } = useI18n()
  return (
    <>
      <p className="ori-label ori-badge">{t('services.badge')}</p>
      <p className="ori-lead">{t('services.intro')}</p>
      <ul className="ori-offers">
        {SERVICES.map((key) => {
          const title = t(`services.items.${key}.title`)
          const features = t(`services.items.${key}.features`)
          return (
            <li key={key}>
              <article className="ori-offer">
                <h3>{title}</h3>
                <p className="ori-offer-price">
                  <span className="ori-label">{t(`services.items.${key}.priceLabel`)}</span>
                  <strong>{t(`services.items.${key}.price`)}</strong>
                </p>
                <p>{t(`services.items.${key}.description`)}</p>
                <ul className="ori-offer-features">
                  {Array.isArray(features) && features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <button type="button" className="ori-btn" onClick={() => onOpenQuote(key)} aria-label={`${t('services.cta')} : ${title}`}>
                  {t('services.cta')}
                </button>
              </article>
            </li>
          )
        })}
      </ul>
      <p className="ori-note">{t('services.note')}</p>
    </>
  )
}

const PERIODS = [
  { scale: 'monthly', days: 30, label: 'contact.lastMonth', aria: 'contact.lastMonthAria' },
  { scale: 'quarterly', days: 90, label: 'contact.last3Months', aria: 'contact.last3MonthsAria' },
]

export const ContactCartouche = ({ lang, onOpenLegal }) => {
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
      <ul className="ori-contacts">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              {...(link.external
                ? { target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${link.label}: ${link.value} — ${newTab}` }
                : { 'aria-label': `${link.label}: ${link.value}` })}
            >
              <span className="ori-label">{link.label}</span>
              <span className="ori-contact-value">{link.value}</span>
              <span aria-hidden="true">{link.external ? '↗' : '→'}</span>
            </a>
          </li>
        ))}
      </ul>

      <section className="ori-github" aria-labelledby="ori-github-title">
        <header>
          <h3 id="ori-github-title" className="ori-subtitle">{t('contact.githubStats')}</h3>
          <div className="ori-switch" role="group" aria-labelledby="ori-github-title">
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
        {!contributions && !contributionsError && <p className="ori-status">{t('origami.loading')}</p>}
        {contributionsError && <p className="ori-status">{t('origami.githubError')}</p>}

        <h3 className="ori-subtitle">{t('contact.latestActivity')}</h3>
        {loading && <p className="ori-status">{t('origami.loading')}</p>}
        {error && <p className="ori-status">{t('origami.githubError')}</p>}
        {!loading && !error && (
          <ul className="ori-repos">
            {repos.map((repo) => (
              <li key={repo.id}>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" aria-label={`${repo.name} — ${newTab}`}>
                  <span className="ori-repo-name">{repo.name}</span>
                  <time dateTime={repo.updated_at}>{formatDate(repo.updated_at)}</time>
                  {repo.description && <span className="ori-repo-desc">{repo.description}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="ori-legal">
        {['legal', 'terms', 'privacy'].map((tab) => (
          <li key={tab}>
            <button type="button" className="ori-link" onClick={() => onOpenLegal(tab)}>
              {t(`legal.${tab}.short`) || t(`legal.${tab}.tab`)}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

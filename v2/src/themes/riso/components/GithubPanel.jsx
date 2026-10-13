import ContributionGraph from '../../../components/ContributionGraph'
// The graph's own styles live with the neon block that first used it
import '../../../components/GitHubActivity.css'
import { useGitHub } from '../../../hooks/useGitHub'
import { useI18n } from '../../../hooks/useI18n'

const PERIODS = [
  { scale: 'monthly', days: 30, label: 'contact.lastMonth', aria: 'contact.lastMonthAria' },
  { scale: 'quarterly', days: 90, label: 'contact.last3Months', aria: 'contact.last3MonthsAria' },
]

/**
 * GitHub activity for this theme: contribution graph on one side, latest
 * repositories on the other. Same data as the neon block (useGitHub), its own
 * markup and plain-language labels.
 */
const GithubPanel = ({ lang }) => {
  const { t } = useI18n()
  const { repos, loading, error, contributions, contributionsError, graphScale, setGraphScale } = useGitHub()
  const period = PERIODS.find((p) => p.scale === graphScale) ?? PERIODS[0]
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="rz-gh" data-rz-reveal>
      <section className="rz-gh-graph" aria-labelledby="rz-gh-graph-title">
        <header className="rz-gh-head">
          <h3 id="rz-gh-graph-title" className="rz-subtitle">{t('contact.githubStats')}</h3>
          <div className="rz-switch" role="group" aria-labelledby="rz-gh-graph-title">
            {PERIODS.map((p) => (
              <button
                key={p.scale}
                type="button"
                aria-pressed={graphScale === p.scale}
                aria-label={t(p.aria)}
                onClick={() => setGraphScale(p.scale)}
              >
                {t(p.label)}
              </button>
            ))}
          </div>
        </header>
        {contributions && (
          <ContributionGraph
            contributions={contributions}
            days={period.days}
            label={t(period.label)}
            alt={t('contact.githubGraphAlt')}
          />
        )}
        {!contributions && !contributionsError && <p className="rz-gh-status">{t('riso.loading')}</p>}
        {contributionsError && <p className="rz-gh-status">{t('riso.githubError')}</p>}
      </section>

      <section className="rz-gh-repos" aria-labelledby="rz-gh-repos-title">
        <h3 id="rz-gh-repos-title" className="rz-subtitle">{t('contact.latestActivity')}</h3>
        {loading && <p className="rz-gh-status">{t('riso.loading')}</p>}
        {error && <p className="rz-gh-status">{t('riso.githubError')}</p>}
        {!loading && !error && (
          <ul>
            {repos.map((repo) => (
              <li key={repo.id}>
                <a
                  className="rz-repo"
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${repo.name} — ${t('accessibility.opensNewTab')}`}
                >
                  <span className="rz-repo-name">{repo.name}</span>
                  <time className="rz-repo-date" dateTime={repo.updated_at}>{formatDate(repo.updated_at)}</time>
                  {repo.description && <span className="rz-repo-desc">{repo.description}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default GithubPanel

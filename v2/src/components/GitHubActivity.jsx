import { useGitHub } from '../hooks/useGitHub'
import { useI18n } from '../hooks/useI18n'
import './GitHubActivity.css'

const GitHubActivity = () => {
  const { repos, loading, error, graphScale, setGraphScale, getGraphUrl } = useGitHub()
  const { t } = useI18n()

  return (
    <div className="github-activity">
      <div className="github-header">
        <span className="status-dot" />
        <h3>{t('contact.githubActivity')}</h3>
      </div>

      <h4 className="github-section-title">{t('contact.githubStats')}</h4>

      <div className="github-graph-container">
        <div className="graph-controls">
          <button
            className={`graph-scale-btn ${graphScale === 'monthly' ? 'active' : ''}`}
            onClick={() => setGraphScale('monthly')}
            aria-label="Last month view"
          >
            {t('contact.lastMonth')}
          </button>
          <button
            className={`graph-scale-btn ${graphScale === 'quarterly' ? 'active' : ''}`}
            onClick={() => setGraphScale('quarterly')}
            aria-label="Last 3 months view"
          >
            {t('contact.last3Months')}
          </button>
        </div>
        <img
          src={getGraphUrl()}
          alt="GitHub Contribution Graph"
          className="github-activity-graph"
          loading="lazy"
        />
      </div>

      <div className="github-latest-activity">
        <h4>{t('contact.latestActivity')}</h4>
        <div className="repos-list">
          {loading && <p className="loading">{t('contact.loading')}</p>}
          {error && <p className="error">failed_to_load_github_data</p>}
          {!loading && !error && repos.map((repo) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="repo-card cursor-target"
            >
              <div className="repo-top">
                <span className="repo-name">{repo.name.toLowerCase()}</span>
                {repo.stargazers_count >= 4 && (
                  <span className="repo-stars">★ {repo.stargazers_count}</span>
                )}
              </div>
              <p className="repo-desc">{repo.description || 'no description available'}</p>
              <div className="repo-stats">
                <span>updated_at: {new Date(repo.updated_at).toLocaleDateString()}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GitHubActivity

import { useState, useEffect } from 'react'
import { fetchGitHubRepos } from '../utils/github'

const GitHubRepos = ({ username = 'Brize-Glace' }) => {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadRepos = async () => {
      setLoading(true)
      try {
        const data = await fetchGitHubRepos(username, 3)
        setRepos(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadRepos()
  }, [username])

  if (loading) {
    return <p className="loading-text">Loading GitHub repos...</p>
  }

  if (error) {
    return <p className="error">Failed to load GitHub data</p>
  }

  return (
    <div className="github-repos-grid">
      {repos.map((repo) => (
        <a
          key={repo.name}
          href={repo.url}
          target="_blank"
          rel="noreferrer"
          className="repo-card"
        >
          <div className="repo-top">
            <span className="repo-name">{repo.name}</span>
            {repo.stars >= 4 && <span className="repo-stars">★ {repo.stars}</span>}
          </div>
          <p className="repo-desc">{repo.description}</p>
          <div className="repo-stats">
            <span>updated: {repo.updatedAt}</span>
          </div>
        </a>
      ))}
    </div>
  )
}

export default GitHubRepos

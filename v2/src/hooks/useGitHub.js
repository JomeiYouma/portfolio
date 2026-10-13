import { useState, useEffect } from 'react'

const GITHUB_USERNAME = 'JomeiYouma'

// Both endpoints are public and rate-limited per visitor IP (GitHub allows 60
// unauthenticated calls an hour), so answers are kept for the browsing session.
const CACHE_TTL_MS = 60 * 60 * 1000

const readCache = (key) => {
  try {
    const entry = JSON.parse(sessionStorage.getItem(key))
    return entry && Date.now() - entry.at < CACHE_TTL_MS ? entry.data : null
  } catch {
    return null
  }
}

const writeCache = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }))
  } catch {
    // Storage full or blocked: the next visit simply fetches again
  }
}

const fetchCached = async (key, url) => {
  const cached = readCache(key)
  if (cached) return cached
  const response = await fetch(url)
  if (!response.ok) throw new Error('Network error')
  const data = await response.json()
  writeCache(key, data)
  return data
}

export const useGitHub = () => {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [contributions, setContributions] = useState(null)
  const [contributionsError, setContributionsError] = useState(null)
  const [graphScale, setGraphScale] = useState('monthly') // 'monthly' | 'quarterly'

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const data = await fetchCached(
          'github-repos',
          `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=4`
        )
        setRepos(data)
      } catch (err) {
        console.error('GitHub API Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchRepos()
  }, [])

  // Daily contribution counts for the last year, oldest first. The official
  // GitHub API only exposes them through authenticated GraphQL, so this goes
  // through the public proxy used by react-github-calendar.
  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const data = await fetchCached(
          'github-contributions',
          `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`
        )
        if (!Array.isArray(data.contributions)) throw new Error('Unexpected response')
        setContributions(data.contributions)
      } catch (err) {
        console.error('GitHub contributions error:', err)
        setContributionsError(err.message)
      }
    }
    fetchContributions()
  }, [])

  return {
    repos,
    loading,
    error,
    contributions,
    contributionsError,
    graphScale,
    setGraphScale,
    username: GITHUB_USERNAME,
  }
}

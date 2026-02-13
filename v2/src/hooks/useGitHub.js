import { useState, useEffect } from 'react'

const GITHUB_USERNAME = 'JomeiYouma'

export const useGitHub = () => {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [graphScale, setGraphScale] = useState('monthly') // 'monthly' | 'quarterly'

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch(
          `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=4`
        )
        if (!response.ok) throw new Error('Network error')
        const data = await response.json()
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

  const getGraphUrl = () => {
    const days = graphScale === 'monthly' ? 30 : 90
    const title = graphScale === 'monthly' ? 'Last%20Month' : 'Last%203%20Months'
    return `https://github-readme-activity-graph.vercel.app/graph?username=${GITHUB_USERNAME}&theme=react-dark&bg_color=111111&color=24FBC5&line=24FBC5&point=dddddd&area=true&hide_border=true&custom_title=${title}&days=${days}`
  }

  return {
    repos,
    loading,
    error,
    graphScale,
    setGraphScale,
    getGraphUrl,
    username: GITHUB_USERNAME,
  }
}

/**
 * GESTION DE L'API GITHUB
 */

export async function fetchGitHubRepos(username, count = 3) {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=${count}`
    )
    if (!response.ok) throw new Error('Network error')
    const repos = await response.json()
    return repos.map((repo) => ({
      name: repo.name.toLowerCase(),
      description: repo.description || 'no description available',
      stars: repo.stargazers_count,
      updatedAt: new Date(repo.updated_at).toLocaleDateString(),
      url: repo.html_url,
    }))
  } catch (error) {
    console.error('Error fetching GitHub repos:', error)
    return []
  }
}

/**
 * GESTION DE L'API GITHUB
 */

export async function loadGitHubRepos(username) {
    const container = document.getElementById('github-repos');
    if (!container) return;

    try {
        // Récupération des 3 dépôts les plus récemment mis à jour
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=3`);
        
        if (!response.ok) throw new Error('Erreur réseau');
        
        const repos = await response.json();

        container.innerHTML = ''; // On efface le message de chargement

        repos.forEach(repo => {
    const div = document.createElement('div');
    div.className = 'repo-card';
    
    // On crée une variable pour l'étoile : vide si < 4, sinon affiche le span
    const starHTML = repo.stargazers_count >= 4 
        ? `<span>★ ${repo.stargazers_count}</span>` 
        : '';

    div.innerHTML = `
        <div class="repo-top">
            <span class="repo-name">${repo.name.toLowerCase()}</span>
        </div>
        <p class="repo-desc">${repo.description || 'no description available'}</p>
        <div class="repo-stats" style="font-size: 0.7rem; opacity: 0.4; display: flex; gap: 10px;">
            ${starHTML}
            <span>updated_at: ${new Date(repo.updated_at).toLocaleDateString()}</span>
        </div>
    `;
    container.appendChild(div);
});
    } catch (error) {
        console.error("Erreur GitHub:", error);
        container.innerHTML = '<p class="error">failed_to_load_github_data</p>';
    }
}
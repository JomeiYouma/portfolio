export async function loadProjects() {
    try {
        const response = await fetch('projects.json');
        const originalProjects = await response.json();
        const track = document.getElementById('project-track');
        const container = document.querySelector(".container");
        const viewport = document.querySelector('.project-list-viewport');

        // --- CONFIGURATION UNIQUE (Ajuste ici pour ton CSS) ---
        const boxH = 200; // Doit être égal au .project-box { height }
        const gapH = 40;  // Doit être égal au .project-scroll-track { gap }
        const fullStep = boxH + gapH;

        // --- CLONAGE POUR L'INFINI ---
        const projects = [
            ...originalProjects.slice(-3), // Fin au début
            ...originalProjects,           // Originaux
            ...originalProjects.slice(0, 3) // Début à la fin
        ];

        let currentIndex = 3; // On commence au premier "vrai" projet

const scrollToProject = (index, smooth = true) => {
    currentIndex = index;
    
    // Calcul de l'index réel pour les textes
    const realIndex = (index - 3 + originalProjects.length) % originalProjects.length;
    const p = originalProjects[realIndex];

    // Mise à jour des textes (conservée)
    document.getElementById('view-title').textContent = p.title;
    document.getElementById('view-type').textContent = p.type;
    document.getElementById('view-desc').textContent = p.description;
    document.getElementById('view-context').textContent = p.context;
    document.getElementById('view-tech').textContent = p.tech;

    // Calcul de la position exacte
    const viewportH = viewport.offsetHeight;
    const centerOffset = (viewportH / 2) - (boxH / 2);
    const offset = -(index * fullStep) + centerOffset;

    // GESTION DE LA TRANSITION
    if (smooth) {
        track.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
    } else {
        track.style.transition = "none";
    }
    
    track.style.transform = `translateY(${offset}px)`;

    // Mise à jour de la classe active
    const boxes = document.querySelectorAll('.project-box');
    boxes.forEach((box, i) => box.classList.toggle('active', i === index));

    // --- LA TÉLÉPORTATION SANS GLITCH ---
    if (smooth) {
        // On utilise une fonction nommée pour pouvoir la supprimer proprement
        const handleJump = () => {
            track.removeEventListener('transitionend', handleJump);

            let jumpNeeded = false;
            let target = index;

            if (index >= projects.length - 3) {
                target = 3;
                jumpNeeded = true;
            } else if (index <= 2) {
                target = projects.length - 4;
                jumpNeeded = true;
            }

            if (jumpNeeded) {
                // Étape A : Désactiver la transition
                track.style.transition = "none";
                
                // Étape B : Forcer le navigateur à recalculer (Reflow)
                // Lire cette propriété force le rendu immédiat
                void track.offsetWidth; 

                // Étape C : Téléportation
                scrollToProject(target, false);
            }
        };

        track.addEventListener('transitionend', handleJump);
    }
};

        // Génération
        projects.forEach((proj, index) => {
            const box = document.createElement('div');
            box.className = 'project-box';
            box.style.backgroundImage = `url(${proj.image})`;
            box.addEventListener('click', () => scrollToProject(index));
            track.appendChild(box);
        });

        // Init : On attend un peu que le DOM soit rendu pour calculer l'offset de départ
        setTimeout(() => scrollToProject(3, false), 50);

        // Clavier
        window.addEventListener('keydown', (e) => {
            const currentSection = Math.round(container.scrollLeft / window.innerWidth);
            if (currentSection !== 1) return;

            if (e.key === "ArrowDown") scrollToProject(currentIndex + 1);
            if (e.key === "ArrowUp") scrollToProject(currentIndex - 1);
        });

    } catch (error) {
        console.error("Erreur projets:", error);
    }
}
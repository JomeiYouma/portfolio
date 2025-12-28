export async function loadProjects() {
    const track = document.getElementById('project-track'); // J'ai adapté l'ID à ta classe CSS précédente
    const infoContainer = document.querySelector('.project-info');
    const viewport = document.querySelector('.project-list-viewport');
    const container = document.querySelector(".container"); // Pour la gestion des pages globales

    if (!track || !infoContainer || !viewport) return;

    try {
        // 1. FETCH DES DONNÉES
        const response = await fetch('projects.json');
        const originalProjects = await response.json();

        // 2. DÉTECTION MOBILE VS DESKTOP
        if (window.innerWidth <= 1024) {
            initMobile(originalProjects, track, infoContainer, viewport);
        } else {
            initDesktop(originalProjects, track, infoContainer, viewport, container);
        }

        // Recharger la page si on redimensionne pour changer de mode proprement
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                location.reload();
            }, 200);
        });

    } catch (error) {
        console.error("Erreur chargement projets:", error);
        track.innerHTML = '<p style="color:white;">Error loading projects</p>';
    }
}

/* =========================================
   LOGIQUE MOBILE (SCROLL HORIZONTAL NATIF)
   ========================================= */
function initMobile(projects, track, infoContainer, viewport) {
    track.innerHTML = '';
    track.style.transform = 'none'; 
    
    // Génération simple
    projects.forEach((proj) => {
        const box = document.createElement('div');
        box.className = 'project-box';
        box.style.backgroundImage = `url(${proj.image})`;
        track.appendChild(box);
    });

    const boxes = document.querySelectorAll('.project-box');

    // Détection au scroll
    const checkActiveMobile = () => {
        // Le centre de l'écran
        const centerPoint = window.innerWidth / 2;
        let bestCandidate = 0;
        let minDistance = Infinity;

        boxes.forEach((box, index) => {
            const rect = box.getBoundingClientRect();
            // Le centre de la boîte
            const boxCenter = rect.left + rect.width / 2;
            const distance = Math.abs(centerPoint - boxCenter);

            if (distance < minDistance) {
                minDistance = distance;
                bestCandidate = index;
            }
        });

        // Mise à jour visuelle (Classe Active)
        boxes.forEach(b => b.classList.remove('active'));
        if (boxes[bestCandidate]) {
            boxes[bestCandidate].classList.add('active');
            
            // Mise à jour du texte
            // On vérifie si l'index a changé pour éviter de redessiner le texte pour rien
            if (infoContainer.dataset.currentIndex != bestCandidate) {
                const p = projects[bestCandidate];
                infoContainer.innerHTML = `
                    <h2 class="main-title" style="font-size: 2.5rem; margin-bottom: 0.5rem; line-height: 1;">${p.title}</h2>
                    <h3 class="sub-title" style="text-align: left; font-size: 1rem; color: var(--accent-cyan);">${p.type}</h3>
                    <p class="description" style="margin-top: 1rem;">${p.description}</p>
                `;
                infoContainer.dataset.currentIndex = bestCandidate;
            }
        }
    };

    // --- CORRECTION MAJEURE ICI ---
    // On écoute le scroll sur 'track' car c'est lui qui a l'overflow-x maintenant
    track.addEventListener('scroll', checkActiveMobile, { passive: true });
    
    // Appel initial pour afficher le premier projet
    setTimeout(checkActiveMobile, 50);
}
/* =========================================
   LOGIQUE DESKTOP (TON SCRIPT INFINI 3D)
   ========================================= */
function initDesktop(originalProjects, track, infoContainer, viewport, container) {
    // --- CONFIGURATION ---
    const boxH = 200; // Doit correspondre à ton CSS .project-box { height: 200px }
    const gapH = 40;  // Doit correspondre à ton CSS .project-scroll-track { gap: 40px }
    const fullStep = boxH + gapH;

    // --- CLONAGE POUR L'INFINI ---
    const projects = [
        ...originalProjects.slice(-3),
        ...originalProjects,
        ...originalProjects.slice(0, 3)
    ];

    let currentIndex = 3; 

    // Nettoyage
    track.innerHTML = '';

    // Génération des box
    projects.forEach((proj, index) => {
        const box = document.createElement('div');
        box.className = 'project-box';
        box.style.backgroundImage = `url(${proj.image})`;
        // Clic pour scroller vers le projet
        box.addEventListener('click', () => scrollToProject(index));
        track.appendChild(box);
    });

    // --- FONCTION DE SCROLL PRINCIPALE ---
    const scrollToProject = (index, smooth = true) => {
        currentIndex = index;
        
        // Index réel pour les données texte
        const realIndex = (index - 3 + originalProjects.length) % originalProjects.length;
        const p = originalProjects[realIndex];

        // Mise à jour du texte (Adapté à ton HTML existant)
        // On recrée le HTML intérieur pour correspondre à ton design
        infoContainer.style.opacity = 0;
        setTimeout(() => {
            infoContainer.innerHTML = `
                <h2 class="main-title" style="margin-bottom: 0.5rem;">${p.title}</h2>
                <h3 class="sub-title" style="text-align: left; color: var(--accent-cyan); font-size: 1.5rem;">${p.type}</h3>
                <div style="margin-top: 1rem; color: var(--text-gray);">
                    <p style="margin-bottom:0.5rem;">${p.description}</p>
                    <small style="opacity:0.6; display:block;">Context: ${p.context} // Tech: ${p.tech}</small>
                </div>
            `;
            infoContainer.style.opacity = 1;
            infoContainer.style.transition = "opacity 0.3s";
        }, 200);

        // Positionnement Vertical
        const viewportH = viewport.offsetHeight;
        const centerOffset = (viewportH / 2) - (boxH / 2);
        const offset = -(index * fullStep) + centerOffset;

        if (smooth) {
            track.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
        } else {
            track.style.transition = "none";
        }
        
        track.style.transform = `translateY(${offset}px)`;

        // Classe Active
        const boxes = document.querySelectorAll('.project-box');
        boxes.forEach((box, i) => box.classList.toggle('active', i === index));

        // --- TÉLÉPORTATION (BOUCLE INFINIE) ---
        if (smooth) {
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
                    track.style.transition = "none";
                    void track.offsetWidth; // Force Reflow
                    scrollToProject(target, false);
                }
            };
            track.addEventListener('transitionend', handleJump);
        }
    };

    // --- EVENTS DESKTOP ---
    
    // Init (Attendre un petit peu pour le DOM)
    setTimeout(() => scrollToProject(3, false), 50);

    // Clavier (Flèches Haut/Bas)
    window.addEventListener('keydown', (e) => {
        // On vérifie qu'on est bien sur la page WORKS (index 1 horizontalement)
        // Si tu as changé l'ordre des pages, change le "=== 1"
        const currentSection = Math.round(container.scrollLeft / window.innerWidth);
        if (currentSection !== 1) return; 

        if (e.key === "ArrowDown") scrollToProject(currentIndex + 1);
        if (e.key === "ArrowUp") scrollToProject(currentIndex - 1);
    });

    // Support de la molette (Optionnel, pour remplacer le scroll par défaut)
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY > 0) {
            scrollToProject(currentIndex + 1);
        } else {
            scrollToProject(currentIndex - 1);
        }
    }, { passive: false });
}
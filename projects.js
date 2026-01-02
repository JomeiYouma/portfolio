export async function loadProjects() {
    const track = document.getElementById('project-track'); 
    const infoContainer = document.querySelector('.project-info');
    const viewport = document.querySelector('.project-list-viewport');
    const container = document.querySelector(".container"); 

    if (!track || !infoContainer || !viewport) return;

    try {
        const response = await fetch('projects.json');
        const originalProjects = await response.json();

        // DÉTECTION MOBILE VS DESKTOP
        if (window.innerWidth <= 1024) {
            initMobile(originalProjects, track, infoContainer, viewport);
        } else {
            initDesktop(originalProjects, track, infoContainer, viewport, container);
        }

        // Recharger la page si on redimensionne
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
   LOGIQUE MOBILE / TABLETTE (< 1024px)
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

    // 1. Détection Active (inchangé)
    const boxes = document.querySelectorAll('.project-box');
    const checkActiveMobile = () => {
        const centerPoint = window.innerWidth / 2;
        let bestCandidate = 0;
        let minDistance = Infinity;

        boxes.forEach((box, index) => {
            const rect = box.getBoundingClientRect();
            const boxCenter = rect.left + rect.width / 2;
            const distance = Math.abs(centerPoint - boxCenter);

            if (distance < minDistance) {
                minDistance = distance;
                bestCandidate = index;
            }
        });

        boxes.forEach(b => b.classList.remove('active'));
        if (boxes[bestCandidate]) {
            boxes[bestCandidate].classList.add('active');
            
            if (infoContainer.dataset.currentIndex != bestCandidate) {
                const p = projects[bestCandidate];
                infoContainer.innerHTML = `
                    <h2 class="project-title" style="font-size: 2.5rem; margin-bottom: 0.5rem; line-height: 1;">${p.title}</h2>
                    <h3 class="sub-title" style="text-align: left; font-size: 1rem; color: var(--accent-cyan);">${p.type}</h3>
                    <p class="description" style="margin-top: 1rem;">${p.description}</p>
                `;
                infoContainer.dataset.currentIndex = bestCandidate;
            }
        }
    };

    track.addEventListener('scroll', checkActiveMobile, { passive: true });
    setTimeout(checkActiveMobile, 50);

    // 2. LE FIX DU "SCROLL TRAP"
    track.addEventListener('wheel', (e) => {
        // On vérifie si on scrolle verticalement
        if (e.deltaY !== 0) {
            const isGoingDown = e.deltaY > 0;
            const isGoingUp = e.deltaY < 0;
            
            // On calcule si on est au bout du scroll horizontal
            // (Marge de 1px pour éviter les arrondis imprécis)
            const atEnd = Math.ceil(track.scrollLeft + track.clientWidth) >= track.scrollWidth - 1;
            const atStart = track.scrollLeft <= 1;

            // CAS 1 : On veut descendre ET on est déjà tout à droite
            if (isGoingDown && atEnd) {
                return; // ON LAISSE PASSER (La page va scroller)
            }
            
            // CAS 2 : On veut monter ET on est déjà tout à gauche
            if (isGoingUp && atStart) {
                return; // ON LAISSE PASSER (La page va scroller)
            }

            // SINON : On bloque la page et on scroll les projets
            e.preventDefault();
            track.scrollLeft += e.deltaY;
        }
    }, { passive: false });
}
/* =========================================
   LOGIQUE DESKTOP (INFINI 3D + SCROLL TRAP)
   ========================================= */
function initDesktop(originalProjects, track, infoContainer, viewport, container) {
    const boxH = 200; 
    const gapH = 40;  
    const fullStep = boxH + gapH;

    // Clonage pour l'effet infini visuel
    const projects = [
        ...originalProjects.slice(-3),
        ...originalProjects,
        ...originalProjects.slice(0, 3)
    ];

    // DEFINITION DES BORNES POUR LE SCROLL TRAP
    // On commence réellement à l'index 3 (après les 3 clones du début)
    const realStartIndex = 3;
    // On finit à l'index correspondant au dernier vrai projet
    const realEndIndex = 3 + originalProjects.length - 1;

    let currentIndex = 3; 

    track.innerHTML = '';

    projects.forEach((proj, index) => {
        const box = document.createElement('div');
        box.className = 'project-box';
        box.style.backgroundImage = `url(${proj.image})`;
        box.addEventListener('click', () => scrollToProject(index));
        track.appendChild(box);
    });

    const scrollToProject = (index, smooth = true) => {
        currentIndex = index;
        
        const realIndex = (index - 3 + originalProjects.length) % originalProjects.length;
        const p = originalProjects[realIndex];

        infoContainer.style.opacity = 0;
        setTimeout(() => {
            infoContainer.innerHTML = `
                <h2 class="project-title" style="margin-bottom: 0.5rem;">${p.title}</h2>
                <h3 class="sub-title" style="text-align: left; color: var(--accent-cyan); font-size: 1.5rem;">${p.type}</h3>
                <div style="margin-top: 1rem; color: var(--text-gray);">
                    <p style="margin-bottom:0.5rem;">${p.description}</p>
                    <small style="opacity:0.6; display:block;">Context: ${p.context} // Tech: ${p.tech}</small>
                </div>
            `;
            infoContainer.style.opacity = 1;
            infoContainer.style.transition = "opacity 0.3s";
        }, 200);

        const viewportH = viewport.offsetHeight;
        const centerOffset = (viewportH / 2) - (boxH / 2);
        const offset = -(index * fullStep) + centerOffset;

        if (smooth) {
            track.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
        } else {
            track.style.transition = "none";
        }
        
        track.style.transform = `translateY(${offset}px)`;

        const boxes = document.querySelectorAll('.project-box');
        boxes.forEach((box, i) => box.classList.toggle('active', i === index));

        if (smooth) {
            const handleJump = () => {
                track.removeEventListener('transitionend', handleJump);
                let jumpNeeded = false;
                let target = index;

                // Logique de saut infini (seulement si on force via click/clavier hors bornes)
                if (index >= projects.length - 3) {
                    target = 3; 
                    jumpNeeded = true;
                } else if (index <= 2) {
                    target = projects.length - 4; 
                    jumpNeeded = true;
                }

                if (jumpNeeded) {
                    track.style.transition = "none";
                    void track.offsetWidth; 
                    scrollToProject(target, false);
                }
            };
            track.addEventListener('transitionend', handleJump);
        }
    };

    setTimeout(() => scrollToProject(3, false), 50);

    // --- NOUVEAU : GESTION INTELLIGENTE DE LA MOLETTE ---
    viewport.addEventListener('wheel', (e) => {
        // e.preventDefault(); // Pas ici ! On laisse le nav.js gérer le preventDefault globalement, sauf si on capture l'event.
        
        const isGoingDown = e.deltaY > 0;
        const isGoingUp = e.deltaY < 0;

        if (isGoingDown) {
            // Si on n'est PAS ENCORE au dernier projet réel
            if (currentIndex < realEndIndex) {
                e.preventDefault(); // On empêche le scroll page/section
                e.stopPropagation(); // On empêche nav.js de voir l'event
                scrollToProject(currentIndex + 1);
            }
            // Sinon (si on est au dernier), on ne fait RIEN.
            // L'event va "bubbler" jusqu'à window, nav.js le verra et changera de section.
        } 
        else if (isGoingUp) {
            // Si on n'est PAS ENCORE au premier projet réel
            if (currentIndex > realStartIndex) {
                e.preventDefault();
                e.stopPropagation();
                scrollToProject(currentIndex - 1);
            }
            // Sinon (si on est au premier), on laisse passer pour remonter à la section HOME.
        }
    }, { passive: false });

    // Clavier (Flèches Haut/Bas) - Même logique de navigation interne
    window.addEventListener('keydown', (e) => {
        if (!container) return;
        const currentSection = Math.round(container.scrollLeft / window.innerWidth);
        if (currentSection !== 1) return; 

        if (e.key === "ArrowDown") scrollToProject(currentIndex + 1);
        if (e.key === "ArrowUp") scrollToProject(currentIndex - 1);
    });
}
import { getCurrentLanguage } from './i18n.js';

// Store references for updating when language changes
let cachedProjects = null;
let cachedInfoContainer = null;
let cachedCurrentIndex = 0;
let isMobileMode = false;

// Helper function to get translated project field
function getTranslatedField(project, fieldName) {
  const lang = getCurrentLanguage();
  const field = project[fieldName];
  
  // If field is an object with translations, use current language
  if (field && typeof field === 'object' && field[lang]) {
    return field[lang];
  }
  
  // Otherwise return as-is (for tech, context, image, etc.)
  return field;
}

// Export function to update project display when language changes
export function updateProjectDisplay() {
  if (!cachedProjects || !cachedInfoContainer) return;
  
  const currentIndex = parseInt(cachedInfoContainer.dataset.currentIndex || cachedCurrentIndex);
  // In desktop mode, cachedCurrentIndex already contains the real index (not cloned)
  // In mobile mode, currentIndex is the actual array index
  const p = isMobileMode ? cachedProjects[currentIndex] : cachedProjects[cachedCurrentIndex];
  
  if (p) {
    renderProjectInfo(cachedInfoContainer, p);
  }
}

// Helper to render project info with current language
function renderProjectInfo(container, project) {
  const title = getTranslatedField(project, 'title');
  const type = getTranslatedField(project, 'type');
  const description = getTranslatedField(project, 'description');
  const link = project.link;
  
  // Get translated "Access Project" text
  const currentLang = localStorage.getItem('preferred-language') || 'en';
  const accessText = currentLang === 'fr' ? 'Accéder au projet' : 'Access Project';
  
  container.innerHTML = `
    <h2 class="project-title" style="margin-bottom: 0.5rem;">${title}</h2>
    <h3 class="project-sub-title">${type}</h3>

    <p class="project-description">${description}</p>

    <div class="project-details">
        <span class="project-info-title">Context:</span> ${project.context} <br>
        <span class="project-info-title">Skills:</span> ${project.tech}
        ${link && link.trim() !== '' ? `<br><span class="project-info-title">Link:</span> <a href="${link}" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: underline;">${accessText} →</a>` : ''}
    </div>
  `;
}

export async function loadProjects() {
  const track = document.getElementById("project-track");
  const infoContainer = document.querySelector(".project-info");
  const viewport = document.querySelector(".project-list-viewport");
  const container = document.querySelector(".container");

  if (!track || !infoContainer || !viewport) return;

  try {
    const response = await fetch("projects.json");
    const originalProjects = await response.json();
    
    // Store for language updates
    cachedProjects = originalProjects;
    cachedInfoContainer = infoContainer;

    // DÉTECTION MOBILE VS DESKTOP
    if (window.innerWidth <= 1024) {
      isMobileMode = true;
      initMobile(originalProjects, track, infoContainer, viewport);
    } else {
      isMobileMode = false;
      initDesktop(originalProjects, track, infoContainer, viewport, container);
    }

    // Recharger la page si on redimensionne
    let resizeTimer;
    window.addEventListener("resize", () => {
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
  track.innerHTML = "";
  track.style.transform = "none";

  // Génération simple
  projects.forEach((proj, index) => {
    const box = document.createElement("div");
    box.className = "project-box";
    box.style.backgroundImage = `url(${proj.image})`;
    
    // Add click handler to select project
    box.addEventListener('click', () => {
      // Scroll to center this box
      const boxWidth = box.offsetWidth;
      const gap = 20;
      const scrollPos = index * (boxWidth + gap);
      track.scrollTo({ left: scrollPos, behavior: "smooth" });
    });
    
    track.appendChild(box);
  });

  // 1. Détection Active (inchangé)
  const boxes = document.querySelectorAll(".project-box");
  
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

    boxes.forEach((b) => b.classList.remove("active"));
    if (boxes[bestCandidate]) {
      boxes[bestCandidate].classList.add("active");

      if (infoContainer.dataset.currentIndex != bestCandidate) {
        const p = projects[bestCandidate];
        renderProjectInfo(infoContainer, p);
        infoContainer.dataset.currentIndex = bestCandidate;
        cachedCurrentIndex = bestCandidate;
      }
    }
  };

  // 2. LE FIX DU "SCROLL TRAP" - Improved for better mobile experience
  track.addEventListener(
    "wheel",
    (e) => {
      // On vérifie si on scrolle verticalement
      if (e.deltaY !== 0) {
        const isGoingDown = e.deltaY > 0;
        const isGoingUp = e.deltaY < 0;

        // On calcule si on est au bout du scroll horizontal
        const atEnd =
          Math.ceil(track.scrollLeft + track.clientWidth) >=
          track.scrollWidth - 1;
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
    },
    { passive: false }
  );

  // 3. AJOUT DES BOUTONS DE NAVIGATION MOBILE
  const navContainer = document.createElement("div");
  navContainer.className = "project-nav-buttons";
  navContainer.innerHTML = `
    <button class="project-nav-btn" id="prev-project" aria-label="Previous project">‹</button>
    <button class="project-nav-btn" id="next-project" aria-label="Next project">›</button>
  `;
  
  // Insert after project-info
  infoContainer.parentElement.appendChild(navContainer);
  
  const prevBtn = document.getElementById("prev-project");
  const nextBtn = document.getElementById("next-project");
  
  const scrollToIndex = (targetIndex) => {
    const boxWidth = boxes[0].offsetWidth;
    const gap = 20;
    const scrollPos = targetIndex * (boxWidth + gap);
    track.scrollTo({ left: scrollPos, behavior: "smooth" });
  };
  
  prevBtn.addEventListener("click", () => {
    const current = parseInt(infoContainer.dataset.currentIndex || 0);
    if (current > 0) {
      scrollToIndex(current - 1);
    }
  });
  
  nextBtn.addEventListener("click", () => {
    const current = parseInt(infoContainer.dataset.currentIndex || 0);
    if (current < projects.length - 1) {
      scrollToIndex(current + 1);
    }
  });
  
  // Update buttons state
  const updateButtons = () => {
    const current = parseInt(infoContainer.dataset.currentIndex || 0);
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === projects.length - 1;
  };
  
  // Store reference to updateButtons so checkActiveMobile can use it
  track.addEventListener("scroll", () => {
    checkActiveMobile();
    updateButtons();
  }, { passive: true });
  
  setTimeout(() => {
    checkActiveMobile();
    updateButtons();
  }, 50);
}
/* =========================================
   LOGIQUE DESKTOP (INFINI 3D + SCROLL TRAP)
   ========================================= */
function initDesktop(
  originalProjects,
  track,
  infoContainer,
  viewport,
  container
) {
  const boxH = 200;
  const gapH = 40;
  const fullStep = boxH + gapH;

  // Clonage pour l'effet infini visuel
  const projects = [
    ...originalProjects.slice(-3),
    ...originalProjects,
    ...originalProjects.slice(0, 3),
  ];

  // DEFINITION DES BORNES POUR LE SCROLL TRAP
  // On commence réellement à l'index 3 (après les 3 clones du début)
  const realStartIndex = 3;
  // On finit à l'index correspondant au dernier vrai projet
  const realEndIndex = 3 + originalProjects.length - 1;

  let currentIndex = 3;

  track.innerHTML = "";

  projects.forEach((proj, index) => {
    const box = document.createElement("div");
    box.className = "project-box";
    box.style.backgroundImage = `url(${proj.image})`;
    box.addEventListener("click", () => scrollToProject(index));
    track.appendChild(box);
  });

  let scrollToProject = (index, smooth = true) => {
    currentIndex = index;

    const realIndex =
      (index - 3 + originalProjects.length) % originalProjects.length;
    const p = originalProjects[realIndex];

    infoContainer.style.opacity = 0;
    setTimeout(() => {
      renderProjectInfo(infoContainer, p);
      cachedCurrentIndex = realIndex;
      infoContainer.style.opacity = 1;
      infoContainer.style.transition = "opacity 0.3s";
    }, 200);

    const viewportH = viewport.offsetHeight;
    const centerOffset = viewportH / 2 - boxH / 2;
    const offset = -(index * fullStep) + centerOffset;

    if (smooth) {
      track.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
    } else {
      track.style.transition = "none";
    }

    track.style.transform = `translateY(${offset}px)`;

    const boxes = document.querySelectorAll(".project-box");
    boxes.forEach((box, i) => box.classList.toggle("active", i === index));

    if (smooth) {
      const handleJump = () => {
        track.removeEventListener("transitionend", handleJump);
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
      track.addEventListener("transitionend", handleJump);
    }
  };

  setTimeout(() => scrollToProject(3, false), 50);

  // --- NOUVEAU : GESTION INTELLIGENTE DE LA MOLETTE ---
  viewport.addEventListener(
    "wheel",
    (e) => {
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
      } else if (isGoingUp) {
        // Si on n'est PAS ENCORE au premier projet réel
        if (currentIndex > realStartIndex) {
          e.preventDefault();
          e.stopPropagation();
          scrollToProject(currentIndex - 1);
        }
        // Sinon (si on est au premier), on laisse passer pour remonter à la section HOME.
      }
    },
    { passive: false }
  );

  // Clavier (Flèches Haut/Bas) - Même logique de navigation interne
  window.addEventListener("keydown", (e) => {
    if (!container) return;
    const currentSection = Math.round(container.scrollLeft / window.innerWidth);
    if (currentSection !== 1) return;

    if (e.key === "ArrowDown") scrollToProject(currentIndex + 1);
    if (e.key === "ArrowUp") scrollToProject(currentIndex - 1);
  });
  
  // Desktop Arrow Navigation Buttons
  const prevBtnDesktop = document.getElementById("prev-project-desktop");
  const nextBtnDesktop = document.getElementById("next-project-desktop");
  
  if (prevBtnDesktop && nextBtnDesktop) {
    prevBtnDesktop.addEventListener("click", () => {
      if (currentIndex > realStartIndex) {
        scrollToProject(currentIndex - 1);
      }
    });
    
    nextBtnDesktop.addEventListener("click", () => {
      if (currentIndex < realEndIndex) {
        scrollToProject(currentIndex + 1);
      }
    });
    
    // Update button states based on current position
    const updateDesktopButtons = () => {
      prevBtnDesktop.disabled = currentIndex <= realStartIndex;
      nextBtnDesktop.disabled = currentIndex >= realEndIndex;
    };
    
    // Call update initially and after each scroll
    const originalScrollFunc = scrollToProject;
    scrollToProject = (index, smooth = true) => {
      originalScrollFunc(index, smooth);
      setTimeout(updateDesktopButtons, 100);
    };
    
    updateDesktopButtons();
  }
}

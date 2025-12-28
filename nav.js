/**
 * GESTION DE LA NAVIGATION GÉNÉRALE (Menu & Sections)
 */
const container = document.querySelector(".container");
const sections = document.querySelectorAll(".section");
const navItems = document.querySelectorAll(".navigation li");

let isScrolling = false;

// Met à jour l'état actif dans le menu
export const updateActiveNav = () => {
    if (!container) return;

    // --- LOGIQUE DESKTOP (Horizontal) ---
    if (window.innerWidth > 1024) {
        const index = Math.round(container.scrollLeft / window.innerWidth);
        navItems.forEach((item, i) => {
            item.classList.toggle("active", i === index);
        });
    } 
    // --- LOGIQUE MOBILE (Vertical) ---
    else {
        // On repère quelle section est visible au milieu de l'écran
        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            // Si le haut de la section est proche du haut de l'écran
            if (rect.top >= -window.innerHeight / 2 && rect.top < window.innerHeight / 2) {
                navItems.forEach((n) => n.classList.remove("active"));
                navItems[index].classList.add("active");
            }
        });
    }
};

// Scroll au clic sur un élément du menu
navItems.forEach((item, index) => {
    item.addEventListener("click", () => {
        // 1. On bloque le listener de scroll auto
        isScrolling = true;

        // 2. MISE À JOUR MANUELLE IMMÉDIATE
        navItems.forEach((nav) => nav.classList.remove("active"));
        item.classList.add("active");

        // 3. DÉCLENCHEMENT DU SCROLL (Adapté au support)
        if (window.innerWidth > 1024) {
            // Desktop : Scroll Horizontal dans le container
            container.scrollTo({
                left: index * window.innerWidth,
                behavior: "smooth",
            });
        } else {
            // Mobile : Scroll Vertical de la page entière
            const targetSection = sections[index];
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: "smooth"
                });
            }
        }

        // 4. On rend la main au scroll auto après l'animation
        setTimeout(() => {
            isScrolling = false;
        }, 800);
    });
});

// Gestion du scroll à la molette (FORCE LE SCROLL HORIZONTAL SUR DESKTOP)
window.addEventListener("wheel", (e) => {
    // --- MODIFICATION : ON ARRÊTE TOUT SI ON EST SUR MOBILE ---
    // Sur mobile/tablette, on laisse le scroll naturel vertical se faire.
    if (window.innerWidth <= 1024) return;

    const targetIsInsideContainer = e.target.closest(".container");
    if (!targetIsInsideContainer || isScrolling || Math.abs(e.deltaY) < 20) return;

    e.preventDefault(); // Bloque le scroll vertical natif uniquement sur Desktop
    isScrolling = true;

    const currentSectionIndex = Math.round(container.scrollLeft / window.innerWidth);
    const nextSectionIndex = e.deltaY > 0
        ? Math.min(sections.length - 1, currentSectionIndex + 1)
        : Math.max(0, currentSectionIndex - 1);

    container.scrollTo({
        left: nextSectionIndex * window.innerWidth,
        behavior: "smooth",
    });

    setTimeout(() => {
        updateActiveNav();
        isScrolling = false;
    }, 700);
}, { passive: false });

// Écouteurs globaux pour mettre à jour le menu au scroll
// Desktop (C'est le container qui scroll)
container.addEventListener("scroll", () => {
    if (!isScrolling && window.innerWidth > 1024) updateActiveNav();
}, { passive: true });

// Mobile (C'est la fenêtre entière qui scroll)
window.addEventListener("scroll", () => {
    if (!isScrolling && window.innerWidth <= 1024) updateActiveNav();
}, { passive: true });

window.addEventListener("resize", updateActiveNav);
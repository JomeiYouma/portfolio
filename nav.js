/**
 * GESTION DE LA NAVIGATION GÉNÉRALE (Menu & Sections)
 */
const container = document.querySelector(".container");
const sections = document.querySelectorAll(".section");
const navItems = document.querySelectorAll(".navigation li");

let isScrolling = false;

// Met à jour l'état actif dans le menu (le ">" et la couleur blanche)
export const updateActiveNav = () => {
    if (!container) return;
    const index = Math.round(container.scrollLeft / window.innerWidth);
    navItems.forEach((item, i) => {
        item.classList.toggle("active", i === index);
    });
};

// Scroll au clic sur un élément du menu
navItems.forEach((item, index) => {
    item.addEventListener("click", () => {
        // 1. On bloque le listener de scroll
        isScrolling = true;

        // 2. MISE À JOUR MANUELLE IMMÉDIATE
        navItems.forEach((nav) => nav.classList.remove("active"));
        item.classList.add("active");

        // 3. On déclenche le scroll
        container.scrollTo({
            left: index * window.innerWidth,
            behavior: "smooth",
        });

        // 4. On rend la main au scroll auto après l'animation
        setTimeout(() => {
            isScrolling = false;
        }, 800); // Un peu plus long que la durée du smooth scroll
    });
});

// Gestion du scroll à la molette (passage de section en section)
window.addEventListener("wheel", (e) => {
    const targetIsInsideContainer = e.target.closest(".container");
    if (!targetIsInsideContainer || isScrolling || Math.abs(e.deltaY) < 20) return;

    e.preventDefault();
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

// Écouteurs globaux
container.addEventListener("scroll", () => {
    if (!isScrolling) updateActiveNav();
}, { passive: true });

window.addEventListener("resize", updateActiveNav);
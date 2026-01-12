/**
 * Animations au scroll
 * Gère les animations d'apparition des éléments textuels
 */

// Observer pour détecter quand les éléments entrent dans le viewport
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const revealOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            // Une fois révélé, on arrête d'observer cet élément
            revealOnScroll.unobserve(entry.target);
        }
    });
}, observerOptions);

// Initialiser les animations
export function initAnimations() {
    // Sélectionner tous les éléments à animer
    const animatedElements = document.querySelectorAll(
        '.main-title, .description, .sub-title, ' +
        '.project-title, .project-description, ' +
        '.intro-text, .testimonial-item, ' +
        '.about-header, .skills-group, ' +
        '.contact-title, .contact-card, ' +
        '.section-title, h2, h3'
    );
    
    // Ajouter la classe 'animate-on-scroll' à chaque élément
    animatedElements.forEach((el, index) => {
        el.classList.add('animate-on-scroll');
        // Délai progressif pour effet cascade
        el.style.setProperty('--animation-delay', `${index * 0.05}s`);
        revealOnScroll.observe(el);
    });
}

// Initialisation au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
} else {
    initAnimations();
}

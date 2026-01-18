/**
 * Internationalization (i18n) System
 * Manages EN/FR language switching
 */

let translations = {};
let currentLang = 'en'; // Default to English

// Load translations from JSON
async function loadTranslations() {
    try {
        const response = await fetch('data/translations.json');
        translations = await response.json();
        
        // Use stored preference, otherwise default to English
        const storedLang = localStorage.getItem('preferred-language');
        currentLang = storedLang || 'en';
        
        applyTranslations(currentLang);
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

// Apply translations to the page
function applyTranslations(lang) {
    currentLang = lang;
    localStorage.setItem('preferred-language', lang);
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const keys = element.getAttribute('data-i18n').split('.');
        let value = translations[lang];
        
        for (const key of keys) {
            value = value?.[key];
        }
        
        if (value) {
            // Handle different element types
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = value;
            } else {
                element.textContent = value;
            }
        }
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update toggle button state
    updateLangToggle();
    
    // Update project display if projects are loaded
    // Dynamic import to avoid circular dependency
    import('./projects.js').then(module => {
        if (module.updateProjectDisplay) {
            module.updateProjectDisplay();
        }
    }).catch(() => {
        // Projects module might not be loaded yet, that's ok
    });
    
    // Re-initialize tech easter eggs after translations are applied
    setTimeout(() => {
        if (typeof initTechEasterEggs !== 'undefined') {
            initTechEasterEggs();
        }
    }, 100);
}

// Toggle between EN and FR
export function toggleLanguage() {
    const newLang = currentLang === 'en' ? 'fr' : 'en';
    applyTranslations(newLang);
}

// Update language toggle button UI
function updateLangToggle() {
    const toggle = document.querySelector('.lang-toggle');
    if (toggle) {
        // Show the language to switch TO, not current language
        const nextLang = currentLang === 'en' ? 'FR' : 'ENG';
        toggle.textContent = nextLang;
        toggle.setAttribute('aria-label', `Switch to ${currentLang === 'en' ? 'French' : 'English'}`);
    }
}

// Get current language
export function getCurrentLanguage() {
    return currentLang;
}

// Initialize on load
export function initI18n() {
    loadTranslations();
}

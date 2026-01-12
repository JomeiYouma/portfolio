/**
 * Internationalization (i18n) System
 * Manages EN/FR language switching
 */

let translations = {};
let currentLang = 'en';

// Load translations from JSON
async function loadTranslations() {
    try {
        const response = await fetch('translations.json');
        translations = await response.json();
        
        // Detect browser language or use stored preference
        const storedLang = localStorage.getItem('preferred-language');
        const browserLang = navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
        currentLang = storedLang || browserLang;
        
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
        toggle.textContent = currentLang.toUpperCase();
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

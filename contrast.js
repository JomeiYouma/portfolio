/**
 * AAA Contrast Mode System
 * Provides high contrast mode for accessibility (WCAG AAA compliance)
 */

let contrastMode = false;

// Initialize contrast mode from localStorage
export function initContrastMode() {
    const storedMode = localStorage.getItem('contrast-mode');
    contrastMode = storedMode === 'true';
    
    if (contrastMode) {
        applyContrastMode();
    }
    
    updateToggleButton();
}

// Apply AAA contrast mode
function applyContrastMode() {
    document.body.classList.add('aaa-contrast');
}

// Remove AAA contrast mode
function removeContrastMode() {
    document.body.classList.remove('aaa-contrast');
}

// Toggle contrast mode
export function toggleContrastMode() {
    contrastMode = !contrastMode;
    localStorage.setItem('contrast-mode', contrastMode.toString());
    
    if (contrastMode) {
        applyContrastMode();
    } else {
        removeContrastMode();
    }
    
    updateToggleButton();
}

// Update toggle button state
function updateToggleButton() {
    const toggle = document.querySelector('.contrast-toggle');
    if (toggle) {
        toggle.classList.toggle('active', contrastMode);
        toggle.setAttribute('aria-pressed', contrastMode.toString());
        toggle.setAttribute('aria-label', `${contrastMode ? 'Disable' : 'Enable'} high contrast mode`);
    }
}

// Get current contrast mode state
export function isContrastModeActive() {
    return contrastMode;
}

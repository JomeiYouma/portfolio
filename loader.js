/**
 * Loading Screen Handler
 */

function hideLoader() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.classList.add('hidden');
        // Remove from DOM after slide-up transition (800ms)
        setTimeout(() => {
            loader.remove();
        }, 800);
    }
}

// Hide loader when everything is loaded
window.addEventListener('load', () => {
    // Small delay for smoother experience
    setTimeout(hideLoader, 300);
});

// Fallback: hide loader after max 3 seconds
setTimeout(hideLoader, 3000);

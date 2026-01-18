/**
 * Cover Letter - Coming Soon Message
 */

async function initCoverLetterButton() {
    const coverLetterBtn = document.getElementById('cover-letter-btn');
    
    if (!coverLetterBtn) return;
    
    // Load translations
    const translations = await fetch('./translations.json').then(r => r.json());
    
    coverLetterBtn.addEventListener('click', () => {
        // Get current language
        const currentLang = localStorage.getItem('preferred-language') || 'en';
        const t = translations[currentLang].contact;
        
        // Create coming soon message
        const message = document.createElement('div');
        message.className = 'coming-soon-message';
        message.innerHTML = `
            <div class="message-content">
                <h3>${t.comingSoon}</h3>
                <p>${t.coverLetterMessage}</p>
                <button class="close-message">${t.ok}</button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Close button
        const closeBtn = message.querySelector('.close-message');
        closeBtn.addEventListener('click', () => {
            message.classList.add('fade-out');
            setTimeout(() => message.remove(), 300);
        });
        
        // Close on backdrop click
        message.addEventListener('click', (e) => {
            if (e.target === message) {
                message.classList.add('fade-out');
                setTimeout(() => message.remove(), 300);
            }
        });
        
        // Fade in
        setTimeout(() => message.classList.add('show'), 10);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initCoverLetterButton);

// Export
window.initCoverLetterButton = initCoverLetterButton;

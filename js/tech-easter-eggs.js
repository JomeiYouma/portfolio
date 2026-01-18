/**
 * Technology Easter Eggs - Interactive hover effects
 */

const effects = {
    // Languages
    'css': () => {
        // CSS Chaos mode - multiple effects
        document.body.classList.add('css-chaos');
        document.querySelectorAll('.section').forEach((el, i) => {
            el.style.animation = `chaosRotate ${0.5 + i * 0.2}s infinite alternate`;
        });
        document.querySelectorAll('*').forEach(el => {
            if (Math.random() > 0.7) {
                el.style.transform = `rotate(${Math.random() * 10 - 5}deg) scale(${0.95 + Math.random() * 0.1})`;
            }
        });
    },
    'js': () => {
        document.querySelectorAll('.section').forEach(el => {
            el.style.animation = 'shake 0.5s infinite';
        });
    },
    'french': () => {
        const langBtn = document.querySelector('.lang-toggle');
        if (langBtn && langBtn.textContent.trim() === 'FR') {
            langBtn.classList.add('highlight-lang');
        }
    },
    'français': () => effects['french'](),
    
    // Frameworks
    'three': () => {
        document.body.style.transform = 'perspective(1000px) rotateY(10deg)';
        document.body.style.transition = 'transform 0.5s ease';
    },
    'bootstrap': () => {
        const grid = document.createElement('div');
        grid.className = 'bootstrap-grid';
        grid.innerHTML = Array(12).fill('<div class="grid-col"></div>').join('');
        document.body.appendChild(grid);
    },
    'tailwind': () => {
        document.querySelectorAll('*').forEach(el => {
            if (el.style) {
                el.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
            }
        });
    },
    'laravel': () => {
        const route = document.createElement('div');
        route.className = 'laravel-route';
        route.textContent = 'Route: /easter-egg → EasterEggController@show';
        document.body.appendChild(route);
    }
};

const cleanupEffects = {
    'css': () => {
        document.body.classList.remove('css-chaos');
        document.body.style.filter = '';
        document.querySelectorAll('.section').forEach(el => {
            el.style.animation = '';
        });
        document.querySelectorAll('*').forEach(el => {
            el.style.transform = '';
        });
    },
    'js': () => document.querySelectorAll('.section').forEach(el => el.style.animation = ''),
    'french': () => document.querySelector('.lang-toggle')?.classList.remove('highlight-lang'),
    'français': () => cleanupEffects['french'](),
    'three': () => {
        // Bounce-back effect
        document.body.style.transform = 'perspective(1000px) rotateY(-5deg)';
        setTimeout(() => {
            document.body.style.transform = '';
        }, 300);
    },
    'bootstrap': () => document.querySelector('.bootstrap-grid')?.remove(),
    'tailwind': () => document.querySelectorAll('*').forEach(el => el.style.filter = ''),
    'laravel': () => document.querySelector('.laravel-route')?.remove()
};

function initTechEasterEggs() {
    // Clean up existing interactive spans first
    document.querySelectorAll('.tech-interactive').forEach(span => {
        span.replaceWith(span.textContent);
    });
    
    // Find all skill paragraphs
    const skillTexts = document.querySelectorAll('.skills-group p');
    
    skillTexts.forEach(p => {
        const text = p.textContent;
        const techs = text.split('–').map(t => t.trim());
        
        // Replace text with interactive spans
        const newHTML = techs.map(tech => {
            const cleanTech = tech.trim();
            const key = cleanTech.toLowerCase();
            
            // Check for exact match or partial match (e.g., "react js" -> "react")
            const matchKey = Object.keys(effects).find(effectKey => 
                key === effectKey || 
                key.startsWith(effectKey + ' ') ||
                key === effectKey.replace(' ', '')
            );
            
            if (matchKey) {
                return `<span class="tech-interactive" data-tech="${matchKey}">${cleanTech}</span>`;
            }
            return cleanTech;
        }).join(' – ');
        
        p.innerHTML = newHTML;
    });
    
    // Add event listeners
    document.querySelectorAll('.tech-interactive').forEach(span => {
        // Increase clickable zone more
        span.style.padding = '1rem';
        span.style.margin = '-1rem';
        span.style.display = 'inline-block';
        
        span.addEventListener('mouseenter', () => {
            const tech = span.dataset.tech;
            if (effects[tech]) {
                effects[tech]();
            }
        });
        
        span.addEventListener('mouseleave', () => {
            const tech = span.dataset.tech;
            if (cleanupEffects[tech]) {
                cleanupEffects[tech]();
            }
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for translations to be applied first
    setTimeout(initTechEasterEggs, 500);
});

// Export for use by i18n.js
window.initTechEasterEggs = initTechEasterEggs;

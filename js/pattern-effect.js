/**
 * Geometric Pattern Cursor Following Effect
 */

document.addEventListener('DOMContentLoaded', () => {
    const geometricPattern = document.querySelector('.geometric-pattern');
    const patternLines = document.querySelectorAll('.pattern-line');
    const socialLinks = document.querySelectorAll('.social-link');
    
    if (!geometricPattern || !patternLines.length) return;
    
    // Hide pattern when hovering social links
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            geometricPattern.classList.add('hidden');
        });
        
        link.addEventListener('mouseleave', () => {
            geometricPattern.classList.remove('hidden');
        });
    });
    
    // Cursor following effect for the cross (pattern lines)
    document.addEventListener('mousemove', (e) => {
        // Don't apply effect if pattern is hidden
        if (geometricPattern.classList.contains('hidden')) return;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Calculate normalized mouse position (-1 to 1)
        const mouseX = (e.clientX / windowWidth) * 2 - 1;
        const mouseY = (e.clientY / windowHeight) * 2 - 1;
        
        // Apply subtle rotation to the lines based on mouse position
        const rotationX = mouseY * 15; // Max 15 degrees
        const rotationY = mouseX * 15;
        
        patternLines.forEach((line, index) => {
            if (index === 0) {
                // Vertical line
                line.style.transform = `translate(-50%, -50%) rotateZ(${rotationY}deg)`;
            } else {
                // Horizontal line
                line.style.transform = `translate(-50%, -50%) rotateZ(${rotationX}deg)`;
            }
        });
    });
    
    // Reset on mouse leave
    document.addEventListener('mouseleave', () => {
        patternLines.forEach(line => {
            line.style.transform = 'translate(-50%, -50%)';
        });
    });
});

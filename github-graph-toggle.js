/**
 * GitHub Graph Scale Toggle
 */

// Graph URLs with exact cyan color #24FBC5
// Monthly shows last month (30 days), Quarterly shows last 3 months (90 days)
const GRAPH_URLS = {
    monthly: 'https://github-readme-activity-graph.vercel.app/graph?username=JomeiYouma&theme=react-dark&bg_color=111111&color=24FBC5&line=24FBC5&point=dddddd&area=true&hide_border=true&custom_title=Last%20Month&days=30',
    quarterly: 'https://github-readme-activity-graph.vercel.app/graph?username=JomeiYouma&theme=react-dark&bg_color=111111&color=24FBC5&line=24FBC5&point=dddddd&area=true&hide_border=true&custom_title=Last%203%20Months&days=90'
};

function initGraphToggle() {
    const buttons = document.querySelectorAll('.graph-scale-btn');
    const graphImg = document.getElementById('github-contribution-graph');
    
    if (!graphImg || buttons.length === 0) return;
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            buttons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Get scale and update graph
            const scale = btn.dataset.scale;
            graphImg.src = GRAPH_URLS[scale];
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initGraphToggle);

// Export for potential external use
window.initGraphToggle = initGraphToggle;

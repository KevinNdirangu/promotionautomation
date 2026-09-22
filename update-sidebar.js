const fs = require('fs');

const files = [
    'dashboard.html',
    'nominal-roll.html',
    'applications-vetting.html',
    'panel-scoring.html',
    'merit-rankings.html',
    'rc-dashboard.html',
    'rc-stations-scores.html',
    'regional-boards.html',
    'regional-scoring.html',
    'final-scores.html'
];

for (const file of files) {
    let html = fs.readFileSync('src/' + file, 'utf8');
    
    // Replace the old regional section with the new regional section
    const oldMenuPattern = /<div style="margin-top: 15px; font-size: 11px; text-transform: uppercase; color: var\(--text-muted\); padding-left: 20px; font-weight: 700;">Regional Command Group<\/div>\s*<ul>\s*<li><a class="nav-link" href="rc-stations-scores\.html">[^<]+<\/a><\/li>\s*<li><a class="nav-link" href="regional-boards\.html">[^<]+<\/a><\/li>\s*<li><a class="nav-link" href="final-scores\.html">[^<]+<\/a><\/li>\s*<\/ul>/i;
    
    // A simpler approach: find where the station step 4 ends, and replace down to final-scores.html
    const step4Idx = html.indexOf('href="merit-rankings.html"');
    if (step4Idx !== -1) {
        const liEnd = html.indexOf('</li>', step4Idx) + 5;
        
        // Find the end of final-scores.html
        const finalScoresIdx = html.indexOf('href="final-scores.html"');
        const finalScoresEnd = html.indexOf('</li>', finalScoresIdx) + 5;
        
        if (finalScoresIdx !== -1) {
            const before = html.substring(0, liEnd);
            const after = html.substring(finalScoresEnd);
            
            const newSidebar = `
      <div style="margin-top: 15px; font-size: 11px; text-transform: uppercase; color: var(--text-muted); padding-left: 20px; font-weight: 700;">Regional Command Group</div>
      <ul style="margin-top: 5px;">
        <li><a class="nav-link" href="rc-dashboard.html">📊 Regional Dashboard</a></li>
        <li><a class="nav-link" href="rc-stations-scores.html">📥 1. Receive Station Results</a></li>
        <li><a class="nav-link" href="regional-boards.html">🎯 2. Board Selection & Cut-offs</a></li>
        <li><a class="nav-link" href="regional-scoring.html">⚖️ 3. Panel Interview Scoring</a></li>
        <li><a class="nav-link" href="final-scores.html">🏆 4. Final Merit & Details</a></li>
      </ul>`;
      
            html = before + newSidebar + after;
        }
    }
    
    // Set active link
    html = html.replace(/class="nav-link\s*active"/g, 'class="nav-link"');
    html = html.replace(new RegExp(`href="${file}"`), `class="nav-link active" href="${file}"`);
    
    fs.writeFileSync('src/' + file, html);
    console.log('Updated sidebar in', file);
}

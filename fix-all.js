const fs = require('fs');

// Read the perfectly fixed panel-scoring.html to get topShell and bottomShell
const panelScoring = fs.readFileSync('src/panel-scoring.html', 'utf8');
const scoringSectionIdx = panelScoring.indexOf('<section id="scoring-page"');
const scoringEndIdx = panelScoring.indexOf('</section>\n', scoringSectionIdx) + '</section>\n'.length;

const topShell = panelScoring.substring(0, scoringSectionIdx);
const bottomShell = panelScoring.substring(scoringEndIdx);

// We need to fetch the sections for the other pages from dashboard.html.recovered
const recovered = fs.readFileSync('src/dashboard.html.recovered', 'utf8');

const getSection = (id) => {
    const start = recovered.indexOf(`<section id="${id}"`);
    if (start === -1) return null;
    let end = recovered.indexOf('<section id="', start + 1);
    if (end === -1) {
        end = recovered.indexOf('</section>', start) + '</section>'.length;
    }
    let html = recovered.substring(start, end);
    html = html.replace(/class="page-view"/, 'class="page-view active"');
    // For welcome-page, replace navigateTo with window.location.href
    if (id === 'welcome-page') {
        html = html
            .replace("onclick=\"navigateTo('nominal-page', document.querySelectorAll('.nav-link')[1])\"", "onclick=\"window.location.href='nominal-roll.html'\"")
            .replace("onclick=\"navigateTo('applications-page', document.querySelectorAll('.nav-link')[2])\"", "onclick=\"window.location.href='applications-vetting.html'\"")
            .replace("onclick=\"navigateTo('scoring-page', document.querySelectorAll('.nav-link')[3])\"", "onclick=\"window.location.href='panel-scoring.html'\"")
            .replace("onclick=\"navigateTo('reports-page', document.querySelectorAll('.nav-link')[4])\"", "onclick=\"window.location.href='merit-rankings.html'\"");
    }
    return html;
};

// Custom extraction for merit-rankings since reports-page was manually recreated
const meritRankingsFile = fs.readFileSync('src/merit-rankings.html', 'utf8');
const reportsStart = meritRankingsFile.indexOf('<section id="reports-page"');
const reportsEnd = meritRankingsFile.indexOf('</section>', reportsStart) + '</section>'.length;
const reportsPageHTML = meritRankingsFile.substring(reportsStart, reportsEnd);

const pages = [
    { id: 'welcome-page', file: 'dashboard.html' },
    { id: 'nominal-page', file: 'nominal-roll.html' },
    { id: 'applications-page', file: 'applications-vetting.html' },
    { id: 'reports-page', file: 'merit-rankings.html' },
    { id: 'rc-stations-page', file: 'rc-stations-scores.html' },
    { id: 'regional-boards-page', file: 'regional-boards.html' },
    { id: 'final-scores-page', file: 'final-scores.html' }
];

for (const page of pages) {
    let sectionHTML = '';
    if (page.id === 'reports-page') {
        sectionHTML = reportsPageHTML;
    } else {
        sectionHTML = getSection(page.id);
    }
    
    // Customize topShell's nav active link
    let customTopShell = topShell.replace('class="nav-link active" href="panel-scoring.html"', 'class="nav-link" href="panel-scoring.html"');
    let linkHref = page.file;
    if (page.id === 'welcome-page') linkHref = 'dashboard.html';
    customTopShell = customTopShell.replace(`href="${linkHref}"`, `class="nav-link active" href="${linkHref}"`);

    fs.writeFileSync('src/' + page.file, customTopShell + sectionHTML + bottomShell);
    console.log('Fixed', page.file);
}

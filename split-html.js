const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const dashboardHtml = fs.readFileSync(path.join(srcDir, 'dashboard.html'), 'utf8');

// The file has a <main class="main-content"> ... <div class="content-area"> ... sections ... modals ...
// We need to extract the parts:
// 1. Top Shell (up to <div class="content-area">)
// 2. The Sections (each <section id="...">...</section>)
// 3. The Bottom Shell (after the last section, which contains modals and script tags)

const contentAreaIndex = dashboardHtml.indexOf('<div class="content-viewport">');
if (contentAreaIndex === -1) throw new Error("Could not find content-viewport");
let topShell = dashboardHtml.substring(0, contentAreaIndex + '<div class="content-viewport">'.length);

// Fix the "Welcome Dashboard" link in the sidebar
topShell = topShell.replace('href="dashboard.html?page=welcome-page"', 'href="dashboard.html"');

const pages = [
  { id: 'welcome-page', file: 'dashboard.html' },
  { id: 'nominal-page', file: 'nominal-roll.html' },
  { id: 'applications-page', file: 'applications-vetting.html' },
  { id: 'scoring-page', file: 'panel-scoring.html' },
  { id: 'reports-page', file: 'merit-rankings.html' },
  { id: 'rc-stations-page', file: 'rc-stations-scores.html' },
  { id: 'regional-boards-page', file: 'regional-boards.html' },
  { id: 'final-scores-page', file: 'final-scores.html' }
];

let remainingHtml = dashboardHtml.substring(contentAreaIndex + '<div class="content-viewport">'.length);

const sections = {};
let lastSectionEnd = 0;

for (const page of pages) {
  const sectionStart = remainingHtml.indexOf(`<section id="${page.id}"`);
  if (sectionStart === -1) {
      console.warn(`Warning: Could not find section ${page.id}`);
      if (page.id === 'reports-page') {
          // Recreate the missing reports-page section
          sections[page.id] = `
      <section id="reports-page" class="page-view active">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
          <div>
            <h2 class="section-title">Reports & Merit Rankings</h2>
            <p class="section-desc">Generate merit ranking reports and view candidates.</p>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-secondary no-print" onclick="exportReportCandidates()">Export to Word</button>
            <button class="btn btn-outline no-print" onclick="window.print()">Print</button>
          </div>
        </div>

        <div class="card no-print">
          <div style="display:flex;gap:14px;align-items:center;">
            <label class="form-label" style="margin:0;">Import Qualified Files:</label>
            <input id="reportQualifiedFileInput" type="file" accept=".xlsx,.xls" multiple class="form-control" style="width:240px;">
            <button class="btn" onclick="handleImportQualifiedReport()">Import</button>
            <label class="form-label" style="margin:0;margin-left:auto;">Target Rank:</label>
            <select id="reportsRankFilter" class="form-control" style="width:160px;">
              <option value="ALL">All Ranks</option>
            </select>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <h3 id="reportTitleHeader" style="margin:0;font-size:16px;">Merit Ranking</h3>
            <span id="reportsStationBadge" class="badge">Station</span>
            <span id="reportTitleStation" style="color:var(--text-muted);font-weight:600;font-size:14px;"></span>
          </div>
          <div id="reportTableTopScroll" class="application-table-scroll"><div id="reportTableTopScrollInner" class="application-table-scroll-inner"></div></div>
          <div id="reportTableContainer" class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width:50px;">Serial</th>
                  <th>PF No</th>
                  <th>Name</th>
                  <th>Current Rank</th>
                  <th>Section</th>
                  <th>Station</th>
                  <th>Target Rank</th>
                  <th style="text-align:center;">Total Score</th>
                </tr>
              </thead>
              <tbody id="meritRankingsBody">
                <tr><td colspan="8" style="text-align:center;color:var(--text-muted);">No data available.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>`;
      } else {
          sections[page.id] = '';
      }
      continue;
  }
  
  // Find the end of this section (the next section start, or the end of the sections)
  let sectionEnd = remainingHtml.indexOf('<section id="', sectionStart + 1);
  if (sectionEnd === -1) {
      // Find the first modal-overlay which marks the start of the bottom shell
      sectionEnd = remainingHtml.indexOf('<div id="stationModal"');
      if (sectionEnd === -1) {
          sectionEnd = remainingHtml.indexOf('<div class="modal-overlay"');
      }
  }
  
  const sectionHtml = remainingHtml.substring(sectionStart, sectionEnd);
  // Ensure the section is visible by adding active class if not present
  sections[page.id] = sectionHtml.replace(/class="page-view"/, 'class="page-view active"');
  
  if (sectionEnd > lastSectionEnd) {
      lastSectionEnd = sectionEnd;
  }
}

const bottomShell = remainingHtml.substring(lastSectionEnd);

// Generate each file
for (const page of pages) {
  // We should also set the active nav-link in the topShell
  let customTopShell = topShell.replace('class="nav-link active"', 'class="nav-link"'); // clear current active
  
  // Now add active to the current page's link
  let linkHref = page.file;
  if (page.id === 'welcome-page') linkHref = 'dashboard.html';
  customTopShell = customTopShell.replace(`href="${linkHref}"`, `class="nav-link active" href="${linkHref}"`);
  
  // Fix welcome-page cards onclick to point to new URLs
  if (page.id === 'welcome-page') {
      sections[page.id] = sections[page.id]
        .replace("onclick=\"navigateTo('nominal-page', document.querySelectorAll('.nav-link')[1])\"", "onclick=\"window.location.href='nominal-roll.html'\"")
        .replace("onclick=\"navigateTo('applications-page', document.querySelectorAll('.nav-link')[2])\"", "onclick=\"window.location.href='applications-vetting.html'\"")
        .replace("onclick=\"navigateTo('scoring-page', document.querySelectorAll('.nav-link')[3])\"", "onclick=\"window.location.href='panel-scoring.html'\"")
        .replace("onclick=\"navigateTo('reports-page', document.querySelectorAll('.nav-link')[4])\"", "onclick=\"window.location.href='merit-rankings.html'\"");
  }

  const fileContent = customTopShell + '\n' + sections[page.id] + '\n' + bottomShell;
  fs.writeFileSync(path.join(srcDir, page.file), fileContent);
  console.log(`Wrote ${page.file}`);
}

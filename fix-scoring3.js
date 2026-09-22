const fs = require('fs');

const dashboard = fs.readFileSync('src/dashboard.html', 'utf8');

// The top shell ends after <div class="content-viewport">
const contentViewportIdx = dashboard.indexOf('<div class="content-viewport">');
let topShell = dashboard.substring(0, contentViewportIdx + '<div class="content-viewport">'.length);

topShell = topShell.replace('class="nav-link active" href="dashboard.html"', 'class="nav-link" href="dashboard.html"');
topShell = topShell.replace('href="panel-scoring.html"', 'class="nav-link active" href="panel-scoring.html"');

const scoringPage = `
      <section id="scoring-page" class="page-view active">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <h2 class="section-title">Step 3: Panel Interview Scoresheet</h2>
            <p class="section-desc">Grade candidates during the promotion board interviews across standard evaluation criteria.</p>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-secondary no-print" onclick="openScoringTemplateModal()">Edit Score Sheet</button>
            <button class="btn btn-secondary no-print" onclick="exportScoreSheets('candidate')">Export Candidate to Word</button>
            <button class="btn btn-secondary no-print" onclick="exportScoreSheets('rank')">Export Rank to Word</button>
            <button class="btn btn-secondary no-print" onclick="exportScoreSheets('all')">Export All to Word</button>
            <button class="btn btn-outline no-print" onclick="window.print()">Print Blank / Completed Scoresheet</button>
          </div>
        </div>

        <!-- Candidate Selection Header -->
        <div class="card no-print">
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px; align-items: end;">
            <div>
              <label class="form-label">1. Select Rank Interviewed For:</label>
              <select id="scoringRankSelect" class="form-control" onchange="loadScoringCandidates()">
                <option value="CPL">Corporal (CPL)</option>
                <option value="SGT">Sergeant (SGT)</option>
                <option value="S/SGT">Senior Sergeant (S/SGT)</option>
                <option value="IP">Inspector (IP)</option>
                <option value="CIP">Chief Inspector (CIP)</option>
                <option value="ASP">ASP</option>
                <option value="SP">SP</option>
                <option value="SSP">SSP</option>
                <option value="CP">CP</option>
                <option value="ACGP">ACGP</option>
                <option value="SACGP">SACGP</option>
                <option value="DCGP">DCGP</option>
                <option value="CGP">CGP</option>
              </select>
            </div>
            <div>
              <label class="form-label">2. Select Qualified Candidate:</label>
              <select id="scoringCandidateSelect" class="form-control" onchange="loadCandidateScoreForm()">
                <option value="">-- Choose Candidate to Score --</option>
              </select>
            </div>
          </div>
        </div>

        <div id="scoringEmptyPrompt" style="padding:40px;text-align:center;color:var(--text-muted);">
          Please select a candidate to view their score sheet.
        </div>

        <div id="scoringFormContainer" style="display: none;">
          <div class="card" style="background: #f8fafc; border-left: 5px solid var(--accent);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
              <div><span style="font-size: 11.5px; color: var(--text-muted); text-transform: uppercase;">PF Number:</span><div id="scorePfDisplay" style="font-size: 16px; font-weight: 700;">--</div></div>
              <div><span style="font-size: 11.5px; color: var(--text-muted); text-transform: uppercase;">Officer Name:</span><div id="scoreNameDisplay" style="font-size: 16px; font-weight: 700;">--</div></div>
              <div><span style="font-size: 11.5px; color: var(--text-muted); text-transform: uppercase;">Current Rank & Station:</span><div id="scoreRankStationDisplay" style="font-size: 14px; font-weight: 600;">--</div></div>
              <div><span style="font-size: 11.5px; color: var(--text-muted); text-transform: uppercase;">Interview For:</span><div id="scoreTargetRankDisplay" style="font-size: 15px; font-weight: 700; color: var(--accent);">--</div></div>
              <div><span style="font-size: 11.5px; color: var(--text-muted); text-transform: uppercase;">Section Deployed:</span><div id="scoreSectionDisplay" style="font-size:14px;font-weight:600;">--</div></div>
              <div><span style="font-size: 11.5px; color: var(--text-muted); text-transform: uppercase;">Gender:</span><div id="scoreGenderDisplay" style="font-size:14px;font-weight:600;">--</div></div>
              <div><span style="font-size: 11.5px; color: var(--text-muted); text-transform: uppercase;">Ethnicity:</span><div id="scoreEthnicityDisplay" style="font-size:14px;font-weight:600;">--</div></div>
            </div>
          </div>

          <div class="card">
            <h3 style="font-size: 16px; margin-bottom: 14px;">Interview Rubric Matrix</h3>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px;">S/NO</th>
                    <th>VARIABLE</th>
                    <th style="width: 130px; text-align: center;">MARKS</th>
                    <th style="width: 160px; text-align: center;">MARKS AWARDED</th>
                  </tr>
                </thead>
                <tbody>
                  ${['education', 'service', 'turnout', 'knowledge', 'current_affairs', 'clean_record', 'commendations'].map((key, i) => `
                  <tr>
                    <td><strong>${i + 1}</strong></td>
                    <td>
                      <strong id="score_label_${key}" style="text-transform: uppercase;">VARIABLE</strong>
                    </td>
                    <td id="score_max_${key}" style="text-align: center; font-weight: 600;"></td>
                    <td style="text-align: center;">
                      <input type="number" id="score_${key}" class="form-control no-print" style="text-align: center; font-weight: 700;" min="0" step="0.5" value="" oninput="calculateLiveTotal()">
                    </td>
                  </tr>`).join('')}
                  <tr>
                    <td colspan="2" style="text-align: right; font-weight: 700; font-size: 16px;">TOTAL MARKS 100%</td>
                    <td id="scoreMaxTotalDisplay" style="text-align: center; font-weight: 700; font-size: 16px; color: var(--accent);"></td>
                    <td id="scoreLiveTotalDisplay" style="text-align: center; font-weight: 700; font-size: 18px; color: #16a34a;"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="margin-top: 20px;" class="no-print">
              <h4 style="font-size: 14px; margin-bottom: 8px;">Panel Remarks</h4>
              <textarea id="scoreRemarksInput" class="form-control" rows="3" placeholder="Enter remarks..."></textarea>
            </div>
            
            <div style="margin-top: 20px;">
              <h4 style="font-size: 14px; margin-bottom: 8px;">APPENDIX 01: EDUCATION</h4>
              <div id="educationAppendixDisplay" style="font-size: 13px; color: #333; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;"></div>
            </div>
            
            <div style="margin-top: 20px;">
              <h4 style="font-size: 14px; margin-bottom: 8px;">APPENDIX 02: LENGTH OF SERVICE</h4>
              <div id="serviceAppendixDisplay" style="font-size: 13px; color: #333;"></div>
            </div>

            <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div><strong>CHAIRMAN SIGNATURE: ____________________</strong></div>
                <div><strong>DATE: ____________________</strong></div>
                <div><strong>MEMBER SIGNATURE: ____________________</strong></div>
                <div><strong>DATE: ____________________</strong></div>
                <div><strong>MEMBER SIGNATURE: ____________________</strong></div>
                <div><strong>DATE: ____________________</strong></div>
                <div><strong>MEMBER SIGNATURE: ____________________</strong></div>
                <div><strong>DATE: ____________________</strong></div>
            </div>

            <div class="no-print" style="display: flex; justify-content: flex-end; align-items: center; gap: 14px; margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
              <span id="scoreSaveStatus" style="font-weight: 600;"></span>
              <button class="btn btn-success" onclick="handleSaveCandidateScore()" style="font-size: 15px; padding: 10px 24px;">Save Score & Remarks</button>
            </div>
          </div>
        </div>
      </section>
`;

// Build the bottom shell correctly
// We want to skip all sections in dashboard.html and just get the modals
// The modals start at <div id="stationModal"
let bottomShellIdx = dashboard.indexOf('<div id="stationModal"');
if (bottomShellIdx === -1) {
    bottomShellIdx = dashboard.indexOf('<!-- Station Settings Modal -->');
}
if (bottomShellIdx === -1) {
    bottomShellIdx = dashboard.indexOf('<div id="editApplicationModal"'); // fallback
}

let bottomShell = dashboard.substring(bottomShellIdx);
// Add the closing tags that are missing before the modals!
bottomShell = '    </div>\n  </main>\n\n' + bottomShell;

fs.writeFileSync('src/panel-scoring.html', topShell + '\n' + scoringPage + '\n' + bottomShell);
console.log('Fixed panel-scoring.html for real!');

const fs = require('fs');

const recovered = fs.readFileSync('src/dashboard.html.recovered', 'utf8');
const missing = fs.readFileSync('missing.html', 'utf8');

const getModal = (source, idStr) => {
    const start = source.indexOf(`<div id="${idStr}" class="modal-overlay">`);
    let end = source.indexOf('</div>\n  </div>', start) + '</div>\n  </div>'.length;
    // special case if end doesn't match precisely
    if (idStr === 'editCandidateModal') {
        end = source.indexOf('</div>\n</div>', start) + '</div>\n</div>'.length;
    }
    // ensure we got the whole modal (closing tags can be tricky)
    if (idStr === 'nominalApplicantModal') end = start + 980; // approximate length if parsing fails
    if (idStr === 'editApplicationModal') end = start + 1800;
    
    // Actually let's just use substring up to the next modal or EOF
    const nextModal = source.indexOf('<div id="', start + 10);
    if (nextModal !== -1) {
        return source.substring(start, nextModal);
    }
    return source.substring(start); // to the end
};

// We will just hardcode them to be perfectly sure they are right and not truncated
const missingModalsStr = `
  <div id="nominalApplicantModal" class="modal-overlay">
    <div class="modal-box" style="max-width: 900px; max-height: 88vh;">
      <div class="modal-header">
        <h3 class="modal-title">Select Officers Who Applied</h3>
        <button class="modal-close" onclick="closeNominalApplicantSelector()">x</button>
      </div>
      <p class="section-desc">Tick every officer who submitted an application. Only selected officers will appear in Step 2.</p>
      <input id="nominalApplicantSearch" class="form-control" placeholder="Search PF number, name, or rank..." style="margin:14px 0;" oninput="filterNominalApplicantChoices()">
      <div id="nominalApplicantChoices" style="max-height:52vh; overflow:auto; border:1px solid var(--border); border-radius:6px;"></div>
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
        <button class="btn btn-secondary" onclick="closeNominalApplicantSelector()">Cancel</button>
        <button class="btn btn-success" onclick="saveNominalApplicantSelection()">Add Selected Applicants</button>
      </div>
    </div>
  </div>

  <div id="editCandidateModal" class="modal-overlay">
    <div class="modal-box" style="width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title">Edit Candidate Details</h3>
        <button class="modal-close" onclick="closeEditCandidateModal()">x</button>
      </div>
      <input type="hidden" id="edit_candidate_pf">
      <div class="form-group">
        <label class="form-label">Candidate Name:</label>
        <input type="text" id="edit_candidate_name" class="form-control">
      </div>
      <div class="form-group">
        <label class="form-label">Rank Applied For:</label>
        <select id="edit_candidate_rank" class="form-control">
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
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
        <button class="btn btn-outline" onclick="closeEditCandidateModal()">Cancel</button>
        <button class="btn btn-success" onclick="saveEditedCandidate()">Save Changes</button>
      </div>
    </div>
  </div>

  <div id="appModal" class="modal-overlay">
    <div class="modal-box" style="width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title">Edit Application Record</h3>
        <button class="modal-close" onclick="closeAppModal()">x</button>
      </div>
      <input type="hidden" id="app_pf">
      <div class="form-group">
        <label class="form-label">Date of Last Promotion (PC: N/A):</label>
        <input type="date" id="app_last_promotion_date" class="form-control">
      </div>
      <div class="form-group">
        <label class="form-label">Date of Last Offence (if any):</label>
        <input type="date" id="app_last_offence_date" class="form-control">
      </div>
      <p style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 14px;">
        * Note: Offences within the last 3 years will automatically flag candidate with 0 marks for clean record conduct.
      </p>
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn btn-outline" onclick="closeAppModal()">Cancel</button>
        <button class="btn btn-success" onclick="saveNewApplication()">Save Application</button>
      </div>
    </div>
  </div>

  <div id="editApplicationModal" class="modal-overlay">
    <div class="modal-box" style="max-width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title">Edit Application Target Rank</h3>
        <button class="modal-close" onclick="closeEditApplicationModal()">x</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="edit_app_pf">
        
        <div class="form-group">
          <label class="form-label">Target Rank (Applied For):</label>
          <select id="edit_app_target_rank" class="form-control">
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
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top:20px;">
          <button class="btn btn-outline" onclick="closeEditApplicationModal()">Cancel</button>
          <button class="btn btn-success" onclick="saveEditedApplication()">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
`;

const files = [
    'dashboard.html',
    'nominal-roll.html',
    'applications-vetting.html',
    'panel-scoring.html',
    'merit-rankings.html',
    'rc-stations-scores.html',
    'regional-boards.html',
    'final-scores.html'
];

for (const file of files) {
    let html = fs.readFileSync('src/' + file, 'utf8');
    if (!html.includes('id="nominalApplicantModal"')) {
        html = html.replace('<script src="renderer.js"></script>', missingModalsStr + '\n  <script src="renderer.js"></script>');
        fs.writeFileSync('src/' + file, html);
        console.log('Injected missing modals into', file);
    }
}

const fs = require('fs');

const missingModals = `
  <!-- Station Settings Modal -->
  <div id="stationModal" class="modal-overlay">
    <div class="modal-box" style="width: 400px;">
      <div class="modal-header">
        <h3 class="modal-title">Set Station Name</h3>
        <button class="modal-close" onclick="closeStationModal()">x</button>
      </div>
      <p class="section-desc">Set the name of the current station. This will appear on reports and exported documents.</p>
      <input id="stationModalInput" type="text" class="form-control" placeholder="e.g. EMBU MAIN PRISON" style="margin: 15px 0;">
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn btn-secondary" onclick="closeStationModal()">Cancel</button>
        <button class="btn btn-success" onclick="saveStation()">Save</button>
      </div>
    </div>
  </div>

  <!-- Add/Edit Officer Modal -->
  <div id="officerModal" class="modal-overlay">
    <div class="modal-box" style="width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title" id="officerModalTitle">Add Officer</h3>
        <button class="modal-close" onclick="closeOfficerModal()">x</button>
      </div>
      <form id="officerForm">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">PF Number *</label>
            <input type="text" id="off_pf_no" class="form-control" required>
          </div>
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="off_name" class="form-control" required>
          </div>
          <div class="form-group">
            <label class="form-label">Current Rank *</label>
            <select id="off_current_rank" class="form-control" required>
                <option value="PC">PC</option>
                <option value="CPL">CPL</option>
                <option value="SGT">SGT</option>
                <option value="S/SGT">S/SGT</option>
                <option value="IP">IP</option>
                <option value="CIP">CIP</option>
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
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select id="off_gender" class="form-control">
              <option value="">--Select--</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ethnicity</label>
            <input type="text" id="off_ethnicity" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Year of Birth</label>
            <input type="number" id="off_year_of_birth" class="form-control" min="1900" max="2100">
          </div>
          <div class="form-group">
            <label class="form-label">Academic Qualification</label>
            <input type="text" id="off_academic_qualification" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Professional Qualification</label>
            <input type="text" id="off_professional_qualification" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Date of Enlistment</label>
            <input type="date" id="off_date_of_enlistment" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Date Posted to Station</label>
            <input type="date" id="off_date_posted" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Section Deployed</label>
            <input type="text" id="off_section_deployed" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Home County</label>
            <input type="text" id="off_home_county" class="form-control">
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px;">
          <button type="button" class="btn btn-outline" onclick="closeOfficerModal()">Cancel</button>
          <button type="submit" class="btn btn-success">Save Officer</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Nominal Roll Columns Modal -->
  <div id="nominalColumnsModal" class="modal-overlay">
    <div class="modal-box" style="width: 400px;">
      <div class="modal-header">
        <h3 class="modal-title">Customize Columns</h3>
        <button class="modal-close" onclick="closeNominalColumnsModal()">x</button>
      </div>
      <div id="nominalColumnsList" style="display: grid; gap: 10px; margin: 15px 0;"></div>
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn btn-secondary" onclick="closeNominalColumnsModal()">Cancel</button>
        <button class="btn btn-success" onclick="saveNominalColumns()">Apply</button>
      </div>
    </div>
  </div>

  <!-- Application Columns Modal -->
  <div id="applicationColumnsModal" class="modal-overlay">
    <div class="modal-box" style="width: 400px;">
      <div class="modal-header">
        <h3 class="modal-title">Customize Applications Columns</h3>
        <button class="modal-close" onclick="closeApplicationColumnsModal()">x</button>
      </div>
      <div id="applicationColumnsList" style="display: grid; gap: 10px; margin: 15px 0;"></div>
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn btn-secondary" onclick="closeApplicationColumnsModal()">Cancel</button>
        <button class="btn btn-success" onclick="saveApplicationColumns()">Apply</button>
      </div>
    </div>
  </div>

  <!-- Scoring Template Modal -->
  <div id="scoringTemplateModal" class="modal-overlay">
    <div class="modal-box" style="width: 700px; max-height: 88vh; overflow-y: auto;">
      <div class="modal-header">
        <h3 class="modal-title">Edit Interview Marking Scheme</h3>
        <button class="modal-close" onclick="closeScoringTemplateModal()">x</button>
      </div>
      <p class="section-desc">Changes here will apply to all newly generated score sheets and exported Word documents.</p>
      
      <div style="margin-top: 20px;">
        <h4>1. Assessment Criteria</h4>
        <div id="templateCriteriaEditor" style="margin-top: 10px;"></div>
      </div>
      
      <div style="margin-top: 20px;">
        <h4>2. Education Appendix</h4>
        <div id="templateEducationEditor" style="margin-top: 10px;"></div>
        <button class="btn btn-outline" onclick="addEducationAppendixRow()" style="margin-top: 10px;">+ Add Education Row</button>
      </div>
      
      <div style="margin-top: 20px;">
        <h4>3. Service Appendix</h4>
        <textarea id="templateServiceAppendix" class="form-control" rows="3"></textarea>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-top: 24px;">
        <div id="scoringTemplateStatus" style="font-weight: 600;"></div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="closeScoringTemplateModal()">Cancel</button>
          <button class="btn btn-success" onclick="renderScoringTemplate()">Save Changes</button>
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
    if (!html.includes('id="stationModal"')) {
        html = html.replace('<script src="renderer.js"></script>', missingModals + '\n  <script src="renderer.js"></script>');
        fs.writeFileSync('src/' + file, html);
        console.log('Injected modals into', file);
    }
}

const fs = require('fs');

const oldModalStart = '<div id="stationModal" class="modal-overlay">';
const oldModalPattern = /<div id="stationModal" class="modal-overlay">[\s\S]*?<\/div>\s*<\/div>/;

const newModal = `<div id="stationModal" class="modal-overlay">
  <div class="modal-box" style="width: 450px;">
    <div class="modal-header">
      <h3 class="modal-title">Global Settings</h3>
      <button class="modal-close" onclick="closeStationModal()">x</button>
    </div>
    <p class="section-desc">Set the station name and promotion cycle. These appear on reports and exported documents.</p>
    <div class="form-group" style="margin-top: 15px;">
      <label class="form-label">Station Name</label>
      <input id="stationModalInput" type="text" class="form-control" placeholder="e.g. EMBU MAIN PRISON">
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div class="form-group">
        <label class="form-label">Promotion Month</label>
        <select id="promotionMonthInput" class="form-control">
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Promotion Year</label>
        <input id="promotionYearInput" type="number" class="form-control" min="2000" max="2100" value="2026">
      </div>
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
      <button class="btn btn-secondary" onclick="closeStationModal()">Cancel</button>
      <button class="btn btn-success" onclick="saveStationName()">Save Changes</button>
    </div>
  </div>
</div>`;

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
    if (html.includes(oldModalStart)) {
        html = html.replace(oldModalPattern, newModal);
        fs.writeFileSync('src/' + file, html);
        console.log('Updated modal in', file);
    } else {
        console.log('Modal not found in', file);
    }
}

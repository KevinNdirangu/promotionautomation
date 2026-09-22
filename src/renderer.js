// Client API Client (IPC bridge with HTTP fallback)
const apiClient = {
async getCleanupTables() {
        if (window.api && window.api.getCleanupTables) return window.api.getCleanupTables();
        return (await (await fetch('http://127.0.0.1:3000/api/system/tables')).json()).tables;
    },
    async deleteSelectedTables(tables) {
        if (window.api && window.api.deleteSelectedTables) return window.api.deleteSelectedTables(tables);
        const res = await fetch('http://127.0.0.1:3000/api/system/cleanup', { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tables }) 
        });
        return res.json();
    },
    async getSettings() {
        if (window.api) return window.api.getSettings();
        const res = await fetch('http://127.0.0.1:3000/api/settings');
        const data = await res.json();
        return data.data;
    },
    async updateStationName(stationName) {
        if (window.api) return window.api.updateStationName(stationName);
        const res = await fetch('http://127.0.0.1:3000/api/settings/station', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stationName })
        });
        return res.json();
    },
    async updatePromotionPeriod(data) {
        if (window.api) return window.api.updatePromotionPeriod(data);
        const res = await fetch('http://127.0.0.1:3000/api/settings/promotion-period', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.json();
    },
    async clearApplicationList() {
        if (window.api) return window.api.clearApplicationList();
        const res = await fetch('http://127.0.0.1:3000/api/applications', { method: 'DELETE' });
        return res.json();
    },
    async getEligibilityCriteria() {
        if (window.api) return window.api.getEligibilityCriteria();
        const res = await fetch('http://127.0.0.1:3000/api/eligibility/criteria');
        return (await res.json()).criteria;
    },
    async updateEligibilityCriteria(criteria) {
        if (window.api) return window.api.updateEligibilityCriteria(criteria);
        const res = await fetch('http://127.0.0.1:3000/api/eligibility/criteria', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(criteria) });
        return res.json();
    },
    async getDashboardStats() {
        if (window.api) return window.api.getDashboardStats();
        const res = await fetch('http://127.0.0.1:3000/api/dashboard/stats');
        const data = await res.json();
        return data.stats;
    },
    async getNominalRoll(filters) {
        if (window.api) return window.api.getNominalRoll(filters);
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`http://127.0.0.1:3000/api/nominal-roll?${query}`);
        const data = await res.json();
        return data.records;
    },
    async saveOfficer(officer) {
        if (window.api) return window.api.saveOfficer(officer);
        const res = await fetch('http://127.0.0.1:3000/api/nominal-roll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(officer)
        });
        return res.json();
    },
    async deleteOfficer(pf_no) {
        if (window.api) return window.api.deleteOfficer(pf_no);
        const res = await fetch(`http://127.0.0.1:3000/api/nominal-roll/${encodeURIComponent(pf_no)}`, {
            method: 'DELETE'
        });
        return res.json();
    },
    async importNominalRoll(filePath, station) {
        if (window.api) return window.api.importNominalRoll(filePath, station);
        const res = await fetch('http://127.0.0.1:3000/api/import/nominal-roll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath, station })
        });
        return res.json();
    },
    async getApplications(filters) {
        if (window.api) return window.api.getApplications(filters);
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`http://127.0.0.1:3000/api/applications?${query}`);
        const data = await res.json();
        return data.applications;
    },
    async saveApplication(appData) {
        if (window.api) return window.api.saveApplication(appData);
        const res = await fetch('http://127.0.0.1:3000/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData)
        });
        return res.json();
    },
    async updateApplicationField(data) {
        if (window.api) return window.api.updateApplicationField(data);
        const res = await fetch('http://127.0.0.1:3000/api/applications/field', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.json();
    },
    async loadAllNominalApplications(rankAppliedFor) {
        if (window.api) return window.api.loadAllNominalApplications(rankAppliedFor);
        const res = await fetch('http://127.0.0.1:3000/api/applications/load-all-nominal', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rankAppliedFor })
        });
        return res.json();
    },
    async selectNominalApplicants(pfNumbers) {
        if (window.api) return window.api.selectNominalApplicants(pfNumbers);
        const res = await fetch('http://127.0.0.1:3000/api/applications/select-nominal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pfNumbers }) });
        return res.json();
    },
    async updateApplicationApplied(data) {
        if (window.api) return window.api.updateApplicationApplied(data);
        const res = await fetch('http://127.0.0.1:3000/api/applications/applied', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.json();
    },
    async generateEligibilityLists() {
        if (window.api) return window.api.generateEligibilityLists();
        const res = await fetch('http://127.0.0.1:3000/api/applications/generate-lists', { method: 'POST' });
        return res.json();
    },
    async exportEligibilityLists() {
        if (window.api) return window.api.exportEligibilityLists();
        throw new Error('Excel export is available in the desktop application.');
    },
    async deleteApplication(pf_no) {
        if (window.api) return window.api.deleteApplication(pf_no);
        const res = await fetch(`http://127.0.0.1:3000/api/applications/${encodeURIComponent(pf_no)}`, {
            method: 'DELETE'
        });
        return res.json();
    },
    async importApplications(filePath, rankAppliedFor, station) {
        if (window.api) return window.api.importApplications(filePath, rankAppliedFor, station);
        const res = await fetch('http://127.0.0.1:3000/api/import/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath, rankAppliedFor, station })
        });
        return res.json();
    },
    async getCandidatesForScoring(rankAppliedFor) {
        if (window.api) return window.api.getCandidatesForScoring(rankAppliedFor);
        const res = await fetch(`http://127.0.0.1:3000/api/scoring/candidates?rankAppliedFor=${encodeURIComponent(rankAppliedFor)}`);
        const data = await res.json();
        return data.candidates;
    },
    async getCandidateScore(pf_no) {
        if (window.api) return window.api.getCandidateScore(pf_no);
        const res = await fetch(`http://127.0.0.1:3000/api/scoring/${encodeURIComponent(pf_no)}`);
        const data = await res.json();
        return data.score;
    },
    async getScoringTemplate() {
        if (window.api) return window.api.getScoringTemplate();
        return (await (await fetch('http://127.0.0.1:3000/api/scoring/template')).json()).template;
    },
    async updateScoringTemplate(template) {
        if (window.api) return window.api.updateScoringTemplate(template);
        return (await (await fetch('http://127.0.0.1:3000/api/scoring/template', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(template) })).json());
    },
    async saveInterviewScore(scoreData) {
        if (window.api) return window.api.saveInterviewScore(scoreData);
        const res = await fetch('http://127.0.0.1:3000/api/scoring', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scoreData)
        });
        return res.json();
    },
    async exportScoreSheets(filters) {
        if (window.api) return window.api.exportScoreSheets(filters);
        throw new Error('Word export is available in the desktop application.');
    },
    async exportRegionalScoreSheets(filters) {
        if (window.api && window.api.exportRegionalScoreSheets) return window.api.exportRegionalScoreSheets(filters);
        throw new Error('Word export is available in the desktop application.');
    },
    async getMeritRankings(filters) {
        if (window.api) return window.api.getMeritRankings(filters);
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`http://127.0.0.1:3000/api/reports/merit-rankings?${query}`);
        const data = await res.json();
        return data.rankings;
    },
    async getReportCandidates(filters) {
        if (window.api) return window.api.getReportCandidates(filters);
        return (await (await fetch(`http://127.0.0.1:3000/api/reports/candidates?${new URLSearchParams(filters)}`)).json()).candidates;
    },
    async importReportCandidates(filePath) {
        if (window.api) return window.api.importReportCandidates(filePath);
        throw new Error('Excel import is available in the desktop application.');
    },
    async importRegionalCandidates(filePath, boardType, stationName, boardNumber) { 
        if (window.api) return window.api.importRegionalCandidates({ filePath, boardType, stationName, boardNumber }); 
        throw new Error('Excel import is available in the desktop application.'); 
    },
    async getRegionalCandidates(filters) { 
        if (window.api) return window.api.getRegionalCandidates(filters); 
        return (await (await fetch(`http://127.0.0.1:3000/api/regional/candidates?${new URLSearchParams(filters)}`)).json()).candidates; 
    },
    async updateRegionalCandidate(data) { 
        if (window.api) return window.api.updateRegionalCandidate(data); 
        throw new Error('Regional updates are available in the desktop application.'); 
    },
    async saveManualTotalScore(data) {
        if (window.api) return window.api.saveManualTotalScore(data);
        return (await (await fetch('http://127.0.0.1:3000/api/reports/manual-total', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json());
    },
    async exportReportCandidates(filters) {
        if (window.api) return window.api.exportReportCandidates(filters);
        throw new Error('Excel export is available in the desktop application.');
    },
    async exportRegionalSelection(filters) {
        if (window.api && window.api.exportRegionalSelection) return window.api.exportRegionalSelection(filters);
        throw new Error('Export is available in the desktop application.');
    },
    async exportFinalScores(filters) {
        if (window.api && window.api.exportFinalScores) return window.api.exportFinalScores(filters);
        throw new Error('Export is available in the desktop application.');
    }
};

let currentStation = 'EMBU MAIN PRISON';
let currentPromotionMonth = new Date().getMonth() + 1;
let currentPromotionYear = new Date().getFullYear();
let activeScoringCandidates = [];
let currentScoringCandidate = null;
let nominalSearchTimer = null;
let appsSearchTimer = null;
let stepTwoStatusTimer = null;
let scoringTemplate = null;

let regionalDataCache = { STATION: [], REGIONAL: [], SELECTION: [] };
let finalScoresCache = [];
let rbSortKey = null;
let rbSortDir = 1;
let reportSearchTimer = null;

const NOMINAL_COLUMN_KEY = 'nominalRollVisibleColumns';
const NOMINAL_COLUMNS = [
    ['serial', 'Serial Number'], ['pf', 'PF Number'], ['name', 'Full Name'],
    ['rank', 'Current Rank'], ['gender', 'Gender'], ['ethnicity', 'Ethnicity'],
    ['yob', 'Y.O.B.'], ['academic', 'Academic Qualification'],
    ['professional', 'Professional Qualification'], ['enlisted', 'Year Enlisted'],
    ['posted', 'Date Posted'], ['section', 'Section'], ['county', 'Home County'],
    ['station', 'Station'], ['actions', 'Action']
];
const REQUIRED_NOMINAL_COLUMNS = ['serial', 'pf', 'name', 'actions'];

const APPLICATION_COLUMNS = [
    ['serial', 'Serial Number'], ['pf', 'PF Number'], ['name', 'Candidate Name'], ['rank', 'Current Rank'], 
    ['gender', 'Gender'], ['ethnicity', 'Ethnicity'], ['yob', 'Y.O.B.'], ['academic', 'Academic Qualification'], 
    ['professional', 'Professional Qualification'], ['enlisted', 'Year Enlisted'], ['posted', 'Date Posted'], 
    ['section', 'Section'], ['county', 'Home County'], ['stationName', 'Station'], ['target', 'Rank Applied For'],
    ['service', 'Years in Service'], ['station', 'Years in Station'], ['promotion', 'Date Last Promoted'],
    ['rankYears', 'Years in Current Rank'], ['offences', 'Offences Count'], ['offenceDate', 'Date of Last Offence'],
    ['record', '3-Yr Record'], ['status', 'Status'], ['reason', 'Reason / Notes'], ['actions', 'Action']
];
const REQUIRED_APPLICATION_COLUMNS = ['pf', 'name', 'status'];
const PROMOTION_RANK_ORDER = ['PC', 'CPL', 'SGT', 'S/SGT', 'IP', 'CIP', 'ASP', 'SP', 'SSP', 'CP', 'ACGP', 'SACGP', 'DCGP', 'CGP'];
let applicationSortKey = null;
let applicationSortDirection = 1;
const nominalSortDirections = {};

function rankSortValue(value) {
    const rank = String(value || '').trim().toUpperCase().split('/')[0] === 'S'
        ? 'S/SGT'
        : String(value || '').trim().toUpperCase();
    const index = PROMOTION_RANK_ORDER.indexOf(rank);
    return index === -1 ? PROMOTION_RANK_ORDER.length : index;
}

window.calculateTotalScore = function() {
    let total = 0;
    const keys = ['education', 'service', 'turnout', 'knowledge', 'current_affairs', 'clean_record', 'commendations'];
    
    keys.forEach(key => {
        const input = document.getElementById(`score_${key}`);
        if (input && input.value) {
            total += parseFloat(input.value) || 0;
        }
    });

    const totalDisplay = document.getElementById('liveScoreTotal');
    if (totalDisplay) {
        totalDisplay.innerText = total.toFixed(2);
    }
};

window.submitPanelScore = async function() {
    const isRegional = window.location.pathname.endsWith('regional-scoring.html');
    if (!currentScoringCandidate) return;
    
    const statusEl = document.getElementById('scoringSaveStatus');
    if (statusEl) {
        statusEl.style.color = 'var(--text-muted)';
        statusEl.innerText = 'Saving...';
    }

    const totalScore = document.getElementById('liveScoreTotal')?.innerText || '0';

    const scoreData = {
        pf_no: currentScoringCandidate.pf_no,
        rank_applied_for: currentScoringCandidate.rank_applied_for,
        remarks: document.getElementById('scoreRemarksInput')?.value || ''
    };

    const keys = ['education', 'service', 'turnout', 'knowledge', 'current_affairs', 'clean_record', 'commendations'];
    keys.forEach(key => {
        scoreData[`${key}_score`] = document.getElementById(`score_${key}`)?.value || 0;
    });

    try {
        let res;
        if (isRegional) {
            res = await apiClient.updateRegionalCandidate({ id: currentScoringCandidate.regional_id, field: 'regional_total_score', value: totalScore });
            res.total_score = totalScore;
        } else {
            res = await apiClient.saveInterviewScore(scoreData);
        }
        
        if (res.success) {
            if (statusEl) {
                statusEl.style.color = '#16a34a';
                statusEl.innerText = `✅ Score successfully finalized (Total: ${res.total_score} marks).`;
            }
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
            
            const select = document.getElementById('scoringCandidateSelect');
            if (select && select.selectedIndex >= 0) {
                const opt = select.options[select.selectedIndex];
                if (opt) {
                    opt.text = `${currentScoringCandidate.pf_no} - ${currentScoringCandidate.name} [✅ Scored (${res.total_score} marks)]`;
                }
            }
        } else {
            if (statusEl) {
                statusEl.style.color = '#dc2626';
                statusEl.innerText = 'Error: ' + (res.error || 'Failed to save score');
            }
        }
    } catch (err) {
        if (statusEl) {
            statusEl.style.color = '#dc2626';
            statusEl.innerText = 'Error: ' + err.message;
        }
    }
};

window.triggerExport = function(scope) {
    const isRegional = window.location.pathname.endsWith('regional-scoring.html');
    const rank = document.getElementById('scoringRankSelect')?.value;
    const pf = document.getElementById('scoringCandidateSelect')?.value;
    
    if (scope === 'candidate' && !pf) {
        alert('Please select a candidate first.');
        return;
    }
    if (scope === 'rank' && !rank) {
        alert('Please select a rank first.');
        return;
    }

    if (isRegional) {
        const board = document.getElementById('scoringBoardFilter')?.value || 'ALL';
        apiClient.exportRegionalScoreSheets({ scope, rankAppliedFor: rank, pf_no: pf, boardNumber: board })
            .then(res => { if(res && res.message) alert(res.message); })
            .catch(err => alert('Export failed: ' + err.message));
    } else {
        apiClient.exportScoreSheets({ scope, rankAppliedFor: rank, pf_no: pf })
            .then(res => { if(res && res.message) alert(res.message); })
            .catch(err => alert('Export failed: ' + err.message));
    }
};

window.saveBoardNumber = async function(val) {
    if (!currentScoringCandidate) return;
    try {
        await apiClient.updateRegionalCandidate({ id: currentScoringCandidate.regional_id, field: 'board_number', value: val });
        currentScoringCandidate.board_number = val;
        
        const statusEl = document.getElementById('scoringSaveStatus');
        if (statusEl) {
            statusEl.style.color = '#16a34a';
            statusEl.innerText = `Board Number updated to ${val || 'Unassigned'}.`;
        }
        window.loadRegionalScoringBoards();
    } catch (err) { 
        alert("Failed to update board number: " + err.message); 
    }
};

window.saveInterviewDate = async function(val) {
    if (!currentScoringCandidate) return;
    try {
        await apiClient.updateRegionalCandidate({ id: currentScoringCandidate.regional_id, field: 'interview_date', value: val });
        currentScoringCandidate.interview_date = val;
        
        const statusEl = document.getElementById('scoringSaveStatus');
        if (statusEl) {
            statusEl.style.color = '#16a34a';
            statusEl.innerText = `Interview Date updated to ${val || 'Unassigned'}.`;
        }
    } catch (err) { 
        alert("Failed to update date: " + err.message); 
    }
};

window.applyBulkBoardAssignment = async function() {
    const station = document.getElementById('bulkAssignStation')?.value;
    const board = document.getElementById('bulkAssignBoard')?.value;
    const date = document.getElementById('bulkAssignDate')?.value;
    const statusEl = document.getElementById('bulkAssignStatus');
    
    if (!station) {
        if (statusEl) {
            statusEl.style.color = 'var(--danger)';
            statusEl.innerText = 'Please select a station first.';
        }
        return;
    }

    if (statusEl) {
        statusEl.style.color = 'var(--accent)';
        statusEl.innerText = 'Applying to candidates...';
    }

    const candidates = activeScoringCandidates.filter(c => c.station === station);
    let count = 0;
    
    for (let c of candidates) {
        try {
            if (board !== '') {
                await apiClient.updateRegionalCandidate({ id: c.regional_id, field: 'board_number', value: board });
                c.board_number = board;
            }
            if (date !== '') {
                await apiClient.updateRegionalCandidate({ id: c.regional_id, field: 'interview_date', value: date });
                c.interview_date = date;
            }
            count++;
        } catch (e) {
            console.error('Failed to update candidate', c.pf_no, e);
        }
    }

    if (statusEl) {
        statusEl.style.color = 'var(--success)';
        statusEl.innerText = `Successfully updated ${count} candidates from ${station}.`;
    }
    
    window.loadRegionalScoringBoards();
    setTimeout(() => { if (statusEl) statusEl.innerText = ''; }, 3000);
};

window.loadRegionalScoringBoards = async function() {
    const isRegional = window.location.pathname.endsWith('regional-scoring.html');
    if (!isRegional) return;
    const boardSelect = document.getElementById('scoringBoardFilter');
    const rankSelect = document.getElementById('scoringRankSelect');
    if (!boardSelect) return;
    
    try {
        const all = await apiClient.getRegionalCandidates({ boardType: 'STATION', rankAppliedFor: rankSelect?.value || 'ALL' });
        const selected = all.filter(c => c.selected_for_regional === 1);
        const boards = [...new Set(selected.map(c => c.board_number).filter(Boolean))].sort();
        
        const currentVal = boardSelect.value;
        boardSelect.innerHTML = '<option value="ALL">All Boards</option>' + 
            boards.map(b => `<option value="${b}">Board ${b}</option>`).join('') + 
            '<option value="UNASSIGNED">Unassigned</option>';
            
        boardSelect.value = boards.includes(currentVal) || currentVal === 'UNASSIGNED' ? currentVal : 'ALL';
        boardSelect.onchange = () => window.loadScoringCandidates();
    } catch (e) { console.error(e); }
};

window.loadScoringRanks = async function() {
    const rankSelect = document.getElementById('scoringRankSelect');
    const candidateSelect = document.getElementById('scoringCandidateSelect');
    if (!rankSelect) return;
    
    try {
        const isRegional = window.location.pathname.endsWith('regional-scoring.html');
        let ranks = [];
        
        if (isRegional) {
            const all = await apiClient.getRegionalCandidates({ boardType: 'STATION', rankAppliedFor: 'ALL' });
            ranks = [...new Set(all.map(c => c.rank_applied_for))].filter(Boolean);
        } else {
            const candidates = await apiClient.getApplications({ rankAppliedFor: 'ALL' });
            ranks = [...new Set(candidates.map(c => c.rank_applied_for))].filter(Boolean);
            if (!ranks.length) {
                const scoringList = await apiClient.getCandidatesForScoring('ALL');
                ranks = [...new Set(scoringList.map(c => c.rank_applied_for))].filter(Boolean);
            }
        }

        ranks.sort((a, b) => rankSortValue(a) - rankSortValue(b));
        
        const currentVal = rankSelect.value;
        rankSelect.innerHTML = '<option value="">-- Select Rank --</option>' + 
            ranks.map(r => `<option value="${r}">${r}</option>`).join('');
            
        rankSelect.onchange = () => window.loadScoringCandidates();
        if (candidateSelect) {
            candidateSelect.onchange = () => window.loadCandidateScoreForm();
        }

        if (ranks.includes(currentVal)) {
            rankSelect.value = currentVal;
            await window.loadScoringCandidates();
        } else if (ranks.length > 0) {
            rankSelect.value = ranks[0];
            await window.loadScoringCandidates();
        } else {
            if (candidateSelect) {
                candidateSelect.innerHTML = '<option value="">No candidates available</option>';
            }
        }
    } catch (err) {
        console.error('Error loading ranks for scoring:', err);
        rankSelect.innerHTML = '<option value="">Error loading ranks</option>';
        if (candidateSelect) {
            candidateSelect.innerHTML = `<option value="">Error: ${err.message}</option>`;
        }
    }
};

window.loadScoringCandidates = async function() {
    const isRegional = window.location.pathname.endsWith('regional-scoring.html');
    const rankSelect = document.getElementById('scoringRankSelect');
    const candidateSelect = document.getElementById('scoringCandidateSelect');
    const boardSelect = document.getElementById('scoringBoardFilter');
    
    if (!candidateSelect) return;
    
    const rank = rankSelect ? rankSelect.value : '';
    if (!rank) { 
        candidateSelect.innerHTML = '<option value="">-- Select a Rank First --</option>'; 
        return; 
    }
    
    candidateSelect.innerHTML = '<option value="">Loading...</option>';
    try {
        if (isRegional) {
            const all = await apiClient.getRegionalCandidates({ boardType: 'STATION', rankAppliedFor: rank });
            activeScoringCandidates = all.filter(c => c.selected_for_regional === 1);
            
            const stationSelect = document.getElementById('bulkAssignStation');
            if (stationSelect) {
                const stations = [...new Set(activeScoringCandidates.map(c => c.station))].sort();
                const currentStationVal = stationSelect.value;
                stationSelect.innerHTML = '<option value="">-- Select Station --</option>' + 
                    stations.map(s => `<option value="${s}">${s}</option>`).join('');
                if (stations.includes(currentStationVal)) stationSelect.value = currentStationVal;
            }

            if (boardSelect && boardSelect.value !== 'ALL') {
                if (boardSelect.value === 'UNASSIGNED') {
                    activeScoringCandidates = activeScoringCandidates.filter(c => !c.board_number);
                } else {
                    activeScoringCandidates = activeScoringCandidates.filter(c => String(c.board_number) === String(boardSelect.value));
                }
            }
        } else {
            activeScoringCandidates = await apiClient.getCandidatesForScoring(rank);
        }
        
        if (!activeScoringCandidates.length) {
            candidateSelect.innerHTML = '<option value="">No candidates available for this selection</option>';
        } else {
            candidateSelect.innerHTML = '<option value="">Select Candidate...</option>' + activeScoringCandidates.map(c => {
                const score = isRegional ? c.regional_total_score : c.total_score;
                const statusStr = (score !== null && score !== undefined && score !== '') ? `[✅ Scored (${score} marks)]` : '[Pending]';
                return `<option value="${c.pf_no}">${c.pf_no} - ${c.name} ${statusStr}</option>`;
            }).join('');
        }
        
        const formContainer = document.getElementById('scoringFormContainer');
        if (formContainer) formContainer.style.display = 'none';
        const emptyPrompt = document.getElementById('scoringEmptyPrompt');
        if (emptyPrompt) emptyPrompt.style.display = 'block';
    } catch (err) {
        candidateSelect.innerHTML = `<option value="">Error: ${err.message}</option>`;
    }
};

window.loadCandidateScoreForm = async function() {
    const pf_no = document.getElementById('scoringCandidateSelect')?.value;
    const container = document.getElementById('scoringFormContainer');
    const emptyPrompt = document.getElementById('scoringEmptyPrompt');
    const isRegional = window.location.pathname.endsWith('regional-scoring.html');

    if (!pf_no) { 
        if (container) container.style.display = 'none'; 
        if (emptyPrompt) emptyPrompt.style.display = 'block'; 
        return; 
    }

    currentScoringCandidate = activeScoringCandidates.find(c => c.pf_no === pf_no);
    if (!currentScoringCandidate) return;

    const setField = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text || '';
    };

    setField('scorePfDisplay', currentScoringCandidate.pf_no);
    setField('scoreNameDisplay', currentScoringCandidate.name);
    setField('scoreCurrentRankDisplay', currentScoringCandidate.current_rank);
    setField('scoreTargetRankDisplay', currentScoringCandidate.rank_applied_for);
    setField('scoreStationDisplay', currentScoringCandidate.station);

    const highestEducation = /development course|initial course certificate/i.test(currentScoringCandidate.professional_qualification || '') || !currentScoringCandidate.professional_qualification ? (currentScoringCandidate.academic_qualification || '') : currentScoringCandidate.professional_qualification;
    setField('scoreEducationDisplay', highestEducation || 'None listed');

    if (isRegional) {
        const boardInput = document.getElementById('scoreBoardNumber');
        if (boardInput) boardInput.value = currentScoringCandidate.board_number || '';
        
        const dateInput = document.getElementById('scoreInterviewDate');
        if (dateInput) dateInput.value = currentScoringCandidate.interview_date || '';
    }

    const saveStatus = document.getElementById('scoringSaveStatus');
    if (saveStatus) saveStatus.innerText = '';
    
    const form = document.getElementById('activeScoringForm');
    if (form) form.reset();

    const keys = ['education', 'service', 'turnout', 'knowledge', 'current_affairs', 'clean_record', 'commendations'];
    keys.forEach(key => {
        const input = document.getElementById(`score_${key}`);
        if (input) {
            const existingScore = currentScoringCandidate[`${key}_score`];
            input.value = existingScore !== undefined && existingScore !== null ? existingScore : '';
        }
    });

    const remarksInput = document.getElementById('scoreRemarksInput');
    if (remarksInput) remarksInput.value = currentScoringCandidate.remarks || '';

    window.calculateTotalScore(); 
    
    if (container) container.style.display = 'block';
    if (emptyPrompt) emptyPrompt.style.display = 'none';
};

function getNominalColumnSelection() {
    try {
        const saved = JSON.parse(localStorage.getItem(NOMINAL_COLUMN_KEY) || 'null');
        if (Array.isArray(saved)) {
            return [...new Set([...saved, ...REQUIRED_NOMINAL_COLUMNS])];
        }
    } catch (err) {
        console.warn('Could not load nominal column settings:', err);
    }
    return NOMINAL_COLUMNS.map(([key]) => key);
}

function applyNominalColumnSelection() {
    const selected = new Set(getNominalColumnSelection());
    document.querySelectorAll('[data-nominal-column]').forEach(cell => {
        cell.style.display = selected.has(cell.dataset.nominalColumn) ? '' : 'none';
    });
    document.querySelectorAll('#nominalTableBody tr').forEach(row => {
        Array.from(row.children).forEach((cell, index) => {
            const column = NOMINAL_COLUMNS[index];
            if (column) cell.style.display = selected.has(column[0]) ? '' : 'none';
        });
    });
}

function renderNominalColumnSettings() {
    const grid = document.getElementById('nominalColumnsGrid');
    if (!grid) return;
    const selected = new Set(getNominalColumnSelection());
    grid.innerHTML = NOMINAL_COLUMNS.map(([key, label]) => `
        <label style="display:flex; gap:8px; align-items:center; padding:10px; border:1px solid var(--border); border-radius:6px;">
            <input type="checkbox" value="${key}" ${selected.has(key) ? 'checked' : ''} ${REQUIRED_NOMINAL_COLUMNS.includes(key) ? 'disabled' : ''}>
            ${label}${REQUIRED_NOMINAL_COLUMNS.includes(key) ? ' (required)' : ''}
        </label>
    `).join('');
}

function openNominalColumnsModal() {
    renderNominalColumnSettings();
    document.getElementById('nominalColumnsModal')?.classList.add('active');
}

function closeNominalColumnsModal() {
    document.getElementById('nominalColumnsModal')?.classList.remove('active');
}

function showAllNominalColumns() {
    document.querySelectorAll('#nominalColumnsGrid input').forEach(input => input.checked = true);
}

function saveNominalColumns() {
    const selected = Array.from(document.querySelectorAll('#nominalColumnsGrid input:checked')).map(input => input.value);
    localStorage.setItem(NOMINAL_COLUMN_KEY, JSON.stringify([...new Set([...selected, ...REQUIRED_NOMINAL_COLUMNS])]));
    applyNominalColumnSelection();
    closeNominalColumnsModal();
}

function setupSidebarToggle() {
    const toggle = document.getElementById('sidebarToggle');
    if (!toggle) return;
    if (localStorage.getItem('sidebarCollapsed') === '1') document.body.classList.add('sidebar-collapsed');
    toggle.addEventListener('click', () => {
        const collapsed = document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
        toggle.title = collapsed ? 'Expand menu' : 'Collapse menu';
        toggle.setAttribute('aria-label', toggle.title);
    });
}

function getApplicationColumnSelection() {
    try {
        const saved = JSON.parse(localStorage.getItem('applicationVisibleColumns') || 'null');
        if (Array.isArray(saved)) return [...new Set([...saved, ...REQUIRED_APPLICATION_COLUMNS])];
    } catch (err) { console.warn('Could not load application column settings:', err); }
    return APPLICATION_COLUMNS.map(column => column[0]);
}

function applyApplicationColumnSelection() {
    const selected = new Set(getApplicationColumnSelection());
    const headerCells = document.querySelectorAll('#applicationTableContainer thead th');
    headerCells.forEach((th, index) => {
        const column = APPLICATION_COLUMNS[index];
        if (column) {
            th.style.display = selected.has(column[0]) ? '' : 'none';
        }
    });

    document.querySelectorAll('#applicationsTableBody tr').forEach(row => {
        Array.from(row.children).forEach((cell, index) => {
            const column = APPLICATION_COLUMNS[index];
            if (column) {
                cell.style.display = selected.has(column[0]) ? '' : 'none';
            }
        });
    });
}

function openApplicationColumnsModal() {
    const grid = document.getElementById('applicationColumnsGrid');
    if (!grid) return;
    const selected = new Set(getApplicationColumnSelection());
    grid.innerHTML = APPLICATION_COLUMNS.map(([key, label]) => `<label style="display:flex;gap:8px;align-items:center;padding:10px;border:1px solid var(--border);border-radius:6px;"><input type="checkbox" value="${key}" ${selected.has(key) ? 'checked' : ''} ${REQUIRED_APPLICATION_COLUMNS.includes(key) ? 'disabled' : ''}>${label}${REQUIRED_APPLICATION_COLUMNS.includes(key) ? ' (required)' : ''}</label>`).join('');
    document.getElementById('applicationColumnsModal')?.classList.add('active');
}

function closeApplicationColumnsModal() { document.getElementById('applicationColumnsModal')?.classList.remove('active'); }
function showAllApplicationColumns() { document.querySelectorAll('#applicationColumnsGrid input').forEach(input => input.checked = true); }
function saveApplicationColumns() {
    const selected = Array.from(document.querySelectorAll('#applicationColumnsGrid input:checked')).map(input => input.value);
    localStorage.setItem('applicationVisibleColumns', JSON.stringify([...new Set([...selected, ...REQUIRED_APPLICATION_COLUMNS])]));
    applyApplicationColumnSelection();
    closeApplicationColumnsModal();
}

function filterApplicationRows() {
    const inputs = Array.from(document.querySelectorAll('#applications-page .filter-row input'));
    const search = document.getElementById('appsSearchInput')?.value.trim().toLowerCase() || '';
    document.querySelectorAll('#applicationsTableBody > tr').forEach(row => {
        const values = Array.from(row.children).map(cell => cell.textContent.trim().toLowerCase());
        const searchVisible = !search || values[1].includes(search) || values[2].includes(search);
        const visible = searchVisible && inputs.every((input, index) => !input.value.trim() || values[index].includes(input.value.trim().toLowerCase()));
        row.style.display = visible ? '' : 'none';
    });
}

function sortApplicationColumn(key) {
    const index = APPLICATION_COLUMNS.findIndex(column => column[0] === key);
    if (index < 0 || key === 'actions') return;
    if (applicationSortKey === key) applicationSortDirection *= -1;
    else { applicationSortKey = key; applicationSortDirection = 1; }
    const body = document.getElementById('applicationsTableBody');
    if (!body) return;
    const rows = Array.from(body.querySelectorAll('tr'));
    rows.sort((left, right) => {
        const leftValue = left.children[index].textContent.trim();
        const rightValue = right.children[index].textContent.trim();
        if (key === 'rank' || key === 'target') {
            return (rankSortValue(leftValue) - rankSortValue(rightValue)) * applicationSortDirection;
        }
        return leftValue.localeCompare(rightValue, undefined, { numeric: true }) * applicationSortDirection;
    });
    rows.forEach(row => body.appendChild(row));
}

function sortNominalColumn(index) {
    nominalSortDirections[index] = nominalSortDirections[index] === undefined ? 1 : nominalSortDirections[index] * -1;
    const body = document.getElementById('nominalTableBody');
    if (!body) return;
    const rows = Array.from(body.querySelectorAll('tr'));
    rows.sort((left, right) => {
        const leftValue = left.children[index]?.textContent.trim() || '';
        const rightValue = right.children[index]?.textContent.trim() || '';
        if (index === 3) {
            return (rankSortValue(leftValue) - rankSortValue(rightValue)) * nominalSortDirections[index];
        }
        return leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' }) * nominalSortDirections[index];
    });
    rows.forEach(row => body.appendChild(row));
}

function formatTenure(years) {
    if (years === null || years === undefined || Number.isNaN(Number(years))) return 'N/A';
    const totalMonths = Math.max(0, Math.floor(Number(years) * 12));
    const fullYears = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts = [];
    if (fullYears) parts.push(`${fullYears} year${fullYears === 1 ? '' : 's'}`);
    if (months) parts.push(`${months} month${months === 1 ? '' : 's'}`);
    return parts.join(' ') || '0 months';
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function getFormattedPromotionPeriod(monthNum, yearNum) {
    const monthName = MONTH_NAMES[parseInt(monthNum, 10) - 1] || "January";
    return `${monthName} ${yearNum}`;
}

function updatePeriodDisplays(month, year) {
    const periodText = getFormattedPromotionPeriod(month, year);
    const sidebarYear = document.getElementById('sidebarYear');
    const promoDisplay = document.getElementById('promotionPeriodDisplay');
    if (sidebarYear) sidebarYear.textContent = periodText;
    if (promoDisplay) promoDisplay.textContent = periodText;
}

function showStepTwoStatus(message, isError = false) {
    const status = document.getElementById('applicantUploadStatus');
    if (!status) return;
    clearTimeout(stepTwoStatusTimer);
    status.style.color = isError ? '#dc2626' : '#16a34a';
    status.textContent = message;
    stepTwoStatusTimer = setTimeout(() => { status.textContent = ''; }, 4000);
}

function initTableScrollSync(topScrollId = 'applicationTableTopScroll', containerId = 'applicationTableContainer', innerScrollId = 'applicationTableTopScrollInner') {
    const topScroll = document.getElementById(topScrollId);
    const container = document.getElementById(containerId);
    const innerScroll = document.getElementById(innerScrollId);
    if (!topScroll || !container || !innerScroll) return;
    const table = container.querySelector('table');
    if (!table) return;

    const updateWidth = () => { innerScroll.style.width = table.scrollWidth + 'px'; };
    new ResizeObserver(updateWidth).observe(table);
    updateWidth();

    let isSyncingTop = false; let isSyncingContainer = false;
    topScroll.onscroll = () => { if (!isSyncingTop) { isSyncingContainer = true; container.scrollLeft = topScroll.scrollLeft; } isSyncingTop = false; };
    container.onscroll = () => { if (!isSyncingContainer) { isSyncingTop = true; topScroll.scrollLeft = container.scrollLeft; } isSyncingContainer = false; };
}

function navigateTo(pageId, linkEl) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');
    if (linkEl) linkEl.classList.add('active');
    localStorage.setItem('lastDashboardPage', pageId);

    if (pageId === 'welcome-page') { loadDashboardStats(); } 
    else if (pageId === 'nominal-page') { loadNominalRollTable(); } 
    else if (pageId === 'applications-page') { loadEligibilityCriteria().then(() => loadApplicationsTable()); } 
    else if (pageId === 'scoring-page') { window.loadScoringRanks(); } 
    else if (pageId === 'reports-page') { loadReportRankOptions(false); } 
    else if (pageId === 'rc-stations-page') { initTableScrollSync('regionalTableTopScroll', 'regionalTableContainer', 'regionalTableTopScrollInner'); window.loadRegionalCandidates('STATION'); } 
    else if (pageId === 'regional-boards-page') { initTableScrollSync('regionalTableTopScroll', 'regionalTableContainer', 'regionalTableTopScrollInner'); window.loadRegionalSelection(); } 
    else if (pageId === 'final-scores-page') { initTableScrollSync('regionalTableTopScroll', 'regionalTableContainer', 'regionalTableTopScrollInner'); window.loadFinalScores(); }
}

function openStationModal() {
    document.getElementById('stationModalInput').value = currentStation;
    document.getElementById('promotionMonthInput').value = currentPromotionMonth || 1;
    document.getElementById('promotionYearInput').value = currentPromotionYear || new Date().getFullYear();
    document.getElementById('stationModal')?.classList.add('active');
}

function closeStationModal() {
    document.getElementById('stationModal')?.classList.remove('active');
}

function updatePromotionUI() {
    const label = `${new Date(2000, currentPromotionMonth - 1, 1).toLocaleString('en-US', { month: 'long' })} ${currentPromotionYear}`;
    const year = document.getElementById('sidebarYear');
    if (year) year.textContent = label;
    const header = document.getElementById('promotionPeriodDisplay');
    if (header) header.textContent = label;
}

async function saveStationName() {
    const inputVal = document.getElementById('stationModalInput')?.value.trim();
    if (!inputVal) {
        alert('Please enter a valid station name.');
        return;
    }

    try {
        const res = await apiClient.updateStationName(inputVal);
        if (res.success) {
            const period = await apiClient.updatePromotionPeriod({
                month: document.getElementById('promotionMonthInput')?.value,
                year: document.getElementById('promotionYearInput')?.value
            });
            currentStation = res.station_name;
            currentPromotionMonth = Number(period.promotion_month || currentPromotionMonth);
            currentPromotionYear = Number(period.promotion_year || currentPromotionYear);
            updateStationUI(currentStation);
            closeStationModal();
            loadDashboardStats();
        } else {
            alert('Failed to update station: ' + (res.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Error saving station: ' + err.message);
    }
}

function updateStationUI(station) {
    const globalStation = document.getElementById('globalStationDisplay');
    if (globalStation) globalStation.innerText = station;
    const heroStation = document.getElementById('heroStationName');
    if (heroStation) heroStation.innerText = station;
    const topHeader = document.getElementById('topHeaderTitle');
    if (topHeader) topHeader.innerHTML = `${station} - Promotion Portal (<span id="promotionPeriodDisplay"></span>)`;
    updatePromotionUI();
    const nominalImportStation = document.getElementById('nominalImportStation');
    if (nominalImportStation) nominalImportStation.value = station;
    const addStation = document.getElementById('add_station');
    if (addStation) addStation.value = station;
    const repStation = document.getElementById('reportsStationBadge');
    if (repStation) repStation.innerText = station;
    const repTitleStation = document.getElementById('reportTitleStation');
    if (repTitleStation) repTitleStation.innerText = station;
}

async function loadDashboardStats() {
    try {
        const stats = await apiClient.getDashboardStats();
        if (stats) {
            currentStation = stats.station_name || 'EMBU MAIN PRISON';
            currentPromotionMonth = Number(stats.promotion_month || currentPromotionMonth);
            currentPromotionYear = Number(stats.promotion_year || currentPromotionYear);
            updateStationUI(currentStation);
            updatePromotionUI();

            const counters = {
                'dash-nominal-count': stats.totalNominal || 0,
                'dash-apps-count': stats.totalApplications || 0,
                'dash-qualified-count': stats.totalQualified || 0,
                'dash-disqualified-count': stats.totalDisqualified || 0,
                'dash-scored-count': stats.totalScored || 0
            };
            Object.entries(counters).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.innerText = value;
            });

            const summaryBody = document.getElementById('dashRankSummaryBody');
            if (!summaryBody) return;
            if (stats.rankStats && stats.rankStats.length > 0) {
                summaryBody.innerHTML = stats.rankStats.map(r => {
                    const pendingOrDisq = r.applicant_count - (r.qualified_count || 0);
                    return `
                        <tr>
                            <td><strong>${r.rank_applied_for}</strong></td>
                            <td>${r.applicant_count}</td>
                            <td><span class="badge badge-success">${r.qualified_count || 0}</span></td>
                            <td><span class="badge ${pendingOrDisq > 0 ? 'badge-danger' : 'badge-info'}">${pendingOrDisq}</span></td>
                        </tr>
                    `;
                }).join('');
            } else {
                summaryBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No candidate applications registered yet.</td></tr>`;
            }
        }
    } catch (err) {
        console.error('Failed to load dashboard stats:', err);
    }
}

window.loadRegionalDashboardStats = async function() {
    try {
        const stats = await apiClient.getDashboardStats();
        if (stats) {
            const counters = {
                'rc-dash-candidates-count': stats.rcCandidates || 0,
                'rc-dash-stations-count': stats.rcStations || 0,
                'rc-dash-selected-count': stats.rcSelected || 0,
                'rc-dash-scored-count': stats.rcScored || 0
            };
            Object.entries(counters).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.innerText = value;
            });

            const stationBody = document.getElementById('rcStationSummaryBody');
            if (stationBody) {
                if (stats.rcStationBreakdown && stats.rcStationBreakdown.length > 0) {
                    stationBody.innerHTML = stats.rcStationBreakdown.map(r => {
                        const isComplete = r.scored_count >= r.selected_count && r.selected_count > 0;
                        const statusBadge = isComplete 
                            ? '<span class="badge badge-success">Completed</span>' 
                            : '<span class="badge badge-warning">Pending</span>';
                        return `
                            <tr>
                                <td><strong>${r.station_name}</strong></td>
                                <td style="text-align: center;">${r.total_candidates}</td>
                                <td style="text-align: center;"><span class="badge badge-info">${r.selected_count}</span></td>
                                <td style="text-align: center;"><span class="badge ${isComplete ? 'badge-success' : 'badge-danger'}">${r.scored_count}</span></td>
                                <td style="text-align: center;">${statusBadge}</td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    stationBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No regional station data available.</td></tr>`;
                }
            }

            const rankBody = document.getElementById('rcRankSummaryBody');
            if (rankBody) {
                if (stats.rcRankBreakdown && stats.rcRankBreakdown.length > 0) {
                    rankBody.innerHTML = stats.rcRankBreakdown.map(r => `
                        <tr>
                            <td><strong>${r.rank_applied_for}</strong></td>
                            <td style="text-align: center;">${r.total_candidates}</td>
                            <td style="text-align: center;"><span class="badge badge-info">${r.selected_count}</span></td>
                            <td style="text-align: center;"><span class="badge badge-success">${r.scored_count}</span></td>
                        </tr>
                    `).join('');
                } else {
                    rankBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No regional rank data available.</td></tr>`;
                }
            }
        }
    } catch (err) {
        console.error('Failed to load regional dashboard stats:', err);
    }
};

async function loadNominalRollTable() {
    const tableBody = document.getElementById('nominalTableBody');
    const stationFilter = document.getElementById('nominalStationFilter')?.value || '';
    const searchVal = document.getElementById('nominalSearchInput')?.value || '';

    if (!tableBody) return;
    tableBody.innerHTML = `<tr><td colspan="15" style="text-align: center; color: var(--text-muted);">Loading roster...</td></tr>`;

    try {
        const records = await apiClient.getNominalRoll({
            station: stationFilter,
            search: searchVal
        });

        const countEl = document.getElementById('nominalTableCount');
        if (countEl) countEl.innerText = records.length;

        if (!records.length) {
            tableBody.innerHTML = `<tr><td colspan="15" style="text-align: center; color: var(--text-muted); padding: 24px;">No officers found. Import an Excel roster or add an officer manually above.</td></tr>`;
            return;
        }

        tableBody.innerHTML = records.map((r, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${r.pf_no}</strong></td>
                <td>${r.name}</td>
                <td><span class="badge badge-info">${r.current_rank}</span></td>
                <td>${r.gender || 'MALE'}</td>
                <td>${r.ethnicity || '--'}</td>
                <td>${r.year_of_birth || '--'}</td>
                <td>${r.academic_qualification || '--'}</td>
                <td>${r.professional_qualification || '--'}</td>
                <td>${String(r.pf_no || '').slice(0, 4) || '--'}</td>
                <td>${r.date_posted || '--'}</td>
                <td>${r.section_deployed || 'GENERAL DUTIES'}</td>
                <td>${r.home_county || '--'}</td>
                <td>${r.station || currentStation}</td>
                <td class="no-print">
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; color: var(--danger);" onclick="handleDeleteOfficer('${r.pf_no}')">🗑️ Delete</button>
                </td>
            </tr>
        `).join('');
        applyNominalColumnSelection();

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="15" style="text-align: center; color: var(--danger);">Failed to load roster: ${err.message}</td></tr>`;
    }
}

function debounceNominalSearch() {
    clearTimeout(nominalSearchTimer);
    nominalSearchTimer = setTimeout(() => {
        loadNominalRollTable();
    }, 250);
}

async function handleImportNominalRoll() {
    const fileInput = document.getElementById('nominalRollFileInput');
    const statusEl = document.getElementById('nominalUploadStatus');
    const station = document.getElementById('nominalImportStation')?.value.trim() || currentStation;

    if (!fileInput.files.length) {
        alert('Please select an Excel file (.xlsx, .xls) first.');
        return;
    }

    const file = fileInput.files[0];
    const filePath = window.api?.getFilePath ? window.api.getFilePath(file) : file.path;
    if (!filePath) {
        if (statusEl) {
            statusEl.style.color = '#dc2626';
            statusEl.innerText = 'Could not access the selected file path. Please select the Excel file again.';
        }
        return;
    }
    if (statusEl) {
        statusEl.style.color = '#2563eb';
        statusEl.innerText = 'Processing and importing Nominal Roll...';
    }

    try {
        const res = await apiClient.importNominalRoll(filePath, station);
        if (res.success) {
            if (statusEl) {
                statusEl.style.color = '#16a34a';
                statusEl.innerText = res.message;
            }
            fileInput.value = '';
            loadNominalRollTable();
            loadDashboardStats();
        } else {
            if (statusEl) {
                statusEl.style.color = '#dc2626';
                statusEl.innerText = 'Import failed: ' + (res.error || 'Unknown error');
            }
        }
    } catch (err) {
        if (statusEl) {
            statusEl.style.color = '#dc2626';
            statusEl.innerText = 'Error: ' + err.message;
        }
    }
}

function openAddOfficerModal() {
    document.getElementById('add_station').value = currentStation;
    document.getElementById('officerModal')?.classList.add('active');
}

function closeOfficerModal() {
    document.getElementById('officerModal')?.classList.remove('active');
}

async function saveNewOfficer() {
    const pf_no = document.getElementById('add_pf_no')?.value.trim();
    const name = document.getElementById('add_name')?.value.trim();
    const current_rank = document.getElementById('add_current_rank')?.value;
    const gender = document.getElementById('add_gender')?.value;
    const ethnicity = document.getElementById('add_ethnicity')?.value.trim();
    const date_of_enlistment = document.getElementById('add_enlistment')?.value || null;
    const section_deployed = document.getElementById('add_section')?.value.trim() || 'GENERAL DUTIES';
    const station = document.getElementById('add_station')?.value.trim() || currentStation;

    if (!pf_no || !name) {
        alert('PF Number and Full Name are required.');
        return;
    }

    try {
        const res = await apiClient.saveOfficer({
            pf_no, name, current_rank, gender, ethnicity,
            date_of_enlistment, section_deployed, station
        });

        if (res.success) {
            closeOfficerModal();
            document.getElementById('add_pf_no').value = '';
            document.getElementById('add_name').value = '';
            document.getElementById('add_ethnicity').value = '';
            loadNominalRollTable();
            loadDashboardStats();
        } else {
            alert('Failed: ' + (res.error || 'Could not save officer'));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function handleDeleteOfficer(pf_no) {
    if (!confirm(`Are you sure you want to delete officer with PF: ${pf_no}? This will also delete related applications and scores.`)) {
        return;
    }

    try {
        await apiClient.deleteOfficer(pf_no);
        loadNominalRollTable();
        loadDashboardStats();
    } catch (err) {
        alert('Delete failed: ' + err.message);
    }
}

async function loadApplicationsTable() {
    const tableBody = document.getElementById('applicationsTableBody');
    if (!tableBody) return;

    const rankFilter = document.getElementById('appsFilterRank')?.value || 'ALL';
    const searchVal = document.getElementById('appsSearchInput')?.value || '';

    tableBody.innerHTML = `<tr><td colspan="25" style="text-align: center; color: var(--text-muted);">Loading candidates...</td></tr>`;

    try {
        let nominalRoll = [];
        try {
            nominalRoll = await apiClient.getNominalRoll({});
        } catch (e) {
            console.warn('Could not fetch nominal roll count:', e);
        }
        const sourceCount = document.getElementById('nominalSourceCount');
        if (sourceCount && Array.isArray(nominalRoll)) sourceCount.innerText = `${nominalRoll.length} nominal-roll officers`;
        
        const apps = (await apiClient.getApplications({ rankAppliedFor: rankFilter, search: searchVal })) || [];
        const appsTableCount = document.getElementById('appsTableCount');
        if (appsTableCount) appsTableCount.innerText = apps.length;
        
        const selectedCount = document.getElementById('selectedApplicantCount');
        if (selectedCount) selectedCount.innerText = apps.length;

        if (!apps.length) {
            tableBody.innerHTML = `<tr><td colspan="25" style="text-align: center; color: var(--text-muted); padding: 24px;">No candidates applied yet. Add an application or import from Excel.</td></tr>`;
            return;
        }

        tableBody.innerHTML = apps.map((a, index) => {
            const isClean = a.clean_record_3yrs === 1;
            const isQual = a.eligibility_status === 'ELIGIBLE';
            const years = value => formatTenure(value);
            const yearEnlisted = a.pf_no ? String(a.pf_no).substring(0, 4) : '';

            return `
                <tr data-application-pf="${a.pf_no}">
                    <td data-application-field="serial">${index + 1}</td>
                    <td data-application-field="pf" data-editable-application="pf_no"><strong>${a.pf_no}</strong></td>
                    <td data-application-field="name" data-editable-application="name">${a.name}</td>
                    <td data-application-field="rank" data-editable-application="current_rank"><span class="badge badge-info">${a.current_rank}</span></td>
                    <td data-application-field="gender" data-editable-application="gender">${a.gender || ''}</td>
                    <td data-application-field="ethnicity" data-editable-application="ethnicity">${a.ethnicity || ''}</td>
                    <td data-application-field="yob" data-editable-application="year_of_birth">${a.year_of_birth || ''}</td>
                    <td data-application-field="academic" data-editable-application="academic_qualification">${a.academic_qualification || ''}</td>
                    <td data-application-field="professional" data-editable-application="professional_qualification">${a.professional_qualification || ''}</td>
                    <td data-application-field="enlisted">${yearEnlisted}</td>
                    <td data-application-field="posted" data-editable-application="date_posted">${a.date_posted || ''}</td>
                    <td data-application-field="section" data-editable-application="section_deployed">${a.section_deployed || ''}</td>
                    <td data-application-field="county" data-editable-application="home_county">${a.home_county || ''}</td>
                    <td data-application-field="stationName" data-editable-application="stationName">${a.station || ''}</td>
                    <td data-application-field="target" data-editable-application="target"><strong>${a.rank_applied_for}</strong></td>
                    <td data-application-field="service">${a.years_in_service_display || years(a.years_in_service)}</td>
                    <td data-application-field="station">${a.years_in_station_display || years(a.years_in_station)}</td>
                    <td data-application-field="promotion" data-editable-application="date_last_promotion">${a.date_last_promotion || 'N/A'}</td>
                    <td data-application-field="rankYears">${a.years_in_current_rank_display || years(a.years_in_current_rank)}</td>
                    <td data-application-field="offences" data-editable-application="offences_count" style="text-align: center;">${a.offences_count}</td>
                    <td data-application-field="offenceDate" data-editable-application="date_of_last_offence">${a.date_of_last_offence || 'Nil / N/A'}</td>
                    <td data-application-field="record"><span class="badge ${isClean ? 'badge-success' : 'badge-danger'}">${isClean ? 'No offence' : 'Offence recorded'}</span></td>
                    <td data-application-field="status"><span class="badge ${isQual ? 'badge-success' : 'badge-danger'}">${isQual ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</span></td>
                    <td data-application-field="reason" style="font-size: 12px; color: ${isQual ? 'var(--text-muted)' : 'var(--danger)'};">${a.disqualification_reason || 'Eligible for interview'}</td>
                    <td class="no-print" data-application-field="actions">
                        <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; color: var(--danger);" onclick="handleDeleteApplication('${a.pf_no}')">🗑️ Remove</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.querySelectorAll('[data-editable-application]').forEach(cell => {
            cell.title = 'Click to edit. Press Enter or click outside to save.';
            cell.addEventListener('click', () => editApplicationField(cell, apps.find(app => app.pf_no === cell.closest('tr').querySelector('[data-application-field="pf"]').textContent.trim()), cell.dataset.editableApplication));
        });
        applyApplicationColumnSelection();

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="25" style="text-align: center; color: var(--danger);">Failed to load applications: ${err.message}</td></tr>`;
    }
}

async function editApplicationField(cell, application, field) {
    if (!application || cell.dataset.editing === 'true') return;
    cell.dataset.editing = 'true';
    
    let original = '';
    if (field === 'target') original = application.rank_applied_for;
    else if (field === 'pf_no') original = application.pf_no;
    else if (field === 'date_of_last_offence') original = application.date_of_last_offence || '';
    else original = String(application[field] ?? '');

    let input;
    if (field === 'target' || field === 'current_rank') {
        input = document.createElement('select');
        const ranks = ['PC', 'CPL', 'SGT', 'S/SGT', 'IP', 'CIP', 'ASP', 'SP', 'SSP', 'CP', 'ACGP', 'SACGP', 'DCGP', 'CGP'];
        ranks.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r; opt.textContent = r;
            if (r === original) opt.selected = true;
            input.appendChild(opt);
        });
    } else if (field === 'gender') {
        input = document.createElement('select');
        ['MALE', 'FEMALE'].forEach(g => {
            const opt = document.createElement('option'); opt.value = g; opt.textContent = g;
            if (g === original.toUpperCase()) opt.selected = true;
            input.appendChild(opt);
        });
    } else {
        input = document.createElement('input');
        input.type = field.includes('date') ? 'date' : (field === 'offences_count' || field === 'serial_no' ? 'number' : 'text');
        if (input.type === 'number') input.min = '0';
        input.value = original;
    }

    input.style.width = '100%';
    input.style.boxSizing = 'border-box';
    input.style.padding = '4px';
    input.style.border = '2px solid var(--accent)';
    input.style.borderRadius = '4px';
    input.style.outline = 'none';

    cell.textContent = '';
    cell.appendChild(input);
    input.focus();
    if (input.select && input.type !== 'date' && input.type !== 'select-one') input.select();

    const nominalFields = ['name', 'current_rank', 'gender', 'ethnicity', 'year_of_birth', 'academic_qualification', 'professional_qualification', 'date_posted', 'section_deployed', 'home_county', 'stationName'];
    
    let saved = false;
    const save = async () => {
        if (saved) return;
        saved = true;
        const value = input.value || null;
        
        if ((value || '') === (original || '')) { 
            loadApplicationsTable(); 
            return; 
        }
        
        try {
            if (field === 'target') {
                await apiClient.saveApplication({ ...application, rank_applied_for: value });
            } else if (field === 'pf_no') {
                await apiClient.updateApplicationField({ pf_no: application.pf_no, field: 'pf_no', value: value });
            } else if (nominalFields.includes(field)) {
                await apiClient.saveOfficer({
                    pf_no: application.pf_no,
                    name: field === 'name' ? value : application.name,
                    current_rank: field === 'current_rank' ? value : application.current_rank,
                    gender: field === 'gender' ? value : application.gender,
                    ethnicity: field === 'ethnicity' ? value : application.ethnicity,
                    year_of_birth: field === 'year_of_birth' ? value : application.year_of_birth,
                    academic_qualification: field === 'academic_qualification' ? value : application.academic_qualification,
                    professional_qualification: field === 'professional_qualification' ? value : application.professional_qualification,
                    date_posted: field === 'date_posted' ? value : application.date_posted,
                    section_deployed: field === 'section_deployed' ? value : application.section_deployed,
                    home_county: field === 'home_county' ? value : application.home_county,
                    station: field === 'stationName' ? value : application.station
                });
            } else {
                await apiClient.updateApplicationField({ pf_no: application.pf_no, field, value });
            }
            await loadApplicationsTable();
            loadDashboardStats();
        } catch (err) { 
            alert(`Could not save ${field}: ${err.message}`); 
            loadApplicationsTable(); 
        }
    };

    input.addEventListener('keydown', event => { 
        if (event.key === 'Enter') { event.preventDefault(); save(); }
        if (event.key === 'Escape') loadApplicationsTable(); 
    });
    input.addEventListener('blur', save);
}

function debounceAppsSearch() {
    clearTimeout(appsSearchTimer);
    appsSearchTimer = setTimeout(() => {
        filterApplicationRows();
    }, 250);
}

async function loadEligibilityCriteria() {
    const criteria = await apiClient.getEligibilityCriteria();
    const cutoffInput = document.getElementById('criteriaCutoffDate');
    if (cutoffInput) cutoffInput.value = criteria.cutoffDate || '';
    
    const minYearsService = document.getElementById('criteriaYearsService');
    if (minYearsService) minYearsService.value = criteria.minimumYearsService;
    
    const minYearsRank = document.getElementById('criteriaYearsRank');
    if (minYearsRank) minYearsRank.value = criteria.minimumYearsCurrentRank;
    
    const cleanYears = document.getElementById('criteriaCleanYears');
    if (cleanYears) cleanYears.value = criteria.cleanRecordYears;
}

async function saveEligibilityCriteria() {
    const status = document.getElementById('criteriaStatus');
    try {
        await apiClient.updateEligibilityCriteria({
            cutoffDate: document.getElementById('criteriaCutoffDate')?.value,
            minimumYearsService: document.getElementById('criteriaYearsService')?.value,
            minimumYearsCurrentRank: document.getElementById('criteriaYearsRank')?.value,
            cleanRecordYears: document.getElementById('criteriaCleanYears')?.value
        });
        if (status) {
            status.style.color = '#16a34a';
            status.textContent = 'Criteria saved and eligibility flags refreshed.';
            setTimeout(() => { status.textContent = ''; }, 4000);
        }
        loadApplicationsTable();
        loadDashboardStats();
    } catch (err) {
        if (status) {
            status.style.color = '#dc2626';
            status.textContent = `Failed to save criteria: ${err.message}`;
            setTimeout(() => { status.textContent = ''; }, 4000);
        }
    }
}

function openManualAddModal() {
    document.getElementById('manual_pf').value = '';
    document.getElementById('manual_name').value = '';
    document.getElementById('manual_current_rank').value = 'PC';
    document.getElementById('manual_target_rank').value = 'CPL';
    document.getElementById('manual_station').value = currentStation;
    document.getElementById('manual_promotion').value = '';
    document.getElementById('manual_offences').value = '0';
    document.getElementById('manual_offence_date').value = '';
    document.getElementById('manualAddModal')?.classList.add('active');
}

function closeManualAddModal() { document.getElementById('manualAddModal')?.classList.remove('active'); }

async function submitManualAddCandidate() {
    const pf_no = document.getElementById('manual_pf')?.value.trim();
    const name = document.getElementById('manual_name')?.value.trim();
    const current_rank = document.getElementById('manual_current_rank')?.value;
    const rank_applied_for = document.getElementById('manual_target_rank')?.value;
    const station = document.getElementById('manual_station')?.value.trim() || currentStation;
    const date_last_promotion = document.getElementById('manual_promotion')?.value;
    const offences_count = document.getElementById('manual_offences')?.value;
    const date_of_last_offence = document.getElementById('manual_offence_date')?.value;

    if (!pf_no || !name) { alert('PF Number and Candidate Name are required.'); return; }

    try {
        const res = await apiClient.saveApplication({
            pf_no, name, current_rank, applied: 1, rank_applied_for, station,
            date_last_promotion: date_last_promotion || null,
            offences_count: parseInt(offences_count, 10) || 0,
            date_of_last_offence: date_of_last_offence || null
        });

        if (res.success) {
            closeManualAddModal();
            loadApplicationsTable();
            loadDashboardStats();
            showStepTwoStatus(`Candidate ${name} manually added successfully.`);
        } else { alert('Failed to save candidate: ' + (res.error || 'Unknown error')); }
    } catch (err) { alert('Error saving manual candidate: ' + err.message); }
}

async function openNominalApplicantSelector() {
    const modal = document.getElementById('nominalApplicantModal');
    const choices = document.getElementById('nominalApplicantChoices');
    if (!modal || !choices) return;
    modal.classList.add('active');
    choices.innerHTML = '<p style="padding:16px;">Loading nominal roll...</p>';
    try {
        const [roster, applications] = await Promise.all([apiClient.getNominalRoll({}), apiClient.getApplications({})]);
        const selected = new Set(applications.map(application => application.pf_no));
        choices.innerHTML = roster.map(officer => `
            <label class="nominal-applicant-choice" data-search="${String(`${officer.pf_no} ${officer.name}${officer.current_rank}`).toLowerCase()}" style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--border);">
                <input type="checkbox" value="${officer.pf_no}" ${selected.has(officer.pf_no) ? 'checked disabled' : ''}>
                <strong>${officer.pf_no}</strong><span>${officer.name}</span><span class="badge badge-info">${officer.current_rank}</span>
                ${selected.has(officer.pf_no) ? '<span style="margin-left:auto;color:#15803d;font-size:12px;">Already selected</span>' : ''}
            </label>
        `).join('');
    } catch (err) { choices.innerHTML = `<p style="padding:16px;color:var(--danger);">Could not load nominal roll: ${err.message}</p>`; }
}

function closeNominalApplicantSelector() { document.getElementById('nominalApplicantModal')?.classList.remove('active'); }
function filterNominalApplicantChoices() {
    const query = document.getElementById('nominalApplicantSearch')?.value.trim().toLowerCase();
    document.querySelectorAll('.nominal-applicant-choice').forEach(choice => {
        choice.style.display = !query || choice.dataset.search.includes(query) ? 'flex' : 'none';
    });
}

async function saveNominalApplicantSelection() {
    const pfNumbers = Array.from(document.querySelectorAll('#nominalApplicantChoices input[type="checkbox"]:checked')).map(input => input.value);
    try {
        const result = await apiClient.selectNominalApplicants(pfNumbers);
        showStepTwoStatus(result.message);
        closeNominalApplicantSelector();
        await loadApplicationsTable();
        loadDashboardStats();
    } catch (err) { alert(`Could not save applicant selection: ${err.message}`); }
}

async function handleDeleteApplication(pf_no) {
    if (!confirm(`Are you sure you want to remove application for PF: ${pf_no}?`)) return;
    try {
        await apiClient.deleteApplication(pf_no);
        loadApplicationsTable();
        loadDashboardStats();
    } catch (err) { alert('Delete failed: ' + err.message); }
}

async function clearApplicationList() {
    if (confirm("Are you sure you want to clear the entire applications list? This will remove all added candidates for this session.")) {
        await apiClient.clearApplicationList();
        loadApplicationsTable();
        loadDashboardStats();
    }
}

async function generateEligibilityLists() {
    try {
        const result = await apiClient.generateEligibilityLists();
        showStepTwoStatus(`Eligibility lists updated: ${result.counts.qualifiedApplied} eligible applicants and ${result.counts.notQualifiedApplied} ineligible applicants.`);
    } catch (err) {
        alert(`Could not generate eligibility lists: ${err.message}`);
    }
}

async function exportEligibilityLists() {
    try {
        const result = await apiClient.exportEligibilityLists();
        if (!result.canceled) showStepTwoStatus(result.message || 'Eligibility lists exported to Excel.');
    } catch (err) {
        showStepTwoStatus(`Could not export eligibility lists: ${err.message}`, true);
    }
}

async function loadAllNominalRollApplications(silent = false) {
    const rank = document.getElementById('applicantImportRank')?.value || 'CORPORAL (CPL)';
    try {
        const result = await apiClient.loadAllNominalApplications(rank);
        if (!silent) showStepTwoStatus(result.message);
        await loadApplicationsTable();
        loadDashboardStats();
    } catch (err) { showStepTwoStatus(`Could not load nominal roll officers: ${err.message}`, true); }
}

function openImportAppsModal() {
    document.getElementById('import_apps_file').value = '';
    document.getElementById('import_apps_station').value = currentStation;
    document.getElementById('importAppsStatus').innerText = '';
    document.getElementById('importAppsModal')?.classList.add('active');
}

function closeImportAppsModal() {
    document.getElementById('importAppsModal')?.classList.remove('active');
}

async function submitImportApps() {
    const fileInput = document.getElementById('import_apps_file');
    const station = document.getElementById('import_apps_station')?.value.trim() || currentStation;
    const statusEl = document.getElementById('importAppsStatus');

    if (!fileInput.files.length) {
        if (statusEl) {
            statusEl.style.color = 'var(--danger)';
            statusEl.innerText = 'Please select an Excel file.';
        }
        return;
    }

    const file = fileInput.files[0];
    const filePath = window.api?.getFilePath ? window.api.getFilePath(file) : file.path;

    if (statusEl) {
        statusEl.style.color = 'var(--accent)';
        statusEl.innerText = 'Importing candidates, please wait...';
    }

    try {
        const res = await apiClient.importApplications(filePath, 'AUTO', station);
        if (res.success) {
            if (statusEl) {
                statusEl.style.color = 'var(--success)';
                statusEl.innerText = res.message;
            }
            setTimeout(() => {
                closeImportAppsModal();
                loadApplicationsTable();
                loadDashboardStats();
            }, 1500);
        } else {
            if (statusEl) {
                statusEl.style.color = 'var(--danger)';
                statusEl.innerText = 'Import failed: ' + (res.error || 'Unknown error');
            }
        }
    } catch (err) {
        if (statusEl) {
            statusEl.style.color = 'var(--danger)';
            statusEl.innerText = 'Error: ' + err.message;
        }
    }
}

window.openScoringTemplateModal = function() {
    if (!scoringTemplate) { loadScoringTemplate().then(window.openScoringTemplateModal); return; }
    const criteria = document.getElementById('templateCriteriaEditor');
    if (criteria) criteria.innerHTML = scoringTemplate.criteria.map(item => `<div style="display:grid;grid-template-columns:1fr 120px;gap:10px;margin-bottom:8px;"><input class="form-control" data-template-label="${item.key}" value="${item.label}"><input class="form-control" type="number" min="0" step="0.5" data-template-max="${item.key}" value="${item.max}"></div>`).join('');
    const education = document.getElementById('templateEducationEditor');
    if (education) education.innerHTML = scoringTemplate.educationAppendix.map(item => educationAppendixRow(item.qualification, item.marks)).join('');
    const srv = document.getElementById('templateServiceAppendix');
    if (srv) srv.value = scoringTemplate.serviceAppendix || '';
    const st = document.getElementById('scoringTemplateStatus');
    if (st) st.textContent = '';
    document.getElementById('scoringTemplateModal')?.classList.add('active');
};

async function loadScoringTemplate() {
    scoringTemplate = await apiClient.getScoringTemplate();
    renderScoringTemplate();
    return scoringTemplate;
}

function renderScoringTemplate() {
    if (!scoringTemplate) return;
    let total = 0;
    scoringTemplate.criteria.forEach(item => {
        total += Number(item.max) || 0;
        const label = document.getElementById(`score_label_${item.key}`);
        const maximum = document.getElementById(`score_max_${item.key}`);
        const input = document.getElementById(`score_${item.key}`);
        if (label) label.textContent = item.label;
        if (maximum) maximum.textContent = item.max;
        if (input) input.max = item.max;
    });
    const totalDisplay = document.getElementById('scoreMaxTotalDisplay');
    if (totalDisplay) totalDisplay.textContent = total;
    const education = document.getElementById('educationAppendixDisplay');
    if (education) education.innerHTML = scoringTemplate.educationAppendix.map(item => `<div>${item.qualification} - <strong>${item.marks} marks</strong></div>`).join('') || 'No education appendix entries.';
    const service = document.getElementById('serviceAppendixDisplay');
    if (service) service.textContent = scoringTemplate.serviceAppendix || '';
}

function educationAppendixRow(qualification = '', marks = 0) {
    return `<div style="display:grid;grid-template-columns:1fr 120px auto;gap:10px;margin-bottom:8px;"><input class="form-control" data-education-name value="${qualification}"><input class="form-control" type="number" min="0" step="0.5" data-education-marks value="${marks}"><button class="btn btn-outline" type="button" onclick="this.parentElement.remove()">Remove</button></div>`;
}

window.addEducationAppendixRow = function() { 
    document.getElementById('templateEducationEditor')?.insertAdjacentHTML('beforeend', educationAppendixRow()); 
};

window.closeScoringTemplateModal = function() { 
    document.getElementById('scoringTemplateModal')?.classList.remove('active'); 
};

window.saveScoringTemplate = async function() {
    const criteria = scoringTemplate.criteria.map(item => ({
        key: item.key,
        label: document.querySelector(`[data-template-label="${item.key}"]`).value.trim(),
        max: Number(document.querySelector(`[data-template-max="${item.key}"]`).value)
    }));
    const rows = Array.from(document.querySelectorAll('#templateEducationEditor > div'));
    const educationAppendix = rows.map(row => ({ qualification: row.querySelector('[data-education-name]').value.trim(), marks: Number(row.querySelector('[data-education-marks]').value) }));
    const status = document.getElementById('scoringTemplateStatus');
    try {
        const result = await apiClient.updateScoringTemplate({ criteria, educationAppendix, serviceAppendix: document.getElementById('templateServiceAppendix').value.trim() });
        scoringTemplate = result.template;
        renderScoringTemplate();
        window.closeScoringTemplateModal();
    } catch (err) {
        if (status) {
            status.style.color = '#dc2626';
            status.textContent = err.message;
        }
    }
};

function debounceReportSearch() {
    clearTimeout(reportSearchTimer);
    reportSearchTimer = setTimeout(loadMeritRankings, 250);
}

async function loadMeritRankings() {
    const tableBody = document.getElementById('meritRankingsBody');
    if (!tableBody) return;

    const rankFilter = document.getElementById('reportsRankFilter')?.value || 'ALL';
    const candidateFilter = document.getElementById('reportsCandidateFilter')?.value || 'ALL';
    const searchFilter = document.getElementById('reportsGlobalSearch')?.value.trim().toLowerCase() || '';
    const reportHeader = document.getElementById('reportTitleHeader');
    const regionalMode = new URLSearchParams(window.location.search).get('mode') === 'regional';

    if (reportHeader) {
        reportHeader.innerText = regionalMode
            ? (rankFilter === 'ALL' ? 'REGIONAL BOARD CONSOLIDATED CANDIDATE LIST - ALL RANKS' : `REGIONAL BOARD CONSOLIDATED CANDIDATE LIST FOR ${rankFilter}`)
            : (rankFilter === 'ALL' ? `PROMOTION BOARD INTERVIEW MERIT LIST - ALL RANKS COMBINED (CYCLE 2026)` : `PROMOTION BOARD INTERVIEW MERIT LIST FOR ${rankFilter} - CYCLE 2026`);
    }

    tableBody.innerHTML = `<tr><td colspan="15" style="text-align: center; color: var(--text-muted);">Loading candidates...</td></tr>`;

    try {
        let rankings = (await apiClient.getReportCandidates({ rankAppliedFor: rankFilter })) || [];
        if (candidateFilter !== 'ALL') rankings = rankings.filter(candidate => candidate.pf_no === candidateFilter);
        if (searchFilter) {
            rankings = rankings.filter(r => String(r.pf_no).toLowerCase().includes(searchFilter) || String(r.name).toLowerCase().includes(searchFilter) || String(r.current_rank).toLowerCase().includes(searchFilter));
        }

        if (!rankings.length) {
            tableBody.innerHTML = `<tr><td colspan="14" style="text-align: center; color: var(--text-muted); padding: 24px;">No qualified Step 2 candidates match this selection.</td></tr>`;
            return;
        }

        tableBody.innerHTML = rankings.map((r, idx) => {
            const highestEducation = /development course|initial course certificate/i.test(r.professional_qualification || '') || !r.professional_qualification ? (r.academic_qualification || '') : r.professional_qualification;
            const enlistmentYear = r.pf_no ? r.pf_no.toString().substring(0, 4) : '';

            return `
                <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>${r.pf_no}</strong></td>
                    <td>${r.name}</td>
                    <td><span class="badge badge-info">${r.current_rank}</span></td>
                    <td>${r.rank_applied_for}</td>
                    <td>${r.gender || ''}</td><td>${r.ethnicity || ''}</td><td>${highestEducation}</td><td>${enlistmentYear}</td><td>${r.date_posted || ''}</td><td>${r.section_deployed || ''}</td><td>${r.home_county || ''}</td><td>${r.station || ''}</td>
                    <td style="text-align:center;"><input class="form-control" style="width:82px;text-align:center;" type="number" min="0" max="100" step="0.5" value="${r.total_score ?? ''}" onchange="saveManualReportScore('${r.pf_no}', this.value)"></td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="14" style="text-align: center; color: var(--danger);">Error: ${err.message}</td></tr>`;
    }
}

async function loadReportRankOptions(loadDetails = true) {
    const rankSelect = document.getElementById('reportsRankFilter'); 
    const candidateSelect = document.getElementById('reportsCandidateFilter');
    if (!rankSelect) return;
    try {
        const candidates = (await apiClient.getReportCandidates({ rankAppliedFor: 'ALL' })) || []; 
        const selectedRank = rankSelect.value;
        const ranks = [...new Set(candidates.map(candidate => candidate.rank_applied_for))].sort((a, b) => rankSortValue(a) - rankSortValue(b));
        rankSelect.innerHTML = `<option value="ALL">All Ranks Combined</option>${ranks.map(rank => `<option value="${rank}">${rank}</option>`).join('')}`; 
        rankSelect.value = ranks.includes(selectedRank) ? selectedRank : 'ALL';
        const visible = candidates.filter(candidate => rankSelect.value === 'ALL' || candidate.rank_applied_for === rankSelect.value);
        if (candidateSelect) {
            candidateSelect.innerHTML = `<option value="ALL">All Candidates</option>${visible.map(candidate => `<option value="${candidate.pf_no}">${candidate.pf_no} -${candidate.name}</option>`).join('')}`;
            candidateSelect.onchange = loadMeritRankings;
        }
        rankSelect.onchange = () => loadReportRankOptions(true);
        if (loadDetails) await loadMeritRankings();
    } catch (err) { console.error('Could not load candidates:', err); }
}

async function handleImportQualifiedReport() {
    const input = document.getElementById('reportQualifiedFileInput');
    if (!input || !input.files.length) return;
    const files = Array.from(input.files);
    try {
        const results = [];
        for (const file of files) { 
            const filePath = window.api?.getFilePath ? window.api.getFilePath(file) : file.path; 
            results.push(await apiClient.importReportCandidates(filePath)); 
        }
        alert(`${results.reduce((sum, result) => sum + result.count, 0)} qualified officer record(s) imported from ${files.length} station file(s).`); 
        input.value = ''; 
        await loadReportRankOptions(true);
    }
    catch (err) { alert(`Could not import qualified officers: ${err.message}`); }
}

async function saveManualReportScore(pf_no, total_score) { 
    try { 
        await apiClient.saveManualTotalScore({ pf_no, total_score }); 
        await loadMeritRankings(); 
    } catch (err) { 
        alert(`Could not save total score: ${err.message}`); 
    } 
}

async function exportReportCandidates() { 
    try { 
        const result = await apiClient.exportReportCandidates({ rankAppliedFor: document.getElementById('reportsRankFilter')?.value || 'ALL' }); 
        if (!result.canceled) alert(result.message); 
    } catch (err) { 
        alert(`Could not export candidates: ${err.message}`); 
    } 
}

window.loadRegionalCandidates = async function(boardType) {
    const rankSelect = document.getElementById(boardType === 'STATION' ? 'regionalRankFilter' : 'rbRankFilter');
    const body = document.getElementById(boardType === 'STATION' ? 'regionalCandidatesBody' : 'rbCandidatesBody');
    if (!rankSelect || !body) return;
    try {
        const all = await apiClient.getRegionalCandidates({ boardType, rankAppliedFor: 'ALL' });
        regionalDataCache[boardType] = all;
        const selected = rankSelect.value; 
        const ranks = [...new Set(all.map(candidate => candidate.rank_applied_for))].sort((a,b) => rankSortValue(a)-rankSortValue(b));
        rankSelect.innerHTML = `<option value="ALL">All Ranks</option>${ranks.map(rank => `<option value="${rank}">${rank}</option>`).join('')}`; 
        rankSelect.value = ranks.includes(selected) ? selected : 'ALL';
        renderRegionalTable(boardType);
    } catch (err) { body.innerHTML = `<tr><td colspan="10" style="color:var(--danger);text-align:center;">Could not load candidates: ${err.message}</td></tr>`; }
};

window.debounceRegionalSearch = function() { clearTimeout(window.regionalSearchTimeout); window.regionalSearchTimeout = setTimeout(() => renderRegionalTable('STATION'), 300); };
window.debounceRbSearch = function() { clearTimeout(window.rbSearchTimeout); window.rbSearchTimeout = setTimeout(() => renderRegionalTable('REGIONAL'), 300); };
window.debounceFsSearch = function() { clearTimeout(window.fsSearchTimeout); window.fsSearchTimeout = setTimeout(() => window.renderFinalScores(), 300); };

window.loadRegionalSelection = async function() {
    const rankSelect = document.getElementById('rbRankFilter');
    const stationSelect = document.getElementById('rbStationFilter');
    const body = document.getElementById('rbCandidatesBody');
    if (!rankSelect || !stationSelect || !body) return;
    try {
        const all = await apiClient.getRegionalCandidates({ boardType: 'STATION', rankAppliedFor: 'ALL' });
        regionalDataCache['SELECTION'] = all;
        
        const selectedRank = rankSelect.value; 
        const ranks = [...new Set(all.map(c => c.rank_applied_for))].sort((a,b) => rankSortValue(a)-rankSortValue(b));
        rankSelect.innerHTML = `<option value="ALL">All Ranks</option>${ranks.map(rank => `<option value="${rank}">${rank}</option>`).join('')}`; 
        rankSelect.value = ranks.includes(selectedRank) ? selectedRank : 'ALL';

        const selectedStation = stationSelect.value;
        const stations = [...new Set(all.map(c => c.station))].sort();
        stationSelect.innerHTML = `<option value="ALL">All Stations</option>${stations.map(station => `<option value="${station}">${station}</option>`).join('')}`; 
        stationSelect.value = stations.includes(selectedStation) ? selectedStation : 'ALL';

        renderRegionalSelection();
    } catch (err) { body.innerHTML = `<tr><td colspan="9" style="color:var(--danger);text-align:center;">Could not load candidates: ${err.message}</td></tr>`; }
};

window.debounceRbSelectionSearch = function() { clearTimeout(window.rbSelectionTimeout); window.rbSelectionTimeout = setTimeout(renderRegionalSelection, 300); };

window.sortRbColumn = function(key) {
    if (rbSortKey === key) {
        rbSortDir *= -1;
    } else {
        rbSortKey = key;
        rbSortDir = 1;
    }

    (regionalDataCache['SELECTION'] || []).sort((a, b) => {
        if (key === 'serial') return 0;
        let valA = a[key] ?? '';
        let valB = b[key] ?? '';

        if (key === 'station_total_score' || key === 'selected_for_regional') {
            return (Number(valA) - Number(valB)) * rbSortDir;
        }
        if (key === 'rank_applied_for') {
            return (rankSortValue(valA) - rankSortValue(valB)) * rbSortDir;
        }
        return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * rbSortDir;
    });

    renderRegionalSelection();
};

function renderRegionalSelection() {
    const rankSelect = document.getElementById('rbRankFilter');
    const stationSelect = document.getElementById('rbStationFilter');
    const searchInput = document.getElementById('rbSearchInput');
    const body = document.getElementById('rbCandidatesBody');
    if (!body) return;
    
    let candidates = regionalDataCache['SELECTION'] || [];
    if (rankSelect && rankSelect.value !== 'ALL') candidates = candidates.filter(c => c.rank_applied_for === rankSelect.value);
    if (stationSelect && stationSelect.value !== 'ALL') candidates = candidates.filter(c => c.station === stationSelect.value);
    
    const search = (searchInput?.value || '').toLowerCase().trim();
    if (search) candidates = candidates.filter(c => (c.name || '').toLowerCase().includes(search) || (c.pf_no || '').toLowerCase().includes(search));
    
    if (!candidates.length) {
        body.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);">No candidates found.</td></tr>`;
        return;
    }
    
    body.innerHTML = candidates.map((c, index) => {
        return `<tr>
            <td>${index+1}</td>
            <td>${c.pf_no}</td>
            <td>${c.name}</td>
            <td>${c.gender || '--'}</td>
            <td>${c.ethnicity || '--'}</td>
            <td>${c.station}</td>
            <td>${c.rank_applied_for}</td>
            <td>${c.station_total_score ?? '-'}</td>
            <td style="text-align:center;">
                <input type="checkbox" style="transform:scale(1.2);" ${c.selected_for_regional ? 'checked' : ''} onchange="window.updateRegionalCandidate(${c.regional_id},'selected_for_regional',this.checked ? 1 : 0)">
            </td>
        </tr>`;
    }).join('');
}

window.applyRegionalCutoff = async function() {
    const cutoff = Number(document.getElementById('rbCutoffInput')?.value);
    if (isNaN(cutoff) || cutoff < 0) {
        alert("Please enter a valid cut-off score.");
        return;
    }
    
    const rankSelect = document.getElementById('rbRankFilter')?.value || 'ALL';
    const stationSelect = document.getElementById('rbStationFilter')?.value || 'ALL';
    
    let candidates = regionalDataCache['SELECTION'] || [];
    if (rankSelect !== 'ALL') candidates = candidates.filter(c => c.rank_applied_for === rankSelect);
    if (stationSelect !== 'ALL') candidates = candidates.filter(c => c.station === stationSelect);
    
    let updated = 0;
    for (const c of candidates) {
        const meetsCutoff = (c.station_total_score ?? 0) >= cutoff;
        const newStatus = meetsCutoff ? 1 : 0;
        if (c.selected_for_regional !== newStatus) {
            await window.updateRegionalCandidate(c.regional_id, 'selected_for_regional', newStatus);
            c.selected_for_regional = newStatus;
            updated++;
        }
    }
    
    alert(`Applied cut-off of ${cutoff} to the selected list. ${updated} candidates updated.`);
    renderRegionalSelection();
};

window.exportRegionalSelection = async function() {
    const rankSelect = document.getElementById('rbRankFilter')?.value || 'ALL';
    const stationSelect = document.getElementById('rbStationFilter')?.value || 'ALL';
    try {
        const res = await apiClient.exportRegionalSelection({ rankAppliedFor: rankSelect, station: stationSelect });
        if (res && res.message) {
            alert(res.message);
        }
    } catch(e) {
        alert('Export failed: ' + e.message);
    }
};

function renderRegionalTable(boardType) {
    const rankSelect = document.getElementById(boardType === 'STATION' ? 'regionalRankFilter' : 'rbRankFilter');
    const searchInput = document.getElementById(boardType === 'STATION' ? 'regionalSearchInput' : 'rbSearchInput');
    const body = document.getElementById(boardType === 'STATION' ? 'regionalCandidatesBody' : 'rbCandidatesBody');
    if (!body) return;
    let candidates = regionalDataCache[boardType] || [];
    
    if (rankSelect && rankSelect.value !== 'ALL') {
        candidates = candidates.filter(c => c.rank_applied_for === rankSelect.value);
    }
    
    const search = (searchInput?.value || '').toLowerCase().trim();
    if (search) {
        candidates = candidates.filter(c => (c.name || '').toLowerCase().includes(search) || (c.pf_no || '').toLowerCase().includes(search));
    }
    
    if (!candidates.length) {
        body.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text-muted);">No candidates found.</td></tr>`;
        return;
    }
    
    body.innerHTML = candidates.map((candidate, index) => {
        if (boardType === 'STATION') {
            return `<tr>
                <td>${index+1}</td>
                <td>${candidate.pf_no}</td>
                <td>${candidate.name}</td>
                <td>${candidate.station}</td>
                <td>${candidate.current_rank}</td>
                <td>${candidate.rank_applied_for}</td>
                <td>${candidate.highest_education || ''}</td>
                <td><input class="form-control" style="width:90px" type="number" min="0" max="100" step="0.5" value="${candidate.station_total_score ?? ''}" onchange="window.updateRegionalCandidate(${candidate.regional_id},'station_total_score',this.value)"></td>
            </tr>`;
        } else {
            return `<tr>
                <td>${index+1}</td>
                <td>${candidate.board_number || ''}</td>
                <td>${candidate.pf_no}</td>
                <td>${candidate.name}</td>
                <td>${candidate.station}</td>
                <td>${candidate.current_rank}</td>
                <td>${candidate.rank_applied_for}</td>
                <td>${candidate.highest_education || ''}</td>
                <td><input class="form-control" style="width:90px" type="number" min="0" max="100" step="0.5" value="${candidate.regional_total_score ?? ''}" onchange="window.updateRegionalCandidate(${candidate.regional_id},'regional_total_score',this.value)"></td>
            </tr>`;
        }
    }).join('');
}
// --- SYSTEM TOOLS & DATA CLEANUP ---
window.loadCleanupTables = async function() {
    const statusEl = document.getElementById('cleanupStatus');
    const container = document.getElementById('cleanupTables');
    if (!container) return;

    if (statusEl) { statusEl.style.color = 'var(--text-muted)'; statusEl.innerText = 'Loading tables...'; }
    
    try {
        const tables = await apiClient.getCleanupTables();
        
        const grouped = tables.reduce((acc, table) => {
            if (!acc[table.group]) acc[table.group] = [];
            acc[table.group].push(table);
            return acc;
        }, {});

        container.innerHTML = Object.entries(grouped).map(([group, items]) => `
            <div class="cleanup-group">
                <h3>${group}</h3>
                ${items.map(item => `
                    <label class="cleanup-option">
                        <input type="checkbox" value="${item.name}">
                        ${item.label}
                    </label>
                `).join('')}
            </div>
        `).join('');
        
        if (statusEl) { statusEl.style.color = 'var(--text-muted)'; statusEl.innerText = 'Select the tables you wish to erase.'; }
    } catch (err) {
        if (statusEl) { statusEl.style.color = 'var(--danger)'; statusEl.innerText = `Error loading tables: ${err.message}`; }
    }
};

window.deleteSelectedTables = async function() {
    const statusEl = document.getElementById('cleanupStatus');
    const checked = Array.from(document.querySelectorAll('#cleanupTables input[type="checkbox"]:checked'));
    const tables = checked.map(input => input.value);

    if (tables.length === 0) {
        alert('Please select at least one table to erase.');
        return;
    }

    if (!confirm(`Are you absolutely sure you want to delete ALL records from the ${tables.length} selected table(s)? This action cannot be undone.`)) {
        return;
    }

    if (statusEl) { statusEl.style.color = 'var(--danger)'; statusEl.innerText = 'Erasing records...'; }

    try {
        const res = await apiClient.deleteSelectedTables(tables);
        if (res.success) {
            alert(res.message);
            if (statusEl) { statusEl.style.color = 'var(--success)'; statusEl.innerText = res.message; }
            // Uncheck boxes after success
            checked.forEach(input => input.checked = false);
            
            // If they happen to be on a split screen or navigate back, refreshing dashboard stats is safe.
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
        } else {
            if (statusEl) { statusEl.style.color = 'var(--danger)'; statusEl.innerText = res.error || 'Failed to erase tables.'; }
        }
    } catch (err) {
        if (statusEl) { statusEl.style.color = 'var(--danger)'; statusEl.innerText = `Error: ${err.message}`; }
    }
};
window.importRegionalFiles = async function(boardType) { 
    const inputId = boardType === 'STATION' ? 'regionalFilesInput' : 'rbFilesInput';
    const stationInputId = boardType === 'STATION' ? 'regionalStationInput' : 'rbStationInput';
    const input = document.getElementById(inputId);
    const stationInput = document.getElementById(stationInputId);
    const boardInput = document.getElementById('rbBoardInput');
    if (!input || !input.files.length) return; 
    try { 
        let count = 0; 
        for (const file of Array.from(input.files)) { 
            const path = window.api?.getFilePath ? window.api.getFilePath(file) : file.path; 
            count += (await apiClient.importRegionalCandidates(path, boardType, stationInput ? stationInput.value : '', boardInput ? boardInput.value : '')).count; 
        } 
        input.value = ''; 
        await window.loadRegionalCandidates(boardType); 
        alert(`${count} candidate record(s) imported.`); 
    } catch(err) { alert(`Could not import results: ${err.message}`); } 
};

window.updateRegionalCandidate = async function(id, field, value) { 
    try { 
        await apiClient.updateRegionalCandidate({id,field,value}); 
    } catch(err) { 
        alert(`Could not save entry: ${err.message}`); 
    } 
};

window.loadFinalScores = async function() {
    const rankSelect = document.getElementById('fsRankFilter');
    const stationSelect = document.getElementById('fsStationFilter');
    const body = document.getElementById('fsCandidatesBody');
    if (!rankSelect || !stationSelect || !body) return;
    
    try {
        const all = await apiClient.getRegionalCandidates({ boardType: 'STATION', rankAppliedFor: 'ALL' });
        finalScoresCache = all;
        
        const selectedRank = rankSelect.value;
        const ranks = [...new Set(all.map(c => c.rank_applied_for))].sort((a,b) => rankSortValue(a)-rankSortValue(b));
        rankSelect.innerHTML = `<option value="ALL">All Ranks</option>${ranks.map(rank => `<option value="${rank}">${rank}</option>`).join('')}`;
        rankSelect.value = ranks.includes(selectedRank) ? selectedRank : 'ALL';

        const selectedStation = stationSelect.value;
        const stations = [...new Set(all.map(c => c.station))].sort();
        stationSelect.innerHTML = `<option value="ALL">All Stations</option>${stations.map(station => `<option value="${station}">${station}</option>`).join('')}`;
        stationSelect.value = stations.includes(selectedStation) ? selectedStation : 'ALL';
        
        window.renderFinalScores();
    } catch (err) {
        body.innerHTML = `<tr><td colspan="8" style="color:var(--danger);text-align:center;">Could not load candidates: ${err.message}</td></tr>`;
    }
};

window.renderFinalScores = function() {
    const rankSelect = document.getElementById('fsRankFilter');
    const stationSelect = document.getElementById('fsStationFilter');
    const searchInput = document.getElementById('fsSearchInput');
    const body = document.getElementById('fsCandidatesBody');
    if (!body) return;
    
    let candidates = finalScoresCache || [];
    if (rankSelect && rankSelect.value !== 'ALL') candidates = candidates.filter(c => c.rank_applied_for === rankSelect.value);
    if (stationSelect && stationSelect.value !== 'ALL') candidates = candidates.filter(c => c.station === stationSelect.value);
    
    const search = (searchInput?.value || '').toLowerCase().trim();
    if (search) candidates = candidates.filter(c => (c.name || '').toLowerCase().includes(search) || (c.pf_no || '').toLowerCase().includes(search));
    
    if (!candidates.length) {
        body.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">No candidates found.</td></tr>`;
        return;
    }
    
    body.innerHTML = candidates.map((c, index) => {
        return `<tr>
            <td>${index+1}</td>
            <td>${c.pf_no}</td>
            <td>${c.name}</td>
            <td>${c.station}</td>
            <td>${c.current_rank}</td>
            <td>${c.rank_applied_for}</td>
            <td><input class="form-control" style="width:90px; font-weight:bold; color:var(--primary);" type="number" min="0" max="100" step="0.5" value="${c.station_total_score ?? ''}" onchange="window.updateRegionalCandidate(${c.regional_id},'station_total_score',this.value)"></td>
            <td><input class="form-control" style="width:90px; font-weight:bold; color:var(--success);" type="number" min="0" max="100" step="0.5" value="${c.regional_total_score ?? ''}" onchange="window.updateRegionalCandidate(${c.regional_id},'regional_total_score',this.value)"></td>
        </tr>`;
    }).join('');
};

window.exportFinalScores = async function() { 
    const rankSelect = document.getElementById('fsRankFilter')?.value || 'ALL';
    const stationSelect = document.getElementById('fsStationFilter')?.value || 'ALL';
    try {
        const res = await apiClient.exportFinalScores({ rankAppliedFor: rankSelect, station: stationSelect });
        if (res && res.message) {
            alert(res.message);
        }
    } catch(e) {
        alert('Export failed: ' + e.message);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    setupSidebarToggle();
    try {
        const settings = await apiClient.getSettings();
        if (settings && settings.station_name) {
            currentStation = settings.station_name;
            updateStationUI(currentStation);
        }
    } catch (e) {
        console.warn('Could not load initial settings:', e);
    }
    
    const pathStr = window.location.pathname;
    let filename = pathStr.split(/[\\/]/).pop();
    if (filename.includes('?')) filename = filename.split('?')[0];

    if (filename === 'dashboard.html' || filename === '') {
        loadDashboardStats();
        const lastPage = localStorage.getItem('lastDashboardPage');
        if (lastPage && document.getElementById(lastPage)) {
            navigateTo(lastPage, document.querySelector(`.nav-link[onclick*="${lastPage}"]`));
        }
    } else if (filename === 'rc-dashboard.html') {
        window.loadRegionalDashboardStats();
    } else if (filename === 'nominal-roll.html') {
        loadDashboardStats();
        loadNominalRollTable();
    } else if (filename === 'applications-vetting.html') {
        loadDashboardStats();
        await loadEligibilityCriteria();
        await loadApplicationsTable();
    } else if (filename === 'panel-scoring.html') {
        window.loadScoringRanks();
    } else if (filename === 'merit-rankings.html') {
        loadReportRankOptions(true);
    } else if (filename === 'rc-stations-scores.html') {
        initTableScrollSync('regionalTableTopScroll', 'regionalTableContainer', 'regionalTableTopScrollInner');
        window.loadRegionalCandidates('STATION');
    } else if (filename === 'regional-boards.html') {
        window.loadRegionalSelection();
    } else if (filename === 'regional-scoring.html') {
        window.loadRegionalScoringBoards().then(() => window.loadScoringRanks()); 
    } else if (filename === 'final-scores.html') {
        window.loadFinalScores();
    }
});
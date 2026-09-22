const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Settings & Station Management
    getSettings: () => ipcRenderer.invoke('get-settings'),
    getEligibilityCriteria: () => ipcRenderer.invoke('get-eligibility-criteria'),
    updateEligibilityCriteria: (criteria) => ipcRenderer.invoke('update-eligibility-criteria', criteria),
    updateStationName: (stationName) => ipcRenderer.invoke('update-station-name', stationName),
    updatePromotionPeriod: (data) => ipcRenderer.invoke('update-promotion-period', data),
    clearApplicationList: () => ipcRenderer.invoke('clear-application-list'),

    // Dashboard Statistics
    getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),

    // Nominal Roll Management
    getNominalRoll: (filters) => ipcRenderer.invoke('get-nominal-roll', filters),
    saveOfficer: (officer) => ipcRenderer.invoke('save-officer', officer),
    deleteOfficer: (pf_no) => ipcRenderer.invoke('delete-officer', pf_no),
    importNominalRoll: (filePath, station) => ipcRenderer.invoke('import-nominal-roll', filePath, station),
    getFilePath: (file) => webUtils.getPathForFile(file),

    // Candidate Applications & Disciplinary Records
    getApplications: (filters) => ipcRenderer.invoke('get-applications', filters),
    saveApplication: (appData) => ipcRenderer.invoke('save-application', appData),
    updateApplicationField: (data) => ipcRenderer.invoke('update-application-field', data),
    loadAllNominalApplications: (rank) => ipcRenderer.invoke('load-all-nominal-applications', rank),
    selectNominalApplicants: (pfNumbers) => ipcRenderer.invoke('select-nominal-applicants', pfNumbers),
    updateApplicationApplied: (data) => ipcRenderer.invoke('update-application-applied', data),
    generateEligibilityLists: () => ipcRenderer.invoke('generate-eligibility-lists'),
    exportEligibilityLists: () => ipcRenderer.invoke('export-eligibility-lists'),
    deleteApplication: (pf_no) => ipcRenderer.invoke('delete-application', pf_no),
    importApplications: (filePath, rankAppliedFor, station) => ipcRenderer.invoke('import-applications', filePath, rankAppliedFor, station),

    // Interview Scoring Panel
    getCandidatesForScoring: (rankAppliedFor) => ipcRenderer.invoke('get-candidates-for-scoring', rankAppliedFor),
    getCandidateScore: (pf_no) => ipcRenderer.invoke('get-candidate-score', pf_no),
    getScoringTemplate: () => ipcRenderer.invoke('get-scoring-template'),
    updateScoringTemplate: (template) => ipcRenderer.invoke('update-scoring-template', template),
    saveInterviewScore: (scoreData) => ipcRenderer.invoke('save-interview-score', scoreData),
    exportScoreSheets: (filters) => ipcRenderer.invoke('export-score-sheets', filters),

    // Reports & Merit Rankings
    getMeritRankings: (filters) => ipcRenderer.invoke('get-merit-rankings', filters),
    getReportCandidates: (filters) => ipcRenderer.invoke('get-report-candidates', filters),
    importReportCandidates: (filePath) => ipcRenderer.invoke('import-report-candidates', filePath),
    importRegionalCandidates: (data) => ipcRenderer.invoke('import-regional-candidates', data),
    getRegionalCandidates: (filters) => ipcRenderer.invoke('get-regional-candidates', filters),
    updateRegionalCandidate: (data) => ipcRenderer.invoke('update-regional-candidate', data),
    saveManualTotalScore: (data) => ipcRenderer.invoke('save-manual-total-score', data),
    exportReportCandidates: (filters) => ipcRenderer.invoke('export-report-candidates', filters),
    exportReportCandidates: (filters) => ipcRenderer.invoke('export-report-candidates', filters),
    exportRegionalScoreSheets: (filters) => ipcRenderer.invoke('export-regional-score-sheets', filters),
    exportRegionalSelection: (filters) => ipcRenderer.invoke('export-regional-selection', filters),
    exportFinalScores: (filters) => ipcRenderer.invoke('export-final-scores', filters),
    
    // System Tools
    getCleanupTables: () => ipcRenderer.invoke('get-cleanup-tables'),
    deleteSelectedTables: (tables) => ipcRenderer.invoke('delete-selected-tables', tables)
});
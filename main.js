const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const express = require('express');
const services = require('./server/services');
const apiRoutes = require('./server/routes');

// Enforce single-instance application lock
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow;
let serverInstance;

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

function registerIpcHandlers() {
    // Settings & Station
    ipcMain.handle('get-settings', async () => services.getSettings());
    ipcMain.handle('get-eligibility-criteria', async () => services.getEligibilityCriteria());
    ipcMain.handle('update-eligibility-criteria', async (event, criteria) => services.updateEligibilityCriteria(criteria));
    ipcMain.handle('update-station-name', async (event, stationName) => services.updateStationName(stationName));
    ipcMain.handle('update-promotion-period', async (event, data) => services.updatePromotionPeriod(data.month, data.year));
    ipcMain.handle('clear-application-list', async () => services.clearApplicationList());
// System Cleanup
    ipcMain.handle('get-cleanup-tables', async () => services.getCleanupTables());
    ipcMain.handle('delete-selected-tables', async (event, tables) => services.deleteSelectedTables(tables));
    // Dashboard
    ipcMain.handle('get-dashboard-stats', async () => services.getDashboardStats());

    // Nominal Roll
    ipcMain.handle('get-nominal-roll', async (event, filters) => services.getNominalRoll(filters));
    ipcMain.handle('save-officer', async (event, officer) => services.saveOfficer(officer));
    ipcMain.handle('delete-officer', async (event, pf_no) => services.deleteOfficer(pf_no));
    ipcMain.handle('import-nominal-roll', async (event, filePath, station) => services.importNominalRollFromExcel(filePath, station));

    // Applications & Disciplinary
    ipcMain.handle('get-applications', async (event, filters) => services.getApplications(filters));
    ipcMain.handle('load-all-nominal-applications', async (event, rank) => services.loadAllNominalRollApplications(rank));
    ipcMain.handle('select-nominal-applicants', async (event, pfNumbers) => services.selectNominalRollApplicants(pfNumbers));
    ipcMain.handle('update-application-applied', async (event, data) => services.updateApplicationApplied(data.pf_no, data.applied, data.rank_applied_for));
    ipcMain.handle('generate-eligibility-lists', async () => services.generateEligibilityLists());
    
    ipcMain.handle('export-eligibility-lists', async () => {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Eligibility Lists',
            defaultPath: 'Eligibility Lists.xlsx',
            filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
        });
        if (canceled || !filePath) return { success: false, canceled: true };
        return services.exportEligibilityListsToExcel(filePath);
    });
    
    ipcMain.handle('save-application', async (event, appData) => services.saveApplication(appData));
    ipcMain.handle('update-application-field', async (event, data) => services.updateApplicationField(data.pf_no, data.field, data.value));
    ipcMain.handle('delete-application', async (event, pf_no) => services.deleteApplication(pf_no));
    ipcMain.handle('import-applications', async (event, filePath, rankAppliedFor, station) => services.importApplicationsFromExcel(filePath, rankAppliedFor, station));

    // Interview Scoring
    ipcMain.handle('get-candidates-for-scoring', async (event, rankAppliedFor) => services.getCandidatesForScoring(rankAppliedFor));
    ipcMain.handle('get-candidate-score', async (event, pf_no) => services.getCandidateScore(pf_no));
    ipcMain.handle('get-scoring-template', async () => services.getScoringTemplate());
    ipcMain.handle('update-scoring-template', async (event, template) => services.updateScoringTemplate(template));
    ipcMain.handle('save-interview-score', async (event, scoreData) => services.saveInterviewScore(scoreData));
    
    ipcMain.handle('export-score-sheets', async (event, filters) => {
        const scope = filters?.scope || 'all';
        const rank = filters?.rankAppliedFor ? String(filters.rankAppliedFor).replace(/[^a-zA-Z0-9_-]/g, '') : '';
        const station = filters?.station && filters.station !== 'ALL' ? String(filters.station).replace(/[^a-zA-Z0-9_\s-]/g, '') : '';
        const board = filters?.boardType === 'REGIONAL' ? 'Regional ' : '';

        let defaultPath = `${board}Promotion Interview Score Sheets.docx`;
        
        if (scope === 'candidate') {
            defaultPath = `${board}Score Sheet - ${filters.pf_no || 'Candidate'}.docx`;
        } else if (scope === 'rank') {
            defaultPath = `${board}Score Sheets - ${rank}${station ? ' - ' + station : ''}.docx`;
        } else {
            defaultPath = `${board}Score Sheets - All Ranks${station ? ' - ' + station : ''}.docx`;
        }

        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Blank Interview Score Sheets',
            defaultPath: defaultPath.trim(),
            filters: [{ name: 'Word Document', extensions: ['docx'] }]
        });
        
        if (canceled || !filePath) return { success: false, canceled: true };
        return services.exportInterviewScoreSheets(filePath, filters);
    });

    ipcMain.handle('export-regional-score-sheets', async (event, filters) => {
        const scope = filters?.scope || 'all';
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Regional Interview Score Sheets',
            defaultPath: scope === 'all' ? 'Regional Interview Score Sheets.docx' : 'Regional Interview Score Sheet.docx',
            filters: [{ name: 'Word Document', extensions: ['docx'] }]
        });
        if (canceled || !filePath) return { success: false, canceled: true };
        return services.exportRegionalScoreSheets(filePath, filters);
    });

    // Merit Reports & Rankings
    ipcMain.handle('get-merit-rankings', async (event, filters) => services.getMeritRankings(filters));
    ipcMain.handle('get-report-candidates', async (event, filters) => services.getReportCandidates(filters));
    ipcMain.handle('import-report-candidates', async (event, filePath) => services.importQualifiedOfficersForReport(filePath));
    ipcMain.handle('import-regional-candidates', async (event, data) => services.importRegionalCandidates(data.filePath, data.boardType, data.stationName, data.boardNumber));
    ipcMain.handle('get-regional-candidates', async (event, filters) => services.getRegionalCandidates(filters));
    ipcMain.handle('update-regional-candidate', async (event, data) => services.updateRegionalCandidate(data.id, data.field, data.value));
    ipcMain.handle('save-manual-total-score', async (event, data) => services.saveManualTotalScore(data.pf_no, data.total_score));
    
    ipcMain.handle('export-report-candidates', async (event, filters) => {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, { 
            title: 'Export Interview Scores', 
            defaultPath: 'Promotion Interview Scores.xlsx', 
            filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }] 
        });
        if (canceled || !filePath) return { success: false, canceled: true };
        return services.exportReportCandidatesToExcel(filePath, filters);
    });

    ipcMain.handle('export-regional-selection', async (event, filters) => {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Board Selection',
            defaultPath: 'Regional_Board_Selection.xlsx',
            filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
        });
        if (canceled || !filePath) return { success: false, canceled: true };
        return services.exportRegionalSelectionToExcel(filePath, filters);
    });

    ipcMain.handle('export-final-scores', async (event, filters) => {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Final Scores',
            defaultPath: 'Final_Scores.xlsx',
            filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
        });
        if (canceled || !filePath) return { success: false, canceled: true };
        return services.exportFinalScoresToExcel(filePath, filters);
    });
}

function startServer() {
    const expressApp = express();
    expressApp.use(express.json());
    expressApp.use('/api', apiRoutes);

    try {
        serverInstance = expressApp.listen(3000, '127.0.0.1', () => {
            console.log('Local API Server running on http://127.0.0.1:3000');
        });
        serverInstance.on('error', (err) => {
            console.warn('Local Express Server warning (IPC will remain primary):', err.message);
        });
    } catch (err) {
        console.warn('Express server skipped:', err.message);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 1024,
        minHeight: 700,
        title: "Promotion Interview Portal - Prisons Service",
        webPreferences: {
            preload: path.join(__dirname, 'src', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'dashboard.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    registerIpcHandlers();
    startServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (serverInstance) {
        serverInstance.close();
    }
    if (process.platform !== 'darwin') app.quit();
});
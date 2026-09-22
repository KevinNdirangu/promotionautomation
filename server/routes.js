const express = require('express');
const router = express.Router();
const services = require('./services');

// 1. SETTINGS & STATION
router.get('/settings', (req, res) => {
    try {
        const data = services.getSettings();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/eligibility/criteria', (req, res) => res.json({ success: true, criteria: services.getEligibilityCriteria() }));
router.post('/eligibility/criteria', (req, res) => res.json(services.updateEligibilityCriteria(req.body)));

router.post('/settings/station', (req, res) => {
    try {
        const { stationName } = req.body;
        const result = services.updateStationName(stationName);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/settings/promotion-period', (req, res) => res.json(services.updatePromotionPeriod(req.body.month, req.body.year)));
router.delete('/applications', (req, res) => res.json(services.clearApplicationList()));

// 2. DASHBOARD STATISTICS
router.get('/dashboard/stats', (req, res) => {
    try {
        const stats = services.getDashboardStats();
        res.json({ success: true, stats });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. MASTER NOMINAL ROLL
router.get('/nominal-roll', (req, res) => {
    try {
        const { station, search } = req.query;
        const records = services.getNominalRoll({ station, search });
        res.json({ success: true, records });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/nominal-roll', (req, res) => {
    try {
        const result = services.saveOfficer(req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.delete('/nominal-roll/:pf_no', (req, res) => {
    try {
        const result = services.deleteOfficer(req.params.pf_no);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/import/nominal-roll', (req, res) => {
    const { filePath, station } = req.body;
    try {
        if (!filePath) {
            return res.status(400).json({ success: false, error: 'filePath is required' });
        }
        const result = services.importNominalRollFromExcel(filePath, station);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. CANDIDATE APPLICATIONS & DISCIPLINARY
router.get('/applications', (req, res) => {
    try {
        const { rankAppliedFor, qualifiedOnly, search } = req.query;
        const applications = services.getApplications({
            rankAppliedFor,
            qualifiedOnly: qualifiedOnly === 'true',
            search
        });
        res.json({ success: true, applications });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/applications', (req, res) => {
    try {
        const result = services.saveApplication(req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
router.post('/applications/field', (req, res) => res.json(services.updateApplicationField(req.body.pf_no, req.body.field, req.body.value)));

router.post('/applications/load-all-nominal', (req, res) => {
    try {
        res.json(services.loadAllNominalRollApplications(req.body.rankAppliedFor));
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/applications/select-nominal', (req, res) => res.json(services.selectNominalRollApplicants(req.body.pfNumbers)));
router.post('/applications/applied', (req, res) => res.json(services.updateApplicationApplied(req.body.pf_no, req.body.applied, req.body.rank_applied_for)));
router.post('/applications/generate-lists', (req, res) => res.json(services.generateEligibilityLists()));

router.delete('/applications/:pf_no', (req, res) => {
    try {
        const result = services.deleteApplication(req.params.pf_no);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/import/applications', (req, res) => {
    const { filePath, rankAppliedFor } = req.body;
    try {
        if (!filePath || !rankAppliedFor) {
            return res.status(400).json({ success: false, error: 'filePath and rankAppliedFor are required' });
        }
        const result = services.importApplicationsFromExcel(filePath, rankAppliedFor);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. INTERVIEW SCORING
router.get('/scoring/template', (req, res) => res.json({ success: true, template: services.getScoringTemplate() }));
router.post('/scoring/template', (req, res) => res.json(services.updateScoringTemplate(req.body)));
router.get('/scoring/candidates', (req, res) => {
    try {
        const { rankAppliedFor } = req.query;
        const candidates = services.getCandidatesForScoring(rankAppliedFor);
        res.json({ success: true, candidates });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/scoring/:pf_no', (req, res) => {
    try {
        const score = services.getCandidateScore(req.params.pf_no);
        res.json({ success: true, score });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/scoring', (req, res) => {
    try {
        const result = services.saveInterviewScore(req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// 6. MERIT REPORTS & RANKINGS
router.get('/reports/merit-rankings', (req, res) => {
    try {
        const { rankAppliedFor, station } = req.query;
        const rankings = services.getMeritRankings({ rankAppliedFor, station });
        res.json({ success: true, rankings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/reports/candidates', (req, res) => res.json({ success: true, candidates: services.getReportCandidates(req.query) }));
router.post('/reports/manual-total', (req, res) => res.json(services.saveManualTotalScore(req.body.pf_no, req.body.total_score)));
router.get('/regional/candidates', (req, res) => res.json({ success: true, candidates: services.getRegionalCandidates(req.query) }));
router.post('/regional/candidates/import', (req, res) => res.json(services.importRegionalCandidates(req.body.filePath)));
router.post('/regional/candidates/field', (req, res) => res.json(services.updateRegionalCandidate(req.body.id, req.body.field, req.body.value)));

// 7. SYSTEM TOOLS & CLEANUP
router.get('/system/tables', (req, res) => {
    res.json({ success: true, tables: services.getCleanupTables() });
});

router.post('/system/cleanup', (req, res) => {
    try {
        const result = services.deleteSelectedTables(req.body.tables);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

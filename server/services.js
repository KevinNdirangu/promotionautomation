const db = require('./db');
const xlsx = require('xlsx');
const fs = require('fs');
const os = require('os');
const path = require('path');

// --- DATABASE MIGRATIONS FOR REGIONAL BOARDS ---
try {
    const regionalColumns = db.prepare("PRAGMA table_info(regional_candidates)").all().map(c => c.name);
    if (!regionalColumns.includes('interview_date')) {
        db.exec("ALTER TABLE regional_candidates ADD COLUMN interview_date TEXT");
    }
} catch(e) {
    console.warn("Could not alter regional_candidates table:", e.message);
}

// --- DATE & SERIAL HELPER FUNCTIONS ---
function parseExcelDate(value) {
    if (!value) return null;
    
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value.toISOString().split('T')[0];
    }

    if (typeof value === 'number' && value > 1000) {
        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    }

    const str = String(value).trim();
    if (!str || str.toLowerCase() === 'nil' || str.toLowerCase() === 'none') return null;

    const ddmmyyyy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (ddmmyyyy) {
        const day = parseInt(ddmmyyyy[1], 10);
        const month = parseInt(ddmmyyyy[2], 10) - 1;
        const year = parseInt(ddmmyyyy[3], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    return null;
}

function evaluateDisciplinary(offencesCount, lastOffenceDate, cutoffDate = null) {
    const offences = parseInt(offencesCount, 10) || 0;
    if (offences <= 0 || !lastOffenceDate) {
        return {
            cleanRecord3yrs: 1,
            isQualified: 1,
            disqualificationReason: null,
            cleanRecordScore: 5
        };
    }

    const offenceDate = new Date(lastOffenceDate);
    const referenceDate = cutoffDate ? new Date(cutoffDate) : new Date();
    const threeYearsAgo = new Date(referenceDate);
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    if (!isNaN(offenceDate.getTime()) && offenceDate > threeYearsAgo) {
        return {
            cleanRecord3yrs: 0,
            isQualified: 0,
            disqualificationReason: `Disciplinary offence on ${lastOffenceDate} (within the 3-year threshold)`,
            cleanRecordScore: 0
        };
    }

    return {
        cleanRecord3yrs: 1,
        isQualified: 1,
        disqualificationReason: null,
        cleanRecordScore: 5
    };
}

// --- SETTINGS SERVICES ---
function getSettings() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {
        station_name: 'EMBU MAIN PRISON',
        promotion_year: '2026'
    };
    for (const r of rows) {
        settings[r.key] = r.value;
    }
    return settings;
}

function getEligibilityCriteria() {
    const settings = getSettings();
    return {
        cutoffDate: settings.eligibility_cutoff_date || '',
        minimumYearsService: Number(settings.minimum_years_service) || 0,
        minimumYearsCurrentRank: Number(settings.minimum_years_current_rank) || 0,
        cleanRecordYears: Number(settings.clean_record_years) || 3
    };
}

const PROMOTION_RANKS = ['PC', 'CPL', 'SGT', 'S/SGT', 'IP', 'CIP', 'ASP', 'SP', 'SSP', 'CP', 'ACGP', 'SACGP', 'DCGP', 'CGP'];
const DEFAULT_SCORING_TEMPLATE = {
    criteria: [
        { key: 'education', label: 'Education', max: 20 },
        { key: 'service', label: 'Length of Service', max: 18 },
        { key: 'turnout', label: 'Turnout Presentation Appearance and Dress', max: 15 },
        { key: 'knowledge', label: 'Knowledge of Prison Work', max: 25 },
        { key: 'current_affairs', label: 'Current Affairs Knowledge of GOK', max: 13 },
        { key: 'clean_record', label: 'Clean Record of Service for Last 3 Years', max: 5 },
        { key: 'commendations', label: 'Commendations Recommendations', max: 4 }
    ],
    educationAppendix: [
        { qualification: 'Masters', marks: 20 },
        { qualification: '1st Degree', marks: 17 },
        { qualification: 'Higher National Diploma', marks: 15 },
        { qualification: 'A Level Diploma', marks: 13 },
        { qualification: 'KCSE KCE', marks: 10 },
        { qualification: 'KJSE', marks: 7 },
        { qualification: 'KCPE CPE and Below', marks: 5 }
    ],
    serviceAppendix: '1 mark for every year of service, up to 18 marks.'
};

function getScoringTemplate() {
    try {
        const saved = getSettings().scoring_template;
        if (saved) {
            const template = JSON.parse(saved);
            if (Array.isArray(template.criteria) && template.criteria.length === DEFAULT_SCORING_TEMPLATE.criteria.length) {
                return template;
            }
        }
    } catch (err) {
        console.warn('Invalid saved scoring template:', err.message);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SCORING_TEMPLATE));
}

function updateScoringTemplate(template) {
    const expectedKeys = DEFAULT_SCORING_TEMPLATE.criteria.map(item => item.key);
    if (!template || !Array.isArray(template.criteria) || template.criteria.map(item => item.key).join('|') !== expectedKeys.join('|')) {
        throw new Error('The score sheet must retain all seven required scoring fields.');
    }
    const criteria = template.criteria.map(item => ({
        key: item.key,
        label: String(item.label || '').trim() || DEFAULT_SCORING_TEMPLATE.criteria.find(defaultItem => defaultItem.key === item.key).label,
        max: Math.max(0, Number(item.max) || 0)
    }));
    const total = criteria.reduce((sum, item) => sum + item.max, 0);
    if (Math.abs(total - 100) > 0.001) {
        throw new Error(`The marking scheme must total 100 marks; it currently totals ${total}.`);
    }
    const educationAppendix = (Array.isArray(template.educationAppendix) ? template.educationAppendix : []).map(item => ({
        qualification: String(item.qualification || '').trim(),
        marks: Math.max(0, Number(item.marks) || 0)
    })).filter(item => item.qualification);
    const clean = {
        criteria,
        educationAppendix,
        serviceAppendix: String(template.serviceAppendix || '').trim()
    };
    db.prepare(`INSERT INTO settings (key, value) VALUES ('scoring_template', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(JSON.stringify(clean));
    return { success: true, template: clean };
}

function normalizeRank(rank) {
    const value = String(rank || '').trim().toUpperCase().replace(/\s+/g, ' ');
    return [...PROMOTION_RANKS]
        .sort((left, right) => right.length - left.length)
        .find(base => value === base || value.startsWith(`${base}/`) || value.startsWith(`${base} `) || value.startsWith(`${base}(`)) || value;
}

function getNextRank(currentRank) {
    const index = PROMOTION_RANKS.indexOf(normalizeRank(currentRank));
    return index >= 0 && index < PROMOTION_RANKS.length - 1 ? PROMOTION_RANKS[index + 1] : '';
}

function updateEligibilityCriteria(criteria) {
    const values = {
        eligibility_cutoff_date: criteria.cutoffDate || '',
        minimum_years_service: Math.max(0, Number(criteria.minimumYearsService) || 0),
        minimum_years_current_rank: Math.max(0, Number(criteria.minimumYearsCurrentRank) || 0),
        clean_record_years: Math.max(0, Number(criteria.cleanRecordYears) || 0)
    };
    const update = db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    const transaction = db.transaction(() => Object.entries(values).forEach(([key, value]) => update.run(key, String(value))));
    transaction();
    const applications = db.prepare(`
        SELECT a.*, n.* FROM applications a
        JOIN nominal_roll n ON n.pf_no = a.pf_no
    `).all();
    const updateStatus = db.prepare('UPDATE applications SET is_qualified = ?, disqualification_reason = ? WHERE application_id = ?');
    const criteriaNow = getEligibilityCriteria();
    for (const application of applications) {
        const result = calculateOfficerEligibility(application, application, criteriaNow);
        updateStatus.run(result.eligibility_status === 'ELIGIBLE' ? 1 : 0, result.disqualification_reason, application.application_id);
    }
    return { success: true, criteria: getEligibilityCriteria() };
}

function yearsSince(dateValue, now = new Date()) {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    return Math.max(0, (now - date) / (365.25 * 24 * 60 * 60 * 1000));
}

function calendarTenure(dateValue, now = new Date()) {
    if (!dateValue) return 'N/A';
    const start = new Date(dateValue);
    if (Number.isNaN(start.getTime())) return 'N/A';
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (now.getDate() < start.getDate()) months -= 1;
    if (months < 0) {
        years -= 1;
        months += 12;
    }
    if (years < 0) return '0 months';
    const parts = [];
    if (years) parts.push(`${years} year${years === 1 ? '' : 's'}`);
    if (months) parts.push(`${months} month${months === 1 ? '' : 's'}`);
    return parts.join(' ') || '0 months';
}

function calculateOfficerEligibility(officer, application, criteria = getEligibilityCriteria()) {
    const now = criteria.cutoffDate ? new Date(criteria.cutoffDate) : new Date();
    
    const yearEnlisted = String(officer.pf_no || '').slice(0, 4);
    const yearsInService = yearEnlisted && /^\d{4}$/.test(yearEnlisted)
        ? Math.max(0, now.getFullYear() - Number(yearEnlisted)) : null;
    const yearsInStation = yearsSince(officer.date_posted, now);
    const isPc = normalizeRank(officer.current_rank) === 'PC';
    const yearsInCurrentRank = isPc ? null : yearsSince(application?.date_last_promotion, now);
    const offences = Number(application?.offences_count) || 0;
    const lastOffence = application?.date_of_last_offence || null;
    const reasons = [];
    const cleanRecord = !lastOffence || yearsSince(lastOffence, now) >= criteria.cleanRecordYears;

    if (yearsInService !== null && yearsInService < criteria.minimumYearsService) reasons.push(`Less than ${criteria.minimumYearsService} years in service`);
    if (!isPc && (yearsInCurrentRank === null || yearsInCurrentRank < criteria.minimumYearsCurrentRank)) reasons.push(`Less than ${criteria.minimumYearsCurrentRank} years in current rank`);
    if (lastOffence && yearsSince(lastOffence, now) < criteria.cleanRecordYears) reasons.push(`Last offence is within ${criteria.cleanRecordYears} years`);

    return {
        years_in_service: yearsInService,
        years_in_station: yearsInStation,
        years_in_current_rank: yearsInCurrentRank,
        years_in_service_display: yearsInService === null ? 'N/A' : `${yearsInService} year${yearsInService === 1 ? '' : 's'}`,
        years_in_station_display: calendarTenure(officer.date_posted, now),
        years_in_current_rank_display: isPc ? 'N/A' : calendarTenure(application?.date_last_promotion, now),
        clean_record_3yrs: cleanRecord ? 1 : 0,
        eligibility_status: reasons.length ? 'NOT ELIGIBLE' : 'ELIGIBLE',
        disqualification_reason: reasons.join('; ') || 'Meets current eligibility criteria'
    };
}

function updateStationName(stationName) {
    const cleanName = (stationName || 'EMBU MAIN PRISON').trim().toUpperCase();
    db.prepare(`
        INSERT INTO settings (key, value) VALUES ('station_name', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(cleanName);
    return { success: true, station_name: cleanName, ...getSettings() };
}

function updatePromotionPeriod(month, year) {
    const cleanMonth = Math.min(12, Math.max(1, Number(month) || 1));
    const cleanYear = Math.max(2000, Number(year) || new Date().getFullYear());
    const update = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
    update.run('promotion_month', String(cleanMonth));
    update.run('promotion_year', String(cleanYear));
    return { success: true, ...getSettings() };
}

function clearApplicationList() {
    const clear = db.transaction(() => {
        db.prepare('DELETE FROM applications').run();
        db.prepare('DELETE FROM qualified_applied_officers').run();
        db.prepare('DELETE FROM not_qualified_applied_officers').run();
        db.prepare('DELETE FROM qualified_not_applied_officers').run();
    });
    clear();
    return { success: true, message: 'Application list and generated eligibility lists cleared.' };
}

// --- DASHBOARD STATISTICS ---
function getDashboardStats() {
    const settings = getSettings();
    const totalNominal = db.prepare('SELECT count(*) as count FROM nominal_roll').get().count;
    const applications = getApplications({});
    const totalQualified = applications.filter(row => row.eligibility_status === 'ELIGIBLE').length;
    const totalDisqualified = applications.length - totalQualified;
    const totalScored = db.prepare('SELECT count(*) as count FROM interview_scores').get().count;
    const totalApplications = applications.length;

    const rankStats = Object.values(applications.reduce((groups, row) => {
        const rank = row.rank_applied_for || 'Unspecified';
        const group = groups[rank] || { rank_applied_for: rank, applicant_count: 0, qualified_count: 0 };
        group.applicant_count++;
        if (row.eligibility_status === 'ELIGIBLE') group.qualified_count++;
        groups[rank] = group;
        return groups;
    }, {}));

    // New additions for Regional Dashboard specifically:
    const rcCandidates = db.prepare("SELECT count(*) as count FROM regional_candidates WHERE board_type = 'STATION'").get().count;
    const rcStations = db.prepare("SELECT count(DISTINCT station) as count FROM regional_candidates WHERE board_type = 'STATION'").get().count;
    const rcSelected = db.prepare("SELECT count(*) as count FROM regional_candidates WHERE board_type = 'STATION' AND selected_for_regional = 1").get().count;
    const rcScored = db.prepare("SELECT count(*) as count FROM regional_candidates WHERE board_type = 'STATION' AND selected_for_regional = 1 AND regional_total_score IS NOT NULL").get().count;

    const rcStationBreakdown = db.prepare(`
        SELECT station as station_name, 
               COUNT(*) as total_candidates,
               SUM(CASE WHEN selected_for_regional = 1 THEN 1 ELSE 0 END) as selected_count,
               SUM(CASE WHEN selected_for_regional = 1 AND regional_total_score IS NOT NULL THEN 1 ELSE 0 END) as scored_count
        FROM regional_candidates
        WHERE board_type = 'STATION'
        GROUP BY station
        ORDER BY station
    `).all();

    const rcRankBreakdown = db.prepare(`
        SELECT rank_applied_for, 
               COUNT(*) as total_candidates,
               SUM(CASE WHEN selected_for_regional = 1 THEN 1 ELSE 0 END) as selected_count,
               SUM(CASE WHEN selected_for_regional = 1 AND regional_total_score IS NOT NULL THEN 1 ELSE 0 END) as scored_count
        FROM regional_candidates
        WHERE board_type = 'STATION'
        GROUP BY rank_applied_for
        ORDER BY rank_applied_for
    `).all();

    return {
        station_name: settings.station_name,
        promotion_year: settings.promotion_year,
        promotion_month: settings.promotion_month,
        totalNominal,
        totalQualified,
        totalDisqualified,
        totalScored,
        totalApplications,
        rankStats,
        
        // Exposing Regional specific properties:
        rcCandidates,
        rcStations,
        rcSelected,
        rcScored,
        rcStationBreakdown,
        rcRankBreakdown
    };
}

// --- MASTER NOMINAL ROLL SERVICES ---
function getNominalRoll(filters = {}) {
    let query = 'SELECT * FROM nominal_roll WHERE 1=1';
    const params = [];

    if (filters.station && filters.station !== 'ALL') {
        query += ' AND station = ?';
        params.push(filters.station);
    }

    if (filters.search) {
        query += ' AND (pf_no LIKE ? OR name LIKE ? OR current_rank LIKE ? OR section_deployed LIKE ?)';
        const term = `%${filters.search.trim()}%`;
        params.push(term, term, term, term);
    }

    query += ' ORDER BY pf_no ASC';
    return db.prepare(query).all(...params).map(row => ({
        ...row,
        current_rank: normalizeRank(row.current_rank)
    }));
}

function saveOfficer(officer) {
    const stmt = db.prepare(`
        INSERT INTO nominal_roll (serial_no, pf_no, name, current_rank, gender, ethnicity, year_of_birth, academic_qualification, professional_qualification, date_of_enlistment, date_posted, section_deployed, home_county, station)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(pf_no) DO UPDATE SET
            serial_no = excluded.serial_no,
            name = excluded.name,
            current_rank = excluded.current_rank,
            gender = excluded.gender,
            ethnicity = excluded.ethnicity,
            year_of_birth = excluded.year_of_birth,
            academic_qualification = excluded.academic_qualification,
            professional_qualification = excluded.professional_qualification,
            date_of_enlistment = excluded.date_of_enlistment,
            date_posted = excluded.date_posted,
            section_deployed = excluded.section_deployed,
            home_county = excluded.home_county,
            station = excluded.station
    `);

    const pf = String(officer.pf_no).trim();
    const name = String(officer.name).trim();
    if (!pf || !name) throw new Error('PF Number and Full Name are required.');

    stmt.run(
        officer.serial_no || null,
        pf,
        name,
        normalizeRank(officer.current_rank || 'PC'),
        officer.gender || 'MALE',
        officer.ethnicity || '',
        officer.year_of_birth || null,
        officer.academic_qualification || '',
        officer.professional_qualification || '',
        officer.date_of_enlistment || null,
        officer.date_posted || null,
        officer.section_deployed || '',
        officer.home_county || '',
        officer.station || getSettings().station_name
    );

    return { success: true, message: `Officer ${name} (${pf}) saved successfully.` };
}

function deleteOfficer(pf_no) {
    db.prepare('DELETE FROM nominal_roll WHERE pf_no = ?').run(pf_no);
    return { success: true, message: `Officer (${pf_no}) deleted.` };
}

function importNominalRollFromExcel(filePath, customStation) {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let headerIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
        if (rows[i] && rows[i].some(cell => {
            const val = String(cell).toUpperCase();
            return val.includes('PF') || val.includes('SERVICE NO') || val.includes('P/NO');
        })) {
            headerIdx = i;
            break;
        }
    }

    if (headerIdx === -1) {
        throw new Error("Could not locate valid header row containing 'PF', 'SERVICE NO', or 'P/NO'");
    }

    const headers = Array.from(rows[headerIdx], h => String(h || '').trim().toUpperCase());
    const dataRows = rows.slice(headerIdx + 1);

    const pfIdx = headers.findIndex(h => h.includes('PF') || h.includes('SERVICE') || h.includes('P/NO'));
    const serialIdx = headers.findIndex(h => h === 'S/NO' || h.includes('SERIAL'));
    const nameIdx = headers.findIndex(h => h.includes('NAME'));
    const rankIdx = headers.findIndex(h => h.includes('RANK'));
    const genderIdx = headers.findIndex(h => h.includes('GENDER') || h.includes('SEX'));
    const tribeIdx = headers.findIndex(h => h.includes('TRIBE') || h.includes('ETHNICITY'));
    const yearOfBirthIdx = headers.findIndex(h => h.includes('Y.O.B') || h.includes('YEAR OF BIRTH') || h.includes('DATE OF BIRTH'));
    const academicIdx = headers.findIndex(h => h.includes('ACADEMIC') || h.includes('EDUCATION'));
    const professionalIdx = headers.findIndex(h => h.includes('PROFESSIONAL'));
    const enlistIdx = headers.findIndex(h => h.includes('ENLIST') || h.includes('APPOINT'));
    const datePostedIdx = headers.findIndex(h => h.includes('DATE POSTED'));
    const areaIdx = headers.findIndex(h => h.includes('DEPLOY') || h.includes('SECTION') || h.includes('AREA'));
    const countyIdx = headers.findIndex(h => h.includes('HOME COUNTY'));
    const stationIdx = headers.findIndex(h => h.includes('STATION'));

    if (pfIdx === -1 || nameIdx === -1) {
        throw new Error(`Required columns not found. Detected headers: ${headers.join(', ')}`);
    }

    const defaultStation = customStation || getSettings().station_name;
    const insertStmt = db.prepare(`
        INSERT INTO nominal_roll (serial_no, pf_no, name, current_rank, gender, ethnicity, year_of_birth, academic_qualification, professional_qualification, date_of_enlistment, date_posted, section_deployed, home_county, station)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(pf_no) DO UPDATE SET
            serial_no = excluded.serial_no,
            name = excluded.name,
            current_rank = excluded.current_rank,
            gender = excluded.gender,
            ethnicity = excluded.ethnicity,
            year_of_birth = excluded.year_of_birth,
            academic_qualification = excluded.academic_qualification,
            professional_qualification = excluded.professional_qualification,
            date_of_enlistment = excluded.date_of_enlistment,
            date_posted = excluded.date_posted,
            section_deployed = excluded.section_deployed,
            home_county = excluded.home_county,
            station = excluded.station
    `);

    let importedCount = 0;
    const transaction = db.transaction((records) => {
        for (const row of records) {
            const pf = row[pfIdx] ? String(row[pfIdx]).trim() : null;
            const name = row[nameIdx] ? String(row[nameIdx]).trim() : null;
            if (!pf || !name || pf.length < 2) continue;

            const serialNo = serialIdx !== -1 && row[serialIdx] ? Number(row[serialIdx]) || null : null;
            const rank = rankIdx !== -1 && row[rankIdx] ? normalizeRank(row[rankIdx]) : 'PC';
            const gender = genderIdx !== -1 && row[genderIdx] ? String(row[genderIdx]).trim().toUpperCase() : 'MALE';
            const ethnicity = tribeIdx !== -1 && row[tribeIdx] ? String(row[tribeIdx]).trim().toUpperCase() : '';
            const yearOfBirth = yearOfBirthIdx !== -1 && row[yearOfBirthIdx] ? String(row[yearOfBirthIdx]).trim() : null;
            const academic = academicIdx !== -1 && row[academicIdx] ? String(row[academicIdx]).trim() : '';
            const professional = professionalIdx !== -1 && row[professionalIdx] ? String(row[professionalIdx]).trim() : '';
            const enlistment = enlistIdx !== -1 ? parseExcelDate(row[enlistIdx]) : null;
            const datePosted = datePostedIdx !== -1 ? parseExcelDate(row[datePostedIdx]) : null;
            const area = areaIdx !== -1 && row[areaIdx] ? String(row[areaIdx]).trim().toUpperCase() : 'GENERAL DUTIES';
            const homeCounty = countyIdx !== -1 && row[countyIdx] ? String(row[countyIdx]).trim().toUpperCase() : '';
            const station = stationIdx !== -1 && row[stationIdx] ? String(row[stationIdx]).trim().toUpperCase() : defaultStation;

            insertStmt.run(serialNo, pf, name, rank, gender, ethnicity, yearOfBirth, academic, professional, enlistment, datePosted, area, homeCounty, station);
            importedCount++;
        }
    });

    transaction(dataRows);
    return { success: true, count: importedCount, message: `Successfully imported ${importedCount} officers into Nominal Roll.` };
}

// --- APPLICATIONS & DISCIPLINARY SERVICES ---
function getApplications(filters = {}) {
    let query = `
        SELECT a.*, 
               n.*,
               s.total_score, s.evaluated_at
        FROM applications a
        JOIN nominal_roll n ON a.pf_no = n.pf_no
        LEFT JOIN interview_scores s ON a.pf_no = s.pf_no
        WHERE a.applied = 1
    `;
    const params = [];

    if (filters.rankAppliedFor && filters.rankAppliedFor !== 'ALL') {
        query += ' AND a.rank_applied_for = ?';
        params.push(filters.rankAppliedFor);
    }

    if (filters.qualifiedOnly) {
        query += ' AND a.is_qualified = 1';
    }

    if (filters.search) {
        query += ' AND (a.pf_no LIKE ? OR n.name LIKE ?)';
        const term = `%${filters.search.trim()}%`;
        params.push(term, term);
    }

    query += ' ORDER BY a.application_id DESC';
    return db.prepare(query).all(...params).map(row => {
        const eligibility = calculateOfficerEligibility(row, row);
        return {
            ...row,
            current_rank: normalizeRank(row.current_rank),
            rank_applied_for: normalizeRank(row.rank_applied_for),
            ...eligibility,
            is_qualified: eligibility.eligibility_status === 'ELIGIBLE' ? 1 : 0
        };
    });
}

function loadAllNominalRollApplications(rankAppliedFor) {
    const officers = [];
    const insert = db.prepare(`INSERT INTO applications (pf_no, applied, rank_applied_for, offences_count, clean_record_3yrs, is_qualified, disqualification_reason) VALUES (?, 0, ?, 0, 1, 1, 'Not marked as applied')`);
    db.transaction(() => officers.forEach(officer => insert.run(officer.pf_no, getNextRank(officer.current_rank) || String(rankAppliedFor || '').toUpperCase())))();
    const applications = db.prepare('SELECT a.pf_no, n.current_rank FROM applications a JOIN nominal_roll n ON n.pf_no = a.pf_no').all();
    const updateRank = db.prepare('UPDATE applications SET rank_applied_for = ? WHERE pf_no = ?');
    applications.forEach(officer => updateRank.run(getNextRank(officer.current_rank) || String(rankAppliedFor || '').toUpperCase(), officer.pf_no));

    return {
        success: true,
        added: officers.length,
        total: db.prepare('SELECT count(*) AS count FROM applications').get().count,
        message: `Loaded ${officers.length} new officers from the Nominal Roll. Existing applications were preserved.`
    };
}

function selectNominalRollApplicants(pfNumbers) {
    const selected = [...new Set((Array.isArray(pfNumbers) ? pfNumbers : []).map(value => String(value).trim()).filter(Boolean))];
    const officers = selected.length ? db.prepare(`
            SELECT * FROM nominal_roll
            WHERE pf_no IN (${selected.map(() => '?').join(',')})
                AND NOT EXISTS (SELECT 1 FROM applications WHERE applications.pf_no = nominal_roll.pf_no AND applications.applied = 1)
    `).all(...selected) : [];
    const insert = db.prepare(`INSERT INTO applications (pf_no, applied, rank_applied_for, offences_count, clean_record_3yrs, is_qualified, disqualification_reason) VALUES (?, 1, ?, 0, 1, 1, 'Pending eligibility details') ON CONFLICT(pf_no) DO UPDATE SET applied = 1, rank_applied_for = excluded.rank_applied_for`);
    db.transaction(() => officers.forEach(officer => insert.run(officer.pf_no, getNextRank(officer.current_rank) || '')))();
    return { success: true, added: officers.length, message: `${officers.length} officer(s) added to the application list.` };
}

function updateApplicationApplied(pfNo, applied, rankAppliedFor) {
    const officer = db.prepare('SELECT current_rank FROM nominal_roll WHERE pf_no = ?').get(String(pfNo));
    if (!officer) throw new Error('Officer is not in the Nominal Roll.');
    const rank = String(rankAppliedFor || getNextRank(officer.current_rank)).trim().toUpperCase();
    db.prepare('UPDATE applications SET applied = ?, rank_applied_for = ? WHERE pf_no = ?').run(applied ? 1 : 0, rank, String(pfNo));
    return { success: true };
}

function generateEligibilityLists() {
    const rows = getApplications({});
    const groups = {
        qualifiedApplied: rows.filter(row => row.applied === 1 && row.eligibility_status === 'ELIGIBLE'),
        notQualifiedApplied: rows.filter(row => row.applied === 1 && row.eligibility_status !== 'ELIGIBLE'),
        qualifiedNotApplied: rows.filter(row => row.applied !== 1 && row.eligibility_status === 'ELIGIBLE')
    };
    const tables = [
        ['qualified_applied_officers', groups.qualifiedApplied],
        ['not_qualified_applied_officers', groups.notQualifiedApplied],
        ['qualified_not_applied_officers', groups.qualifiedNotApplied]
    ];
    const transaction = db.transaction(() => {
        for (const [table, items] of tables) {
            db.exec(`DELETE FROM ${table}`);
            const columns = ['pf_no', 'applied', 'rank_applied_for', 'date_last_promotion', 'offences_count', 'date_of_last_offence', 'clean_record_3yrs', 'is_qualified', 'disqualification_reason'];
            const insert = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`);
            items.forEach(item => insert.run(...columns.map(column => item[column] ?? null)));
        }
    });
    transaction();
    return { success: true, counts: { qualifiedApplied: groups.qualifiedApplied.length, notQualifiedApplied: groups.notQualifiedApplied.length, qualifiedNotApplied: groups.qualifiedNotApplied.length } };
}

function exportEligibilityListsToExcel(filePath) {
    const lists = generateEligibilityLists();
    const settings = getSettings();
    const definitions = [
        ['Eligible Applicants', 'qualified_applied_officers'],
        ['Ineligible Applicants', 'not_qualified_applied_officers'],
        ['Eligible Non-Applicants', 'qualified_not_applied_officers']
    ];
    const workbook = xlsx.utils.book_new();
    for (const [sheetName, table] of definitions) {
        const rows = db.prepare(`
            SELECT g.pf_no AS 'PF Number', n.name AS 'Candidate Name', n.current_rank AS 'Current Rank',
                   g.rank_applied_for AS 'Rank Applied For', g.date_last_promotion AS 'Date Last Promoted',
                   g.offences_count AS 'Offences Count', g.date_of_last_offence AS 'Date of Last Offence',
                   CASE WHEN g.is_qualified = 1 THEN 'ELIGIBLE' ELSE 'NOT ELIGIBLE' END AS 'Eligibility Status',
                   g.disqualification_reason AS 'Reason / Notes'
            FROM ${table} g LEFT JOIN nominal_roll n ON n.pf_no = g.pf_no
            ORDER BY g.rank_applied_for, n.name
        `).all();
        const worksheet = xlsx.utils.json_to_sheet(rows);
        worksheet['!cols'] = [14, 28, 16, 22, 18, 15, 20, 20, 45].map(wch => ({ wch }));
        xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    }
    xlsx.writeFile(workbook, filePath);
    return {
        success: true,
        counts: lists.counts,
        message: `Eligibility lists for ${settings.station_name} were exported to Excel.`
    };
}

function saveApplication(appData) {
    const pf = String(appData.pf_no).trim();
    const existingApplication = db.prepare('SELECT applied FROM applications WHERE pf_no = ?').get(pf);
    const applied = appData.applied !== undefined ? (appData.applied ? 1 : 0) : (existingApplication?.applied || 0);
    const rankApplied = normalizeRank(appData.rank_applied_for || 'CPL');
    const offences = parseInt(appData.offences_count, 10) || 0;
    const lastOffenceDate = parseExcelDate(appData.date_of_last_offence);
    const lastPromotionDate = parseExcelDate(appData.date_last_promotion);

    const criteria = getEligibilityCriteria();
    const evalResult = evaluateDisciplinary(offences, lastOffenceDate, criteria.cutoffDate);

    const existingOfficer = db.prepare('SELECT pf_no FROM nominal_roll WHERE pf_no = ?').get(pf);
    if (!existingOfficer) {
        const officerName = (appData.name || `Officer ${pf}`).trim().toUpperCase();
        db.prepare(`
            INSERT INTO nominal_roll (pf_no, name, current_rank, station)
            VALUES (?, ?, ?, ?)
        `).run(pf, officerName, appData.current_rank || 'PC', appData.station || getSettings().station_name);
    } else if (appData.station) {
        db.prepare('UPDATE nominal_roll SET station = ? WHERE pf_no = ?').run(appData.station.trim().toUpperCase(), pf);
    }

    const officer = db.prepare('SELECT * FROM nominal_roll WHERE pf_no = ?').get(pf);
    const eligibility = calculateOfficerEligibility(officer, {
        date_last_promotion: lastPromotionDate,
        offences_count: offences,
        date_of_last_offence: lastOffenceDate
    }, criteria);
    
    const isQualified = eligibility.eligibility_status === 'ELIGIBLE' ? 1 : 0;
    const disqualReason = eligibility.disqualification_reason;

    const stmt = db.prepare(`
        INSERT INTO applications (
            pf_no, applied, rank_applied_for, date_last_promotion, offences_count, date_of_last_offence,
            clean_record_3yrs, is_qualified, disqualification_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(pf_no) DO UPDATE SET
            applied = excluded.applied,
            rank_applied_for = excluded.rank_applied_for,
            date_last_promotion = excluded.date_last_promotion,
            offences_count = excluded.offences_count,
            date_of_last_offence = excluded.date_of_last_offence,
            clean_record_3yrs = excluded.clean_record_3yrs,
            is_qualified = excluded.is_qualified,
            disqualification_reason = excluded.disqualification_reason
    `);

    stmt.run(pf, applied, rankApplied, lastPromotionDate, offences, lastOffenceDate, evalResult.cleanRecord3yrs, isQualified, disqualReason);

    return {
        success: true,
        message: `Application for PF ${pf} (${rankApplied}) saved. Status: ${isQualified ? 'Qualified' : 'Disqualified'}.`,
        is_qualified: isQualified
    };
}

function updateApplicationField(pfNo, field, value) {
    if (field === 'pf_no') {
        const newPf = String(value).trim();
        if (!newPf || newPf === String(pfNo)) return { success: true };
        
        const existing = db.prepare('SELECT pf_no FROM nominal_roll WHERE pf_no = ?').get(newPf);
        if (existing) throw new Error(`PF Number ${newPf} already exists. Conflict detected.`);

        db.transaction(() => {
            const old = db.prepare('SELECT * FROM nominal_roll WHERE pf_no = ?').get(String(pfNo));
            if (old) {
                db.prepare(`INSERT INTO nominal_roll (serial_no, pf_no, name, current_rank, gender, ethnicity, year_of_birth, academic_qualification, professional_qualification, date_of_enlistment, date_posted, section_deployed, home_county, station) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(old.serial_no, newPf, old.name, old.current_rank, old.gender, old.ethnicity, old.year_of_birth, old.academic_qualification, old.professional_qualification, old.date_of_enlistment, old.date_posted, old.section_deployed, old.home_county, old.station);
                db.prepare('UPDATE applications SET pf_no = ? WHERE pf_no = ?').run(newPf, String(pfNo));
                db.prepare('UPDATE interview_scores SET pf_no = ? WHERE pf_no = ?').run(newPf, String(pfNo));
                db.prepare('UPDATE regional_candidates SET pf_no = ? WHERE pf_no = ?').run(newPf, String(pfNo));
                db.prepare('DELETE FROM nominal_roll WHERE pf_no = ?').run(String(pfNo));
            }
        })();
        return { success: true };
    }

    const allowedFields = ['date_last_promotion', 'offences_count', 'date_of_last_offence'];
    if (!allowedFields.includes(field)) throw new Error('That application field cannot be edited.');
    
    const application = db.prepare('SELECT * FROM applications WHERE pf_no = ?').get(String(pfNo));
    if (!application) throw new Error('Application record not found.');
    
    const values = {
        date_last_promotion: application.date_last_promotion,
        offences_count: application.offences_count,
        date_of_last_offence: application.date_of_last_offence
    };
    values[field] = field === 'offences_count' ? Math.max(0, parseInt(value, 10) || 0) : parseExcelDate(value);
    
    saveApplication({
        pf_no: application.pf_no,
        applied: application.applied,
        rank_applied_for: application.rank_applied_for,
        date_last_promotion: values.date_last_promotion,
        offences_count: values.offences_count,
        date_of_last_offence: values.date_of_last_offence
    });
    return { success: true };
}

function deleteApplication(pf_no) {
    db.prepare('DELETE FROM applications WHERE pf_no = ?').run(pf_no);
    return { success: true, message: `Application for PF ${pf_no} removed.` };
}

function importApplicationsFromExcel(filePath, rankAppliedFor, customStation) {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    let count = 0;
    let newNominalStubs = 0;
    const criteria = getEligibilityCriteria();

    const transaction = db.transaction((items) => {
        for (const item of items) {
            const pfKey = Object.keys(item).find(k => {
                const upper = k.toUpperCase();
                return upper.includes('PF') || upper.includes('SERVICE') || upper.includes('P/NO');
            });
            if (!pfKey || !item[pfKey]) continue;

            const pf = String(item[pfKey]).trim();
            if (pf.length < 2) continue;

            const nameKey = Object.keys(item).find(k => k.toUpperCase().includes('NAME'));
            const name = nameKey && item[nameKey] ? String(item[nameKey]).trim().toUpperCase() : null;

            const rankKey = Object.keys(item).find(k => k.toUpperCase() === 'RANK' || k.toUpperCase().includes('CURRENT RANK'));
            const currentRank = rankKey && item[rankKey] ? normalizeRank(item[rankKey]) : 'PC';

            const targetRank = (rankAppliedFor === 'AUTO' || !rankAppliedFor) 
                ? (getNextRank(currentRank) || currentRank) 
                : normalizeRank(rankAppliedFor);

            const officerExists = db.prepare('SELECT pf_no FROM nominal_roll WHERE pf_no = ?').get(pf);
            if (!officerExists) {
                db.prepare(`
                    INSERT INTO nominal_roll (pf_no, name, current_rank, station)
                    VALUES (?, ?, ?, ?)
                `).run(pf, name || `PF ${pf}`, currentRank, customStation || getSettings().station_name);
                newNominalStubs++;
            } else if (customStation) {
                db.prepare('UPDATE nominal_roll SET station = ? WHERE pf_no = ?').run(customStation, pf);
            }

            const offencesKey = Object.keys(item).find(k => k.toUpperCase().includes('DISCIPLINARY') || k.toUpperCase().includes('OFFENCE'));
            const lastOffenceKey = Object.keys(item).find(k => k.toUpperCase().includes('LAST OFFENCE') || k.toUpperCase().includes('DATE OF OFFENCE'));
            const lastPromotionKey = Object.keys(item).find(k => k.toUpperCase().includes('LAST PROMOT'));

            let offences = 0;
            if (offencesKey && item[offencesKey] && String(item[offencesKey]).toLowerCase() !== 'nil') {
                offences = parseInt(item[offencesKey], 10) || 0;
            }

            let lastOffenceDate = null;
            if (lastOffenceKey && item[lastOffenceKey]) {
                lastOffenceDate = parseExcelDate(item[lastOffenceKey]);
            }
            const lastPromotionDate = lastPromotionKey && item[lastPromotionKey] ? parseExcelDate(item[lastPromotionKey]) : null;

            const evalResult = evaluateDisciplinary(offences, lastOffenceDate, criteria.cutoffDate);
            const officer = db.prepare('SELECT * FROM nominal_roll WHERE pf_no = ?').get(pf);
            const eligibility = calculateOfficerEligibility(officer, {
                date_last_promotion: lastPromotionDate,
                offences_count: offences,
                date_of_last_offence: lastOffenceDate
            }, criteria);

            db.prepare(`
                INSERT INTO applications (
                    pf_no, applied, rank_applied_for, date_last_promotion, offences_count, date_of_last_offence,
                    clean_record_3yrs, is_qualified, disqualification_reason
                ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(pf_no) DO UPDATE SET
                    applied = 1,
                    rank_applied_for = excluded.rank_applied_for,
                    date_last_promotion = excluded.date_last_promotion,
                    offences_count = excluded.offences_count,
                    date_of_last_offence = excluded.date_of_last_offence,
                    clean_record_3yrs = excluded.clean_record_3yrs,
                    is_qualified = excluded.is_qualified,
                    disqualification_reason = excluded.disqualification_reason
            `).run(pf, targetRank, lastPromotionDate, offences, lastOffenceDate, evalResult.cleanRecord3yrs, eligibility.eligibility_status === 'ELIGIBLE' ? 1 : 0, eligibility.disqualification_reason);

            count++;
        }
    });

    transaction(rawData);
    return {
        success: true,
        count,
        newNominalStubs,
        message: `Successfully processed ${count} applications.`
    };
}

// --- INTERVIEW SCORING SERVICES ---
function getCandidatesForScoring(rankAppliedFor) {
    let query = `
        SELECT a.pf_no, a.rank_applied_for, a.offences_count, a.date_of_last_offence, a.clean_record_3yrs, a.is_qualified,
               n.name, n.current_rank, n.gender, n.ethnicity, n.station, n.section_deployed, n.date_of_enlistment,
               s.score_id, s.education_score, s.service_score, s.turnout_score,
               s.knowledge_score, s.current_affairs_score, s.clean_record_score,
               s.commendations_score, s.total_score, s.remarks, s.evaluated_at
        FROM applications a
        JOIN nominal_roll n ON a.pf_no = n.pf_no
        LEFT JOIN interview_scores s ON a.pf_no = s.pf_no
        WHERE a.is_qualified = 1 AND a.applied = 1
    `;
    const params = [];

    if (rankAppliedFor && rankAppliedFor !== 'ALL') {
        query += ' AND a.rank_applied_for = ?';
        params.push(rankAppliedFor);
    }

    query += ' ORDER BY n.name ASC';
    return db.prepare(query).all(...params);
}

function getCandidateScore(pf_no) {
    const query = `
        SELECT a.pf_no, a.rank_applied_for, a.offences_count, a.date_of_last_offence, a.clean_record_3yrs, a.is_qualified,
               n.name, n.current_rank, n.gender, n.ethnicity, n.station, n.section_deployed, n.date_of_enlistment,
               s.score_id, s.education_score, s.service_score, s.turnout_score,
               s.knowledge_score, s.current_affairs_score, s.clean_record_score,
               s.commendations_score, s.total_score, s.remarks, s.evaluated_at
        FROM applications a
        JOIN nominal_roll n ON a.pf_no = n.pf_no
        LEFT JOIN interview_scores s ON a.pf_no = s.pf_no
        WHERE a.pf_no = ?
    `;
    return db.prepare(query).get(pf_no);
}

function saveInterviewScore(data) {
    const pf = String(data.pf_no).trim();
    const rankApplied = String(data.rank_applied_for).trim().toUpperCase();

    const template = getScoringTemplate();
    const scores = Object.fromEntries(template.criteria.map(item => {
        const supplied = Math.max(0, parseFloat(data[`${item.key}_score`]) || 0);
        if (supplied > item.max) throw new Error(`${item.label} cannot exceed ${item.max} marks.`);
        return [item.key, supplied];
    }));
    const { education: edu, service: srv, turnout: trn, knowledge: knw, current_affairs: cur, clean_record: cln, commendations: com } = scores;
    const remarks = (data.remarks || '').trim();

    const total = parseFloat((edu + srv + trn + knw + cur + cln + com).toFixed(2));

    const stmt = db.prepare(`
        INSERT INTO interview_scores (
            pf_no, rank_applied_for, education_score, service_score, turnout_score,
            knowledge_score, current_affairs_score, clean_record_score, commendations_score,
            total_score, remarks, evaluated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(pf_no) DO UPDATE SET
            rank_applied_for = excluded.rank_applied_for,
            education_score = excluded.education_score,
            service_score = excluded.service_score,
            turnout_score = excluded.turnout_score,
            knowledge_score = excluded.knowledge_score,
            current_affairs_score = excluded.current_affairs_score,
            clean_record_score = excluded.clean_record_score,
            commendations_score = excluded.commendations_score,
            total_score = excluded.total_score,
            remarks = excluded.remarks,
            evaluated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(pf, rankApplied, edu, srv, trn, knw, cur, cln, com, total, remarks);

    return {
        success: true,
        pf_no: pf,
        total_score: total,
        message: `Score for PF ${pf} recorded successfully with Total: ${total} marks.`
    };
}

async function exportInterviewScoreSheets(filePath, filters = {}) {
    let docx;
    try {
        docx = require('docx');
    } catch (err) {
        throw new Error("The 'docx' library is not installed. Please run 'npm install docx' in the app terminal.");
    }

    const {
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        WidthType, AlignmentType, VerticalAlign, BorderStyle, ImageRun
    } = docx;

    const scope = filters.scope || 'all';
    let candidates;
    if (scope === 'candidate') {
        candidates = getCandidatesForScoring('ALL').filter(c => c.pf_no === filters.pf_no);
    } else if (scope === 'rank') {
        candidates = getCandidatesForScoring(filters.rankAppliedFor);
    } else {
        candidates = getCandidatesForScoring('ALL');
    }

    if (!candidates.length) {
        throw new Error('No qualified applicants were found for this export choice.');
    }

    const settings = getSettings();
    const template = getScoringTemplate();
    const crestPath = path.join(__dirname, '..', 'image1.jpg');

    const monthNames = ['', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const promoMonth = monthNames[parseInt(settings.promotion_month, 10) || 1] || 'JANUARY';
    const promoYear = settings.promotion_year || '2026';

    const sections = [];

    const cellBorderConfig = {
        top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
        left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
    };

    const makeMatrixCell = (text, widthPercent, bold = false, align = AlignmentType.LEFT) => {
        return new TableCell({
            width: { size: widthPercent, type: WidthType.PERCENTAGE },
            borders: cellBorderConfig,
            verticalAlign: VerticalAlign.CENTER,
            children: [
                new Paragraph({
                    alignment: align,
                    spacing: { before: 80, after: 80 },
                    children: [new TextRun({ text: String(text || ' ').replace(/[\r\n\t\x00-\x1F]/g, ' '), bold, size: 24, font: 'Times New Roman' })]
                })
            ]
        });
    };

    for (const candidate of candidates) {
        let stationName = String(candidate.station || settings.station_name || '').trim().toUpperCase();
        if (stationName && !stationName.includes('PRISON') && !stationName.includes('COMMAND') && !stationName.includes('HQ')) {
            stationName = `${stationName} PRISON`;
        }
        if (!stationName) stationName = 'EMBU MAIN PRISON';
        
        let stationHeader = `${stationName} INTERVIEW`;
        const targetRank = String(candidate.rank_applied_for || 'CPL').toUpperCase();

        const children = [];

        if (fs.existsSync(crestPath)) {
            try {
                const imageBuffer = fs.readFileSync(crestPath);
                children.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 0, before: 0 },
                        children: [
                            new ImageRun({
                                data: imageBuffer,
                                transformation: { width: 100, height: 100 },
                                type: 'jpg'
                            })
                        ]
                    })
                );
            } catch (err) {
                console.warn('Could not embed crest image:', err.message);
            }
        }

        const addHeading = (text, spaceAfter = 0) => {
            children.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: spaceAfter, before: 0 },
                    children: [new TextRun({ text: String(text || ' ').replace(/[\r\n\t\x00-\x1F]/g, ' '), bold: true, size: 24, font: 'Times New Roman' })]
                })
            );
        };

        addHeading('KENYA PRISONS SERVICE');
        addHeading(stationHeader);
        addHeading(`${promoMonth} ${promoYear} PROMOTIONAL INTERVIEWS SCORE SHEET`, 150);

        children.push(
            new Paragraph({
                spacing: { after: 100, before: 0 },
                children: [
                    new TextRun({ text: 'RANK APPLIED FOR: ', size: 24, font: 'Times New Roman' }),
                    new TextRun({ text: targetRank, size: 24, font: 'Times New Roman' })
                ]
            })
        );

        const makeProfileCell = (label, val) => new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorderConfig,
            children: [
                new Paragraph({
                    spacing: { before: 60, after: 60, left: 60, right: 60 },
                    children: [
                        new TextRun({ text: `${label}: `, size: 24, font: 'Times New Roman' }),
                        new TextRun({ text: String(val || ' ').replace(/[\r\n\t\x00-\x1F]/g, ' '), bold: true, size: 24, font: 'Times New Roman' })
                    ]
                })
            ]
        });

        children.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            makeProfileCell('PF/NO', candidate.pf_no),
                            makeProfileCell('RANK', candidate.current_rank)
                        ]
                    }),
                    new TableRow({
                        children: [
                            makeProfileCell('NAME', candidate.name),
                            makeProfileCell('SECTION DEPLOYED', candidate.section_deployed)
                        ]
                    }),
                    new TableRow({
                        children: [
                            makeProfileCell('GENDER', candidate.gender),
                            makeProfileCell('ETHNICITY', candidate.ethnicity)
                        ]
                    })
                ]
            })
        );

        children.push(new Paragraph({ spacing: { after: 150, before: 0 }, children: [new TextRun({ text: ' ' })] }));

        const rubricRows = [
            new TableRow({
                children: [
                    makeMatrixCell('S/NO', 8, true, AlignmentType.LEFT),
                    makeMatrixCell('VARIABLE', 62, true, AlignmentType.LEFT),
                    makeMatrixCell('MARKS', 15, true, AlignmentType.LEFT),
                    makeMatrixCell('MARKS AWARDED', 15, true, AlignmentType.LEFT)
                ]
            })
        ];

        let totalMax = 0;
        template.criteria.forEach((item, idx) => {
            totalMax += Number(item.max) || 0;
            
            const awardedScore = (candidate[`${item.key}_score`] !== undefined && candidate[`${item.key}_score`] !== null) 
                ? String(candidate[`${item.key}_score`]) 
                : ' ';

            rubricRows.push(
                new TableRow({
                    children: [
                        makeMatrixCell(String(idx + 1), 8, false, AlignmentType.LEFT),
                        makeMatrixCell(String(item.label || '').toUpperCase(), 62, false, AlignmentType.LEFT),
                        makeMatrixCell(String(item.max), 15, false, AlignmentType.LEFT),
                        makeMatrixCell(awardedScore, 15, true, AlignmentType.LEFT)
                    ]
                })
            );
        });

        const finalScoreStr = (candidate.total_score !== undefined && candidate.total_score !== null) 
            ? String(candidate.total_score) 
            : ' ';

        rubricRows.push(
            new TableRow({
                children: [
                    new TableCell({
                        columnSpan: 2,
                        borders: cellBorderConfig,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                spacing: { before: 80, after: 80, left: 60, right: 60 },
                                children: [new TextRun({ text: 'TOTAL MARKS 100%', size: 24, font: 'Times New Roman' })]
                            })
                        ]
                    }),
                    makeMatrixCell('TOTAL MARKS 100%', 15, false, AlignmentType.LEFT),
                    makeMatrixCell(finalScoreStr, 15, true, AlignmentType.LEFT)
                ]
            })
        );

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rubricRows }));
        children.push(new Paragraph({ spacing: { after: 150, before: 0 }, children: [new TextRun({ text: ' ' })] }));

        children.push(
            new Paragraph({
                spacing: { after: 40, before: 0 },
                children: [
                    new TextRun({ text: 'APPENDIX 01: EDUCATION', bold: true, size: 24, font: 'Times New Roman' })
                ]
            })
        );

        const eduTableRows = (template.educationAppendix || []).map(edu => new TableRow({
            children: [
                new TableCell({
                    borders: cellBorderConfig,
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            spacing: { before: 30, after: 30, left: 60, right: 60 },
                            children: [new TextRun({ text: String(edu.qualification || ' ').replace(/[\r\n\t\x00-\x1F]/g, ' '), size: 24, font: 'Times New Roman' })]
                        })
                    ]
                }),
                new TableCell({
                    borders: cellBorderConfig,
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            spacing: { before: 30, after: 30, left: 60, right: 60 },
                            children: [new TextRun({ text: `- ${edu.marks} MARKS`, size: 24, font: 'Times New Roman' })]
                        })
                    ]
                })
            ]
        }));

        if (eduTableRows.length > 0) {
            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: eduTableRows }));
        }

        children.push(new Paragraph({ spacing: { after: 150, before: 0 }, children: [new TextRun({ text: ' ' })] }));

        children.push(
            new Paragraph({
                spacing: { after: 0, before: 0 },
                children: [
                    new TextRun({ text: 'APPENDIX 02: LENGTH OF SERVICE', bold: true, size: 24, font: 'Times New Roman' })
                ]
            })
        );

        children.push(
            new Paragraph({
                spacing: { after: 200, before: 0 },
                children: [
                    new TextRun({ text: String(template.serviceAppendix || '1 mark for every year of service, up to 18 marks.').replace(/[\r\n\t\x00-\x1F]/g, ' '), size: 24, font: 'Times New Roman' })
                ]
            })
        );

        children.push(
            new Paragraph({
                spacing: { after: 0, before: 0 },
                children: [
                    new TextRun({ text: `CHAIRMAN SIGNATURE: ____________________        DATE: ____________________`, size: 24, font: 'Times New Roman' })
                ]
            })
        );

        for (let i = 0; i < 4; i++) {
            children.push(
                new Paragraph({
                    spacing: { after: 0, before: 0 },
                    children: [
                        new TextRun({ text: `MEMBER SIGNATURE: ______________________        DATE: ____________________`, size: 24, font: 'Times New Roman' })
                    ]
                })
            );
        }

        sections.push({
            properties: {
                page: {
                    margin: { top: 720, bottom: 720, left: 1080, right: 1080 } 
                }
            },
            children
        });
    }

    const doc = new Document({ sections });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    return {
        success: true,
        count: candidates.length,
        message: `${candidates.length} score sheet(s) successfully exported to Word.`
    };
}

async function exportRegionalScoreSheets(filePath, filters = {}) {
    let docx;
    try { docx = require('docx'); } catch (err) { throw new Error("The 'docx' library is not installed."); }
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, VerticalAlign, BorderStyle, ImageRun } = docx;

    const scope = filters.scope || 'all';
    
    let candidates = getRegionalCandidates({ boardType: 'STATION' }).filter(c => c.selected_for_regional === 1);
    
    if (scope === 'candidate') {
        candidates = candidates.filter(c => c.pf_no === filters.pf_no);
    } else {
        if (filters.rankAppliedFor && filters.rankAppliedFor !== 'ALL') {
            candidates = candidates.filter(c => c.rank_applied_for === filters.rankAppliedFor);
        }
        if (filters.boardNumber && filters.boardNumber !== 'ALL') {
            if (filters.boardNumber === 'UNASSIGNED') {
                candidates = candidates.filter(c => !c.board_number);
            } else {
                candidates = candidates.filter(c => String(c.board_number) === String(filters.boardNumber));
            }
        }
    }

    if (!candidates.length) throw new Error('No qualified regional applicants were found for this export choice.');

    const settings = getSettings();
    const template = getScoringTemplate();
    const crestPath = path.join(__dirname, '..', 'image1.jpg');
    const monthNames = ['', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const promoMonth = monthNames[parseInt(settings.promotion_month, 10) || 1] || 'JANUARY';
    const promoYear = settings.promotion_year || '2026';
    const sections = [];

    const cellBorderConfig = { top: { style: BorderStyle.SINGLE, size: 4, color: '000000' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' }, left: { style: BorderStyle.SINGLE, size: 4, color: '000000' }, right: { style: BorderStyle.SINGLE, size: 4, color: '000000' } };
    const makeMatrixCell = (text, widthPercent, bold = false, align = AlignmentType.LEFT) => new TableCell({ width: { size: widthPercent, type: WidthType.PERCENTAGE }, borders: cellBorderConfig, verticalAlign: VerticalAlign.CENTER, children: [ new Paragraph({ alignment: align, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: String(text || ' ').replace(/[\r\n\t\x00-\x1F]/g, ' '), bold, size: 24, font: 'Times New Roman' })] }) ] });

    for (const candidate of candidates) {
        const targetRank = String(candidate.rank_applied_for || 'CPL').toUpperCase();
        const children = [];

        if (fs.existsSync(crestPath)) {
            try {
                const imageBuffer = fs.readFileSync(crestPath);
                children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, before: 0 }, children: [new ImageRun({ data: imageBuffer, transformation: { width: 100, height: 100 }, type: 'jpg' })] }));
            } catch (err) {}
        }

        const addHeading = (text, spaceAfter = 0) => { children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: spaceAfter, before: 0 }, children: [new TextRun({ text: String(text || ' ').replace(/[\r\n\t\x00-\x1F]/g, ' '), bold: true, size: 24, font: 'Times New Roman' })] })); };

        addHeading('KENYA PRISONS SERVICE');
        addHeading('REGIONAL PROMOTION BOARD INTERVIEW');
        addHeading(`${promoMonth} ${promoYear} PROMOTIONAL INTERVIEWS SCORE SHEET`, 150);

        children.push(
            new Paragraph({
                spacing: { after: 100, before: 0 },
                children: [
                    new TextRun({ text: 'RANK APPLIED FOR: ', size: 24, font: 'Times New Roman' }),
                    new TextRun({ text: targetRank + '        ', size: 24, font: 'Times New Roman' }),
                    new TextRun({ text: 'BOARD NO: ', size: 24, font: 'Times New Roman' }),
                    new TextRun({ text: (candidate.board_number || '____') + '        ', bold: true, size: 24, font: 'Times New Roman' }),
                    new TextRun({ text: 'DATE: ', size: 24, font: 'Times New Roman' }),
                    new TextRun({ text: candidate.interview_date || '__________________', bold: true, size: 24, font: 'Times New Roman' })
                ]
            })
        );

        const makeProfileCell = (label, val) => new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: cellBorderConfig, children: [ new Paragraph({ spacing: { before: 60, after: 60, left: 60, right: 60 }, children: [ new TextRun({ text: `${label}: `, size: 24, font: 'Times New Roman' }), new TextRun({ text: String(val || ' ').replace(/[\r\n\t\x00-\x1F]/g, ' '), bold: true, size: 24, font: 'Times New Roman' }) ] }) ] });

        children.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [ makeProfileCell('PF/NO', candidate.pf_no), makeProfileCell('RANK', candidate.current_rank) ] }),
                    new TableRow({ children: [ makeProfileCell('NAME', candidate.name), makeProfileCell('STATION', candidate.station) ] }),
                    new TableRow({ children: [ makeProfileCell('GENDER', candidate.gender), makeProfileCell('ETHNICITY', candidate.ethnicity) ] })
                ]
            })
        );

        children.push(new Paragraph({ spacing: { after: 150, before: 0 }, children: [new TextRun({ text: ' ' })] }));

        const rubricRows = [ new TableRow({ children: [ makeMatrixCell('S/NO', 8, true), makeMatrixCell('VARIABLE', 62, true), makeMatrixCell('MARKS', 15, true), makeMatrixCell('MARKS AWARDED', 15, true) ] }) ];

        template.criteria.forEach((item, idx) => {
            const awardedScore = (candidate[`${item.key}_score`] !== undefined && candidate[`${item.key}_score`] !== null) ? String(candidate[`${item.key}_score`]) : ' ';
            rubricRows.push(new TableRow({ children: [ makeMatrixCell(String(idx + 1), 8), makeMatrixCell(String(item.label || '').toUpperCase(), 62), makeMatrixCell(String(item.max), 15), makeMatrixCell(awardedScore, 15, true) ] }));
        });

        const finalScoreStr = (candidate.regional_total_score !== undefined && candidate.regional_total_score !== null) ? String(candidate.regional_total_score) : ' ';
        rubricRows.push(new TableRow({ children: [ new TableCell({ columnSpan: 2, borders: cellBorderConfig, verticalAlign: VerticalAlign.CENTER, children: [ new Paragraph({ spacing: { before: 80, after: 80, left: 60, right: 60 }, children: [new TextRun({ text: 'TOTAL MARKS 100%', size: 24, font: 'Times New Roman' })] }) ] }), makeMatrixCell('TOTAL MARKS 100%', 15), makeMatrixCell(finalScoreStr, 15, true) ] }));
        
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rubricRows }));
        children.push(new Paragraph({ spacing: { after: 150, before: 0 }, children: [new TextRun({ text: ' ' })] }));

        children.push(new Paragraph({ spacing: { after: 40, before: 0 }, children: [ new TextRun({ text: 'APPENDIX 01: EDUCATION', bold: true, size: 24, font: 'Times New Roman' }) ] }));

        const eduTableRows = (template.educationAppendix || []).map(edu => new TableRow({ children: [ new TableCell({ borders: cellBorderConfig, width: { size: 40, type: WidthType.PERCENTAGE }, children: [ new Paragraph({ spacing: { before: 30, after: 30, left: 60, right: 60 }, children: [new TextRun({ text: String(edu.qualification || ' ').replace(/[\r\n\t\x00-\x1F]/g, ' '), size: 24, font: 'Times New Roman' })] }) ] }), new TableCell({ borders: cellBorderConfig, width: { size: 60, type: WidthType.PERCENTAGE }, children: [ new Paragraph({ spacing: { before: 30, after: 30, left: 60, right: 60 }, children: [new TextRun({ text: `- ${edu.marks} MARKS`, size: 24, font: 'Times New Roman' })] }) ] }) ] }));
        if (eduTableRows.length > 0) children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: eduTableRows }));

        children.push(new Paragraph({ spacing: { after: 150, before: 0 }, children: [new TextRun({ text: ' ' })] }));
        children.push(new Paragraph({ spacing: { after: 0, before: 0 }, children: [ new TextRun({ text: 'APPENDIX 02: LENGTH OF SERVICE', bold: true, size: 24, font: 'Times New Roman' }) ] }));
        children.push(new Paragraph({ spacing: { after: 200, before: 0 }, children: [ new TextRun({ text: String(template.serviceAppendix || '1 mark for every year of service, up to 18 marks.').replace(/[\r\n\t\x00-\x1F]/g, ' '), size: 24, font: 'Times New Roman' }) ] }));
        children.push(new Paragraph({ spacing: { after: 0, before: 0 }, children: [ new TextRun({ text: `CHAIRMAN SIGNATURE: ____________________        DATE: ____________________`, size: 24, font: 'Times New Roman' }) ] }));
        for (let i = 0; i < 4; i++) { children.push(new Paragraph({ spacing: { after: 0, before: 0 }, children: [ new TextRun({ text: `MEMBER SIGNATURE: ______________________        DATE: ____________________`, size: 24, font: 'Times New Roman' }) ] })); }

        sections.push({ properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } } }, children });
    }

    const doc = new Document({ sections });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    return { success: true, count: candidates.length, message: `${candidates.length} regional score sheet(s) exported to Word.` };
}

function getReportCandidates(filters = {}) {
    let query = `SELECT a.pf_no, a.rank_applied_for, n.*, s.total_score
        FROM applications a JOIN nominal_roll n ON n.pf_no = a.pf_no
        LEFT JOIN interview_scores s ON s.pf_no = a.pf_no
        WHERE a.applied = 1 AND a.is_qualified = 1`;
    const params = [];
    if (filters.rankAppliedFor && filters.rankAppliedFor !== 'ALL') { query += ' AND a.rank_applied_for = ?'; params.push(filters.rankAppliedFor); }
    query += ' ORDER BY CASE WHEN s.total_score IS NULL THEN 1 ELSE 0 END, s.total_score DESC, n.name ASC';
    return db.prepare(query).all(...params).map(row => ({ ...row, current_rank: normalizeRank(row.current_rank), rank_applied_for: normalizeRank(row.rank_applied_for) }));
}

function importQualifiedOfficersForReport(filePath) {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    const value = (row, matcher) => row[Object.keys(row).find(key => matcher.test(key.toUpperCase()))] || '';
    const upsertOfficer = db.prepare(`INSERT INTO nominal_roll (serial_no,pf_no,name,current_rank,ethnicity,year_of_birth,academic_qualification,professional_qualification,date_of_enlistment,date_posted,section_deployed,home_county,station)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(pf_no) DO UPDATE SET name=excluded.name,current_rank=excluded.current_rank,ethnicity=excluded.ethnicity,year_of_birth=excluded.year_of_birth,academic_qualification=excluded.academic_qualification,professional_qualification=excluded.professional_qualification,date_posted=excluded.date_posted,section_deployed=excluded.section_deployed,home_county=excluded.home_county,station=excluded.station`);
    const upsertApplication = db.prepare(`INSERT INTO applications (pf_no,applied,rank_applied_for,date_last_promotion,offences_count,date_of_last_offence,clean_record_3yrs,is_qualified,disqualification_reason)
        VALUES (?,1,?,?,0,?,1,1,'Imported as qualified') ON CONFLICT(pf_no) DO UPDATE SET applied=1,rank_applied_for=excluded.rank_applied_for,date_last_promotion=excluded.date_last_promotion,date_of_last_offence=excluded.date_of_last_offence,is_qualified=1,disqualification_reason='Imported as qualified'`);
    let count = 0;
    db.transaction(() => rows.forEach((row, index) => {
        const pf = String(value(row, /PF|P\/NO|SERVICE/)).trim(); if (!pf) return;
        const currentRank = normalizeRank(value(row, /^RANK$|CURRENT RANK/) || 'PC');
        const station = String(value(row, /CURRENT STATION|STATION/) || getSettings().station_name).trim().toUpperCase();
        const education = String(value(row, /HIGHEST.*EDUCATION|EDUCATION/) || '').trim();
        upsertOfficer.run(value(row, /S\/NO|SERIAL/) || index + 1, pf, String(value(row, /NAME/) || `PF ${pf}`).trim().toUpperCase(), currentRank, String(value(row, /ETHNICITY/) || '').trim().toUpperCase(), String(value(row, /DATE OF BIRTH|BIRTH/) || ''), education, education, null, null, String(value(row, /DEPLOYED|SECTION/) || '').trim().toUpperCase(), String(value(row, /HOME COUNTY|COUNTY/) || '').trim().toUpperCase(), station);
        upsertApplication.run(pf, getNextRank(currentRank) || currentRank, parseExcelDate(value(row, /LAST PROMOTION/)), parseExcelDate(value(row, /LAST OFFENCE/))); count++;
    }))();
    return { success: true, count, message: `${count} qualified officer record(s) imported into Step 4.` };
}

function importRegionalCandidates(filePath, boardType = 'STATION', customStationName = '', boardNumber = '') {
    const workbook = xlsx.readFile(filePath, { cellDates: true }); const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    const value = (row, matcher) => row[Object.keys(row).find(key => matcher.test(key.toUpperCase()))] || '';
    const insert = db.prepare(`INSERT INTO regional_candidates (pf_no,name,current_rank,rank_applied_for,station,year_of_birth,date_last_promotion,highest_education,date_last_offence,ethnicity,home_county,section_deployed,station_total_score,regional_total_score,board_type,board_number) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(pf_no,station) DO UPDATE SET name=excluded.name,current_rank=excluded.current_rank,rank_applied_for=excluded.rank_applied_for,year_of_birth=excluded.year_of_birth,date_last_promotion=excluded.date_last_promotion,highest_education=excluded.highest_education,date_last_offence=excluded.date_last_offence,ethnicity=excluded.ethnicity,home_county=excluded.home_county,section_deployed=excluded.section_deployed,station_total_score=excluded.station_total_score,regional_total_score=excluded.regional_total_score,board_type=excluded.board_type,board_number=excluded.board_number`);
    let count = 0; db.transaction(() => rows.forEach(row => { const pf = String(value(row, /PF|P\/NO|SERVICE/)).trim(); if (!pf) return; const currentRank = normalizeRank(value(row, /^RANK$|CURRENT RANK/) || 'PC'); const station = String(customStationName || value(row, /CURRENT STATION|STATION/) || 'UNSPECIFIED STATION').trim().toUpperCase(); const totalMarks = value(row, /TOTAL.*SCORE|TOTAL MARKS/) || null; insert.run(pf, String(value(row, /NAME/) || `PF ${pf}`).trim().toUpperCase(), currentRank, getNextRank(currentRank) || currentRank, station, String(value(row, /DATE OF BIRTH|BIRTH/) || ''), parseExcelDate(value(row, /LAST PROMOTION/)), String(value(row, /HIGHEST.*EDUCATION|EDUCATION/) || ''), parseExcelDate(value(row, /LAST OFFENCE/)), String(value(row, /ETHNICITY/) || ''), String(value(row, /HOME COUNTY|COUNTY/) || ''), String(value(row, /DEPLOYED|SECTION/) || ''), totalMarks, totalMarks, boardType, String(boardNumber).trim()); count++; }))();
    return { success: true, count, message: `${count} candidate record(s) added to the workspace.` };
}

function getRegionalCandidates(filters = {}) {
    let query = `
        SELECT r.*, n.gender, n.ethnicity
        FROM regional_candidates r 
        LEFT JOIN nominal_roll n ON r.pf_no = n.pf_no 
        WHERE 1=1
    `; 
    const params=[]; 
    if(filters.rankAppliedFor && filters.rankAppliedFor !== 'ALL'){
        query+=' AND r.rank_applied_for=?';
        params.push(filters.rankAppliedFor);
    } 
    if(filters.boardType){
        query+=' AND r.board_type=?';
        params.push(filters.boardType);
    } 
    query+=' ORDER BY r.rank_applied_for, r.station, r.name'; 
    return db.prepare(query).all(...params); 
}

function updateRegionalCandidate(id, field, value) {
    if (!['regional_total_score', 'station_total_score', 'selected_for_regional', 'board_number', 'interview_date'].includes(field)) {
        throw new Error('That regional field cannot be updated.');
    }
    
    db.prepare(`UPDATE regional_candidates SET ${field}=? WHERE regional_id=?`).run(
        (['regional_total_score', 'station_total_score'].includes(field) && value !== '') ? Number(value) : (field === 'selected_for_regional' ? Number(value) : value || null),
        Number(id)
    );
    
    return { success: true };
}

function saveManualTotalScore(pfNo, totalScore) {
    const candidate = db.prepare('SELECT a.rank_applied_for FROM applications a WHERE a.pf_no = ? AND a.applied = 1 AND a.is_qualified = 1').get(String(pfNo));
    if (!candidate) throw new Error('Only qualified Step 2 applicants can be added to this report.');
    const score = totalScore === '' || totalScore === null || totalScore === undefined ? null : Number(totalScore);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) throw new Error('Total score must be between 0 and 100.');
    if (score === null) { db.prepare('DELETE FROM interview_scores WHERE pf_no = ?').run(String(pfNo)); return { success: true, total_score: null }; }
    db.prepare(`INSERT INTO interview_scores (pf_no, rank_applied_for, total_score, evaluated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(pf_no) DO UPDATE SET rank_applied_for = excluded.rank_applied_for, total_score = excluded.total_score, evaluated_at = CURRENT_TIMESTAMP`).run(String(pfNo), candidate.rank_applied_for, score);
    return { success: true, total_score: score };
}

function exportReportCandidatesToExcel(filePath, filters = {}) {
    const rows = getReportCandidates(filters).map((row, index) => ({
        'Serial Number': index + 1, 'PF Number': row.pf_no, 'Candidate Name': row.name, 'Current Rank': row.current_rank,
        'Rank Applied For': row.rank_applied_for, Gender: row.gender, Ethnicity: row.ethnicity, 'Year of Birth': row.year_of_birth,
        'Highest Level of Education': highestEducation(row), 'Year Enlisted': row.pf_no ? String(row.pf_no).substring(0, 4) : '', 'Date Posted': row.date_posted,
        Section: row.section_deployed, 'Home County': row.home_county, Station: row.station, 'Total Marks': row.total_score ?? ''
    }));
    const workbook = xlsx.utils.book_new(); const sheet = xlsx.utils.json_to_sheet(rows);
    sheet['!cols'] = Object.keys(rows[0] || { 'Serial Number': '' }).map(key => ({ wch: Math.max(14, Math.min(32, key.length + 6)) }));
    xlsx.utils.book_append_sheet(workbook, sheet, 'Interview Scores'); xlsx.writeFile(workbook, filePath);
    return { success: true, count: rows.length, message: `${rows.length} candidate record(s) exported to Excel.` };
}

function exportRegionalSelectionToExcel(filePath, filters = {}) {
    let candidates = getRegionalCandidates({ boardType: 'STATION' });
    
    if (filters.rankAppliedFor && filters.rankAppliedFor !== 'ALL') {
        candidates = candidates.filter(c => c.rank_applied_for === filters.rankAppliedFor);
    }
    if (filters.station && filters.station !== 'ALL') {
        candidates = candidates.filter(c => c.station === filters.station);
    }

    const rows = candidates.map((c, i) => ({
        'S/N': i + 1,
        'PF Number': c.pf_no,
        'Name': c.name,
        'Gender': c.gender || '',
        'Ethnicity': c.ethnicity || '',
        'Station': c.station,
        'Target Rank': c.rank_applied_for,
        'Station Score': c.station_total_score ?? '',
        'Selected for Regional': c.selected_for_regional ? 'YES' : 'NO'
    }));

    const workbook = xlsx.utils.book_new();
    const sheet = xlsx.utils.json_to_sheet(rows);
    
    sheet['!cols'] = [
        {wch: 8}, {wch: 15}, {wch: 30}, {wch: 10}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 20}
    ];
    
    xlsx.utils.book_append_sheet(workbook, sheet, 'Board Selection');
    xlsx.writeFile(workbook, filePath);

    return { success: true, count: rows.length, message: `Successfully exported ${rows.length} candidates to Excel.` };
}

function exportFinalScoresToExcel(filePath, filters = {}) {
    let candidates = getRegionalCandidates({ boardType: 'STATION' });
    
    if (filters.rankAppliedFor && filters.rankAppliedFor !== 'ALL') {
        candidates = candidates.filter(c => c.rank_applied_for === filters.rankAppliedFor);
    }
    if (filters.station && filters.station !== 'ALL') {
        candidates = candidates.filter(c => c.station === filters.station);
    }

    const rows = candidates.map((c, i) => ({
        'S/N': i + 1,
        'PF Number': c.pf_no,
        'Candidate Name': c.name,
        'Station': c.station,
        'Current Rank': c.current_rank,
        'Target Rank': c.rank_applied_for,
        'Station Score': c.station_total_score ?? '',
        'Regional Score': c.regional_total_score ?? ''
    }));

    const workbook = xlsx.utils.book_new();
    const sheet = xlsx.utils.json_to_sheet(rows);
    
    sheet['!cols'] = [
        {wch: 8}, {wch: 15}, {wch: 30}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}
    ];
    
    xlsx.utils.book_append_sheet(workbook, sheet, 'Final Scores');
    xlsx.writeFile(workbook, filePath);

    return { success: true, count: rows.length, message: `Successfully exported ${rows.length} final scores to Excel.` };
}

function highestEducation(row) {
    const professional = String(row.professional_qualification || '').trim();
    return /development course|initial course certificate/i.test(professional) || !professional ? (row.academic_qualification || '') : professional;
}

// --- REPORTS & MERIT RANKINGS SERVICES ---
function getMeritRankings(filters = {}) {
    let query = `
        SELECT s.score_id, s.pf_no, s.rank_applied_for,
               s.education_score, s.service_score, s.turnout_score,
               s.knowledge_score, s.current_affairs_score, s.clean_record_score,
               s.commendations_score, s.total_score, s.remarks, s.evaluated_at,
               n.name, n.current_rank, n.gender, n.ethnicity, n.station, n.date_of_enlistment,
               a.offences_count, a.clean_record_3yrs
        FROM interview_scores s
        JOIN nominal_roll n ON s.pf_no = n.pf_no
        JOIN applications a ON s.pf_no = a.pf_no
        WHERE 1=1
    `;
    const params = [];

    if (filters.rankAppliedFor && filters.rankAppliedFor !== 'ALL') {
        query += ' AND s.rank_applied_for = ?';
        params.push(filters.rankAppliedFor);
    }

    if (filters.station && filters.station !== 'ALL') {
        query += ' AND n.station = ?';
        params.push(filters.station);
    }

    query += ' ORDER BY s.total_score DESC, s.service_score DESC, s.knowledge_score DESC';
    const rows = db.prepare(query).all(...params);

    return rows.map((row, index) => ({
        merit_rank: index + 1,
        ...row
    }));
}

function getCleanupTables() {
    return [
        { name: 'nominal_roll', label: 'Master Nominal Roll (Officers)', group: 'Station Level Data' },
        { name: 'applications', label: 'Candidate Applications & Vetting', group: 'Station Level Data' },
        { name: 'interview_scores', label: 'Station Interview Scores', group: 'Station Level Data' },
        { name: 'regional_candidates', label: 'Regional Candidates & Scores', group: 'Regional Command Data' }
    ];
}

function deleteSelectedTables(tables) {
    const allowedTables = ['nominal_roll', 'applications', 'interview_scores', 'regional_candidates'];
    const toDelete = (Array.isArray(tables) ? tables : []).filter(t => allowedTables.includes(t));
    
    if (toDelete.length === 0) {
        throw new Error("No valid tables selected for deletion.");
    }

    const transaction = db.transaction(() => {
        for (const table of toDelete) {
            db.prepare(`DELETE FROM ${table}`).run();
            // If applications are deleted, clear the generated eligibility lists as well
            if (table === 'applications') {
                db.prepare(`DELETE FROM qualified_applied_officers`).run();
                db.prepare(`DELETE FROM not_qualified_applied_officers`).run();
                db.prepare(`DELETE FROM qualified_not_applied_officers`).run();
            }
        }
    });

    transaction();
    return { success: true, message: `Successfully erased records from ${toDelete.length} table(s).` };
}

module.exports = {
    getSettings,
    getEligibilityCriteria,
    updateEligibilityCriteria,
    updateStationName,
    updatePromotionPeriod,
    clearApplicationList,
    getDashboardStats,
    getNominalRoll,
    saveOfficer,
    deleteOfficer,
    importNominalRollFromExcel,
    getApplications,
    loadAllNominalRollApplications,
    selectNominalRollApplicants,
    updateApplicationApplied,
    generateEligibilityLists,
    exportEligibilityListsToExcel,
    getNextRank,
    normalizeRank,
    saveApplication,
    updateApplicationField,
    deleteApplication,
    importApplicationsFromExcel,
    getCandidatesForScoring,
    getCandidateScore,
    getScoringTemplate,
    updateScoringTemplate,
    exportInterviewScoreSheets,
    exportRegionalScoreSheets,
    getReportCandidates,
    importQualifiedOfficersForReport,
    importRegionalCandidates,
    getRegionalCandidates,
    updateRegionalCandidate,
    saveManualTotalScore,
    exportReportCandidatesToExcel,
    exportRegionalSelectionToExcel,
    exportFinalScoresToExcel,
    saveInterviewScore,
    getMeritRankings,
    parseExcelDate,
    getCleanupTables,  
    deleteSelectedTables,
    evaluateDisciplinary
};
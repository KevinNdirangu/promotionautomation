const Database = require('better-sqlite3');
const path = require('path');

// Connect to SQLite DB in user data directory or local app directory
const dbPath = path.join(__dirname, '..', 'promotion_data.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable Foreign Key Constraints
db.pragma('foreign_keys = ON');

// Initialize Database Tables
function initSchema() {
    db.exec(`
        -- Settings & Metadata Table
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        -- 1. Master Nominal Roll Table
        CREATE TABLE IF NOT EXISTS nominal_roll (
            serial_no INTEGER,
            pf_no TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            current_rank TEXT NOT NULL,
            gender TEXT,
            ethnicity TEXT,
            year_of_birth TEXT,
            academic_qualification TEXT,
            professional_qualification TEXT,
            date_of_enlistment TEXT,
            date_posted TEXT,
            section_deployed TEXT,
            home_county TEXT,
            station TEXT DEFAULT 'EMBU MAIN PRISON'
        );

        -- 2. Applications & Disciplinary Record Table
        CREATE TABLE IF NOT EXISTS applications (
            application_id INTEGER PRIMARY KEY AUTOINCREMENT,
            pf_no TEXT UNIQUE,
            applied INTEGER CHECK (applied IN (0, 1)) DEFAULT 0,
            rank_applied_for TEXT NOT NULL,
            date_last_promotion TEXT,
            offences_count INTEGER DEFAULT 0,
            date_of_last_offence TEXT,
            clean_record_3yrs INTEGER CHECK (clean_record_3yrs IN (0, 1)) DEFAULT 1,
            is_qualified INTEGER CHECK (is_qualified IN (0, 1)) DEFAULT 1,
            disqualification_reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pf_no) REFERENCES nominal_roll(pf_no) ON DELETE CASCADE
        );

        -- 3. Dynamic Interview Scoresheet Table
        CREATE TABLE IF NOT EXISTS interview_scores (
            score_id INTEGER PRIMARY KEY AUTOINCREMENT,
            pf_no TEXT UNIQUE,
            rank_applied_for TEXT NOT NULL,
            education_score REAL DEFAULT 0,
            service_score REAL DEFAULT 0,
            turnout_score REAL DEFAULT 0,
            knowledge_score REAL DEFAULT 0,
            current_affairs_score REAL DEFAULT 0,
            clean_record_score REAL DEFAULT 0,
            commendations_score REAL DEFAULT 0,
            total_score REAL DEFAULT 0,
            remarks TEXT DEFAULT '',
            evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pf_no) REFERENCES nominal_roll(pf_no) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_apps_rank ON applications(rank_applied_for);
        CREATE INDEX IF NOT EXISTS idx_scores_rank ON interview_scores(rank_applied_for);
        CREATE TABLE IF NOT EXISTS regional_candidates (
            regional_id INTEGER PRIMARY KEY AUTOINCREMENT, pf_no TEXT NOT NULL, name TEXT NOT NULL, current_rank TEXT, rank_applied_for TEXT, station TEXT,
            year_of_birth TEXT, date_last_promotion TEXT, highest_education TEXT, date_last_offence TEXT, ethnicity TEXT, home_county TEXT, section_deployed TEXT,
            station_total_score REAL, regional_total_score REAL, final_recommendation TEXT, board_type TEXT, board_number TEXT, UNIQUE(pf_no, station)
        );
        CREATE INDEX IF NOT EXISTS idx_regional_rank ON regional_candidates(rank_applied_for);
    `);

    // Migration / Alter table checks for existing databases
    const regionalColumns = db.prepare("PRAGMA table_info(regional_candidates)").all().map(c => c.name);
    if (!regionalColumns.includes('board_type')) {
        db.exec("ALTER TABLE regional_candidates ADD COLUMN board_type TEXT DEFAULT 'STATION'");
    }
    if (!regionalColumns.includes('board_number')) {
        db.exec("ALTER TABLE regional_candidates ADD COLUMN board_number TEXT");
    }
    if (!regionalColumns.includes('selected_for_regional')) {
        db.exec("ALTER TABLE regional_candidates ADD COLUMN selected_for_regional INTEGER DEFAULT 0");
    }

    const nominalColumns = db.prepare("PRAGMA table_info(nominal_roll)").all().map(c => c.name);
    const nominalMigrations = [
        ['serial_no', 'INTEGER'],
        ['year_of_birth', 'TEXT'],
        ['academic_qualification', 'TEXT'],
        ['professional_qualification', 'TEXT'],
        ['date_posted', 'TEXT'],
        ['home_county', 'TEXT']
    ];
    for (const [column, type] of nominalMigrations) {
        if (!nominalColumns.includes(column)) {
            db.exec(`ALTER TABLE nominal_roll ADD COLUMN ${column} ${type}`);
        }
    }
    if (!nominalColumns.includes('station')) {
        db.exec("ALTER TABLE nominal_roll ADD COLUMN station TEXT DEFAULT 'EMBU MAIN PRISON'");
    }

    const scoreColumns = db.prepare("PRAGMA table_info(interview_scores)").all().map(c => c.name);
    if (!scoreColumns.includes('remarks')) {
        db.exec("ALTER TABLE interview_scores ADD COLUMN remarks TEXT DEFAULT ''");
    }

    const applicationColumns = db.prepare("PRAGMA table_info(applications)").all().map(c => c.name);
    if (!applicationColumns.includes('date_last_promotion')) {
        db.exec("ALTER TABLE applications ADD COLUMN date_last_promotion TEXT");
    }
    if (!applicationColumns.includes('applied')) {
        db.exec("ALTER TABLE applications ADD COLUMN applied INTEGER CHECK (applied IN (0, 1)) DEFAULT 0");
    }

    db.exec(`
        CREATE TABLE IF NOT EXISTS qualified_applied_officers AS SELECT * FROM applications WHERE 0;
        CREATE TABLE IF NOT EXISTS not_qualified_applied_officers AS SELECT * FROM applications WHERE 0;
        CREATE TABLE IF NOT EXISTS qualified_not_applied_officers AS SELECT * FROM applications WHERE 0;
    `);

    // Default settings
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('station_name', 'EMBU MAIN PRISON')").run();
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('promotion_year', '2026')").run();
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('promotion_month', '1')").run();
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('minimum_years_service', '0')").run();
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('minimum_years_current_rank', '3')").run();
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('clean_record_years', '3')").run();
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('maximum_offences', '0')").run();
    db.prepare("DELETE FROM applications WHERE applied = 0 AND disqualification_reason = 'Not marked as applied'").run();
}

initSchema();

module.exports = db;

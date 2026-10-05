/**
 * SQLite database setup using better-sqlite3
 * Stores patients, screenings, users, otp_tokens in a local .db file
 * X-ray slot is reserved with klGrade / xrayImagePath columns — ready for ML model plugin
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../data/sakhi.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    role        TEXT NOT NULL CHECK(role IN ('healthWorker','admin','patient')),
    phone       TEXT UNIQUE,
    admin_id    TEXT UNIQUE,
    admin_pin   TEXT,
    name        TEXT,
    sub_center  TEXT,
    district    TEXT,
    language    TEXT DEFAULT 'English',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS otp_tokens (
    id          TEXT PRIMARY KEY,
    phone       TEXT NOT NULL,
    otp_hash    TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    used        INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patients (
    id              TEXT PRIMARY KEY,
    ner_id          TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    age             INTEGER NOT NULL,
    sex             TEXT NOT NULL CHECK(sex IN ('male','female','other')),
    occupation      TEXT NOT NULL,
    village         TEXT NOT NULL,
    block           TEXT NOT NULL,
    district        TEXT NOT NULL DEFAULT 'Sonitpur',
    contact         TEXT,
    registered_by   TEXT NOT NULL,
    entry_source    TEXT NOT NULL DEFAULT 'healthWorker',
    consent_given   INTEGER DEFAULT 0,
    bmi_category    TEXT,
    prior_injury    INTEGER DEFAULT 0,
    family_history  INTEGER DEFAULT 0,
    comorbidities   TEXT DEFAULT '[]',
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS screenings (
    id                  TEXT PRIMARY KEY,
    patient_id          TEXT NOT NULL REFERENCES patients(id),
    worker_id           TEXT NOT NULL REFERENCES users(id),
    camp_name           TEXT,
    status              TEXT DEFAULT 'draft' CHECK(status IN ('draft','inProgress','completed','referred')),

    -- KOOS / WOMAC responses (JSON blob)
    koos_responses      TEXT DEFAULT '{}',
    risk_factors        TEXT DEFAULT '{}',
    red_flag            INTEGER DEFAULT 0,

    -- WOMAC computed subscales (0–100 each)
    womac_pain          REAL,
    womac_stiffness     REAL,
    womac_function      REAL,
    womac_total         REAL,

    -- Sit-to-Stand test
    sts_reps            INTEGER,
    sts_duration_s      INTEGER,
    sts_quality         TEXT,
    sts_entry_method    TEXT DEFAULT 'manual',

    -- Fusion output
    fusion_score        REAL,
    risk_tier           TEXT CHECK(risk_tier IN ('Low Risk','Moderate Risk','High Risk','High Risk — Immediate Referral')),
    fusion_explanation  TEXT,
    recommended_action  TEXT,
    confidence_note     TEXT,

    -- X-ray plugin slot (populate when ML model is inserted)
    xray_image_path     TEXT,
    kl_grade            INTEGER,
    xray_ml_score       REAL,

    -- Referral
    referral_required   INTEGER DEFAULT 0,
    referral_note       TEXT,
    specialist_name     TEXT,
    specialist_contact  TEXT,

    -- Sync
    local_id            TEXT,
    synced_at           TEXT,
    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS guidance_items (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    title_as    TEXT,
    category    TEXT NOT NULL CHECK(category IN ('exercise','lifestyle','diet','ergonomics','pain_relief')),
    target_risk TEXT DEFAULT '["Low Risk","Moderate Risk","High Risk"]',
    description TEXT,
    desc_as     TEXT,
    video_url   TEXT,
    image_url   TEXT,
    reps        TEXT,
    duration    TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS camps (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    village     TEXT NOT NULL,
    district    TEXT NOT NULL,
    sub_center  TEXT,
    date        TEXT NOT NULL,
    worker_id   TEXT NOT NULL REFERENCES users(id),
    status      TEXT DEFAULT 'active' CHECK(status IN ('active','completed')),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Trigger to auto-update screenings.updated_at
  CREATE TRIGGER IF NOT EXISTS screenings_updated_at
    AFTER UPDATE ON screenings
    BEGIN
      UPDATE screenings SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
`);

export default db;

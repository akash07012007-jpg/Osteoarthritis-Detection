/**
 * Sakhi OA Screening — Express API Server
 * SQLite backend for the React frontend
 *
 * Endpoints:
 *   POST /api/auth/send-otp
 *   POST /api/auth/verify-otp
 *   POST /api/auth/admin-login
 *   GET  /api/auth/me
 *
 *   GET  /api/patients
 *   POST /api/patients
 *   GET  /api/patients/:id
 *   GET  /api/patients/:id/screenings
 *
 *   GET  /api/screenings/:id
 *   POST /api/screenings
 *   PATCH /api/screenings/:id
 *   POST /api/screenings/:id/xray  ← X-ray plugin slot
 *
 *   GET  /api/guidance
 *
 *   GET  /api/admin/stats
 *   GET  /api/admin/clusters
 *
 *   POST /api/sync          ← Bulk offline queue flush
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import './db.js'; // Initialize DB + schema
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function generateOTP(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function simpleJWT(payload: object): string {
  // Lightweight JWT-like token for prototype (base64, no signature)
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  return `${header}.${body}.prototype`;
}

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const [, body] = token.split('.');
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const payload = decodeToken(auth.slice(7));
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  (req as any).user = payload;
  next();
}

// ────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ────────────────────────────────────────────────────────────────────────────

// POST /api/auth/send-otp
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body as { phone: string };
  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const otp = generateOTP();
  const otpHash = bcrypt.hashSync(otp, 6); // fast rounds for prototype
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // Invalidate old OTPs for this phone
  db.prepare('UPDATE otp_tokens SET used = 1 WHERE phone = ? AND used = 0').run(phone);

  // Insert new OTP
  db.prepare(`
    INSERT INTO otp_tokens (id, phone, otp_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), phone, otpHash, expiresAt);

  // ── CONSOLE OTP (prototype mode) ─────────────────────────────────────────
  console.log(`\n📱 OTP for ${phone}: ${otp}\n   Expires: ${expiresAt}\n`);

  // Look up existing user for display info
  const user = db.prepare('SELECT name, sub_center FROM users WHERE phone = ?').get(phone) as any;

  res.json({
    success: true,
    message: `OTP sent to ${phone} (console-only mode — check server logs)`,
    userName: user?.name || null,
  });
});

// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body as { phone: string; otp: string };
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  const token = db.prepare(`
    SELECT * FROM otp_tokens
    WHERE phone = ? AND used = 0 AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `).get(phone) as any;

  if (!token || !bcrypt.compareSync(otp, token.otp_hash)) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  // Mark as used
  db.prepare('UPDATE otp_tokens SET used = 1 WHERE id = ?').run(token.id);

  // Upsert user
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
  if (!user) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO users (id, role, phone, name, district) VALUES (?, 'healthWorker', ?, ?, 'Sonitpur')
    `).run(id, phone, `Worker-${phone.slice(-4)}`);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  const jwtToken = simpleJWT({
    uid: user.id,
    role: user.role,
    phone: user.phone,
    name: user.name,
    subCenter: user.sub_center,
    district: user.district,
  });

  res.json({ success: true, token: jwtToken, user: { id: user.id, role: user.role, name: user.name, subCenter: user.sub_center, district: user.district, phone: user.phone } });
});

// POST /api/auth/admin-login
app.post('/api/auth/admin-login', (req, res) => {
  const { adminId, pin } = req.body as { adminId: string; pin: string };
  if (!adminId || !pin) return res.status(400).json({ error: 'Admin ID and PIN required' });

  const user = db.prepare('SELECT * FROM users WHERE admin_id = ? AND role = ?').get(adminId.toUpperCase(), 'admin') as any;
  if (!user || !bcrypt.compareSync(pin, user.admin_pin)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = simpleJWT({ uid: user.id, role: user.role, name: user.name, district: user.district });
  res.json({ success: true, token, user: { id: user.id, role: user.role, name: user.name, district: user.district } });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const { uid } = (req as any).user;
  const user = db.prepare('SELECT id, role, phone, admin_id, name, sub_center, district, language FROM users WHERE id = ?').get(uid) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ────────────────────────────────────────────────────────────────────────────
// PATIENT ROUTES
// ────────────────────────────────────────────────────────────────────────────

// GET /api/patients — list with optional filters
app.get('/api/patients', authMiddleware, (req, res) => {
  const { district, search, limit = '50', offset = '0' } = req.query as Record<string, string>;

  let query = 'SELECT * FROM patients WHERE 1=1';
  const params: unknown[] = [];

  if (district) { query += ' AND district = ?'; params.push(district); }
  if (search) { query += ' AND name LIKE ?'; params.push(`%${search}%`); }

  const total = (db.prepare(`SELECT COUNT(*) as n FROM (${query})`).get(...params as []) as any).n;
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const patients = db.prepare(query).all(...params as []);
  res.json({ patients, total, limit: Number(limit), offset: Number(offset) });
});

// POST /api/patients
app.post('/api/patients', authMiddleware, (req, res) => {
  const { uid } = (req as any).user;
  const { name, age, sex, occupation, village, block, district, contact, bmiCategory, priorInjury, familyHistory } = req.body;

  if (!name || !age || !sex || !occupation || !village || !block) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  // Generate NER ID
  const count = (db.prepare('SELECT COUNT(*) as n FROM patients').get() as any).n;
  const nerId = `NER-OA-${String(count + 1001).padStart(4, '0')}`;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO patients (id, ner_id, name, age, sex, occupation, village, block, district, contact, registered_by, entry_source, bmi_category, prior_injury, family_history)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'healthWorker', ?, ?, ?)
  `).run(id, nerId, name, age, sex, occupation, village, block, district || 'Sonitpur', contact || null, uid, bmiCategory || null, priorInjury ? 1 : 0, familyHistory ? 1 : 0);

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
  res.status(201).json(patient);
});

// GET /api/patients/:id
app.get('/api/patients/:id', authMiddleware, (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// PATCH /api/patients/:id — update consent
app.patch('/api/patients/:id', authMiddleware, (req, res) => {
  const { consent_given } = req.body;
  db.prepare('UPDATE patients SET consent_given = ? WHERE id = ?').run(consent_given ? 1 : 0, req.params.id);
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  res.json(patient);
});

// GET /api/patients/:id/screenings
app.get('/api/patients/:id/screenings', authMiddleware, (req, res) => {
  const screenings = db.prepare('SELECT * FROM screenings WHERE patient_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(screenings);
});

// ────────────────────────────────────────────────────────────────────────────
// SCREENING ROUTES
// ────────────────────────────────────────────────────────────────────────────

// POST /api/screenings — create new
app.post('/api/screenings', authMiddleware, (req, res) => {
  const { uid } = (req as any).user;
  const { patientId, campName, localId } = req.body;
  if (!patientId) return res.status(400).json({ error: 'patientId required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO screenings (id, patient_id, worker_id, camp_name, status, local_id)
    VALUES (?, ?, ?, ?, 'inProgress', ?)
  `).run(id, patientId, uid, campName || null, localId || null);

  res.status(201).json({ id });
});

// GET /api/screenings/:id
app.get('/api/screenings/:id', authMiddleware, (req, res) => {
  const screening = db.prepare('SELECT * FROM screenings WHERE id = ?').get(req.params.id);
  if (!screening) return res.status(404).json({ error: 'Screening not found' });
  res.json(screening);
});

// PATCH /api/screenings/:id — save any fields (questionnaire, STS, fusion, etc.)
app.patch('/api/screenings/:id', authMiddleware, (req, res) => {
  const allowed = [
    'status', 'koos_responses', 'risk_factors', 'red_flag',
    'womac_pain', 'womac_stiffness', 'womac_function', 'womac_total',
    'sts_reps', 'sts_duration_s', 'sts_quality', 'sts_entry_method',
    'fusion_score', 'risk_tier', 'fusion_explanation', 'recommended_action', 'confidence_note',
    'referral_required', 'referral_note', 'specialist_name', 'specialist_contact',
    'camp_name', 'synced_at',
  ];

  const fields = Object.entries(req.body)
    .filter(([k]) => allowed.includes(k))
    .map(([k, v]) => {
      // Serialize objects to JSON string
      const val = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
      return { key: k, val };
    });

  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields' });

  const setClause = fields.map(f => `${f.key} = ?`).join(', ');
  const values = [...fields.map(f => f.val), req.params.id];

  db.prepare(`UPDATE screenings SET ${setClause} WHERE id = ?`).run(...values as []);

  const updated = db.prepare('SELECT * FROM screenings WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// POST /api/screenings/:id/xray — X-RAY ML PLUGIN SLOT
// When you're ready to insert your ML model, call this endpoint
// with { klGrade: number (0-4), xrayMlScore: number (0-100), xrayImagePath: string }
app.post('/api/screenings/:id/xray', authMiddleware, (req, res) => {
  const { klGrade, xrayMlScore, xrayImagePath } = req.body;

  // Validate KL grade
  if (klGrade !== undefined && (klGrade < 0 || klGrade > 4)) {
    return res.status(400).json({ error: 'KL grade must be 0–4' });
  }

  db.prepare(`
    UPDATE screenings
    SET kl_grade = ?, xray_ml_score = ?, xray_image_path = ?
    WHERE id = ?
  `).run(klGrade ?? null, xrayMlScore ?? null, xrayImagePath ?? null, req.params.id);

  const updated = db.prepare('SELECT id, kl_grade, xray_ml_score, xray_image_path FROM screenings WHERE id = ?').get(req.params.id);
  res.json({ success: true, xray: updated });
});

// ────────────────────────────────────────────────────────────────────────────
// GUIDANCE ROUTES
// ────────────────────────────────────────────────────────────────────────────

// GET /api/guidance?category=exercise&risk=High+Risk&lang=as
app.get('/api/guidance', (req, res) => {
  const { category, search } = req.query as Record<string, string>;
  let query = 'SELECT * FROM guidance_items WHERE 1=1';
  const params: unknown[] = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY category, title';
  const items = db.prepare(query).all(...params as []);
  res.json(items);
});

// ────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ────────────────────────────────────────────────────────────────────────────

// GET /api/admin/stats
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  const total = (db.prepare('SELECT COUNT(*) as n FROM screenings WHERE status != ?').get('draft') as any).n;
  const highRisk = (db.prepare("SELECT COUNT(*) as n FROM screenings WHERE risk_tier = 'High Risk' OR risk_tier = 'High Risk — Immediate Referral'").get() as any).n;
  const modRisk = (db.prepare("SELECT COUNT(*) as n FROM screenings WHERE risk_tier = 'Moderate Risk'").get() as any).n;
  const lowRisk = (db.prepare("SELECT COUNT(*) as n FROM screenings WHERE risk_tier = 'Low Risk'").get() as any).n;
  const referred = (db.prepare("SELECT COUNT(*) as n FROM screenings WHERE referral_required = 1").get() as any).n;
  const totalPatients = (db.prepare('SELECT COUNT(*) as n FROM patients').get() as any).n;

  res.json({
    totalScreened: total,
    totalPatients,
    highRisk,
    modRisk,
    lowRisk,
    referred,
    highRiskPct: total > 0 ? Math.round((highRisk / total) * 100) : 0,
    modRiskPct: total > 0 ? Math.round((modRisk / total) * 100) : 0,
    lowRiskPct: total > 0 ? Math.round((lowRisk / total) * 100) : 0,
  });
});

// GET /api/admin/clusters — village/block breakdown
app.get('/api/admin/clusters', authMiddleware, (req, res) => {
  const clusters = db.prepare(`
    SELECT
      p.block as cluster,
      COUNT(s.id) as total,
      SUM(CASE WHEN s.risk_tier IN ('High Risk','High Risk — Immediate Referral') THEN 1 ELSE 0 END) as high_risk,
      SUM(CASE WHEN s.risk_tier = 'Moderate Risk' THEN 1 ELSE 0 END) as mod_risk,
      SUM(CASE WHEN s.risk_tier = 'Low Risk' THEN 1 ELSE 0 END) as low_risk,
      ROUND(
        CAST(SUM(CASE WHEN s.risk_tier IN ('High Risk','High Risk — Immediate Referral') THEN 1 ELSE 0 END) AS REAL)
        / CAST(COUNT(s.id) AS REAL) * 100, 1
      ) as burden_pct
    FROM screenings s
    JOIN patients p ON p.id = s.patient_id
    WHERE s.status != 'draft'
    GROUP BY p.block
    ORDER BY burden_pct DESC
  `).all();
  res.json(clusters);
});

// GET /api/admin/patients — list all screened patients for admin view
app.get('/api/admin/patients', authMiddleware, (req, res) => {
  const { risk, block, limit = '100', offset = '0' } = req.query as Record<string, string>;

  let query = `
    SELECT p.*, s.risk_tier, s.fusion_score, s.status as screening_status, s.id as screening_id, s.created_at as screened_at
    FROM patients p
    LEFT JOIN screenings s ON s.patient_id = p.id AND s.status != 'draft'
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (risk) { query += ' AND s.risk_tier = ?'; params.push(risk); }
  if (block) { query += ' AND p.block = ?'; params.push(block); }

  query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const patients = db.prepare(query).all(...params as []);
  res.json(patients);
});

// ────────────────────────────────────────────────────────────────────────────
// OFFLINE SYNC ROUTE
// ────────────────────────────────────────────────────────────────────────────

// POST /api/sync — bulk flush from IndexedDB offline queue
app.post('/api/sync', authMiddleware, (req, res) => {
  const { records } = req.body as {
    records: Array<{
      type: 'patient' | 'screening';
      localId: string;
      data: Record<string, unknown>;
    }>;
  };

  if (!Array.isArray(records)) return res.status(400).json({ error: 'records array required' });

  const results: Array<{ localId: string; serverId: string; type: string }> = [];

  const upsertTx = db.transaction(() => {
    for (const rec of records) {
      const serverId = uuidv4();

      if (rec.type === 'patient') {
        const { uid } = (req as any).user;
        const d = rec.data;
        const nerId = `NER-OA-SYNC-${serverId.slice(0, 6).toUpperCase()}`;
        db.prepare(`
          INSERT OR IGNORE INTO patients (id, ner_id, name, age, sex, occupation, village, block, district, contact, registered_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(serverId, nerId, d.name, d.age, d.sex, d.occupation, d.village, d.block, d.district || 'Sonitpur', d.contact || null, uid);
      }

      if (rec.type === 'screening') {
        const { uid } = (req as any).user;
        const d = rec.data;
        db.prepare(`
          INSERT OR IGNORE INTO screenings (id, patient_id, worker_id, status, koos_responses, risk_factors, red_flag, fusion_score, risk_tier, sts_reps, local_id, synced_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          serverId, d.patientId, uid, d.status || 'completed',
          JSON.stringify(d.koosResponses || {}), JSON.stringify(d.riskFactors || {}),
          d.redFlag ? 1 : 0, d.fusionScore || null, d.riskTier || null, d.stsReps || null, rec.localId
        );
      }

      results.push({ localId: rec.localId, serverId, type: rec.type });
    }
  });

  upsertTx();
  res.json({ synced: results.length, results });
});

// ────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Sakhi API Server running on http://localhost:${PORT}`);
  console.log(`   Database: SQLite (local)`);
  console.log(`   OTP Mode: Console-only (prototype)\n`);
});

export default app;

/**
 * Seed script — populates SQLite with demo data for the prototype
 * Run: npx tsx server/seed.ts
 */

import db from './db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

console.log('🌱 Seeding Sakhi OA SQLite database...');

// ─── CLEAR EXISTING DATA ─────────────────────────────────────────────────────
db.exec(`
  DELETE FROM screenings;
  DELETE FROM patients;
  DELETE FROM otp_tokens;
  DELETE FROM guidance_items;
  DELETE FROM camps;
  DELETE FROM users;
`);

// ─── USERS ───────────────────────────────────────────────────────────────────

const hwId = uuidv4();
const hw2Id = uuidv4();
const adminId = uuidv4();

const insertUser = db.prepare(`
  INSERT INTO users (id, role, phone, admin_id, admin_pin, name, sub_center, district, language)
  VALUES (@id, @role, @phone, @admin_id, @admin_pin, @name, @sub_center, @district, @language)
`);

// Health Workers (OTP login — PIN stored as hash for demo)
insertUser.run({
  id: hwId,
  role: 'healthWorker',
  phone: '9435012894',
  admin_id: null,
  admin_pin: null,
  name: 'Priya Bora',
  sub_center: 'Balipara Sub-Centre',
  district: 'Sonitpur',
  language: 'English',
});

insertUser.run({
  id: hw2Id,
  role: 'healthWorker',
  phone: '8638001234',
  admin_id: null,
  admin_pin: null,
  name: 'Minoti Das',
  sub_center: 'Dhekiajuli PHC',
  district: 'Sonitpur',
  language: 'অসমীয়া',
});

// Admin (ID + PIN login)
const adminPinHash = bcrypt.hashSync('840291', 10);
insertUser.run({
  id: adminId,
  role: 'admin',
  phone: null,
  admin_id: 'AS-SON-NODAL-01',
  admin_pin: adminPinHash,
  name: 'Dr. M. Saikia',
  sub_center: null,
  district: 'Sonitpur',
  language: 'English',
});

console.log('✅ Users seeded (2 health workers, 1 admin)');

// ─── CAMPS ───────────────────────────────────────────────────────────────────
const campId1 = uuidv4();
const campId2 = uuidv4();

const insertCamp = db.prepare(`
  INSERT INTO camps (id, name, village, district, sub_center, date, worker_id, status)
  VALUES (@id, @name, @village, @district, @sub_center, @date, @worker_id, @status)
`);

insertCamp.run({ id: campId1, name: 'Dhekiajuli Village Camp #4', village: 'Dhekiajuli', district: 'Sonitpur', sub_center: 'Balipara Sub-Centre', date: new Date().toISOString().split('T')[0], worker_id: hwId, status: 'active' });
insertCamp.run({ id: campId2, name: 'Rangapara Tea Estate Camp', village: 'Rangapara', district: 'Sonitpur', sub_center: 'Dhekiajuli PHC', date: new Date().toISOString().split('T')[0], worker_id: hw2Id, status: 'active' });

console.log('✅ Camps seeded');

// ─── PATIENTS ─────────────────────────────────────────────────────────────────

const insertPatient = db.prepare(`
  INSERT INTO patients (id, ner_id, name, age, sex, occupation, village, block, district, contact, registered_by, consent_given, bmi_category, prior_injury, family_history)
  VALUES (@id, @ner_id, @name, @age, @sex, @occupation, @village, @block, @district, @contact, @registered_by, @consent_given, @bmi_category, @prior_injury, @family_history)
`);

const patientSeeds = [
  { name: 'Bhaben Das', age: 62, sex: 'male', occupation: 'Farmer', village: 'Dhekiajuli', block: 'Dhekiajuli Block', contact: '9876543210', bmi: 'overweight', injury: 1, family: 1 },
  { name: 'Monomati Devi', age: 54, sex: 'female', occupation: 'Tea Garden Worker', village: 'Dhekiajuli', block: 'Dhekiajuli Block', contact: null, bmi: 'obese', injury: 0, family: 0 },
  { name: 'Jiten Gogoi', age: 48, sex: 'male', occupation: 'Daily Porter', village: 'Balipara', block: 'Balipara Block', contact: null, bmi: 'normal', injury: 0, family: 0 },
  { name: 'Rekha Borah', age: 58, sex: 'female', occupation: 'Tea Garden Worker', village: 'Rangapara', block: 'Dhekiajuli Block', contact: '8638005678', bmi: 'obese', injury: 1, family: 1 },
  { name: 'Anil Saikia', age: 67, sex: 'male', occupation: 'Retired', village: 'Tezpur', block: 'Tezpur Urban', contact: '9435099123', bmi: 'overweight', injury: 0, family: 1 },
  { name: 'Pratima Kalita', age: 51, sex: 'female', occupation: 'Homemaker', village: 'Tezpur', block: 'Tezpur Urban', contact: null, bmi: 'normal', injury: 0, family: 0 },
  { name: 'Dipak Nath', age: 44, sex: 'male', occupation: 'Driver', village: 'Balipara', block: 'Balipara Block', contact: '9864001122', bmi: 'overweight', injury: 1, family: 0 },
  { name: 'Sabitri Boro', age: 72, sex: 'female', occupation: 'Farmer', village: 'Dhekiajuli', block: 'Dhekiajuli Block', contact: null, bmi: 'obese', injury: 0, family: 1 },
];

const patientIds: string[] = [];
patientSeeds.forEach((p, i) => {
  const id = uuidv4();
  patientIds.push(id);
  insertPatient.run({
    id,
    ner_id: `NER-OA-${String(i + 1001).padStart(4, '0')}`,
    name: p.name,
    age: p.age,
    sex: p.sex,
    occupation: p.occupation,
    village: p.village,
    block: p.block,
    district: 'Sonitpur',
    contact: p.contact ?? null,
    registered_by: hwId,
    consent_given: 1,
    bmi_category: p.bmi,
    prior_injury: p.injury,
    family_history: p.family,
  });
});

console.log('✅ Patients seeded (8 patients)');

// ─── SCREENINGS ───────────────────────────────────────────────────────────────

const insertScreening = db.prepare(`
  INSERT INTO screenings (
    id, patient_id, worker_id, camp_name, status,
    koos_responses, risk_factors, red_flag,
    womac_pain, womac_stiffness, womac_function, womac_total,
    sts_reps, sts_duration_s, sts_quality, sts_entry_method,
    fusion_score, risk_tier, fusion_explanation, recommended_action,
    referral_required, referral_note, specialist_name, specialist_contact, synced_at
  ) VALUES (
    @id, @patient_id, @worker_id, @camp_name, @status,
    @koos_responses, @risk_factors, @red_flag,
    @womac_pain, @womac_stiffness, @womac_function, @womac_total,
    @sts_reps, @sts_duration_s, @sts_quality, @sts_entry_method,
    @fusion_score, @risk_tier, @fusion_explanation, @recommended_action,
    @referral_required, @referral_note, @specialist_name, @specialist_contact, @synced_at
  )
`);

// Patient 0 — Bhaben Das — High Risk
insertScreening.run({
  id: uuidv4(), patient_id: patientIds[0], worker_id: hwId, camp_name: 'Dhekiajuli Village Camp #4', status: 'referred',
  koos_responses: '{}', risk_factors: '{"bmiCategory":"overweight","occupation":"heavy","priorInjury":true,"familyHistory":true,"symptomDurationMonths":24}',
  red_flag: 0, womac_pain: 72, womac_stiffness: 68, womac_function: 71, womac_total: 71,
  sts_reps: 5, sts_duration_s: 30, sts_quality: 'HIGH', sts_entry_method: 'camera',
  fusion_score: 78, risk_tier: 'High Risk',
  fusion_explanation: 'High reported symptom severity (71/100); elevated risk-factor profile; reduced functional performance on sit-to-stand (5 reps).',
  recommended_action: 'Refer to orthopaedic specialist promptly',
  referral_required: 1, referral_note: 'PHC Referral issued. TMCH Ortho OPD.',
  specialist_name: 'Dr. Ranjit Kalita', specialist_contact: '03712-234567',
  synced_at: new Date().toISOString(),
});

// Patient 1 — Monomati Devi — Moderate Risk
insertScreening.run({
  id: uuidv4(), patient_id: patientIds[1], worker_id: hwId, camp_name: 'Dhekiajuli Village Camp #4', status: 'completed',
  koos_responses: '{}', risk_factors: '{"bmiCategory":"obese","occupation":"heavy","priorInjury":false,"familyHistory":false,"symptomDurationMonths":8}',
  red_flag: 0, womac_pain: 54, womac_stiffness: 50, womac_function: 52, womac_total: 52,
  sts_reps: 8, sts_duration_s: 30, sts_quality: 'MEDIUM', sts_entry_method: 'manual',
  fusion_score: 62, risk_tier: 'Moderate Risk',
  fusion_explanation: 'Moderate symptom severity; reduced sit-to-stand performance (8 reps); high occupational strain.',
  recommended_action: 'Refer to physiotherapy / re-screen in 3 months',
  referral_required: 0, referral_note: 'Home ergonomics guidance given. Follow up in 3 months.',
  specialist_name: null, specialist_contact: null,
  synced_at: new Date().toISOString(),
});

// Patient 2 — Jiten Gogoi — Low Risk
insertScreening.run({
  id: uuidv4(), patient_id: patientIds[2], worker_id: hwId, camp_name: 'Dhekiajuli Village Camp #4', status: 'completed',
  koos_responses: '{}', risk_factors: '{"bmiCategory":"normal","occupation":"moderate","priorInjury":false,"familyHistory":false,"symptomDurationMonths":2}',
  red_flag: 0, womac_pain: 20, womac_stiffness: 18, womac_function: 22, womac_total: 20,
  sts_reps: 14, sts_duration_s: 30, sts_quality: 'HIGH', sts_entry_method: 'camera',
  fusion_score: 22, risk_tier: 'Low Risk',
  fusion_explanation: 'All inputs within expected range. Normal joint function.',
  recommended_action: 'Self-management guidance / re-screen in 6-12 months',
  referral_required: 0, referral_note: 'Routine care. Next checkup in 6 months.',
  specialist_name: null, specialist_contact: null,
  synced_at: new Date().toISOString(),
});

// Add a few more screenings from other patients
insertScreening.run({
  id: uuidv4(), patient_id: patientIds[3], worker_id: hw2Id, camp_name: 'Rangapara Tea Estate Camp', status: 'referred',
  koos_responses: '{}', risk_factors: '{"bmiCategory":"obese","occupation":"heavy","priorInjury":true,"familyHistory":true,"symptomDurationMonths":36}',
  red_flag: 0, womac_pain: 80, womac_stiffness: 75, womac_function: 78, womac_total: 78,
  sts_reps: 4, sts_duration_s: 30, sts_quality: 'HIGH', sts_entry_method: 'camera',
  fusion_score: 85, risk_tier: 'High Risk',
  fusion_explanation: 'Severe symptom burden; very low functional performance (4 reps); maximum occupational risk.',
  recommended_action: 'Refer to orthopaedic specialist promptly',
  referral_required: 1, referral_note: 'Urgent PHC referral issued.',
  specialist_name: 'Dr. Ranjit Kalita', specialist_contact: '03712-234567',
  synced_at: new Date().toISOString(),
});

insertScreening.run({
  id: uuidv4(), patient_id: patientIds[4], worker_id: hwId, camp_name: 'Dhekiajuli Village Camp #4', status: 'completed',
  koos_responses: '{}', risk_factors: '{"bmiCategory":"overweight","occupation":"sedentary","priorInjury":false,"familyHistory":true,"symptomDurationMonths":18}',
  red_flag: 0, womac_pain: 45, womac_stiffness: 40, womac_function: 42, womac_total: 42,
  sts_reps: 10, sts_duration_s: 30, sts_quality: 'MEDIUM', sts_entry_method: 'manual',
  fusion_score: 48, risk_tier: 'Moderate Risk',
  fusion_explanation: 'Moderate symptoms; age 67 elevated risk factor.',
  recommended_action: 'Refer to physiotherapy / re-screen in 3 months',
  referral_required: 0, referral_note: null,
  specialist_name: null, specialist_contact: null,
  synced_at: new Date().toISOString(),
});

console.log('✅ Screenings seeded (5 completed screenings)');

// ─── GUIDANCE ITEMS ──────────────────────────────────────────────────────────

const insertGuidance = db.prepare(`
  INSERT INTO guidance_items (id, title, title_as, category, target_risk, description, desc_as, reps, duration)
  VALUES (@id, @title, @title_as, @category, @target_risk, @description, @desc_as, @reps, @duration)
`);

const guidanceItems = [
  {
    title: 'Chair-Assisted Sit-to-Stand',
    title_as: 'কুৰ্চি-সহায়ত উঠা-বহা',
    category: 'exercise',
    target_risk: '["Low Risk","Moderate Risk","High Risk"]',
    description: 'Strengthens quadriceps and reduces knee pain. Sit in a firm chair with feet flat. Slowly rise to standing using minimal arm support. Lower back down slowly.',
    desc_as: 'কুৰ্চিত বহি ভৰি সমতলত ৰাখক। লাহে লাহে উঠক। হাতৰ সহায় কম লওক।',
    reps: '10 repetitions',
    duration: '2 sets, twice daily',
  },
  {
    title: 'Straight-Leg Raises',
    title_as: 'পোন ভৰিৰ উত্তোলন',
    category: 'exercise',
    target_risk: '["Low Risk","Moderate Risk","High Risk"]',
    description: 'Strengthens thigh muscles without stressing the knee joint. Lie flat. Tighten thigh muscle. Lift leg to 45°. Hold 5 seconds. Lower slowly.',
    desc_as: 'পোন হৈ শুওক। উৰু পেশী টান কৰক। ভৰি ৪৫° উঠাওক। ৫ ছেকেণ্ড ধৰি ৰাখক।',
    reps: '15 repetitions each leg',
    duration: '3 sets, once daily',
  },
  {
    title: 'Wall Calf Stretches',
    title_as: 'বেৰত পিন্ধিৰ মাংসপেশী প্ৰসাৰণ',
    category: 'exercise',
    target_risk: '["Low Risk","Moderate Risk"]',
    description: 'Reduces morning stiffness and improves ankle flexibility. Stand facing a wall. Step one foot back. Keep heel flat. Lean into wall gently. Feel the stretch in calf.',
    desc_as: 'বেৰৰ মুখামুখি থিয় হওক। এখন ভৰি পিছলৈ দিয়ক। গোৰোহা সমতল ৰাখক।',
    reps: 'Hold 30 seconds each leg',
    duration: '3 times per side, twice daily',
  },
  {
    title: 'Weight Management & Diet',
    title_as: 'ওজন নিয়ন্ত্ৰণ আৰু খাদ্য',
    category: 'diet',
    target_risk: '["Moderate Risk","High Risk"]',
    description: 'Every 1 kg of weight loss reduces knee load by 4 kg. Eat less fried foods and rice. Increase vegetables, dal, and leafy greens. Drink 8 glasses of water daily.',
    desc_as: 'প্ৰতি ১ কেজি ওজন কমালে হাঁটুত ৪ কেজি চাপ কমে। তেলেতেলীয়া খাদ্য কম খাওক।',
    reps: null,
    duration: 'Daily habit',
  },
  {
    title: 'Low-Stool Squatting Alternative',
    title_as: 'নিচলৈ বহিব নালাগে বিকল্প',
    category: 'ergonomics',
    target_risk: '["Moderate Risk","High Risk"]',
    description: 'Avoid deep squatting and sitting on low surfaces. Use raised toilet seats. Place a low stool under feet when sitting. Avoid sitting cross-legged (padmasana).',
    desc_as: 'গভীৰ বহিব নালাগে। ওখ শৌচাগাৰৰ আসন ব্যৱহাৰ কৰক। মাটিত বহিব নালাগে।',
    reps: null,
    duration: 'Permanent lifestyle change',
  },
  {
    title: 'Hot & Cold Therapy',
    title_as: 'গৰম আৰু ঠাণ্ডা থেৰাপি',
    category: 'pain_relief',
    target_risk: '["Low Risk","Moderate Risk","High Risk"]',
    description: 'Cold pack for swollen/hot joints (first 48 hours). Warm compress for chronic stiffness. Apply for 15-20 minutes. Wrap in cloth before applying to skin.',
    desc_as: 'ফুলা গাঁঠিৰ বাবে ঠাণ্ডা প্যাক (প্ৰথম ৪৮ ঘণ্টা)। দীৰ্ঘকালীন শক্তিৰ বাবে গৰম সেক।',
    reps: '15-20 minutes',
    duration: '3 times daily as needed',
  },
  {
    title: 'Tea Garden Posture Correction',
    title_as: 'চাহ বাগানত সঠিক ভঙ্গিমা',
    category: 'ergonomics',
    target_risk: '["Moderate Risk","High Risk"]',
    description: 'When plucking tea: keep knees slightly bent (not fully flexed). Use a basket with shoulder straps instead of holding. Take micro-breaks every 30 minutes. Avoid kneeling on hard ground.',
    desc_as: 'চাহপাত তোলোতে: হাঁটু সামান্য বঁকা ৰাখক। কান্ধত ঝুড়ি ব্যৱহাৰ কৰক। ৩০ মিনিটৰ পিছত জিৰণি লওক।',
    reps: null,
    duration: 'During work hours',
  },
  {
    title: 'Padded Footwear Advice',
    title_as: 'গদি থকা পাদুকাৰ পৰামৰ্শ',
    category: 'lifestyle',
    target_risk: '["Low Risk","Moderate Risk","High Risk"]',
    description: 'Wear shoes with cushioned soles. Avoid flat slippers (hawai chappals) on hard ground. Use OA-friendly footwear with mild heel elevation. Orthopedic insoles available at district hospital.',
    desc_as: 'গদিযুক্ত জোতা পিন্ধক। শক্ত মেঝেত পাতল চেণ্ডেল নিপিন্ধিব। অৰ্থোপেডিক পাদুকা জিলা হাস্পতালত পোৱা যায়।',
    reps: null,
    duration: 'Always when walking outdoors',
  },
];

guidanceItems.forEach(item => {
  insertGuidance.run({ id: uuidv4(), ...item });
});

console.log('✅ Guidance items seeded (8 items)');
console.log('\n🎉 Seeding complete!');
console.log('\n📋 Demo Credentials:');
console.log('  Health Worker phone: 9435012894 (OTP logged to console)');
console.log('  Admin ID: AS-SON-NODAL-01 | PIN: 840291');

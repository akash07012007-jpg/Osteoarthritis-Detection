# 🌾 SAKHI (সখী) — Early Knee Osteoarthritis (OA) Screening Web App
> **Rural Clinical Fieldwork Edition — Calibrated for Frontline ASHA / ANM Outreach in North-East Region (Sonitpur District, Assam)**

---

## 📱 Features & Completed Screen Inventory

| Screen | Title / Flow | Route | Key Interactions & Features |
|---|---|---|---|
| **1** | **Dual Role Login & Setup** | `/` | 3 Roles: ASHA Health Worker, Govt Admin, Patient. Console OTP generator, English + Assamese language switch, offline status badge. |
| **2** | **Patient Signup & Baseline** | `/patient-entry` & `/consent` | Demographics, BMI build, Prior Injury, Family History, NER-OA ID generation, digital consent disclosure. |
| **3** | **Patient Screening Hub** | `/patient-hub` | Resumable card architecture, red-flag bypass safety logic, X-ray AI plugin slot, local SQLite sync. |
| **4** | **Preventive Guidance Library** | `/guidance` | 6 Categorized domains, search filter, step-by-step physio exercises, tea-garden ergonomics, local diet tips. |
| **5** | **Health Worker Home & Hub** | `/home` & `/my-patients` | Station context, 4-slide carousel, "Screen New Patient" hero CTA, live camp stats bar, recent patient triage list, Force Sync. |
| **6** | **Symptom Questionnaire** | `/questionnaire` | 42-Item KOOS instrument, 24-Item embedded WOMAC subscales (Pain, Stiffness, Function), red-flag gate, vernacular voice prompts. |
| **7** | **Sit-to-Stand Mobility Test** | `/sit-to-stand` | MediaPipe 3D world landmark tracking, adaptive lighting normalisation, FSM rise-stand detector, CDC STEADI norm scoring, manual counter fallback. |
| **8** | **Government Admin Dashboard** | `/admin` | District Nodal Officer analytics, multi-tier risk progress bar, Tea-Belt & Riverine Hotspot table with burden sorting, cohort drilldown, CSV export. |
| **9** | **Fusion Engine & Referral** | `/results` | Multimodal weighted fusion score, SVG radial meter, 4 diagnostic stream breakdown, specialist referral slip with instant PDF download. |

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd Sakhi
npm install
```

### 2. Seed SQLite Database with Prototype Data
```bash
npm run seed
```
> Populates sample health workers, district officer, 8 camp patients, and historical screenings into `data/sakhi.db`.

### 3. Start Backend API Server
```bash
npm run server
```
> Starts Express + SQLite server at `http://localhost:3001` (Logs OTP codes directly to terminal).

### 4. Start Frontend
```bash
npm run dev
```
> App runs at `http://localhost:5173`. Open in Mobile View (390×844) for best experience.

---

## 🧪 Demo Credentials

- **Health Worker Login**: Mobile `9435012894` → Tap **Get OTP** (Code logged to server terminal e.g. `4892`).
- **District Admin Login**: ID `AS-SON-NODAL-01` | Passcode `840291`.

---

## 🔬 X-Ray ML Model Integration Slot

When you are ready to plug in your custom X-Ray Machine Learning model:
1. Make a `POST` request to `http://localhost:3001/api/screenings/:id/xray`:
   ```json
   {
     "klGrade": 2,
     "xrayMlScore": 50,
     "xrayImagePath": "uploads/xray_001.jpg"
   }
   ```
2. The **Multimodal Fusion Engine** will automatically recalculate the weighted score with the radiograph component (15% weighting) without any code refactoring required.

---

## 🐳 Self-Hosting with Docker

```bash
docker compose up -d --build
```
> Runs containerized application with persistent SQLite volume mounted at `sakhi-data`.

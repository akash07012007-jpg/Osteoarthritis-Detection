# 🩺 Sakhi — AI-Assisted Osteoarthritis Screening for Rural North East India

> A zero-extra-hardware, offline-first screening tool that lets an ASHA/ANM worker triage knee osteoarthritis (OA) in under 10 minutes, with an explainable risk tier, a referral report, and a government dashboard showing where specialists are needed.

---

## 📖 Overview

**Problem:** OA goes undiagnosed across rural North Eastern Region (NER) because remote health camps have no screening tools and almost no orthopaedic specialists within reach.

**Who is affected**
- 🧑‍🌾 **The aging farmer / tea-garden worker:** decades of joint load, never sees a doctor, and the pain is dismissed as "old age."
- 👩‍⚕️ **The ASHA/ANM health worker:** asked to screen for everything, with no tool to assess a joint (about 55,000 workers reaching 39M people).
- 🏛️ **The district health department:** too few orthopaedic specialists and no data on where to deploy them.

**Root cause:** there is no triage layer between the community and the specialist. Patients either ignore the pain at home or travel hours to a specialist.

**Solution:** Sakhi adds that missing layer. It combines a validated clinical questionnaire, a camera-based functional test and an explainable fusion engine into one on-device workflow.

---

## ✨ Key Features

**Software Stack**
- 🐍⚛️ **React + Firebase Firestore:** offline persistence and automatic sync, with no custom sync queue
- 🎥 **MediaPipe Pose Landmarker:** browser-based, on-device sit-to-stand motion assessment
- 📋 **KOOS (42 items, 5 subscales):** clinical questionnaire; the full instrument is used as the sole instrument since its Daily Living subscale already covers WOMAC Function
- 🧮 **Fusion Engine (`fusion-engine.js`):** weighted, auto-renormalizing risk scoring with a plain-language explanation
- 🦴 **EfficientNet-B0 + FastAPI + Grad-CAM:** optional X-ray KL-grade classifier with visual explainability
- 🌐 **Multilingual UI + read-aloud audio:** English, Assamese, Khasi, Bengali
- 🏛️ **Government dashboard:** coverage, risk tiers, hotspot clusters, specialist allocation

**What makes it different**

| Layer | What it does |
|-------|--------------|
| 1. Clinical Instrument | Full KOOS plus risk factors (age, BMI, occupation, injury, family history, symptom duration), aligned with NICE guidance that OA can be diagnosed without imaging |
| 2. Objective Motion Data | Camera-based sit-to-stand test with quality gate and confidence score |
| 3. Explainable Verdict | Risk tier plus the named factors that drove it, with no black box |
| 4. Public Health Signal | Dynamic village/block hotspots and specialist allocation for district planners |

**Safety and robustness**
- 🚩 **Red-flag short-circuit:** recent trauma, hot swollen joint or rapid worsening skips scoring and routes straight to immediate referral
- 📉 **Confidence-weighted motion score:** unreliable tracking is downweighted, not discarded or blindly trusted
- 🔍 **Pre-test quality gate:** checks brightness, blur and body visibility before the timer starts
- ⏸️ **Pause on lost tracking**, with a manual-entry fallback
- 📐 **3D `worldLandmarks` for angle math:** fixes the aspect-ratio distortion of 2D normalized coordinates
- 👥 **Three roles:** Health Worker, Government, Patient, with role-aware terms for the unsupervised test
- 🔁 **Resumable Patient Hub:** matches real one-house-at-a-time ASHA visits

---

## ⚙️ Hardware Components

Sakhi needs **no additional hardware**. That is a deliberate choice for low-resource deployment.

| Component | Role |
|-----------|------|
| 📱 Smartphone / tablet with camera | Runs the app and the on-device pose test (rear → front → any camera fallback; GPU → CPU delegate fallback) |
| 🔊 Phone speaker / headphones | Plays per-question audio clips in the local language |
| 🖥️ Backend server *(optional)* | Hosts the FastAPI X-ray model endpoint (`POST /predict-xray`) |
| 🩻 X-ray image *(optional)* | Adds imaging evidence to the fusion score when available |
| ☁️ Firebase Firestore | Offline-persistent storage that syncs when connectivity returns |

---

## 🏗️ System Architecture

```
 KOOS Questionnaire ─┐
 Risk Factors ───────┼─► Clinical Risk Score ──┐
 Red-flag screen ────┘   (short-circuits to     │
                          immediate referral)   │
                                                ├─► FUSION ENGINE ─► Risk Tier + Explanation ─► Referral Report
 Camera Sit-to-Stand ─► Motion + Symmetry ──────┤   (confidence-       │
 (MediaPipe, on-device)   (confidence score)    │    weighted)         ▼
                                                │              Firestore (offline sync)
 X-ray (optional) ─► EfficientNet-B0 + Grad-CAM ┘                      │
                                                                       ▼
                                                           Government Dashboard
                                                (hotspots · specialist allocation · review workflow)
```

Without imaging, the clinical and motion scores are weighted roughly 50/50. With imaging, the weights are auto-renormalized across the symptom, risk factor, motion, symmetry and imaging components.

---

## 📁 Repository Structure *(suggested — adjust to your repo)*

```
.
├── app/                          # React application
│   ├── components/
│   │   └── QuestionAudioButton.jsx
│   └── public/audio/{lang}/{id}.mp3   # e.g. as/S1.mp3, as/P5.mp3
├── engine/
│   └── fusion-engine.js
├── prototypes/
│   └── sit-to-stand-test.html
├── xray-model/                   # FastAPI + EfficientNet-B0 + Grad-CAM
├── docs/
│   ├── oa-screening-build-spec.md
│   ├── master-design-prompt.md
│   ├── antigravity-build-prompt.md
│   ├── sit-to-stand-build-prompt.md
│   └── app-corrections-prompt.md
└── README.md
```

---

## 🚀 Getting Started

```bash
git clone https://github.com/[TODO-username]/[TODO-repo].git
cd [TODO-repo]

# Frontend
cd app && npm install
npm run dev

# X-ray API (optional)
cd ../xray-model
pip install -r requirements.txt
uvicorn main:app --reload      # exposes POST /predict-xray
```

**Prerequisites:** Node.js `[TODO version]`, Python 3.9+, a Firebase project with Firestore offline persistence enabled `[TODO: add env/config instructions]`.

---

## 🗓️ Hackathon Development Plan

| Phase | Focus | Status |
|-------|-------|--------|
| 1. Problem Discovery & Scoping | Named personas, root cause, sharpened problem statement | ✅ |
| 2. Ideation & Prioritization | 15 candidate approaches narrowed to 5 core levers | ✅ |
| 3. MVP Lock | 3 core features: questionnaire, camera test, fusion engine | ✅ |
| 4. Core Builds | Sit-to-stand test, KOOS form, fusion engine | ✅ |
| 5. X-ray Module | Trained EfficientNet-B0 with FastAPI endpoint and Grad-CAM | ✅ |
| 6. Government Dashboard & Data | Firestore, hotspots, specialist allocation, referral directory | ✅ |
| 7. App Design & Build | Master design spec, Stitch → React implementation, audio component | 🔄 ~60% built, corrections pass in progress |
| 8. Localization | Assamese audio done; Khasi and Bengali content pending | 🔄 |
| 9. Pitch Deck | Problem, Solution and Uniqueness slides done; Core Features and Architecture slides pending | 🔄 |

**Open items:** finalize Khasi/Bengali content, confirm the Patient Self-Service routing fix (Questionnaire → Test → Fusion) has landed, and build the Core Features and Architecture slides.

**Deliberately deprioritized:** vibroarthrography and vocal sensors (camera-only fits low-resource deployment better), live GPS/maps (connectivity constraints), and telemedicine and trend tracking (scope control).

---

## 📊 Results & Impact

### Results

| Metric | Value |
|--------|-------|
| X-ray model | EfficientNet-B0, 5-class KL grading |
| Training data | 8,260 X-rays, patient-level split |
| Exact-grade accuracy | **65.1%** |
| Within ±1 grade accuracy | **92.51%** |
| Screening time | Under 10 minutes per patient |
| Connectivity | Offline-capable |

Published models report roughly 69–82% exact accuracy across backbones, so the exact-grade result is near the lower end of that range. ±1-grade accuracy is the clinically meaningful figure, since KL grading is ordinal and subjective.

`[TODO: add pilot or test data from real participants, if available]`

### Impact
- **For patients:** earlier detection, before OA is normalized as "old age" and becomes severe.
- **For ASHA/ANM workers:** a structured, guided tool to assess a joint.
- **For district planners:** data on where OA clusters, so scarce orthopaedic specialists can be deployed where needed.
- **For policy:** fits the NHM and ABDM digital health pathway.

### Future Work
- Selective ML upgrade of the rule-based scoring engine
- Patient history and trend tracking
- Telemedicine linkage
- Field validation across NER districts

---

## ⚠️ Disclaimer

Sakhi is a **screening and triage aid, not a diagnostic device**. It supports referral decisions and does not replace clinical evaluation by a qualified doctor.

## 📄 License
`[TODO: e.g., MIT]`

## 👥 Team
| Name | Role | GitHub |
|------|------|--------|
| `[TODO]` | `[TODO]` | `[TODO]` |

## 🙏 Acknowledgements
MediaPipe, KOOS and WOMAC instruments, NICE OA guidelines, DeepKnee/Tiulpin et al. (methodology reference), Firebase, Google Stitch.

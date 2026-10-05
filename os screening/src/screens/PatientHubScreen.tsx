import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/ui/AppHeader';
import { ConnectivityRibbon } from '../components/ui/ConnectivityBadge';
import { api } from '../api/client';

export default function PatientHubScreen() {
  const navigate = useNavigate();
  const { currentPatient, language } = useApp();
  const { session, updateXray } = useScreening();

  const isAssamese = language === 'অসমীয়া';

  // Module statuses
  const koosDone = session?.questionnaireStatus === 'complete';
  const stsDone = session?.stsStatus === 'complete';
  const redFlagRaised = session?.redFlagAnswer === true;
  const resultsUnlocked = (koosDone && stsDone) || redFlagRaised;

  // Optional X-Ray Plugin state
  const [xrayKlGrade, setXrayKlGrade] = useState<number | null>(session?.xrayData?.klGrade ?? null);
  const [xraySaving, setXraySaving] = useState(false);
  const [xrayNotice, setXrayNotice] = useState('');

  const handleSaveXray = async (grade: number) => {
    setXraySaving(true);
    setXrayKlGrade(grade);
    updateXray({
      uploaded: true,
      klGrade: grade,
      uploadedAt: new Date(),
    });

    if (currentPatient?.id) {
      try {
        await api.uploadXrayData(currentPatient.id, {
          klGrade: grade,
          xrayMlScore: grade * 25,
        });
        setXrayNotice(isAssamese ? 'এক্স-ৰে ডাটা সংৰক্ষণ কৰা হ’ল' : 'X-Ray KL-Grade logged');
        setTimeout(() => setXrayNotice(''), 3000);
      } catch (e) {
        // local state fallback
      }
    }
    setXraySaving(false);
  };

  const completedCount = (koosDone ? 1 : 0) + (stsDone || redFlagRaised ? 1 : 0);

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader showBack title={isAssamese ? 'ৰোগী পৰীক্ষণ হাব' : 'Patient Screening Hub'} />

      <main className="flex flex-col w-full pt-16 pb-24 px-margin space-y-space-md max-w-md mx-auto">
        {/* Sync Status Ribbon */}
        <ConnectivityRibbon patientsCount={1} />

        {/* Patient Profile Banner */}
        <section className="bg-surface-container-high rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px] text-primary">
                  {currentPatient?.sex === 'female' ? 'woman' : 'elderly'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                    {currentPatient?.name || (isAssamese ? 'ৰতন বৰা' : 'Ratan Borah')}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm">
                    {currentPatient?.id ? `NER-OA-${currentPatient.id.slice(0, 4).toUpperCase()}` : 'NER-OA-0892'}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {currentPatient?.age ? `${currentPatient.age}y` : '58y'} •{' '}
                  {currentPatient?.sex === 'female' ? (isAssamese ? 'মহিলা' : 'Female') : (isAssamese ? 'পুৰুষ' : 'Male')} •{' '}
                  {currentPatient?.occupation || (isAssamese ? 'চাহ বাগান শ্ৰমিক' : 'Tea-garden Worker')}
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              <span>{currentPatient?.village || 'Dhekiajuli'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 bg-surface-container px-3 py-2 rounded-lg">
            <div className="flex items-center gap-1.5 text-on-surface font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span>{isAssamese ? 'সন্মতি সংৰক্ষিত' : 'Consent Recorded'}</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">cloud_done</span>
              <span>{isAssamese ? 'স্থানীয় সংৰক্ষণ সক্ৰিয়' : 'Synced Locally'}</span>
            </span>
          </div>
        </section>

        {/* Section Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              {isAssamese ? 'মাল্টিমডেল পৰীক্ষণ মডিউল' : 'Multimodal Assessment'}
            </h3>
          </div>
          <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-bold">
            {completedCount} of 2 {isAssamese ? 'সম্পূৰ্ণ' : 'Complete'}
          </span>
        </div>

        {/* Red Flag Alert Notice if triggered */}
        {redFlagRaised && (
          <div className="bg-secondary-container text-on-secondary-container p-4 rounded-xl flex items-start gap-3 border border-secondary/30">
            <span className="material-symbols-outlined text-[24px] text-secondary">emergency</span>
            <div>
              <h4 className="font-bold text-label-lg">
                {isAssamese ? 'জৰুৰী সতৰ্কতা: ৰেড-ফ্লেগ চিনাক্ত' : 'Red Flag Symptom Reported'}
              </h4>
              <p className="font-body-sm text-sm mt-0.5 leading-snug">
                {isAssamese
                  ? 'ৰোগীৰ সুৰক্ষাৰ বাবে উঠা-বহা শাৰীৰিক পৰীক্ষা বাইপাছ কৰা হৈছে। ফলাফল আৰু জৰুৰী ৰেফাৰেল পত্ৰৰ বাবে আগবাঢ়ক।'
                  : 'Physical mobility test safely bypassed to prevent acute joint injury. Proceed to Fusion Report for doctor referral.'}
              </p>
            </div>
          </div>
        )}

        {/* Modular Assessment Cards */}
        <div className="flex flex-col space-y-space-md">

          {/* Card 1: Questionnaire */}
          <div className="bg-surface-container-high rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-primary shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">quiz</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface font-bold">
                    {isAssamese ? '১. KOOS লক্ষণ আৰু বিষ প্ৰশ্নাৱলী' : '1. KOOS Clinical Questionnaire'}
                  </h4>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {isAssamese ? 'লক্ষণ, বিষ আৰু দৈনন্দিন কাৰ্য্যক্ষমতা' : 'Symptoms, Pain & Daily Activities'}
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-label-sm font-bold flex items-center gap-1 shrink-0 ${
                koosDone ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-highest text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {koosDone ? 'check_circle' : 'schedule'}
                </span>
                <span>{koosDone ? (isAssamese ? 'সম্পূৰ্ণ' : 'Complete') : (isAssamese ? 'বাকী আছে' : 'Needs Entry')}</span>
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {isAssamese
                ? 'হাঁটুৰ বিষ, ফুলি উঠা, টান অনুভৱ আৰু কৃষি/বাগিচা কামৰ প্ৰভাৱৰ ৪২টা প্ৰশ্ন আৰু ৰেড-ফ্লেগ নিৰূপণ।'
                : 'Validated regional symptom severity assessment, mobility limits, and clinical red-flag triage.'}
            </p>
            <button
              onClick={() => navigate('/questionnaire')}
              className="btn-primary"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">{koosDone ? 'edit_note' : 'play_arrow'}</span>
              <span>{koosDone ? (isAssamese ? 'উত্তৰসমূহ পুনৰীক্ষণ কৰক' : 'Review / Edit Responses') : (isAssamese ? 'প্ৰশ্নাৱলী আৰম্ভ কৰক' : 'Start Questionnaire')}</span>
            </button>
          </div>

          {/* Card 2: Sit-to-Stand Test */}
          <div className={`rounded-xl p-4 shadow-sm flex flex-col gap-3 ${
            redFlagRaised ? 'bg-surface-dim opacity-75' : 'bg-surface-container-high'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container text-[18px]">videocam</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface font-bold">
                    {isAssamese ? '২. ৩০-ছেকেণ্ড উঠা-বহা পৰীক্ষা' : '2. 30s Sit-to-Stand Mobility Test'}
                  </h4>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    {isAssamese ? 'কেমেৰা এআই দ্বাৰা বায়োমেকানিক্স নিৰীক্ষণ' : 'Computer Vision Biomechanics'}
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-label-sm font-bold flex items-center gap-1 shrink-0 ${
                redFlagRaised
                  ? 'bg-outline-variant text-on-surface-variant'
                  : stsDone
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-secondary-container text-on-secondary-container'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {redFlagRaised ? 'block' : stsDone ? 'check_circle' : 'motion_sensor_active'}
                </span>
                <span>
                  {redFlagRaised
                    ? (isAssamese ? 'নিষ্ক্ৰিয় (ৰেড ফ্লেগ)' : 'Bypassed')
                    : stsDone
                      ? `${session?.stsData?.reps || 0} ${isAssamese ? 'বাৰ সম্পূৰ্ণ' : 'Reps Done'}`
                      : (isAssamese ? 'পৰীক্ষা বাকী' : 'Needs Capture')}
                </span>
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {redFlagRaised
                ? (isAssamese ? 'তীব্ৰ বিষ আৰু ফুলাৰ বাবে শাৰীৰিক পৰীক্ষা সুৰক্ষিতভাৱে বাদ দিয়া হৈছে।' : 'Safely bypassed due to acute red flag.')
                : (isAssamese ? '৩০ ছেকেণ্ডত কেইবাৰ উঠিব-বহিব পাৰে কেমেৰা অথবা মেনুৱেল কাউণ্টাৰৰ জৰিয়তে পৰীক্ষা কৰক।' : 'Automated 30s chair-stand tracking detects joint stiffness and functional stamina.')}
            </p>

            {!redFlagRaised && (
              <button
                onClick={() => navigate('/sit-to-stand')}
                className="w-full min-h-[48px] px-4 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">{stsDone ? 'refresh' : 'videocam'}</span>
                <span>{stsDone ? (isAssamese ? 'পুনৰ পৰীক্ষা কৰক' : 'Retest Mobility') : (isAssamese ? 'কেমেৰা পৰীক্ষা আৰম্ভ কৰক' : 'Start Mobility Test')}</span>
              </button>
            )}
          </div>

          {/* Card 3: Results & Fusion Engine Report */}
          <div className={`rounded-xl p-4 shadow-sm flex flex-col gap-3 ${
            resultsUnlocked ? 'bg-surface-container-lowest border-2 border-primary shadow-card-2' : 'bg-surface-dim opacity-60'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface font-bold">
                    {isAssamese ? '৩. ফিউজন বিশ্লেষণ আৰু ৰেফাৰেল ৰিপ’ৰ্ট' : '3. Fusion Analysis & Referral Report'}
                  </h4>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {isAssamese ? 'বহু-মডেলভিত্তিক সংকট মূল্যায়ন' : 'Clinical Decision Support'}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant text-label-sm font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  {resultsUnlocked ? 'lock_open' : 'lock'}
                </span>
                <span>{resultsUnlocked ? (isAssamese ? 'প্ৰস্তুত' : 'Ready') : (isAssamese ? 'লক কৰা' : 'Locked')}</span>
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {resultsUnlocked
                ? (isAssamese ? 'প্ৰশ্নাৱলী আৰু গতিশীলতা তথ্য সংগ্ৰহ সম্পূৰ্ণ। সামগ্রিক সংকট স্ক’ৰ আৰু পি.এইচ.চি ৰেফাৰেল পত্ৰ চাওক।' : 'All prerequisite streams captured. View combined risk score, clinical drivers, and doctor referral slip.')
                : (isAssamese ? 'সংকট স্ক’ৰ খুলিবলৈ ওপৰৰ দুয়োটা মডিউল সম্পূৰ্ণ কৰক।' : 'Complete Questionnaire and Mobility test to unlock OA risk calculation.')}
            </p>

            <button
              onClick={() => navigate('/results')}
              disabled={!resultsUnlocked}
              className={`w-full min-h-[48px] px-4 rounded-xl font-label-md text-label-md font-bold flex items-center justify-center gap-2 transition-all ${
                resultsUnlocked
                  ? 'bg-primary text-on-primary hover:bg-primary-container shadow-md'
                  : 'bg-outline-variant text-outline cursor-not-allowed'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              <span>
                {resultsUnlocked
                  ? (isAssamese ? 'ফিউজন ফলাফল আৰু ৰিপ’ৰ্ট চাওক' : 'View Fusion Results & Referral')
                  : (isAssamese ? 'লক কৰা (ওপৰৰ পদক্ষেপসমূহ কৰক)' : 'Locked (Complete Steps Above)')}
              </span>
            </button>
          </div>

          {/* Card 4: Optional Knee X-Ray AI Plugin Slot */}
          <div className="bg-surface-container-high rounded-xl p-4 shadow-sm flex flex-col gap-3 border border-outline-variant/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-[18px]">radiology</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface font-bold">
                    {isAssamese ? '৪. এক্স-ৰে এআই বিশ্লেষণ (ঐচ্ছিক মডিউল)' : '4. Knee X-Ray AI Analysis (Optional)'}
                  </h4>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">
                    {isAssamese ? 'এমএল মডেল ইন্টিগ্ৰেচন স্লট' : 'ML Model Plugin Slot'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                Optional
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {isAssamese
                ? 'যদি ৰোগীৰ এক্স-ৰে উপলব্ধ থাকে, Kellgren-Lawrence (KL) গ্ৰেড বাছক। ইয়াৰ দ্বাৰা সংকট স্ক’ৰ আৰু অধিক নিখুঁত হ’ব।'
                : 'Select Kellgren-Lawrence (KL 0–4) grade or upload digital radiograph. Integrates seamlessly into the multimodal fusion equation.'}
            </p>

            {xrayNotice && (
              <div className="bg-primary-fixed text-on-primary-fixed p-2 rounded-lg text-label-sm flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{xrayNotice}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-label-sm text-on-surface-variant font-semibold mr-1">KL Grade:</span>
              {[0, 1, 2, 3, 4].map((grade) => (
                <button
                  key={grade}
                  onClick={() => handleSaveXray(grade)}
                  disabled={xraySaving}
                  className={`flex-1 py-2 rounded-lg text-label-sm font-bold transition-all ${
                    xrayKlGrade === grade
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-highest'
                  }`}
                  type="button"
                >
                  G{grade}
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

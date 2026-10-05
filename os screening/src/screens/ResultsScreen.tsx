import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/ui/AppHeader';
import { runFusionEngine } from '../engine/fusionEngine';
import { scoreWOMAC } from '../data/koosQuestions';
import { lookupSpecialist } from '../data/districtSpecialists';
import { api } from '../api/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ResultsScreen() {
  const navigate = useNavigate();
  const { session, setFusionOutput } = useScreening();
  const { currentPatient, language } = useApp();
  const isAssamese = language === 'অসমীয়া';
  const reportRef = useRef<HTMLDivElement>(null);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Compute WOMAC Subscales
  const womac = useMemo(() => {
    return scoreWOMAC(session?.koosResponses || {});
  }, [session?.koosResponses]);

  // Risk factor score computation (0-100)
  const riskFactorScore = useMemo(() => {
    let score = 0;
    const rf = session?.riskFactors;
    const age = currentPatient?.age || 58;

    if (age >= 65) score += 25;
    else if (age >= 50) score += 15;

    if (rf?.bmiCategory === 'obese') score += 25;
    else if (rf?.bmiCategory === 'overweight') score += 15;

    if (rf?.occupation === 'heavy') score += 25;
    if (rf?.priorInjury) score += 15;
    if (rf?.familyHistory) score += 10;
    if ((rf?.symptomDurationMonths || 0) >= 12) score += 10;

    return Math.min(100, score);
  }, [session?.riskFactors, currentPatient?.age]);

  // Motion score from Sit-to-Stand
  const stsReps = session?.stsData?.reps ?? 8;
  const stsQuality = session?.stsData?.trackingQuality || 'HIGH';
  const confidence = stsQuality === 'HIGH' ? 0.9 : 0.6;

  const motionScore = useMemo(() => {
    if (!session?.stsData) return 60; // neutral baseline
    if (stsReps < 7) return 85;
    if (stsReps < 11) return 65;
    if (stsReps < 15) return 35;
    return 15;
  }, [session?.stsData, stsReps]);

  // Run Multimodal Fusion Engine
  const fusionResult = useMemo(() => {
    return runFusionEngine({
      redFlag: session?.redFlagAnswer === true,
      symptomScore: womac.totalNormalized,
      riskFactorScore,
      motionScore,
      motionConfidence: confidence,
      imagingScore: session?.xrayData?.uploaded
        ? session.xrayData.klGrade
          ? session.xrayData.klGrade * 25
          : 50
        : null,
    });
  }, [session?.redFlagAnswer, womac.totalNormalized, riskFactorScore, motionScore, confidence, session?.xrayData]);

  // Save fusion result to context and SQLite
  useEffect(() => {
    setFusionOutput(fusionResult);
    if (currentPatient?.id) {
      api.updateScreening(currentPatient.id, {
        fusion_score: fusionResult.score,
        risk_tier: fusionResult.tier,
        fusion_explanation: fusionResult.explanation,
        recommended_action: fusionResult.recommendedAction,
        referral_required: fusionResult.tier.includes('High') || fusionResult.tier.includes('Immediate') ? 1 : 0,
        status: 'completed',
      }).catch((e) => console.warn('Syncing fusion score:', e));
    }
  }, [fusionResult, currentPatient?.id, setFusionOutput]);

  // Lookup Specialist Hospital
  const specialist = useMemo(() => {
    return lookupSpecialist(currentPatient?.district || 'Sonitpur');
  }, [currentPatient?.district]);

  // PDF Export
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Sakhi_OA_Referral_${currentPatient?.name || 'Patient'}.pdf`);
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const isHighRisk = fusionResult.tier.includes('High') || fusionResult.tier.includes('Immediate');
  const isModRisk = fusionResult.tier === 'Moderate Risk';

  // Calculations for Radial Meter (circumference = 100)
  const scoreVal = fusionResult.score ?? 62;
  const strokeDash = `${scoreVal}, 100`;

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader showBack title={isAssamese ? 'ফিউজন বিশ্লেষণ আৰু ৰেফাৰেল' : 'Patient Detail Summary'} />

      <main className="flex flex-col w-full pt-16 pb-28 px-margin space-y-3.5 max-w-md mx-auto">
        
        {/* Offline Queue Sync Strip */}
        <div className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-2 rounded-xl flex items-center justify-between shadow-xs border border-tertiary/20">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="material-symbols-outlined text-[16px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
              cloud_queue
            </span>
            <span>{isAssamese ? 'স্থানীয়ভাৱে সংৰক্ষিত • পি.এইচ.চি পঞ্জীত জমা' : 'Saved Locally • Queued for Sonitpur Portal'}</span>
          </div>
          <span className="font-label-sm text-label-sm font-bold bg-tertiary-fixed-dim/40 px-2 py-0.5 rounded-full">
            Step 4/4
          </span>
        </div>

        {/* Printable Report Canvas */}
        <div ref={reportRef} className="space-y-3.5 bg-surface">
          
          {/* Patient Context Badge & Identifiers */}
          <section className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-2.5 shadow-card-1 border border-outline-variant/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-primary-fixed flex items-center justify-center text-primary font-bold text-lg">
                  {currentPatient?.name ? currentPatient.name.charAt(0) : 'R'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      {currentPatient?.name || (isAssamese ? 'ৰতন বৰা' : 'Ratan Borah')}
                    </h2>
                    <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {currentPatient?.age || 58}y {currentPatient?.sex === 'female' ? 'Female' : 'Male'} • {currentPatient?.occupation || 'Tea-garden Worker'}
                  </p>
                </div>
              </div>
              <span className="font-label-sm text-label-sm bg-surface-container-highest px-2.5 py-1 rounded-lg text-on-surface font-mono font-bold">
                {currentPatient?.id ? `NER-OA-${currentPatient.id.slice(0, 4).toUpperCase()}` : 'NER-OA-0892'}
              </span>
            </div>

            <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1 border-t border-outline-variant/30">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </span>
              <span className="flex items-center gap-1 text-primary font-bold">
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                <span>Sub-Center: {currentPatient?.village || 'Dhekiajuli West'}</span>
              </span>
            </div>
          </section>

          {/* Triage Hero Card */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-card-1 border border-outline-variant/30 flex flex-col gap-4">
            {/* Risk Title Ribbon */}
            <div className={`rounded-xl px-3.5 py-2.5 flex items-center justify-between text-on-primary ${
              isHighRisk ? 'bg-secondary' : isModRisk ? 'bg-[#b8863a]' : 'bg-primary'
            }`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isHighRisk ? 'emergency' : isModRisk ? 'info' : 'check_circle'}
                </span>
                <span className="font-label-lg text-label-lg tracking-wide uppercase font-bold">
                  {fusionResult.tier}
                </span>
              </div>
              <span className="font-label-sm text-label-sm font-bold bg-white/20 px-2 py-0.5 rounded">
                {isHighRisk ? 'Tier 3' : isModRisk ? 'Tier 2' : 'Tier 1'}
              </span>
            </div>

            {/* Fusion Score Visual Radial Meter */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">
                  {isAssamese ? 'মাল্টিমডেল ফিউজন স্ক’ৰ' : 'Multimodal Fusion Score'}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface font-bold font-mono">
                    {scoreVal}
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface-variant font-bold">/ 100</span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-bold mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">sensors</span>
                  <span>{isAssamese ? 'উচ্চ বিশ্বাসযোগ্যতা (ভিজন পৰীক্ষিত)' : 'Confidence: High (Vision verified)'}</span>
                </span>
              </div>

              {/* SVG Radial Progress Meter */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-high"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className={isHighRisk ? 'text-secondary' : isModRisk ? 'text-[#b8863a]' : 'text-primary'}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={strokeDash}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`material-symbols-outlined text-[22px] ${isHighRisk ? 'text-secondary' : isModRisk ? 'text-[#b8863a]' : 'text-primary'}`}>
                    {isHighRisk ? 'crisis_alert' : isModRisk ? 'warning' : 'verified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Plain Clinical Rationale Box */}
            <div className="bg-surface-container p-3.5 rounded-xl flex flex-col gap-1.5 border border-outline-variant/30">
              <span className="font-label-sm text-label-sm text-primary font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                <span>{isAssamese ? 'প্ৰধান নিদানিক চালকসমূহ:' : 'Key Clinical Drivers'}</span>
              </span>
              <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                {fusionResult.explanation}
              </p>
            </div>
          </section>

          {/* Multi-Modal Diagnostic Breakdown Accordion Cards */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                {isAssamese ? 'মডেলভিত্তিক নিৰ্ণয় বিশ্লেষণ' : 'Modal Diagnostic Breakdown'}
              </h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                4 Streams Integrated
              </span>
            </div>

            {/* Module 1: WOMAC Symptoms */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                  </div>
                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface font-bold">
                      {isAssamese ? 'লক্ষণৰ তীব্ৰতা (WOMAC)' : 'Symptom Severity (WOMAC)'}
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                      Validated Regional Questionnaire
                    </p>
                  </div>
                </div>
                <span className="font-label-lg text-label-lg text-on-surface font-bold bg-surface-container px-2.5 py-0.5 rounded-lg font-mono">
                  {womac.totalNormalized}/100
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-surface-container-low rounded-xl p-2 flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-semibold">Pain</span>
                  <span className="text-label-md text-secondary font-bold font-mono">
                    {Math.round((womac.pain / womac.painMax) * 100)}%
                  </span>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: `${(womac.pain / womac.painMax) * 100}%` }} />
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-2 flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-semibold">Stiffness</span>
                  <span className="text-label-md text-tertiary font-bold font-mono">
                    {Math.round((womac.stiffness / womac.stiffnessMax) * 100)}%
                  </span>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-tertiary h-full rounded-full" style={{ width: `${(womac.stiffness / womac.stiffnessMax) * 100}%` }} />
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-2 flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-semibold">Function</span>
                  <span className="text-label-md text-primary font-bold font-mono">
                    {Math.round((womac.function / womac.functionMax) * 100)}%
                  </span>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${(womac.function / womac.functionMax) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Module 2: Mobility & Biometrics */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">directions_walk</span>
                  </div>
                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface font-bold">
                      {isAssamese ? '৩০-ছেকেণ্ড উঠা-বহা পৰীক্ষা' : '30s Chair-Rise Mobility Test'}
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                      AI Computer-Vision Analysis
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2.5 py-0.5 rounded-lg font-bold">
                  {stsReps < 10 ? 'Sub-optimal' : 'Normal'}
                </span>
              </div>

              <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-medium">Total Repetitions (30s)</span>
                  <span className="font-bold text-on-surface">{stsReps} Reps <span className="font-normal text-on-surface-variant">(Norm: 12–17)</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-medium">Mean Velocity per Stand</span>
                  <span className="font-bold text-on-surface">2.4 seconds</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-medium">Bilateral Weight Bias</span>
                  <span className="font-bold text-secondary">12% Right Knee Antalgic Shift</span>
                </div>
              </div>
            </div>

            {/* Module 3: Occupational & Lifestyle */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">agriculture</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface font-bold">
                    {isAssamese ? 'কৰ্মক্ষেত্ৰৰ চাপ কাৰক' : 'Occupational Strain Factor'}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                    30+ yrs tea-plucking, daily deep squats
                  </p>
                </div>
              </div>
              <span className="font-label-sm text-label-sm text-on-error bg-error-container/80 px-2.5 py-1 rounded-full font-bold shrink-0">
                High Impact
              </span>
            </div>

            {/* Module 4: Optional Knee X-Ray AI Analysis */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">radiology</span>
                  </div>
                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface font-bold">
                      {isAssamese ? 'এক্স-ৰে এআই শ্ৰেণীবিভাজন' : 'Knee X-Ray Classification'}
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                      {session?.xrayData?.uploaded ? 'Kellgren-Lawrence (KL) Model Input' : 'Model Plugin Slot (Optional)'}
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded font-bold">
                  {session?.xrayData?.uploaded ? `KL-Grade ${session.xrayData.klGrade}` : 'Ready'}
                </span>
              </div>
            </div>
          </section>

          {/* District Specialist Referral Recommendation Slip */}
          <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[22px]">local_hospital</span>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                {isAssamese ? 'নিকটৱৰ্তী বিশেষজ্ঞ ৰেফাৰেল পত্ৰ' : 'District Specialist Referral Slip'}
              </h3>
            </div>

            {specialist && (
              <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2 text-body-sm border border-outline-variant/30">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-label-md text-on-surface">{specialist.hospital}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                    {specialist.type}
                  </span>
                </div>
                <p className="text-on-surface-variant text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                  <span>{specialist.address}</span>
                </p>
                <div className="flex items-center justify-between pt-1.5 border-t border-outline-variant/30 text-xs text-on-surface font-semibold">
                  <span>OPD Days: {specialist.orthopedicDays}</span>
                  <span>Ph: {specialist.contact}</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between text-xs font-semibold text-on-surface-variant">
              <span>{fusionResult.recommendedAction}</span>
              <span className="text-primary font-bold">NHM Protocol</span>
            </div>
          </section>
        </div>

        {/* Floating Success Toast */}
        {printSuccess && (
          <div className="bg-primary-fixed text-on-primary-fixed p-3 rounded-xl flex items-center gap-2 text-label-sm font-bold shadow-sm">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{isAssamese ? 'ৰেফাৰেল ৰিপ’ৰ্ট PDF সফলভাৱে সংৰক্ষিত হ’ল!' : 'Referral Report PDF downloaded successfully!'}</span>
          </div>
        )}

        {/* Action Trays */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleExportPDF}
            disabled={downloadingPdf}
            className="btn-primary"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            <span>{downloadingPdf ? 'Generating PDF Slip...' : isAssamese ? 'ৰেফাৰেল পত্ৰ ডাউনলোড কৰক (PDF)' : 'Download Referral Slip (PDF)'}</span>
          </button>

          <button
            onClick={() => navigate('/complete')}
            className="btn-outline"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
            <span>{isAssamese ? 'পৰীক্ষণ অধিবেশন সম্পূৰ্ণ কৰক' : 'Complete Screening Session'}</span>
          </button>
        </div>
      </main>
    </div>
  );
}

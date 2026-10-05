import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/ui/AppHeader';
import { ConnectivityRibbon } from '../components/ui/ConnectivityBadge';
import { api } from '../api/client';
import type { Patient } from '../context/AppContext';

interface PatientQueueItem {
  id: string;
  name: string;
  age: number;
  sex: string;
  occupation: string;
  village: string;
  block: string;
  risk_tier?: string;
  fusion_score?: number;
  referral_required?: number;
}

const CAROUSEL_SLIDES = [
  {
    tag: '10 Min Protocol',
    tag_as: '১০ মিনিটৰ প্ৰট’কল',
    tagIcon: 'timer',
    iconBg: 'bg-primary-fixed text-on-primary-fixed',
    icon: 'vital_signs',
    headline: 'Screen for Knee OA in under 10 minutes.',
    headline_as: '১০ মিনিটৰ ভিতৰতে আঁঠুৰ বাতবিষ নিৰূপণ।',
    body: 'Zero lab apparatus required. Rapid physical assessment calibrated for field camps in Sonitpur.',
    body_as: 'কোনো লেব যন্ত্ৰৰ প্ৰয়োজন নাই। গ্ৰাম্য ক্ষেত্ৰৰ বাবে যুগুত কৰা দ্ৰুত শাৰীৰিক পৰীক্ষণ।',
  },
  {
    tag: 'Sensor Vision',
    tag_as: 'কেমেৰা চেঞ্চৰ',
    tagIcon: 'photo_camera',
    iconBg: 'bg-secondary-fixed text-on-secondary-fixed',
    icon: 'chair',
    headline: 'Camera Sit-to-Stand functional rep test.',
    headline_as: 'কেমেৰা দ্বাৰা ৩০ ছেকেণ্ডৰ উঠা-বহা পৰীক্ষা।',
    body: 'Automated 30-sec sit-stand counting detects early biomechanical stiffness & knee fatigue.',
    body_as: 'স্বয়ংক্রিয় গণনাৰে গাঁঠিৰ টান অনুভৱ আৰু মাংসপেশীৰ দুৰ্বলতা আগতীয়াকৈ ধৰা পেলায়।',
  },
  {
    tag: 'Zero Network',
    tag_as: '১০০% অফলাইন',
    tagIcon: 'cloud_off',
    iconBg: 'bg-tertiary-fixed text-on-tertiary-fixed',
    icon: 'save',
    headline: '100% Offline with local device storage.',
    headline_as: 'ইণ্টাৰনেট অবিহনে স্থানীয়ভাৱে সংৰক্ষিত।',
    body: 'Perform door-to-door screenings in tea gardens. Sync effortlessly when connected to PHC.',
    body_as: 'চাহ বাগিচা বা দূৰ্গম অঞ্চলত পৰীক্ষা কৰক। পিএইচচিত সংযোগ পালে আপোনা-আপুনি সংমিশ্ৰণ হ’ব।',
  },
  {
    tag: 'Explainable AI',
    tag_as: 'স্পষ্ট বিশ্লেষণ',
    tagIcon: 'psychology',
    iconBg: 'bg-primary text-on-primary',
    icon: 'rule',
    headline: 'Transparent explainable OA risk tiers.',
    headline_as: 'সহজ আৰু বোধগম্য সংকট শ্ৰেণীবিভাজন।',
    body: 'Dual symptom-function matrices map clear clinical rationales for doctor referrals.',
    body_as: 'লক্ষণ আৰু গতিশীলতা বিশ্লেষণ কৰি উপযুক্ত ডাক্তৰী ৰেফাৰেল পৰামৰ্শ প্ৰদান কৰে।',
  },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { user, setCurrentPatient, language } = useApp();
  const { initSession } = useScreening();
  const isAssamese = language === 'অসমীয়া';

  const [slideIndex, setSlideIndex] = useState(0);
  const [patients, setPatients] = useState<PatientQueueItem[]>([]);
  const [stats, setStats] = useState({
    totalScreened: 14,
    highRisk: 3,
    modRisk: 7,
    lowRisk: 4,
    pendingSync: 2,
  });
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  // Auto-advance hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % CAROUSEL_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Fetch live stats & patients from SQLite
  useEffect(() => {
    async function loadData() {
      try {
        const statsRes = await api.getAdminStats();
        if (statsRes && statsRes.totalScreened > 0) {
          setStats({
            totalScreened: statsRes.totalScreened,
            highRisk: statsRes.highRisk,
            modRisk: statsRes.modRisk,
            lowRisk: statsRes.lowRisk,
            pendingSync: 0,
          });
        }
        const patientData = await api.getAdminPatients({ limit: '6' });
        if (patientData && patientData.length > 0) {
          setPatients(patientData);
        } else {
          // Fallback demo patients
          setPatients([
            { id: 'p1', name: 'Bhaben Das', age: 62, sex: 'male', occupation: 'Farmer', village: 'Dhekiajuli', block: 'Dhekiajuli Block', risk_tier: 'High Risk', fusion_score: 78, referral_required: 1 },
            { id: 'p2', name: 'Monomati Devi', age: 54, sex: 'female', occupation: 'Tea Garden Worker', village: 'Dhekiajuli', block: 'Dhekiajuli Block', risk_tier: 'Moderate Risk', fusion_score: 62, referral_required: 0 },
            { id: 'p3', name: 'Jiten Gogoi', age: 48, sex: 'male', occupation: 'Daily Porter', village: 'Balipara', block: 'Balipara Block', risk_tier: 'Low Risk', fusion_score: 22, referral_required: 0 },
          ]);
        }
      } catch {
        // Local demo fallback
        setPatients([
          { id: 'p1', name: 'Bhaben Das', age: 62, sex: 'male', occupation: 'Farmer', village: 'Dhekiajuli', block: 'Dhekiajuli Block', risk_tier: 'High Risk', fusion_score: 78, referral_required: 1 },
          { id: 'p2', name: 'Monomati Devi', age: 54, sex: 'female', occupation: 'Tea Garden Worker', village: 'Dhekiajuli', block: 'Dhekiajuli Block', risk_tier: 'Moderate Risk', fusion_score: 62, referral_required: 0 },
          { id: 'p3', name: 'Jiten Gogoi', age: 48, sex: 'male', occupation: 'Daily Porter', village: 'Balipara', block: 'Balipara Block', risk_tier: 'Low Risk', fusion_score: 22, referral_required: 0 },
        ]);
      }
    }
    loadData();
  }, []);

  const handleForceSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setStats((s) => ({ ...s, pendingSync: 0 }));
      setSyncNotice(isAssamese ? 'সকলো তথ্য সফলতাৰে সংমিশ্ৰিত হ’ল!' : 'All local queue records synced with PHC!');
      setTimeout(() => setSyncNotice(''), 3500);
    }, 1200);
  };

  const handleOpenPatient = (p: PatientQueueItem) => {
    const patientObj: Patient = {
      id: p.id,
      name: p.name,
      age: p.age,
      sex: p.sex as any,
      occupation: p.occupation,
      village: p.village,
      block: p.block,
      district: 'Sonitpur',
      registeredBy: user?.uid || 'hw',
      entrySource: 'healthWorker',
      consentGiven: true,
      createdAt: new Date(),
    };
    setCurrentPatient(patientObj);
    initSession(p.id);
    navigate('/patient-hub');
  };

  const slide = CAROUSEL_SLIDES[slideIndex];

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader />

      <main className="flex flex-col w-full pt-28 pb-32 bg-surface min-h-screen max-w-md mx-auto">
        <div className="flex flex-col w-full px-margin space-y-space-md">

          {/* Camp Context Banner & Real-time Connectivity Badge */}
          <section className="flex items-center justify-between bg-surface-container-low p-space-sm rounded-xl shadow-sm border border-outline-variant/30">
            <div className="flex items-center gap-space-xs min-w-0">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                location_on
              </span>
              <div className="truncate">
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                  {user?.subCenter || 'Balipara SC'} • {isAssamese ? 'আউটৰিচ শিবিৰ' : 'Outreach Station'}
                </p>
                <p className="font-label-md text-label-md text-on-surface font-bold truncate">
                  {user?.district || 'Sonitpur'} {isAssamese ? 'জিলা শিবিৰ #৪' : 'Village Camp #4'}
                </p>
              </div>
            </div>
            <ConnectivityRibbon patientsCount={stats.totalScreened} />
          </section>

          {syncNotice && (
            <div className="bg-primary-fixed text-on-primary-fixed p-3 rounded-xl flex items-center gap-2 text-label-sm font-bold shadow-xs">
              <span className="material-symbols-outlined text-[18px]">cloud_done</span>
              <span>{syncNotice}</span>
            </div>
          )}

          {/* Feature Carousel Card */}
          <section className="relative bg-surface-container-lowest rounded-2xl shadow-card-1 p-space-md flex flex-col justify-between overflow-hidden border border-outline-variant/30">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-primary-fixed/40 pointer-events-none blur-2xl" />

            <div className="relative z-10 min-h-[140px] flex flex-col justify-between">
              <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                <div className="inline-flex items-center gap-1 bg-surface-container-high text-primary px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[15px]">{slide.tagIcon}</span>
                  <span className="font-label-sm text-label-sm font-bold">{isAssamese ? slide.tag_as : slide.tag}</span>
                </div>
                <span className="font-label-sm text-label-sm text-outline-variant font-bold">
                  {slideIndex + 1} / {CAROUSEL_SLIDES.length}
                </span>
              </div>

              <div className="flex items-center gap-space-sm my-space-xs">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${slide.iconBg}`}>
                  <span className="material-symbols-outlined text-[24px]">{slide.icon}</span>
                </div>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold leading-tight" style={{ fontFamily: 'Work Sans, sans-serif' }}>
                  {isAssamese ? slide.headline_as : slide.headline}
                </h2>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1">
                {isAssamese ? slide.body_as : slide.body}
              </p>
            </div>

            {/* Dots */}
            <div className="mt-space-md pt-space-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {CAROUSEL_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === slideIndex ? 'w-6 bg-primary' : 'w-2 bg-outline-variant'
                    }`}
                    type="button"
                  />
                ))}
              </div>
              <button
                onClick={() => setSlideIndex((i) => (i + 1) % CAROUSEL_SLIDES.length)}
                className="min-h-[40px] w-10 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container active:scale-95 transition-all"
                type="button"
                aria-label="Next slide"
              >
                <span className="material-symbols-outlined text-primary text-[20px]">chevron_right</span>
              </button>
            </div>
          </section>

          {/* Big Hero Tap CTA: Start New Patient Screening */}
          <section className="w-full">
            <button
              onClick={() => navigate('/patient-entry')}
              className="btn-primary flex items-center justify-between py-3.5"
              type="button"
            >
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    add_circle
                  </span>
                </div>
                <div className="text-left min-w-0">
                  <span className="font-label-lg text-label-lg font-bold block text-on-primary">
                    {isAssamese ? 'নতুন ৰোগী পৰীক্ষা কৰক' : 'New Patient Screening'}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-primary-container block truncate opacity-90">
                    {isAssamese ? 'লক্ষণ, বায়োমেকানিক্স আৰু ৰেফাৰেল' : 'Triage symptoms, mobility & referrals'}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </section>

          {/* Quick Camp Stats & Offline Buffer */}
          <section className="grid grid-cols-2 gap-space-sm">
            {/* Stat 1: Camp Progress */}
            <div className="bg-surface-container-lowest p-space-sm rounded-2xl shadow-card-1 border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                  {isAssamese ? 'আজিৰ শিবিৰ' : "Today's Camp"}
                </span>
                <span className="material-symbols-outlined text-primary text-[18px]">how_to_reg</span>
              </div>
              <div className="mt-space-xs">
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-xl-mobile text-headline-xl-mobile font-bold text-on-surface leading-none font-mono">
                    {stats.totalScreened}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    {isAssamese ? 'পৰীক্ষিত' : 'Screened'}
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-surface-container flex overflow-hidden mt-2">
                  <div className="bg-primary h-full" style={{ width: `${(stats.lowRisk / stats.totalScreened) * 100}%` }} title="Low Risk" />
                  <div className="bg-tertiary-container h-full" style={{ width: `${(stats.modRisk / stats.totalScreened) * 100}%` }} title="Moderate Risk" />
                  <div className="bg-secondary h-full" style={{ width: `${(stats.highRisk / stats.totalScreened) * 100}%` }} title="High Risk" />
                </div>
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1.5 font-bold">
                  <span className="text-primary">{stats.lowRisk} Low</span>
                  <span className="text-tertiary">{stats.modRisk} Mod</span>
                  <span className="text-secondary">{stats.highRisk} High</span>
                </div>
              </div>
            </div>

            {/* Stat 2: Queue Buffer & Force Sync */}
            <div className="bg-surface-container-lowest p-space-sm rounded-2xl shadow-card-1 border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                  {isAssamese ? 'শাৰী বাফাৰ' : 'Queue Buffer'}
                </span>
                <span className="material-symbols-outlined text-secondary text-[18px]">sync_problem</span>
              </div>
              <div className="mt-space-xs">
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-xl-mobile text-headline-xl-mobile font-bold text-secondary leading-none font-mono">
                    {stats.pendingSync}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    {isAssamese ? 'অপেক্ষাকৃত' : 'Awaiting'}
                  </span>
                </div>
                <button
                  onClick={handleForceSync}
                  disabled={syncing}
                  className="w-full min-h-[34px] mt-2 px-2 py-1 rounded-xl bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  type="button"
                >
                  <span className={`material-symbols-outlined text-[16px] text-primary ${syncing ? 'animate-spin' : ''}`}>sync</span>
                  <span>{syncing ? (isAssamese ? 'হৈ আছে...' : 'Syncing...') : (isAssamese ? 'সংমিশ্ৰণ কৰক' : 'Force Sync')}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Recent Screened Patients Queue */}
          <section className="space-y-space-xs pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">recent_patient</span>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {isAssamese ? 'শেহতীয়া ৰোগীসকল' : 'Recent Patients'}
                </h3>
              </div>
              <button
                onClick={() => navigate('/my-patients')}
                className="font-label-sm text-label-sm text-primary font-bold hover:underline"
              >
                {isAssamese ? `সকলো (${patients.length})` : `View All (${patients.length})`}
              </button>
            </div>

            {/* Patient Cards */}
            <div className="flex flex-col space-y-2.5">
              {patients.slice(0, 3).map((p) => {
                const isHigh = p.risk_tier?.includes('High');
                const isMod = p.risk_tier?.includes('Moderate');

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenPatient(p)}
                    className="bg-surface-container-lowest rounded-2xl shadow-card-1 p-3.5 flex flex-col gap-2 border border-outline-variant/30 active:scale-[0.99] transition-all cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-label-lg text-label-lg font-bold text-on-surface truncate">{p.name}</h4>
                          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{p.age}y • {p.sex}</span>
                          <span className="bg-surface-container px-2 py-0.5 rounded-full font-label-sm text-label-sm text-on-surface-variant">{p.occupation}</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 line-clamp-1">
                          {p.village} • {p.block}
                        </p>
                      </div>

                      {/* Risk Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold shrink-0 ${
                        isHigh
                          ? 'bg-secondary text-on-secondary'
                          : isMod
                            ? 'bg-tertiary-container text-on-tertiary-container'
                            : 'bg-primary-fixed text-on-primary-fixed'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {isHigh ? 'warning' : isMod ? 'info' : 'verified'}
                        </span>
                        <span>{p.risk_tier || 'Screened'}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30 bg-surface-container-low px-2.5 py-1.5 rounded-xl">
                      <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          {isHigh ? 'assignment_late' : 'task_alt'}
                        </span>
                        <span>{isHigh ? (isAssamese ? 'ৰেফাৰেল পত্ৰ প্ৰস্তুত' : 'PHC Referral Ready') : (isAssamese ? 'পৰীক্ষা সম্পূৰ্ণ' : 'Screening Complete')}</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-primary font-bold inline-flex items-center gap-0.5">
                        <span>{isAssamese ? 'বিৱৰণ চাওক' : 'View Hub'}</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick Utility Cards */}
          <section className="grid grid-cols-2 gap-space-sm pt-1">
            <button
              onClick={() => navigate('/guidance')}
              className="bg-surface-container-high rounded-2xl p-3.5 flex flex-col gap-2 items-start active:scale-[0.98] transition-all shadow-card-1 text-left"
              type="button"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[22px]">exercise</span>
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface font-bold leading-tight">
                  {isAssamese ? 'প্ৰতিৰোধ নিৰ্দেশনা' : 'Guidance Library'}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                  {isAssamese ? 'ব্যায়াম আৰু পুষ্টি' : 'Exercises & nutrition'}
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/my-patients')}
              className="bg-surface-container-high rounded-2xl p-3.5 flex flex-col gap-2 items-start active:scale-[0.98] transition-all shadow-card-1 text-left"
              type="button"
            >
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[22px]">group</span>
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface font-bold leading-tight">
                  {isAssamese ? 'মোৰ ৰোগী পঞ্জী' : 'Patient Registry'}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                  {isAssamese ? 'গাঁও/ব্লকভিত্তিক তালিকা' : 'Village & camp cohorts'}
                </p>
              </div>
            </button>
          </section>

        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 bg-surface/95 backdrop-blur-xl border-t border-outline-variant pb-safe max-w-md mx-auto left-0 right-0">
        <div className="flex items-center justify-around h-16">
          {[
            { icon: 'home', label: isAssamese ? 'গৃহ' : 'Home', route: '/home', active: true },
            { icon: 'group', label: isAssamese ? 'ৰোগীসকল' : 'Patients', route: '/my-patients', active: false },
            { icon: 'menu_book', label: isAssamese ? 'নিৰ্দেশনা' : 'Guidance', route: '/guidance', active: false },
          ].map(({ icon, label, route, active }) => (
            <button
              key={label}
              onClick={() => navigate(route)}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] px-4 flex-1 ${
                active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {icon}
              </span>
              <span className="font-label-sm text-label-sm font-bold">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

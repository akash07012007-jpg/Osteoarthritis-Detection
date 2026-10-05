import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/ui/AppHeader';
import { api } from '../api/client';
import {
  QUESTIONNAIRE_ITEMS,
  FREQUENCY_OPTIONS,
  SEVERITY_OPTIONS,
  DIFFICULTY_OPTIONS,
  RED_FLAG_QUESTIONS,
  scoreWOMAC,
  type KOOSResponse,
  type QuestionnaireItem,
} from '../data/koosQuestions';

type TabKey = 'redflag' | 'riskfactors' | 'symptoms' | 'pain' | 'adl' | 'sport_qol';

export default function QuestionnaireScreen() {
  const navigate = useNavigate();
  const { currentPatient, language } = useApp();
  const { session, updateQuestionnaire } = useScreening();
  const isAssamese = language === 'অসমীয়া';

  // Questionnaire responses state
  const [answers, setAnswers] = useState<Record<string, KOOSResponse>>(session?.koosResponses || {});
  const [redFlag, setRedFlag] = useState<boolean | null>(session?.redFlagAnswer ?? null);
  const [activeTab, setActiveTab] = useState<TabKey>('redflag');
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Risk Factors State
  const [bmi, setBmi] = useState<'normal' | 'overweight' | 'obese'>(session?.riskFactors?.bmiCategory || 'overweight');
  const [occIntensity, setOccIntensity] = useState<'sedentary' | 'moderate' | 'heavy'>(session?.riskFactors?.occupation || 'heavy');
  const [injury, setInjury] = useState<boolean>(session?.riskFactors?.priorInjury || false);
  const [famHistory, setFamHistory] = useState<boolean>(session?.riskFactors?.familyHistory || false);
  const [symptomDuration, setSymptomDuration] = useState<number>(session?.riskFactors?.symptomDurationMonths || 18);

  const handleAudioPrompt = (_itemId: string, text: string) => {
    setAudioNotice(`🔊 ${isAssamese ? 'অসমীয়া অডিঅ’ বাৰ্তা:' : 'Vernacular Prompt:'} "${text}"`);
    setTimeout(() => setAudioNotice(null), 4000);
  };

  const handleSelectOption = (itemId: string, val: KOOSResponse) => {
    setAnswers((prev) => ({ ...prev, [itemId]: val }));
  };

  // Grouped questions by tab
  const tabQuestions = useMemo(() => {
    return {
      symptoms: QUESTIONNAIRE_ITEMS.filter((i) => i.subscale === 'symptoms'),
      pain: QUESTIONNAIRE_ITEMS.filter((i) => i.subscale === 'pain'),
      adl: QUESTIONNAIRE_ITEMS.filter((i) => i.subscale === 'adl'),
      sport_qol: QUESTIONNAIRE_ITEMS.filter((i) => i.subscale === 'sport' || i.subscale === 'qol'),
    };
  }, []);

  const totalQuestions = QUESTIONNAIRE_ITEMS.length;
  const answeredCount = Object.keys(answers).length;
  const completionPct = Math.round((answeredCount / totalQuestions) * 100);

  // Real-time scores
  const womacScores = useMemo(() => scoreWOMAC(answers), [answers]);

  const handleSaveAndReturn = async () => {
    setSaving(true);
    const isComplete = redFlag === true || (redFlag === false && answeredCount >= 20);

    const riskFactors = {
      bmiCategory: bmi,
      occupation: occIntensity,
      priorInjury: injury,
      familyHistory: famHistory,
      symptomDurationMonths: symptomDuration,
    };

    updateQuestionnaire(
      answers,
      riskFactors,
      redFlag === true,
      isComplete ? 'complete' : 'inProgress'
    );

    // Save to SQLite backend
    if (currentPatient?.id) {
      try {
        await api.updateScreening(currentPatient.id, {
          koos_responses: answers,
          risk_factors: riskFactors,
          red_flag: redFlag === true ? 1 : 0,
          womac_pain: womacScores.pain,
          womac_stiffness: womacScores.stiffness,
          womac_function: womacScores.function,
          womac_total: womacScores.totalNormalized,
        });
      } catch (e) {
        // local persistence fallback
      }
    }

    setSaving(false);
    navigate('/patient-hub');
  };

  const TABS = [
    { key: 'redflag' as TabKey, label: isAssamese ? '১. ৰেড-ফ্লেগ' : '1. Red-Flag', done: redFlag !== null },
    { key: 'riskfactors' as TabKey, label: isAssamese ? '২. সংকট কাৰক' : '2. Risk Profile', done: true },
    { key: 'symptoms' as TabKey, label: isAssamese ? '৩. লক্ষণ (৭)' : '3. Symptoms (7)', count: tabQuestions.symptoms.length },
    { key: 'pain' as TabKey, label: isAssamese ? '৪. বিষ (৯)' : '4. Pain (9)', count: tabQuestions.pain.length },
    { key: 'adl' as TabKey, label: isAssamese ? '৫. দৈনন্দিন (১৭)' : '5. WOMAC ADL (17)', count: tabQuestions.adl.length },
    { key: 'sport_qol' as TabKey, label: isAssamese ? '৬. গতি/জীৱন (৯)' : '6. Sport & QoL (9)', count: tabQuestions.sport_qol.length },
  ];

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader showBack title={isAssamese ? 'KOOS আৰু WOMAC প্ৰশ্নাৱলী' : 'KOOS & WOMAC Assessment'} />

      {/* Floating Vernacular Voice Toast */}
      {audioNotice && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-inverse-surface text-inverse-on-surface p-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn border border-primary-fixed/30">
          <span className="material-symbols-outlined text-[24px] text-primary-fixed shrink-0">record_voice_over</span>
          <span className="text-body-sm font-medium leading-snug">{audioNotice}</span>
        </div>
      )}

      {/* Tabbed Navigation Bar */}
      <div className="fixed top-16 w-full z-40 bg-surface-container-high border-b border-outline-variant/40 px-margin py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-md mx-auto left-0 right-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2 rounded-xl text-label-sm font-bold shrink-0 transition-all flex items-center gap-1 min-h-[38px] ${
              activeTab === t.key
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
            }`}
            type="button"
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <main className="flex flex-col w-full pt-28 pb-32 px-margin space-y-space-md max-w-md mx-auto">
        
        {/* Live Progress & WOMAC Tracker Strip */}
        <div className="bg-surface-container-lowest p-3 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-label-sm font-bold text-on-surface">
              {answeredCount}/{totalQuestions} {isAssamese ? 'উত্তৰ দিয়া হ’ল' : 'Answered'} ({completionPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2 text-label-sm font-bold">
            <span className="text-on-surface-variant">WOMAC Severity:</span>
            <span className={`px-2 py-0.5 rounded-lg ${
              womacScores.totalNormalized > 60
                ? 'bg-secondary text-on-secondary'
                : womacScores.totalNormalized > 30
                  ? 'bg-tertiary-container text-on-tertiary-container'
                  : 'bg-primary-fixed text-on-primary-fixed'
            }`}>
              {womacScores.totalNormalized}/100
            </span>
          </div>
        </div>

        {/* ─── TAB 1: RED-FLAG TRIAGE GATE ────────────────────────────────────── */}
        {activeTab === 'redflag' && (
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">emergency</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface leading-tight">
                  {isAssamese ? 'ৰেড-ফ্লেগ সুৰক্ষা নিৰীক্ষণ' : 'Clinical Red-Flag Gate'}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {isAssamese ? 'তলৰ যিকোনো জৰুৰী লক্ষণ থাকিলে তৎকালীন ডাক্তৰী ৰেফাৰেল প্ৰয়োজন।' : 'Identify acute contraindications requiring immediate hospital referral.'}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {RED_FLAG_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-3 border border-outline-variant/20">
                  <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                    {isAssamese ? q.text_as : q.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="font-label-md text-label-md text-on-surface font-bold block mb-2">
                {isAssamese ? 'ৰোগীৰ কোনো ৰেড-ফ্লেগ লক্ষণ আছে নেকি?' : 'Does the patient have ANY of the above red-flag symptoms?'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRedFlag(true)}
                  className={`min-h-[54px] rounded-xl font-label-md text-label-md font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                    redFlag === true
                      ? 'border-secondary bg-secondary text-on-secondary shadow-md'
                      : 'border-outline-variant bg-surface-container text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                  <span>{isAssamese ? 'হয় (ৰেড-ফ্লেগ আছে)' : 'YES (Red-Flag)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRedFlag(false);
                    setActiveTab('symptoms');
                  }}
                  className={`min-h-[54px] rounded-xl font-label-md text-label-md font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                    redFlag === false
                      ? 'border-primary bg-primary text-on-primary shadow-md'
                      : 'border-outline-variant bg-surface-container text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>{isAssamese ? 'নাই (সুৰক্ষিত)' : 'NO (Clear)'}</span>
                </button>
              </div>
            </div>

            {redFlag === true && (
              <div className="bg-secondary-container text-on-secondary-container p-3.5 rounded-xl text-body-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">emergency</span>
                <span>
                  {isAssamese
                    ? 'তৎকালীন ৰেফাৰেল সক্ৰিয় হ’ল। শাৰীৰিক পৰীক্ষা বাইপাছ কৰি পোনে পোনে ফলাফল লওক।'
                    : 'Emergency referral flagged. Physical testing bypassed. You can proceed to report now.'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: RISK FACTORS PROFILE ───────────────────────────────────── */}
        {activeTab === 'riskfactors' && (
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 space-y-4">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
              {isAssamese ? 'জীৱনশৈলী আৰু কৰ্মক্ষেত্ৰৰ সংকট কাৰক' : 'Occupational & Baseline Risk Factors'}
            </h3>

            {/* BMI Build */}
            <div className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md font-bold text-on-surface">BMI Category / Body Mass</span>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'overweight', 'obese'] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBmi(b)}
                    className={`min-h-[46px] rounded-xl text-label-sm font-bold capitalize transition-all border-2 ${
                      bmi === b
                        ? 'border-primary bg-primary text-on-primary shadow-xs'
                        : 'border-outline-variant bg-surface-container text-on-surface'
                    }`}
                    type="button"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Occupational Load */}
            <div className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md font-bold text-on-surface">
                {isAssamese ? 'দৈনন্দিন কামৰ প্ৰকৃতি (চাহপাত/কৃষি শ্ৰম)' : 'Daily Occupational Knee Strain'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['sedentary', 'moderate', 'heavy'] as const).map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setOccIntensity(occ)}
                    className={`min-h-[46px] rounded-xl text-label-sm font-bold capitalize transition-all border-2 ${
                      occIntensity === occ
                        ? 'border-primary bg-primary text-on-primary shadow-xs'
                        : 'border-outline-variant bg-surface-container text-on-surface'
                    }`}
                    type="button"
                  >
                    {occ === 'heavy' ? (isAssamese ? 'ভাৰী শ্ৰম' : 'Heavy (Tea/Agri)') : occ === 'moderate' ? (isAssamese ? 'মধ্যমীয়া' : 'Moderate') : (isAssamese ? 'পাতল' : 'Sedentary')}
                  </button>
                ))}
              </div>
            </div>

            {/* Injury & Family History */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-3 p-3 bg-surface-container rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={injury}
                  onChange={(e) => setInjury(e.target.checked)}
                  className="w-5 h-5 accent-primary"
                />
                <span className="text-body-sm font-semibold text-on-surface">
                  {isAssamese ? 'পূৰ্বতে আঁঠুত গুৰুতৰ আঘাত পোৱাৰ ইতিহাস' : 'History of significant prior knee injury / trauma'}
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-surface-container rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={famHistory}
                  onChange={(e) => setFamHistory(e.target.checked)}
                  className="w-5 h-5 accent-primary"
                />
                <span className="text-body-sm font-semibold text-on-surface">
                  {isAssamese ? 'পৰিয়ালৰ সদস্যৰ গাঁঠিৰ বাতবিষৰ ইতিহাস' : 'Family history of severe Knee Osteoarthritis'}
                </span>
              </label>
            </div>

            {/* Symptom Duration Slider */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between font-label-md text-label-md font-bold">
                <span>{isAssamese ? 'বিষৰ সময়সীমা:' : 'Symptom Duration:'}</span>
                <span className="text-primary font-mono">{symptomDuration} {isAssamese ? 'মাহ' : 'months'}</span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ─── TABS 3–6: QUESTIONNAIRE ITEMS ──────────────────────────────────── */}
        {(activeTab === 'symptoms' || activeTab === 'pain' || activeTab === 'adl' || activeTab === 'sport_qol') && (
          <div className="space-y-4">
            {tabQuestions[activeTab as keyof typeof tabQuestions].map((item: QuestionnaireItem) => {
              const currentVal = answers[item.id];
              const isAnswered = currentVal !== undefined;
              const options =
                item.responseType === 'frequency'
                  ? FREQUENCY_OPTIONS
                  : item.responseType === 'severity'
                    ? SEVERITY_OPTIONS
                    : DIFFICULTY_OPTIONS;

              return (
                <div
                  key={item.id}
                  className={`bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border transition-all ${
                    isAnswered ? 'border-primary/40' : 'border-outline-variant/30'
                  }`}
                >
                  {/* Header row with Audio button */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-surface-container font-mono text-xs font-bold text-primary flex items-center justify-center shrink-0">
                        {item.id}
                      </span>
                      {item.isWomac && (
                        <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase">
                          WOMAC
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAudioPrompt(item.id, isAssamese ? item.question_as : item.question)}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl bg-surface-container-high hover:bg-surface-container text-primary flex items-center gap-1 active:scale-95 text-xs font-bold"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">volume_up</span>
                      <span>Audio</span>
                    </button>
                  </div>

                  {/* Question Text in English + Assamese */}
                  <h4 className="font-headline-md text-headline-md font-bold text-on-surface leading-snug">
                    {isAssamese ? item.question_as : item.question}
                  </h4>
                  {isAssamese && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                      {item.question}
                    </p>
                  )}

                  {/* 5-Option Likert Grid (Touch Ergonomic min 48px) */}
                  <div className="grid grid-cols-1 gap-2 pt-3">
                    {options.map((opt) => {
                      const isSelected = currentVal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleSelectOption(item.id, opt.value)}
                          className={`min-h-[50px] px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all border-2 ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-on-surface font-bold shadow-xs'
                              : 'border-outline-variant/50 bg-surface-container text-on-surface-variant hover:border-outline'
                          }`}
                          type="button"
                        >
                          <span className="font-label-md text-label-md">
                            {isAssamese ? opt.label_as : opt.label}
                          </span>
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-primary bg-primary text-on-primary' : 'border-outline'
                          }`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 w-full bg-surface/95 backdrop-blur-xl border-t border-outline-variant px-margin py-3 pb-safe z-40 max-w-md mx-auto left-0 right-0">
        <button
          onClick={handleSaveAndReturn}
          disabled={saving}
          className="btn-primary flex items-center justify-between"
          type="button"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>{saving ? 'Saving...' : isAssamese ? 'সংৰক্ষণ কৰক আৰু হাবলৈ যাওক' : 'Save & Continue to Hub'}</span>
          </div>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

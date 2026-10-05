// Patient Entry Screen — Screen 2: Patient Signup & Baseline Profile
// Connected to SQLite backend (api.createPatient & api.createScreening)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/ui/AppHeader';
import { api } from '../api/client';
import { t } from '../data/translations';
import type { Patient } from '../context/AppContext';

export default function PatientEntryScreen() {
  const navigate = useNavigate();
  const { user, setCurrentPatient, language } = useApp();
  const { initSession } = useScreening();

  // Basic Demographics
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('female');
  const [occupation, setOccupation] = useState('Tea Garden Worker');
  const [village, setVillage] = useState('Dhekiajuli Gaon');
  const [block, setBlock] = useState('Dhekiajuli Block');
  const [contact, setContact] = useState('');

  // Baseline Risk Indicators
  const [bmiCategory, setBmiCategory] = useState<'normal' | 'overweight' | 'obese'>('overweight');
  const [priorInjury, setPriorInjury] = useState(false);
  const [familyHistory, setFamilyHistory] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isValid = name.trim() && age.trim() && occupation.trim() && village.trim() && block.trim();

  const handleSave = async () => {
    if (!isValid) {
      setError(language === 'অসমীয়া' ? 'অনুগ্ৰহ কৰি প্ৰয়োজনীয় সকলো তথ্য পূৰণ কৰক।' : 'Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      // 1. Create Patient in SQLite
      const created = await api.createPatient({
        name: name.trim(),
        age: parseInt(age, 10),
        sex,
        occupation: occupation.trim(),
        village: village.trim(),
        block: block.trim(),
        district: user?.district || 'Sonitpur',
        contact: contact.trim() || undefined,
        bmiCategory,
        priorInjury,
        familyHistory,
      });

      // 2. Map to local context
      const patient: Patient = {
        id: created.id,
        name: created.name,
        age: created.age,
        sex: created.sex,
        occupation: created.occupation,
        village: created.village,
        block: created.block,
        district: created.district,
        contact: created.contact,
        registeredBy: user?.uid || 'local-worker',
        entrySource: 'healthWorker',
        consentGiven: false,
        createdAt: new Date(),
      };

      setCurrentPatient(patient);

      // 3. Initialize screening session in SQLite + context
      await api.createScreening({
        patientId: created.id,
        campName: `${block} Outreach Camp`,
      });

      initSession(created.id);

      navigate('/consent');
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to register patient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader showBack title={t(language, 'step1Of4')} />

      <main className="flex flex-col w-full pt-16 pb-32 min-h-screen max-w-md mx-auto">
        <div className="flex flex-col w-full px-margin py-space-md space-y-space-md">

          {/* Progress Header Badge */}
          <div className="bg-primary-fixed rounded-xl px-3.5 py-2 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">person_add</span>
              <p className="font-label-sm text-label-sm text-on-primary-fixed font-bold">
                {t(language, 'step1Of4')}
              </p>
            </div>
            <span className="font-label-sm text-label-sm bg-primary text-on-primary px-2 py-0.5 rounded-full">
              25%
            </span>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="name">
              {t(language, 'fullName')} <span className="text-secondary">*</span>
            </label>
            <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-3 focus-within:bg-surface-container-highest transition-colors">
              <span className="material-symbols-outlined text-outline mr-2 text-[20px]">person</span>
              <input
                id="name"
                type="text"
                placeholder={language === 'অসমীয়া' ? 'যেনে: ৰেখা দাস' : 'e.g. Rekha Das'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline font-medium"
              />
            </div>
          </div>

          {/* Age + Sex Row */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="age">
                {t(language, 'age')} <span className="text-secondary">*</span>
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-3 focus-within:bg-surface-container-highest transition-colors">
                <input
                  id="age"
                  type="number"
                  min={18}
                  max={100}
                  placeholder="52"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline font-medium"
                />
                <span className="font-label-sm text-label-sm text-outline">
                  {language === 'অসমীয়া' ? 'বছৰ' : 'yrs'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold">
                {t(language, 'sex')} <span className="text-secondary">*</span>
              </label>
              <div className="flex gap-1.5">
                {(['female', 'male', 'other'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSex(s)}
                    className={`flex-1 min-h-[48px] rounded-xl font-label-sm text-label-sm font-bold capitalize transition-all ${
                      sex === s
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                    type="button"
                  >
                    {s === 'female' ? (language === 'অসমীয়া' ? 'মহিলা' : 'F') : s === 'male' ? (language === 'অসমীয়া' ? 'পুৰুষ' : 'M') : 'O'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Occupation */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="occupation">
              {t(language, 'occupation')} <span className="text-secondary">*</span>
            </label>
            <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-3 focus-within:bg-surface-container-highest transition-colors">
              <span className="material-symbols-outlined text-outline mr-2 text-[20px]">agriculture</span>
              <input
                id="occupation"
                type="text"
                placeholder={language === 'অসমীয়া' ? 'যেনে: চাহ বাগান শ্ৰমিক, কৃষক' : 'e.g. Tea garden worker, farmer'}
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline font-medium"
              />
            </div>
          </div>

          {/* Village & Block */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="village">
                {t(language, 'village')} <span className="text-secondary">*</span>
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-3 focus-within:bg-surface-container-highest transition-colors">
                <input
                  id="village"
                  type="text"
                  placeholder="Dhekiajuli"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="block">
                {t(language, 'block')} <span className="text-secondary">*</span>
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-3 focus-within:bg-surface-container-highest transition-colors">
                <input
                  id="block"
                  type="text"
                  placeholder="Dhekiajuli Block"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline font-medium"
                />
              </div>
            </div>
          </div>

          {/* Baseline Risk Profile Card */}
          <div className="bg-surface-container-low rounded-xl p-3.5 space-y-3 border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wide">
                {language === 'অসমীয়া' ? 'প্ৰাৰম্ভিক সংকট সূচক' : 'Baseline Risk Factors'}
              </span>
              <span className="material-symbols-outlined text-primary text-[18px]">vital_signs</span>
            </div>

            {/* BMI Category */}
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">BMI / Body Build</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['normal', 'overweight', 'obese'] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBmiCategory(b)}
                    className={`py-2 px-1 rounded-lg text-label-sm font-semibold capitalize transition-all text-center ${
                      bmiCategory === b
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                    type="button"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container cursor-pointer">
                <input
                  type="checkbox"
                  checked={priorInjury}
                  onChange={(e) => setPriorInjury(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-label-sm text-on-surface leading-tight">
                  {language === 'অসমীয়া' ? 'পূৰ্বৰ আঘাত' : 'Prior Injury'}
                </span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container cursor-pointer">
                <input
                  type="checkbox"
                  checked={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-label-sm text-on-surface leading-tight">
                  {language === 'অসমীয়া' ? 'পৰিয়ালত ইতিহাস' : 'Family History'}
                </span>
              </label>
            </div>
          </div>

          {/* Contact (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="contact">
              {language === 'অসমীয়া' ? 'ম’বাইল নম্বৰ (ঐচ্ছিক)' : 'Contact Number (Optional)'}
            </label>
            <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 focus-within:bg-surface-container-highest transition-colors">
              <span className="font-label-lg text-label-lg text-on-surface-variant font-bold pr-2 mr-2 border-r border-outline-variant">+91</span>
              <input
                id="contact"
                type="tel"
                maxLength={10}
                placeholder="98765 43210"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline font-medium"
              />
            </div>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container p-3 rounded-xl flex items-center gap-2 text-body-sm font-semibold">
              <span className="material-symbols-outlined text-error text-[20px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 w-full bg-surface/95 backdrop-blur-xl border-t border-outline-variant px-margin py-3 pb-safe z-40 max-w-md mx-auto left-0 right-0">
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className={`btn-primary ${(!isValid || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
          type="button"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              <span>{language === 'অসমীয়া' ? 'সংৰক্ষণ হৈ আছে...' : 'Saving Patient...'}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">save</span>
              <span>{t(language, 'saveAndContinue')}</span>
              <span className="material-symbols-outlined text-[20px] ml-auto">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

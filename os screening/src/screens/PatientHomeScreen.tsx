import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/ui/AppHeader';
import { api } from '../api/client';
import type { Patient } from '../context/AppContext';

export default function PatientHomeScreen() {
  const navigate = useNavigate();
  const { user, currentPatient, setCurrentPatient, language } = useApp();
  const { initSession } = useScreening();
  const isAssamese = language === 'অসমীয়া';

  const [name, setName] = useState(currentPatient?.name || user?.name || '');
  const [age, setAge] = useState(currentPatient?.age ? String(currentPatient.age) : '50');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>(currentPatient?.sex || 'female');
  const [village, setVillage] = useState(currentPatient?.village || 'Sonitpur Village');
  const [saving, setSaving] = useState(false);

  const handleStartSelfScreening = async () => {
    setSaving(true);
    try {
      const created = await api.createPatient({
        name: name.trim() || 'Self-Registered Patient',
        age: parseInt(age, 10) || 50,
        sex,
        occupation: 'Agricultural / Homemaker',
        village: village.trim(),
        block: 'Balipara Block',
        district: 'Sonitpur',
      });

      const p: Patient = {
        id: created.id,
        name: created.name,
        age: created.age,
        sex: created.sex,
        occupation: created.occupation,
        village: created.village,
        block: created.block,
        district: created.district,
        contact: created.contact,
        registeredBy: 'self',
        entrySource: 'patient',
        consentGiven: true,
        createdAt: new Date(),
      };

      setCurrentPatient(p);
      initSession(created.id);
      navigate('/guidance');
    } catch {
      const fallbackId = `self_${Date.now()}`;
      const p: Patient = {
        id: fallbackId,
        name: name || 'Patient',
        age: parseInt(age, 10) || 50,
        sex,
        occupation: 'Agricultural / Homemaker',
        village,
        block: 'Balipara Block',
        district: 'Sonitpur',
        registeredBy: 'self',
        entrySource: 'patient',
        consentGiven: true,
        createdAt: new Date(),
      };
      setCurrentPatient(p);
      initSession(fallbackId);
      navigate('/guidance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader title={isAssamese ? 'ৰোগী স্বয়ং-পৰীক্ষণ' : 'Patient Self-Check'} />

      <main className="flex flex-col w-full pt-20 pb-28 px-margin space-y-4 max-w-md mx-auto">
        <div className="card-2 space-y-3 bg-primary text-on-primary shadow-card-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">self_care</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold">
                {isAssamese ? 'হাঁটুৰ স্বাস্থ্য স্বয়ং পৰীক্ষা' : 'Knee Health Self-Check'}
              </h2>
              <p className="font-body-sm text-body-sm opacity-90">
                {isAssamese ? 'গোপনীয় পৰীক্ষা আৰু ঘৰুৱা ব্যায়াম পৰামৰ্শ' : 'Confidential screening & home care exercises'}
              </p>
            </div>
          </div>
          <p className="text-body-sm opacity-95 leading-snug">
            {isAssamese
              ? 'আপোনাৰ লক্ষণসমূহ নিৰ্ণয় কৰক, কেমেৰাৰে উঠা-বহা গতিশীলতা পৰীক্ষা কৰক আৰু ব্যক্তিগত পুষ্টি-ব্যায়াম নিৰ্দেশনা প্ৰাপ্ত কৰক।'
              : 'Assess your knee symptoms, evaluate joint mobility with your camera, and receive personalized physical therapy and diet guidelines.'}
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 space-y-4">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
            {isAssamese ? 'আপোনাৰ পৰিচয় নিশ্চিত কৰক' : 'Confirm Your Profile'}
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md font-bold text-on-surface">
              {isAssamese ? 'আপোনাৰ সম্পূৰ্ণ নাম' : 'Your Full Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mina Devi"
              className="bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface font-body-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-bold text-on-surface">
                {isAssamese ? 'বয়স' : 'Age'}
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface font-body-md"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-bold text-on-surface">
                {isAssamese ? 'লিঙ্গ' : 'Sex'}
              </label>
              <div className="flex gap-1.5">
                {(['female', 'male'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`flex-1 py-2.5 rounded-xl font-label-sm text-label-sm font-bold capitalize transition-all ${
                      sex === s ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {s === 'female' ? (isAssamese ? 'মহিলা' : 'F') : (isAssamese ? 'পুৰুষ' : 'M')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md font-bold text-on-surface">
              {isAssamese ? 'গাঁও / অঞ্চল' : 'Village / Locality'}
            </label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Balipara"
              className="bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface font-body-md"
            />
          </div>

          <button
            type="button"
            onClick={handleStartSelfScreening}
            disabled={saving}
            className="btn-primary mt-2"
          >
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            <span>{saving ? 'Loading...' : isAssamese ? 'নিৰ্দেশনা চাওক আৰু আৰম্ভ কৰক' : 'View Guidance & Begin Screening'}</span>
          </button>
        </div>
      </main>
    </div>
  );
}

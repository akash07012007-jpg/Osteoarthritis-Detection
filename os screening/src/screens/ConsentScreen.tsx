import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/ui/AppHeader';
import { api } from '../api/client';

export default function ConsentScreen() {
  const navigate = useNavigate();
  const { currentPatient, setCurrentPatient, language } = useApp();
  const [consentChecked, setConsentChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleProceed = async () => {
    if (!consentChecked) return;
    setSaving(true);
    try {
      if (currentPatient?.id) {
        await api.updatePatientConsent(currentPatient.id, true);
        setCurrentPatient({
          ...currentPatient,
          consentGiven: true,
        });
      }
      navigate('/patient-hub');
    } catch (err) {
      console.error('Error updating consent:', err);
      navigate('/patient-hub');
    } finally {
      setSaving(false);
    }
  };

  const isAssamese = language === 'অসমীয়া';

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader showBack title={isAssamese ? 'সন্মতি আৰু প্ৰট’কল' : 'Consent & Protocol'} />

      <main className="flex flex-col w-full pt-20 pb-28 px-margin max-w-md mx-auto">
        <div className="card-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[28px]">verified_user</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                {isAssamese ? 'পৰীক্ষণ সন্মতি' : 'Screening Consent'}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {isAssamese ? 'ক্ষেত্ৰভিত্তিক প্ৰাথমিক পৰীক্ষণ সহায়ক' : 'Non-diagnostic field triage support'}
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-4 text-body-md text-on-surface space-y-3">
            <p>
              <strong>{isAssamese ? 'উদ্দেশ্য:' : 'Purpose:'}</strong>{' '}
              {isAssamese
                ? 'এই সঁজুলিটো আশা/এএনএম স্বাস্থ্যকৰ্মীসকলক গাঁঠিৰ বাতবিষ (Knee Osteoarthritis) আগতীয়াকৈ চিনাক্ত কৰাত সহায় কৰিবলৈ তৈয়াৰ কৰা হৈছে।'
                : 'This screening tool is designed to support community health workers (ASHA/ANM) in identifying early signs of Knee Osteoarthritis (OA) and recommending clinical referral or preventive care.'}
            </p>
            <p>
              <strong>{isAssamese ? 'সতৰ্কবাৰ্তা:' : 'Notice:'}</strong>{' '}
              {isAssamese
                ? 'ই কোনো চূড়ান্ত চিকিৎসাজনিত ৰোগ নিৰ্ণয় নহয়। ই কেৱল প্ৰাথমিক স্বাস্থ্যকেন্দ্ৰ আৰু বিশেষজ্ঞ চিকিৎসকৰ সৈতে যোগাযোগ কৰাৰ পৰামৰ্শ।'
                : 'This is NOT a final medical diagnosis. All conclusions are screening recommendations to connect you with district health services and PHCs.'}
            </p>
            <p>
              <strong>{isAssamese ? 'তথ্যৰ গোপনীয়তা:' : 'Data Privacy:'}</strong>{' '}
              {isAssamese
                ? 'আপোনাৰ তথ্যসমূহ নিৰাপদে সংৰক্ষিত কৰা হৈছে আৰু ৰাষ্ট্ৰীয় স্বাস্থ্য অভিযান (NHM) পৰ্যবেক্ষণৰ সৈতে সংযোজিত কৰা হ’ব।'
                : 'Your responses and test data are stored securely on this device and synced with the National Health Mission / District Registry.'}
            </p>
          </div>

          <label className="flex items-start gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-outline text-primary focus:ring-primary cursor-pointer accent-primary"
            />
            <span className="font-body-sm text-body-sm text-on-surface leading-snug">
              {isAssamese
                ? 'মই নিশ্চিত কৰিছোঁ যে পৰীক্ষণ প্ৰক্ৰিয়াটো মোৰ বুজিব পৰা ভাষাত বুজাই দিয়া হৈছে, আৰু মই প্ৰশ্নাৱলী আৰু শাৰীৰিক গতিশীলতা পৰীক্ষাত অংশগ্ৰহণ কৰিবলৈ সন্মতি দিছোঁ।'
                : 'I confirm that the screening process has been explained in a language I understand, and I consent to undergo the questionnaire and physical mobility test.'}
            </span>
          </label>

          <button
            onClick={handleProceed}
            disabled={!consentChecked || saving}
            className={`btn-primary ${(!consentChecked || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
            <span>
              {saving
                ? (isAssamese ? 'পঞ্জীয়ন হৈ আছে...' : 'Recording...')
                : (isAssamese ? 'ৰোগী হাবলৈ যাওক' : 'Proceed to Patient Hub')}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}

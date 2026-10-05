import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/ui/AppHeader';

export default function ScreeningCompleteScreen() {
  const navigate = useNavigate();
  const { currentPatient, setCurrentPatient } = useApp();
  const { clearSession } = useScreening();

  const handleScreenNext = () => {
    setCurrentPatient(null);
    clearSession();
    navigate('/patient-entry');
  };

  const handleReturnHome = () => {
    setCurrentPatient(null);
    clearSession();
    navigate('/home');
  };

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader title="Screening Complete" />

      <main className="flex flex-col w-full pt-20 pb-24 px-margin max-w-lg mx-auto flex-1 justify-center">
        <div className="card-2 text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[36px]">task_alt</span>
          </div>

          <h2 className="font-headline-lg font-bold text-on-surface">Screening Recorded</h2>
          <p className="font-body-md text-on-surface-variant">
            Assessment data for <strong>{currentPatient?.name || 'the patient'}</strong> has been securely cached in local storage and queued for sub-centre PHC cloud synchronization.
          </p>

          <div className="bg-surface-container-low p-4 rounded-xl text-left space-y-2 text-body-sm">
            <div className="flex justify-between">
              <span className="text-outline">Patient ID:</span>
              <span className="font-mono font-bold text-on-surface">#{currentPatient?.id ? currentPatient.id.slice(0, 8).toUpperCase() : 'NER-SYNC'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Village / Station:</span>
              <span className="font-semibold text-on-surface">{currentPatient?.village || 'Local Village'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Storage Status:</span>
              <span className="font-semibold text-primary">Saved in IndexedDB</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <button
              type="button"
              onClick={handleScreenNext}
              className="btn-primary"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>Screen Next Patient</span>
            </button>

            <button
              type="button"
              onClick={handleReturnHome}
              className="btn-outline"
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span>Back to Camp Hub</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

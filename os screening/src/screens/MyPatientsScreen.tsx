import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useScreening } from '../context/ScreeningContext';
import { AppHeader } from '../components/ui/AppHeader';
import { ConnectivityRibbon } from '../components/ui/ConnectivityBadge';
import { api } from '../api/client';
import type { Patient } from '../context/AppContext';

export default function MyPatientsScreen() {
  const navigate = useNavigate();
  const { setCurrentPatient, language } = useApp();
  const { initSession } = useScreening();
  const isAssamese = language === 'অসমীয়া';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await api.getPatients();
        if (res && res.patients) {
          const mapped: Patient[] = res.patients.map((d: any) => ({
            id: d.id,
            name: d.name || 'Unnamed',
            age: d.age || 0,
            sex: d.sex || 'female',
            occupation: d.occupation || '',
            village: d.village || '',
            block: d.block || '',
            district: d.district || 'Sonitpur',
            contact: d.contact,
            registeredBy: d.registered_by || '',
            entrySource: d.entry_source || 'healthWorker',
            consentGiven: Boolean(d.consent_given),
            createdAt: new Date(d.created_at),
          }));
          setPatients(mapped);
        }
      } catch (e) {
        console.warn('Error fetching patients from SQLite:', e);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.village.toLowerCase().includes(search.toLowerCase()) ||
      p.block.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectPatient = (p: Patient) => {
    setCurrentPatient(p);
    initSession(p.id);
    navigate('/patient-hub');
  };

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader showBack title={isAssamese ? 'ৰোগী পঞ্জী' : 'Patient Registry'} />

      <main className="flex flex-col w-full pt-20 pb-28 px-margin space-y-4 max-w-md mx-auto">
        <ConnectivityRibbon patientsCount={patients.length} />

        {/* Search Input */}
        <div className="flex items-center bg-surface-container-high rounded-xl px-3.5 py-2.5 shadow-sm border border-outline-variant/30">
          <span className="material-symbols-outlined text-primary mr-2 text-[20px]">search</span>
          <input
            type="text"
            placeholder={isAssamese ? 'ৰোগীৰ নাম বা গাঁও সন্ধান কৰক...' : 'Search by patient name or village...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent font-body-md text-on-surface focus:outline-none placeholder:text-outline font-medium"
          />
        </div>

        {/* List of Patients */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-on-surface-variant flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-primary">sync</span>
              <span>{isAssamese ? 'ৰোগী তালিকা ল’ড হৈ আছে...' : 'Loading patient registry...'}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl text-center text-on-surface-variant shadow-sm border border-outline-variant/30">
              {isAssamese ? 'কোনো ৰোগী পোৱা নগ’ল।' : 'No patients found.'}
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectPatient(p)}
                className="bg-surface-container-lowest rounded-2xl shadow-card-1 p-3.5 flex flex-col gap-2 border border-outline-variant/30 hover:bg-surface-container-low cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">{p.name}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {p.age}y • {p.sex.toUpperCase()} • {p.occupation}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-label-sm font-bold capitalize ${
                      p.entrySource === 'patient'
                        ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                        : 'bg-primary-fixed text-on-primary-fixed'
                    }`}
                  >
                    {p.entrySource === 'patient' ? (isAssamese ? 'স্বয়ং' : 'Self-Check') : (isAssamese ? 'আশা এন্ট্ৰী' : 'ASHA Entry')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30 text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">location_on</span>
                    {p.village} ({p.block})
                  </span>
                  <span className="text-primary font-bold flex items-center gap-0.5">
                    <span>{isAssamese ? 'হাব খোলক' : 'Open Hub'}</span>
                    <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

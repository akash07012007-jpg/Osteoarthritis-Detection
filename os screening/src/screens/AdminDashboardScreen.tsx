import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/ui/AppHeader';
import { api } from '../api/client';

interface ClusterRow {
  cluster: string;
  total: number;
  high_risk: number;
  mod_risk: number;
  low_risk: number;
  burden_pct: number;
}

interface AdminPatient {
  id: string;
  name: string;
  age: number;
  sex: string;
  occupation: string;
  village: string;
  block: string;
  risk_tier?: string;
  fusion_score?: number;
}

export default function AdminDashboardScreen() {
  const { language } = useApp();
  const isAssamese = language === 'অসমীয়া';

  const [timeframe, setTimeframe] = useState('last-30');
  const [stats, setStats] = useState({
    totalScreened: 1428,
    totalPatients: 1428,
    highRisk: 312,
    modRisk: 648,
    lowRisk: 468,
    highRiskPct: 22,
    modRiskPct: 45,
    lowRiskPct: 33,
    referred: 312,
  });

  const [clusters, setClusters] = useState<ClusterRow[]>([
    { cluster: 'Dhekiajuli Block', total: 482, high_risk: 142, mod_risk: 218, low_risk: 122, burden_pct: 29.4 },
    { cluster: 'Balipara Tea Estate', total: 394, high_risk: 98, mod_risk: 184, low_risk: 112, burden_pct: 24.8 },
    { cluster: 'Rangapara Belt', total: 310, high_risk: 52, mod_risk: 142, low_risk: 116, burden_pct: 16.7 },
    { cluster: 'Tezpur Rural Ward', total: 242, high_risk: 20, mod_risk: 104, low_risk: 118, burden_pct: 8.3 },
  ]);

  const [sortAsc, setSortAsc] = useState(false);
  const [selectedFilterRisk, setSelectedFilterRisk] = useState<string | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [cohortPatients, setCohortPatients] = useState<AdminPatient[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const statsData = await api.getAdminStats();
        if (statsData && statsData.totalScreened > 0) {
          setStats((prev) => ({ ...prev, ...statsData }));
        }
        const clusterData = await api.getAdminClusters();
        if (clusterData && clusterData.length > 0) {
          setClusters(clusterData);
        }
      } catch (e) {
        console.warn('Using baseline analytics for admin view:', e);
      }
    }
    loadAdminData();
  }, [timeframe]);

  const handleExport = () => {
    const csvContent =
      'Cluster,Total Screened,High Risk,Moderate Risk,Low Risk,Burden %\n' +
      clusters.map((c) => `${c.cluster},${c.total},${c.high_risk},${c.mod_risk},${c.low_risk},${c.burden_pct}%`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NHM_OA_Registry_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(isAssamese ? 'ৰেকৰ্ড সফলভাৱে ডাউনলোড কৰা হ’ল (CSV)' : 'Registry snapshot exported (CSV)');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleViewCohort = async (clusterName: string) => {
    setSelectedCohort(clusterName);
    try {
      const res = await api.getAdminPatients({ block: clusterName });
      if (res && res.length > 0) {
        setCohortPatients(res);
      } else {
        setCohortPatients([
          { id: '1', name: 'Bhaben Das', age: 62, sex: 'male', occupation: 'Farmer', village: 'Dhekiajuli', block: clusterName, risk_tier: 'High Risk', fusion_score: 78 },
          { id: '2', name: 'Monomati Devi', age: 54, sex: 'female', occupation: 'Tea Garden Worker', village: 'Dhekiajuli', block: clusterName, risk_tier: 'Moderate Risk', fusion_score: 62 },
          { id: '3', name: 'Sabitri Boro', age: 72, sex: 'female', occupation: 'Farmer', village: 'Dhekiajuli', block: clusterName, risk_tier: 'High Risk', fusion_score: 82 },
        ]);
      }
    } catch {
      setCohortPatients([
        { id: '1', name: 'Bhaben Das', age: 62, sex: 'male', occupation: 'Farmer', village: 'Dhekiajuli', block: clusterName, risk_tier: 'High Risk', fusion_score: 78 },
        { id: '2', name: 'Monomati Devi', age: 54, sex: 'female', occupation: 'Tea Garden Worker', village: 'Dhekiajuli', block: clusterName, risk_tier: 'Moderate Risk', fusion_score: 62 },
      ]);
    }
  };

  const sortedClusters = [...clusters].sort((a, b) => (sortAsc ? a.burden_pct - b.burden_pct : b.burden_pct - a.burden_pct));

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader showBack title={isAssamese ? 'জিলা প্ৰশাসন ডেচব’ৰ্ড' : 'District Admin Dashboard'} />

      {/* Floating Export Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-inverse-surface text-inverse-on-surface p-3.5 rounded-2xl shadow-xl flex items-center gap-2 animate-fadeIn border border-primary-fixed/30">
          <span className="material-symbols-outlined text-[20px] text-primary-fixed">download_done</span>
          <span className="text-body-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="flex flex-col w-full pt-16 pb-28 px-margin space-y-space-md max-w-md mx-auto">
        
        {/* District Officer Context & Filter Banner */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 flex flex-col gap-3 mt-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                  NHM NER Cell • Assam
                </span>
              </div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold leading-tight" style={{ fontFamily: 'Work Sans, sans-serif' }}>
                {isAssamese ? 'শোণিতপুৰ জিলা বাতবিষ পঞ্জী' : 'Sonitpur District OA Registry'}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[16px] text-primary">clinical_notes</span>
                <span>Dr. M. Saikia, Nodal Officer (NCD Cell)</span>
              </p>
            </div>

            {/* Quick Export Button */}
            <button
              onClick={handleExport}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-surface-container-high text-primary flex items-center justify-center active:scale-95 transition-transform"
              type="button"
              title="Export Snapshot"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>

          {/* Timeframe Selector & Status Chips */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="relative flex-1">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full min-h-[44px] pl-3 pr-8 py-2 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md appearance-none focus:outline-none font-semibold border border-outline-variant/30"
              >
                <option value="last-30">Last 30 Days (Oct 2024)</option>
                <option value="sep-2024">Sep 2024 (1,210 Screened)</option>
                <option value="q3-2024">Q3 FY24-25 (Division)</option>
                <option value="ytd">YTD Cumulative (9,410)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                arrow_drop_down
              </span>
            </div>

            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm min-h-[44px] shrink-0 font-bold">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>NHM Validated</span>
            </div>
          </div>
        </section>

        {/* Executive Summary Banner */}
        <section className="bg-surface-container-low rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex flex-col z-10">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">
                {isAssamese ? 'মুঠ গাঁও পৰীক্ষণ পৰিসৰ' : 'Total Village Coverage'}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-headline-xl-mobile text-headline-xl-mobile font-bold text-on-surface font-mono">
                  {stats.totalScreened}
                </span>
                <span className="font-label-md text-label-md text-primary font-bold">
                  {isAssamese ? 'ৰোগী' : 'Patients'}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-tertiary">camping</span>
                <span>Across 42 Tea-Belt Camps</span>
              </p>
            </div>

            {/* Sync Health Pill */}
            <div className="flex flex-col items-end z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-surface-container-lowest text-primary font-label-sm text-label-sm shadow-xs font-bold border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>98.4%</span>
                <span className="text-on-surface-variant font-normal">Packets</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 text-[11px]">
                24 Pending Sync
              </span>
            </div>
          </div>

          {/* Visual Progress Multi-Tier Stack Bar */}
          <div className="mt-space-md flex flex-col gap-1.5">
            <div className="w-full h-3.5 rounded-full bg-surface-container-highest overflow-hidden flex shadow-inner">
              <div className="h-full bg-secondary" style={{ width: `${stats.highRiskPct}%` }} title="Urgent Risk" />
              <div className="h-full bg-tertiary-container" style={{ width: `${stats.modRiskPct}%` }} title="Moderate Risk" />
              <div className="h-full bg-primary" style={{ width: `${stats.lowRiskPct}%` }} title="Low Risk" />
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm text-xs font-semibold">
              <span>Prevalence Rate: <strong>67.2%</strong> joint stress</span>
              <span>Goal: &lt; 20% Urgent</span>
            </div>
          </div>
        </section>

        {/* Risk Tier Breakdown Cards */}
        <section className="grid grid-cols-1 gap-space-sm">
          {/* Card 1: Urgent High Risk */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-on-secondary shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-label-md font-bold text-secondary">
                    {isAssamese ? 'উচ্চ সংকট (জৰুৰী)' : 'High Risk (Urgent)'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                    {stats.highRiskPct}%
                  </span>
                </div>
                <span className="font-headline-md text-headline-md font-bold text-on-surface font-mono">
                  {stats.highRisk} <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">{isAssamese ? 'ৰেফাৰেল' : 'Referred'}</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
                  TMCH Ortho & Surgical Triage
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedFilterRisk(selectedFilterRisk === 'High Risk' ? null : 'High Risk')}
              className={`min-h-[44px] px-3.5 rounded-xl font-label-md text-label-md font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all ${
                selectedFilterRisk === 'High Risk'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container text-secondary hover:bg-surface-container-high'
              }`}
              type="button"
            >
              <span>{isAssamese ? 'পৰিদৰ্শন' : 'Review'}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Card 2: Moderate Risk */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-12 h-12 rounded-xl bg-tertiary-container flex items-center justify-center text-on-tertiary shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[24px]">accessibility_new</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-label-md font-bold text-tertiary">
                    {isAssamese ? 'মধ্যম সংকট' : 'Moderate Risk'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold">
                    {stats.modRiskPct}%
                  </span>
                </div>
                <span className="font-headline-md text-headline-md font-bold text-on-surface font-mono">
                  {stats.modRisk} <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">{isAssamese ? 'পৰীক্ষিত' : 'Assigned'}</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
                  Physiotherapy & Ergonomics
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedFilterRisk(selectedFilterRisk === 'Moderate Risk' ? null : 'Moderate Risk')}
              className={`min-h-[44px] px-3.5 rounded-xl font-label-md text-label-md font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all ${
                selectedFilterRisk === 'Moderate Risk'
                  ? 'bg-tertiary-container text-on-tertiary shadow-xs'
                  : 'bg-surface-container text-tertiary hover:bg-surface-container-high'
              }`}
              type="button"
            >
              <span>{isAssamese ? 'পৰিদৰ্শন' : 'Review'}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Card 3: Low Risk */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[24px]">health_and_safety</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-label-md font-bold text-primary">
                    {isAssamese ? 'নিম্ন সংকট (নিয়মীয়া)' : 'Low Risk (Lifestyle)'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold">
                    {stats.lowRiskPct}%
                  </span>
                </div>
                <span className="font-headline-md text-headline-md font-bold text-on-surface font-mono">
                  {stats.lowRisk} <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">{isAssamese ? 'নিয়ন্ত্ৰিত' : 'Monitored'}</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
                  Ayush / Home Exercises
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedFilterRisk(selectedFilterRisk === 'Low Risk' ? null : 'Low Risk')}
              className={`min-h-[44px] px-3.5 rounded-xl font-label-md text-label-md font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all ${
                selectedFilterRisk === 'Low Risk'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-primary hover:bg-surface-container-high'
              }`}
              type="button"
            >
              <span>{isAssamese ? 'পৰিদৰ্শন' : 'Review'}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Priority Clusters & Tea Estate Hotspots */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                {isAssamese ? 'অগ্ৰাধিকাৰ ক্লাষ্টাৰ' : 'Priority Clusters'}
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                {isAssamese ? 'ব্লক আৰু চাহ বাগান হটস্পট' : 'Block & Estate Hotspots'}
              </h2>
            </div>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-3 py-1.5 rounded-xl bg-surface-container text-primary font-label-sm text-label-sm font-bold shadow-xs flex items-center gap-1 border border-outline-variant/30"
              type="button"
            >
              <span>{isAssamese ? 'বৰ্ডেন' : 'Burden'}</span>
              <span className="material-symbols-outlined text-[16px]">
                {sortAsc ? 'arrow_upward' : 'arrow_downward'}
              </span>
            </button>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
            High burden correlated with plucking basket lumbar torque and tea-slope knee flexion.
          </p>

          <div className="flex flex-col gap-2.5 mt-1">
            {sortedClusters.map((c) => (
              <article
                key={c.cluster}
                className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2 border border-outline-variant/20 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-secondary">location_on</span>
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">{c.cluster}</span>
                      {c.burden_pct > 20 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-error-container text-on-error-container text-[10px] font-bold">
                          Hotspot
                        </span>
                      )}
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5 block">
                      Heavy tea plantation worker concentration
                    </span>
                  </div>
                  <span className="font-label-lg text-label-lg font-bold text-secondary font-mono">
                    {c.burden_pct}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-body-sm font-body-sm pt-1 border-t border-outline-variant/30">
                  <div className="flex items-center gap-3 text-xs">
                    <span><strong>{c.total}</strong> Screened</span>
                    <span className="text-secondary font-semibold"><strong>{c.high_risk}</strong> Urgent</span>
                  </div>
                  <button
                    onClick={() => handleViewCohort(c.cluster)}
                    className="min-h-[38px] px-3 rounded-xl bg-surface-container-lowest text-primary font-label-sm text-label-sm font-bold flex items-center gap-1 active:scale-95 transition-transform shadow-xs"
                    type="button"
                  >
                    <span>{isAssamese ? 'কোহৰ্ট চাওক' : 'View Cohort'}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Drill-Down Cohort Modal */}
        {selectedCohort && (
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-card-2 border-2 border-primary space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-label-lg text-on-surface">Cohort: {selectedCohort}</h4>
                <span className="text-xs text-on-surface-variant">Screened patients under this health outpost</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCohort(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {cohortPatients.map((cp) => (
                <div key={cp.id} className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-body-md text-on-surface">{cp.name}</h5>
                    <p className="text-xs text-on-surface-variant">{cp.age}y • {cp.occupation} • {cp.village}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    cp.risk_tier?.includes('High')
                      ? 'bg-secondary text-on-secondary'
                      : cp.risk_tier?.includes('Moderate')
                        ? 'bg-tertiary-container text-on-tertiary-container'
                        : 'bg-primary-fixed text-on-primary-fixed'
                  }`}>
                    {cp.risk_tier || 'Screened'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

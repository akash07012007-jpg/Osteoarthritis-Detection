// Login Screen — Dual Role Login & Language Setup (Stitch Screen 1)
// Fully connected to Express + SQLite backend with console OTP & Admin login
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { t } from '../data/translations';

type Role = 'healthWorker' | 'admin' | 'patient';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { setUser, language, setLanguage } = useApp();
  const [activeRole, setActiveRole] = useState<Role>('healthWorker');
  const [langOpen, setLangOpen] = useState(false);

  // Health Worker fields
  const [phone, setPhone] = useState('9435012894');
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpNotice, setOtpNotice] = useState('');

  // Admin fields
  const [adminId, setAdminId] = useState('AS-SON-NODAL-01');
  const [adminPin, setAdminPin] = useState('840291');

  // Patient fields
  const [patientPhone, setPatientPhone] = useState('9864055123');
  const [patientOtpVisible, setPatientOtpVisible] = useState(false);
  const [patientOtp, setPatientOtp] = useState(['', '', '', '']);

  const handleSendOtp = async (targetPhone: string, isPatient = false) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.sendOtp(targetPhone);
      if (isPatient) {
        setPatientOtpVisible(true);
      } else {
        setOtpVisible(true);
      }
      setOtpNotice(res.message || 'OTP generated! Check terminal output.');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (targetPhone: string, otpDigits: string[]) => {
    const code = otpDigits.join('');
    if (code.length !== 4) {
      setError('Please enter all 4 OTP digits');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.verifyOtp(targetPhone, code);
      setUser(res.user);
      if (activeRole === 'patient') {
        navigate('/patient-home');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminId || !adminPin) {
      setError('Please enter Admin ID and Passcode');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.adminLogin(adminId, adminPin);
      setUser(res.user);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const LANGUAGES = ['English', 'অসমীয়া'];

  return (
    <main className="flex flex-col w-full bg-surface min-h-screen pt-safe pb-safe max-w-md mx-auto shadow-2xl relative">
      {/* Header banner */}
      <div className="w-full bg-primary-container px-space-md pt-4 pb-space-lg shadow-md relative overflow-hidden">
        {/* Top row */}
        <div className="flex items-center justify-between mb-space-md">
          {/* Sync status */}
          <div className="flex items-center gap-2 bg-surface/20 px-3 py-1.5 rounded-full backdrop-blur-xs">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary-fixed animate-pulse" />
            <span className="font-label-sm text-label-sm text-on-primary font-medium tracking-wide">
              {t(language, 'syncActive')}
            </span>
          </div>

          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 px-3 py-1.5 rounded-full text-on-primary transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">translate</span>
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">
                {language === 'অসমীয়া' ? 'অস' : 'EN'}
              </span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-surface-container-lowest shadow-card-2 rounded-xl py-1 z-30">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setLangOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-between"
                  >
                    <span>{lang}</span>
                    {language === lang && (
                      <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
                        check
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* App branding */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-2xl p-1 bg-surface-container-lowest shadow-md flex-shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[36px]">orthopedics</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-primary font-bold tracking-tight" style={{ fontFamily: 'Work Sans, sans-serif' }}>
                {t(language, 'appName')}
              </h1>
            </div>
            <p className="font-body-sm text-body-sm text-on-primary-container leading-tight mt-0.5">
              {t(language, 'appTagline')}
            </p>
          </div>
        </div>

        {/* Offline note */}
        <div className="mt-3 bg-primary/40 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-sm">
          <span className="material-symbols-outlined text-primary-fixed text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
            cloud_off
          </span>
          <p className="font-label-sm text-label-sm text-primary-fixed font-medium">
            {t(language, 'localStorageActive')}
          </p>
        </div>
      </div>

      <div className="px-space-md py-4 flex flex-col gap-4 flex-1">
        {/* Role tabs */}
        <div className="grid grid-cols-3 gap-2 bg-surface-container-high p-1.5 rounded-2xl shadow-xs">
          {([
            { role: 'healthWorker' as Role, icon: 'medical_services', label: t(language, 'healthWorker') },
            { role: 'admin' as Role, icon: 'account_balance', label: t(language, 'govtAdmin') },
            { role: 'patient' as Role, icon: 'person', label: t(language, 'patient') },
          ] as const).map(({ role, icon, label }) => (
            <button
              key={role}
              onClick={() => {
                setActiveRole(role);
                setError('');
                setOtpNotice('');
              }}
              className={`min-h-[52px] py-2 px-1 rounded-xl font-label-sm text-label-sm font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                activeRole === role
                  ? 'bg-surface-container-lowest text-primary shadow-sm border border-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]" style={activeRole === role ? { fontVariationSettings: '"FILL" 1' } : {}}>
                {icon}
              </span>
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>

        {/* Error / Notice toasts */}
        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-xl flex items-center gap-2 text-body-sm font-semibold">
            <span className="material-symbols-outlined text-[20px] text-error">error</span>
            <span>{error}</span>
          </div>
        )}
        {otpNotice && (
          <div className="bg-primary-fixed text-on-primary-fixed p-3 rounded-xl flex items-center gap-2 text-body-sm font-medium">
            <span className="material-symbols-outlined text-[20px] text-primary">mark_chat_read</span>
            <span>{otpNotice}</span>
          </div>
        )}

        {/* Health Worker Card */}
        {activeRole === 'healthWorker' && (
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-md flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed shadow-xs">
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>home_health</span>
                </div>
                <div>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface leading-tight" style={{ fontFamily: 'Work Sans, sans-serif' }}>
                    {t(language, 'healthWorker')}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t(language, 'frontlineSubtitle')}
                  </p>
                </div>
              </div>
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />{t(language, 'fieldMode')}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between" htmlFor="ashaMobile">
                <span>{t(language, 'registeredPhone')}</span>
                <span className="font-label-sm text-label-sm text-primary font-bold">Assam • NHM</span>
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 focus-within:bg-surface-container-highest transition-colors">
                <span className="font-label-lg text-label-lg text-on-surface-variant font-bold pr-2 mr-2 border-r border-outline-variant">+91</span>
                <input
                  id="ashaMobile"
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent font-body-lg text-body-lg text-on-surface focus:outline-none placeholder:text-outline font-medium tracking-wider"
                />
                <button
                  onClick={() => handleSendOtp(phone)}
                  disabled={loading}
                  className="text-primary font-label-md text-label-md font-bold px-2 py-1 hover:bg-surface-container-high rounded-lg transition-colors whitespace-nowrap"
                  type="button"
                >
                  {t(language, 'getOtp')}
                </button>
              </div>
            </div>

            {otpVisible && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">{t(language, 'enterOtp')}</label>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{t(language, 'autoFilled')}</span>
                </div>
                <div className="flex gap-2.5 justify-between">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newOtp = [...otp];
                        newOtp[i] = val;
                        setOtp(newOtp);
                        if (val && i < 3) {
                          const nextInput = document.getElementById(`otp-${i + 1}`);
                          nextInput?.focus();
                        }
                      }}
                      className="w-14 h-14 bg-surface-container-low rounded-xl text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold focus:outline-none focus:bg-primary-fixed-dim transition-all"
                      style={{ fontFamily: 'Work Sans, sans-serif' }}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (!otpVisible) {
                  handleSendOtp(phone);
                } else {
                  handleVerifyOtp(phone, otp);
                }
              }}
              disabled={loading}
              className="btn-primary"
              type="button"
            >
              <span>{otpVisible ? t(language, 'enterQueue') : t(language, 'getOtp')}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Admin Card */}
        {activeRole === 'admin' && (
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-md flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface shadow-xs">
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>domain</span>
                </div>
                <div>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface leading-tight" style={{ fontFamily: 'Work Sans, sans-serif' }}>
                    {t(language, 'districtOfficer')}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t(language, 'officerSubtitle')}
                  </p>
                </div>
              </div>
              <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {t(language, 'hqAccess')}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="adminId">
                {t(language, 'officerId')}
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-3 focus-within:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined text-outline mr-2 text-[20px]">badge</span>
                <input
                  id="adminId"
                  type="text"
                  placeholder="e.g. AS-SON-NODAL-01"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline font-medium tracking-wide uppercase"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="adminPin">
                {t(language, 'passcode')}
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-3 focus-within:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined text-outline mr-2 text-[20px]">pin</span>
                <input
                  id="adminPin"
                  type="password"
                  maxLength={6}
                  placeholder="••••••"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline tracking-widest font-bold"
                />
              </div>
            </div>

            <button onClick={handleAdminLogin} disabled={loading} className="btn-primary" type="button">
              <span>{t(language, 'accessDashboard')}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Patient Card */}
        {activeRole === 'patient' && (
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-md flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-on-tertiary-fixed text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>self_care</span>
                </div>
                <div>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface leading-tight" style={{ fontFamily: 'Work Sans, sans-serif' }}>
                    {t(language, 'patientPortal')}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t(language, 'patientSubtitle')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="patientMobile">
                {t(language, 'patientPhone')}
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 focus-within:bg-surface-container-highest transition-colors">
                <span className="font-label-lg text-label-lg text-on-surface-variant font-bold pr-2 mr-2 border-r border-outline-variant">+91</span>
                <input
                  id="patientMobile"
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full bg-transparent font-body-lg text-body-lg text-on-surface focus:outline-none placeholder:text-outline font-medium tracking-wider"
                />
                <button
                  onClick={() => handleSendOtp(patientPhone, true)}
                  disabled={loading}
                  className="text-primary font-label-md text-label-md font-bold px-2 py-1 hover:bg-surface-container-high rounded-lg transition-colors whitespace-nowrap"
                  type="button"
                >
                  {t(language, 'getOtp')}
                </button>
              </div>
            </div>

            {patientOtpVisible && (
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface font-semibold">{t(language, 'enterOtp')}</label>
                <div className="flex gap-2.5 justify-between">
                  {patientOtp.map((digit, i) => (
                    <input
                      key={i}
                      id={`patient-otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newOtp = [...patientOtp];
                        newOtp[i] = val;
                        setPatientOtp(newOtp);
                        if (val && i < 3) {
                          const nextInput = document.getElementById(`patient-otp-${i + 1}`);
                          nextInput?.focus();
                        }
                      }}
                      className="w-14 h-14 bg-surface-container-low rounded-xl text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold focus:outline-none focus:bg-primary-fixed-dim transition-all"
                      style={{ fontFamily: 'Work Sans, sans-serif' }}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (!patientOtpVisible) {
                  handleSendOtp(patientPhone, true);
                } else {
                  handleVerifyOtp(patientPhone, patientOtp);
                }
              }}
              disabled={loading}
              className="btn-primary"
              type="button"
            >
              <span>{patientOtpVisible ? t(language, 'startAssessment') : t(language, 'getOtp')}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

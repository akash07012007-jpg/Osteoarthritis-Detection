// AppHeader — fixed top header matching Stitch design exactly
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConnectivityBadge } from './ConnectivityBadge';

const LANGUAGES = ['English', 'অসমীয়া'];

interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
  subtitle?: string;
}

export function AppHeader({ showBack = false, title }: AppHeaderProps) {
  const navigate = useNavigate();
  const { user, language, setLanguage } = useApp();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-header">
      <div
        className={`px-margin flex items-center justify-between gap-space-sm ${
          showBack ? 'h-16' : 'h-28 flex-col justify-center gap-space-xs'
        }`}
      >
        {showBack ? (
          // Simple header with back button
          <>
            <div className="flex items-center gap-space-xs">
              <button
                onClick={() => navigate(-1)}
                className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-colors"
                type="button"
                aria-label="Go back"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <h1 className="font-headline-md text-headline-md text-primary font-bold truncate max-w-[210px]">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-space-xs">
              <ConnectivityBadge />
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </div>
          </>
        ) : (
          // Full header with app branding
          <>
            <div className="flex items-center justify-between gap-space-sm w-full">
              {/* Brand */}
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">orthopedics</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary leading-none">
                      SAKHI
                    </span>
                    <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-1.5 py-0.5 rounded-full">
                      NE-Field
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-[130px]">
                    {user?.subCenter || 'SahayOA Screening'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-space-xs">
                {/* Language switcher */}
                <div className="relative">
                  <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="min-h-[44px] px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-1.5 active:scale-95 transition-transform"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">translate</span>
                    <span className="font-semibold">{language === 'English' ? 'EN' : language.slice(0, 3)}</span>
                    <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
                  </button>
                  {langOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-surface-container-lowest shadow-card-2 rounded-xl py-1 z-30">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => { setLanguage(lang); setLangOpen(false); }}
                          className="w-full px-4 py-2.5 text-left font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-between"
                          type="button"
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

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                </div>
              </div>
            </div>

            {/* Second row: connectivity + user info */}
            <div className="flex items-center justify-between gap-space-sm w-full pt-0.5">
              <ConnectivityBadge />
              {user && (
                <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm truncate">
                  <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                  <span className="truncate font-medium">{user.name || 'Health Worker'}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

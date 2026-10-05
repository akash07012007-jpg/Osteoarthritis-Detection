// ConnectivityBadge — always-present online/offline/syncing indicator
import { useApp } from '../../context/AppContext';

export function ConnectivityBadge() {
  const { connectivity } = useApp();

  if (connectivity === 'offline') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm min-h-[32px]">
        <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse" />
        <span className="font-medium text-tertiary">Offline Mode</span>
        <span className="text-outline text-[10px]">•</span>
        <span className="text-outline text-label-sm">Local Cache</span>
      </div>
    );
  }

  if (connectivity === 'syncing') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm min-h-[32px]">
        <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse" />
        <span className="font-medium text-primary">Syncing...</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm min-h-[32px]">
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <span className="font-medium text-primary">Online (Synced)</span>
      <span className="text-outline text-[10px]">•</span>
      <span className="text-outline text-label-sm">PHC Live</span>
    </div>
  );
}

// Larger version for hub screens
export function ConnectivityRibbon({ patientsCount = 0 }: { patientsCount?: number }) {
  const { connectivity } = useApp();

  if (connectivity === 'offline') {
    return (
      <div className="flex items-center justify-between bg-surface-container px-3 py-2 rounded-lg text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim animate-pulse" />
          <span className="font-label-sm text-label-sm tracking-wide text-on-surface">
            Offline Mode • Local Cache Active
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-tertiary">
          <span className="material-symbols-outlined text-[16px]">cloud_off</span>
          <span>{patientsCount} Saved Locally</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-surface-container px-3 py-2 rounded-lg text-on-surface-variant">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
        <span className="font-label-sm text-label-sm tracking-wide text-primary">
          Online • Synced with PHC
        </span>
      </div>
      <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-primary">
        <span className="material-symbols-outlined text-[16px]">cloud_done</span>
        <span>{patientsCount} Synced</span>
      </div>
    </div>
  );
}

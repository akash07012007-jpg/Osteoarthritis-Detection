import type { RiskTier } from '../../engine/fusionEngine';

interface RiskBadgeProps {
  tier: RiskTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const TIER_CONFIG: Record<RiskTier, { label: string; icon: string; className: string }> = {
  'Low Risk': {
    label: 'Low Risk',
    icon: 'verified',
    className: 'bg-primary-fixed text-on-primary-fixed',
  },
  'Moderate Risk': {
    label: 'Moderate Risk',
    icon: 'info',
    className: 'bg-tertiary-fixed text-on-tertiary-fixed',
  },
  'High Risk': {
    label: 'High Risk',
    icon: 'warning',
    className: 'bg-secondary-container text-on-secondary-container',
  },
  'High Risk — Immediate Referral': {
    label: 'Immediate Referral',
    icon: 'emergency',
    className: 'bg-secondary text-on-secondary',
  },
};

export function RiskBadge({ tier, size = 'md', showIcon = true }: RiskBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG['Moderate Risk'];

  const sizeClass = {
    sm: 'px-2 py-0.5 rounded text-label-sm gap-1',
    md: 'px-2.5 py-1 rounded-lg text-label-md gap-1.5',
    lg: 'px-3 py-1.5 rounded-xl text-label-lg gap-2',
  }[size];

  const iconSize = { sm: 'text-[14px]', md: 'text-[16px]', lg: 'text-[20px]' }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold ${sizeClass} ${config.className}`}
      role="status"
      aria-label={`Risk tier: ${config.label}`}
    >
      {showIcon && (
        <span className={`material-symbols-outlined ${iconSize}`} style={{ fontVariationSettings: '"FILL" 1' }}>
          {config.icon}
        </span>
      )}
      {config.label}
    </span>
  );
}

// Sync status tag
export type SyncStatusType = 'savedLocally' | 'syncing' | 'synced';

interface SyncTagProps {
  status: SyncStatusType;
}

export function SyncTag({ status }: SyncTagProps) {
  if (status === 'syncing') {
    return (
      <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
        Syncing...
      </span>
    );
  }
  if (status === 'synced') {
    return (
      <span className="font-label-sm text-label-sm text-primary flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>cloud_done</span>
        Synced
      </span>
    );
  }
  return (
    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]">save</span>
      Saved locally
    </span>
  );
}

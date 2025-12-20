'use client';

import { SessionQuota } from '@/types/quota';
import { useTranslation } from '@/i18n';

interface EmptyStateProps {
  onNewAnalysis: () => void;
  quota?: SessionQuota | null;
}

export default function EmptyState({ onNewAnalysis, quota }: EmptyStateProps) {
  const { t } = useTranslation();
  const isLimitReached = quota?.isLimitReached || false;

  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">{isLimitReached ? '🔒' : '🎯'}</div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        {isLimitReached ? t('quota.limitReached') : t('dashboard.noSessions')}
      </h2>
      <p className="text-text-secondary mb-6">
        {isLimitReached
          ? t('quota.upgradeMessage')
          : t('dashboard.welcomeDesc')}
      </p>
      <button
        onClick={onNewAnalysis}
        disabled={isLimitReached}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
          isLimitReached
            ? 'bg-border-medium text-text-tertiary cursor-not-allowed'
            : 'bg-brand-primary text-white hover:bg-brand-hover'
        }`}
      >
        {isLimitReached ? t('quota.upgrade') : t('dashboard.startNewAnalysis')}
      </button>
    </div>
  );
}

'use client';

import { ResearchTypeConfig, ResearchType } from '@/lib/constants/research';
import { useTranslation } from '@/i18n';

interface ResearchTypeCardProps {
  config: ResearchTypeConfig;
  completed: boolean;
  onClick: () => void;
}

export default function ResearchTypeCard({
  config,
  completed,
  onClick,
}: ResearchTypeCardProps) {
  const { t } = useTranslation();

  // Get localized label and description based on research type
  const getLocalizedLabel = (type: ResearchType) => {
    const typeKey = type as 'competitor' | 'community' | 'regulatory';
    return t(`research.types.${typeKey}.label`);
  };

  const getLocalizedDescription = (type: ResearchType) => {
    const typeKey = type as 'competitor' | 'community' | 'regulatory';
    return t(`research.types.${typeKey}.description`);
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative
        bg-surface-elevated border-2 rounded-lg p-6
        text-left transition-all duration-200
        hover:shadow-lg hover:scale-105
        ${completed ? 'border-green-500/50 bg-green-50/5' : 'border-border-light hover:border-brand-primary'}
      `}
    >
      {/* Icon */}
      <div className="text-5xl mb-4">{config.icon}</div>

      {/* Title */}
      <h3 className="text-xl font-bold text-text-primary mb-2">
        {getLocalizedLabel(config.id)}
      </h3>

      {/* Description */}
      <p className="text-sm text-text-secondary mb-4 min-h-[3rem]">
        {getLocalizedDescription(config.id)}
      </p>

      {/* Status Badge */}
      <div className="flex items-center justify-between mt-auto">
        {completed ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-600">
            ✓ {t('research.completed')}
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-base text-text-tertiary">
            {t('research.notStarted')}
          </span>
        )}

        {/* Action hint */}
        <span className="text-xs text-text-tertiary">
          {completed ? `${t('research.viewResults')} →` : `${t('research.startResearch')} →`}
        </span>
      </div>

      {/* Completed overlay indicator */}
      {completed && (
        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
          ✓
        </div>
      )}
    </button>
  );
}

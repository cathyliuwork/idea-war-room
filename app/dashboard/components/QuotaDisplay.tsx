'use client';

import { SessionQuota } from '@/types/quota';
import { useTranslation } from '@/i18n';

interface QuotaDisplayProps {
  quota: SessionQuota;
  variant?: 'compact' | 'full';
}

/**
 * Format reset date for display (1st of next month)
 * Uses UTC to avoid timezone conversion issues
 */
function formatResetDate(isoDate: string, language: string): string {
  const date = new Date(isoDate);
  // Use UTC values to avoid timezone shift
  const month = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    timeZone: 'UTC',
  });
  const day = date.getUTCDate();

  if (language === 'zh') {
    return `${month}${day}日`;
  }
  return `${month} ${day}`;
}

/**
 * Displays session quota usage information
 *
 * All tiers now use monthly quota with reset on the 1st of next month.
 *
 * Variants:
 * - compact: Shows "2/5" format with "/mo" indicator
 * - full: Shows detailed progress bar, status, and reset info
 */
export default function QuotaDisplay({
  quota,
  variant = 'full',
}: QuotaDisplayProps) {
  const { t, language } = useTranslation();
  const { used, limit, remaining, isLimitReached, resetDate, memberLevel } = quota;

  // Get tier name for display
  const tierName = t(`quota.tiers.${memberLevel}`);

  const usagePercent = Math.min((used / limit) * 100, 100);
  const isNearLimit = remaining <= 1 && !isLimitReached;

  if (variant === 'compact') {
    return (
      <span
        className={`text-sm ${isLimitReached ? 'text-severity-1-catastrophic' : 'text-text-secondary'}`}
      >
        {used}/{limit}
        <span className="text-xs text-text-tertiary ml-1">
          {t('quota.thisMonth')}
        </span>
      </span>
    );
  }

  return (
    <div className="space-y-2">
      {/* Tier badge and label */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary uppercase tracking-wide">
            {t('quota.monthlyUsage')}
          </span>
          <span className="text-xs px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded-sm">
            {tierName}
          </span>
        </div>
        <span
          className={`text-sm font-medium ${
            isLimitReached
              ? 'text-severity-1-catastrophic'
              : isNearLimit
                ? 'text-severity-3-significant'
                : 'text-text-primary'
          }`}
        >
          {used} / {limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-border-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isLimitReached
              ? 'bg-severity-1-catastrophic'
              : isNearLimit
                ? 'bg-severity-3-significant'
                : 'bg-brand-primary'
          }`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      {/* Reset info */}
      {!isLimitReached && (
        <p className="text-xs text-text-tertiary">
          {t('quota.resetsOn', { date: formatResetDate(resetDate, language) })}
        </p>
      )}

      {/* Limit reached message */}
      {isLimitReached && (
        <p className="text-xs text-severity-1-catastrophic">
          {t('quota.limitReachedMonthly', { date: formatResetDate(resetDate, language) })}
        </p>
      )}
    </div>
  );
}

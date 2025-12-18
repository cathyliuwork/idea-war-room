'use client';

import { SessionQuota } from '@/types/quota';

interface QuotaDisplayProps {
  quota: SessionQuota;
  variant?: 'compact' | 'full';
}

/**
 * Displays session quota usage information
 *
 * Variants:
 * - compact: Shows "2/5 sessions" format
 * - full: Shows detailed progress bar and status
 */
export default function QuotaDisplay({
  quota,
  variant = 'full',
}: QuotaDisplayProps) {
  const { used, limit, remaining, isLimitReached } = quota;

  // Unlimited users
  if (limit === null) {
    return (
      <div className="text-sm text-text-secondary">
        <span className="font-medium text-text-primary">{used}</span> sessions
        created
        <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
          Unlimited
        </span>
      </div>
    );
  }

  const usagePercent = Math.min((used / limit) * 100, 100);
  const isNearLimit = remaining !== null && remaining <= 1 && !isLimitReached;

  if (variant === 'compact') {
    return (
      <span
        className={`text-sm ${isLimitReached ? 'text-severity-1-catastrophic' : 'text-text-secondary'}`}
      >
        {used}/{limit} sessions
      </span>
    );
  }

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-secondary uppercase tracking-wide">
          Session Usage
        </span>
        <span
          className={`text-sm font-medium ${
            isLimitReached
              ? 'text-severity-1-catastrophic'
              : isNearLimit
                ? 'text-severity-3-significant'
                : 'text-text-primary'
          }`}
        >
          {used} of {limit}
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

      {/* Warning message */}
      {isLimitReached && (
        <p className="text-xs text-severity-1-catastrophic">
          Limit reached
        </p>
      )}
    </div>
  );
}

'use client';

import { SessionQuota } from '@/types/quota';
import { getTierName } from '@/lib/constants/quota';

interface UpgradePromptProps {
  quota: SessionQuota;
}

/**
 * Upgrade prompt shown when user reaches session limit
 */
export default function UpgradePrompt({ quota }: UpgradePromptProps) {
  const upgradeUrl = process.env.NEXT_PUBLIC_PARENT_HOME_URL || '/';

  const currentTier = getTierName(quota.memberLevel);
  const nextTier = quota.memberLevel === 0 ? 'Basic' : 'Pro';
  const nextLimit = quota.memberLevel === 0 ? '5' : 'unlimited';

  return (
    <div className="bg-severity-3-bg border border-severity-3-significant rounded-lg p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        Session Limit Reached
      </h3>
      <p className="text-text-secondary mb-4">
        You have used all {quota.limit} sessions available on your {currentTier}{' '}
        plan.{' '}
        {quota.memberLevel === 0
          ? 'Upgrade to a Paid Membership for more sessions.'
          : 'Upgrade to a Pro Membership for unlimited sessions.'}
      </p>
      <a
        href={upgradeUrl}
        className="inline-block px-4 py-2 bg-severity-3-significant text-white font-medium rounded-lg hover:bg-amber-600 transition-colors"
      >
        Upgrade Now
      </a>
    </div>
  );
}

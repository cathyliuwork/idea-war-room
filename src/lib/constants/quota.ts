/**
 * Session Quota Configuration
 *
 * Defines monthly session limits per membership tier.
 *
 * Membership Levels:
 * - 0: Free tier (2 sessions/month)
 * - 1: Basic tier (5 sessions/month)
 * - 2+: Pro tier (20 sessions/month)
 */

import { QuotaResetType } from '@/types/quota';

/**
 * Quota configuration per member level
 */
export interface QuotaConfig {
  limit: number;
  resetType: QuotaResetType;
}

/**
 * Session quota configuration by member level
 * All tiers use monthly reset
 */
export const SESSION_QUOTA_CONFIG: Record<number, QuotaConfig> = {
  0: { limit: 2, resetType: 'monthly' }, // Free: 2 sessions/month
  1: { limit: 5, resetType: 'monthly' }, // Basic: 5 sessions/month
  2: { limit: 20, resetType: 'monthly' }, // Pro: 20 sessions/month
};

/**
 * Get quota configuration for a given member level
 *
 * @param memberLevel - User's member level (0=Free, 1=Basic, 2+=Pro)
 * @returns Quota configuration with limit and reset type
 */
export function getQuotaConfig(memberLevel: number): QuotaConfig {
  if (memberLevel >= 2) {
    return SESSION_QUOTA_CONFIG[2]; // Pro tier
  }
  return SESSION_QUOTA_CONFIG[memberLevel] ?? SESSION_QUOTA_CONFIG[0];
}

/**
 * Get session limit for a given member level
 * @deprecated Use getQuotaConfig instead
 */
export function getSessionLimit(memberLevel: number): number {
  return getQuotaConfig(memberLevel).limit;
}

/**
 * Tier display names for UI
 */
export const TIER_NAMES: Record<number, string> = {
  0: 'Free',
  1: 'Basic',
  2: 'Pro',
};

/**
 * Get tier name for display
 */
export function getTierName(memberLevel: number): string {
  if (memberLevel >= 2) return 'Pro';
  return TIER_NAMES[memberLevel] ?? 'Free';
}

/**
 * Session Quota Type Definitions
 *
 * Types for the session quota/limit system that restricts
 * how many sessions users can create based on membership tier.
 */

/**
 * Quota reset type - all tiers use monthly reset
 */
export type QuotaResetType = 'monthly';

/**
 * Session quota information for a user
 */
export interface SessionQuota {
  /** Number of sessions already used in current period */
  used: number;

  /** Maximum sessions allowed per month */
  limit: number;

  /** Number of sessions remaining this month */
  remaining: number;

  /** Whether the user has reached their limit */
  isLimitReached: boolean;

  /** User's member level for context */
  memberLevel: number;

  /** Quota reset type */
  resetType: QuotaResetType;

  /** Next reset date in ISO format (first day of next month) */
  resetDate: string;
}

/**
 * API response for quota endpoint
 */
export interface QuotaResponse {
  quota: SessionQuota;
}

/**
 * Error response when quota is exceeded
 */
export interface QuotaExceededError {
  error: string;
  code: 'QUOTA_EXCEEDED';
  quota: SessionQuota;
}

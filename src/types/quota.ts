/**
 * Session Quota Type Definitions
 *
 * Types for the session quota/limit system that restricts
 * how many sessions users can create based on membership tier.
 */

/**
 * Session quota information for a user
 */
export interface SessionQuota {
  /** Number of sessions already used */
  used: number;

  /** Maximum sessions allowed (null = unlimited) */
  limit: number | null;

  /** Number of sessions remaining (null = unlimited) */
  remaining: number | null;

  /** Whether the user has reached their limit */
  isLimitReached: boolean;

  /** User's member level for context */
  memberLevel: number;
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

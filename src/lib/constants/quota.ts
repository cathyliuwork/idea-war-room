/**
 * Session Quota Configuration
 *
 * Defines session limits per membership tier.
 *
 * Membership Levels:
 * - 0: Free tier
 * - 1: Basic tier
 * - 2+: Pro tier (unlimited)
 */

/**
 * Session limits by member level
 * null indicates unlimited sessions
 */
export const SESSION_LIMITS: Record<number, number | null> = {
  0: 2, // Free tier: 2 sessions lifetime
  1: 5, // Basic tier: 5 sessions lifetime
  // member >= 2: unlimited (handled by getSessionLimit function)
};

/**
 * Get session limit for a given member level
 *
 * @param memberLevel - User's member level (0=Free, 1=Basic, 2+=Pro)
 * @returns Session limit or null if unlimited
 */
export function getSessionLimit(memberLevel: number): number | null {
  if (memberLevel >= 2) {
    return null; // Unlimited for Pro and above
  }
  return SESSION_LIMITS[memberLevel] ?? 2; // Default to free tier limit
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

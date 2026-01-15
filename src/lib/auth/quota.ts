import { createServerSupabaseClient } from '@/lib/supabase/client';
import { User } from '@/types/auth';
import { SessionQuota } from '@/types/quota';
import { getQuotaConfig } from '@/lib/constants/quota';

/**
 * Session Quota Management
 *
 * Provides functions for checking and enforcing monthly session quotas
 * based on user membership tier.
 */

/**
 * Get the start of the current month in UTC
 */
function getMonthStartUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Get the start of the next month in UTC (for reset date display)
 */
function getNextMonthStartUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

/**
 * Get the count of sessions for a user within a time period
 *
 * Counts sessions created on or after the specified date.
 * This ensures quota is enforced from the moment a session is created.
 *
 * @param userId - Internal user UUID
 * @param since - Count sessions created on or after this date
 * @returns Total number of sessions for this user in the period
 */
export async function getUserSessionCount(
  userId: string,
  since?: Date
): Promise<number> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Add time filter for monthly quota
  if (since) {
    query = query.gte('created_at', since.toISOString());
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to count sessions: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get quota information for a user
 *
 * All tiers use monthly quota reset.
 *
 * @param user - Authenticated user object
 * @returns SessionQuota object with usage details
 */
export async function getQuotaInfo(user: User): Promise<SessionQuota> {
  const config = getQuotaConfig(user.member);
  const { limit, resetType } = config;

  // All tiers use monthly quota - count only current month's sessions
  const since = getMonthStartUTC();
  const resetDate = getNextMonthStartUTC().toISOString();

  const used = await getUserSessionCount(user.id, since);
  const remaining = Math.max(0, limit - used);
  const isLimitReached = used >= limit;

  return {
    used,
    limit,
    remaining,
    isLimitReached,
    memberLevel: user.member,
    resetType,
    resetDate,
  };
}

/**
 * Check if user can create a new session
 *
 * @param user - Authenticated user object
 * @returns Object with canCreate boolean and quota info
 */
export async function checkCanCreateSession(user: User): Promise<{
  canCreate: boolean;
  quota: SessionQuota;
}> {
  const quota = await getQuotaInfo(user);
  return {
    canCreate: !quota.isLimitReached,
    quota,
  };
}

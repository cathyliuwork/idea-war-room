import { createServerSupabaseClient } from '@/lib/supabase/client';
import { User } from '@/types/auth';
import { SessionQuota } from '@/types/quota';
import { getSessionLimit } from '@/lib/constants/quota';

/**
 * Session Quota Management
 *
 * Provides functions for checking and enforcing session quotas
 * based on user membership tier.
 */

/**
 * Get the count of sessions for a user
 *
 * Counts all sessions including drafts (sessions without ideas).
 * This ensures quota is enforced from the moment a session is created.
 *
 * @param userId - Internal user UUID
 * @returns Total number of sessions for this user
 */
export async function getUserSessionCount(userId: string): Promise<number> {
  const supabase = createServerSupabaseClient();

  const { count, error } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to count sessions: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get quota information for a user
 *
 * @param user - Authenticated user object
 * @returns SessionQuota object with usage details
 */
export async function getQuotaInfo(user: User): Promise<SessionQuota> {
  const used = await getUserSessionCount(user.id);
  const limit = getSessionLimit(user.member);

  const isUnlimited = limit === null;
  const remaining = isUnlimited ? null : Math.max(0, limit - used);
  const isLimitReached = !isUnlimited && used >= limit;

  return {
    used,
    limit,
    remaining,
    isLimitReached,
    memberLevel: user.member,
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

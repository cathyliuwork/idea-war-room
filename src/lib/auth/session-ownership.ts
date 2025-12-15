import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Session Ownership Verification
 *
 * CRITICAL SECURITY: Service role key bypasses Row Level Security (RLS).
 * This function MUST be called before accessing any session-scoped data
 * to prevent authorization bypass vulnerabilities.
 */

export interface SessionOwnershipResult {
  authorized: boolean;
  session?: {
    id: string;
    status: 'intake' | 'choice' | 'completed' | 'failed';
    user_id: string;
    research_completed: boolean;
    analysis_completed: boolean;
    created_at: string;
  };
  error?: string;
}

/**
 * Verify that the authenticated user owns the specified session
 *
 * This function ensures that:
 * 1. The session exists
 * 2. The session belongs to the authenticated user
 * 3. Returns session data if authorized
 *
 * SECURITY NOTE:
 * - Always call this function BEFORE accessing session-related data
 * - Never rely on RLS alone when using service role key
 * - Return 404 (not 403) to avoid leaking session existence
 *
 * @param supabase - Authenticated Supabase client with service role key
 * @param sessionId - Session ID to verify
 * @param userId - Current authenticated user's ID
 * @returns Object with authorization status, session data, and optional error
 *
 * @example
 * ```typescript
 * const { authorized, session, error } = await verifySessionOwnership(
 *   supabase,
 *   params.sessionId,
 *   user.id
 * );
 *
 * if (!authorized) {
 *   return NextResponse.json(
 *     { error: error || 'Session not found or access denied' },
 *     { status: 404 }
 *   );
 * }
 *
 * // Safe to proceed - user owns this session
 * ```
 */
export async function verifySessionOwnership(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<SessionOwnershipResult> {
  // Query session with explicit user_id filter
  // CRITICAL: Service role key bypasses RLS, so we MUST filter by user_id
  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, status, user_id, research_completed, analysis_completed, created_at')
    .eq('id', sessionId)
    .eq('user_id', userId)  // CRITICAL: Ensure user owns this session
    .single();

  // Handle errors
  if (error) {
    // PGRST116 = "not found" error code from PostgREST
    if (error.code === 'PGRST116') {
      return {
        authorized: false,
        error: 'Session not found or access denied'
      };
    }

    // Other database errors
    console.error('Session ownership verification failed:', error);
    return {
      authorized: false,
      error: error.message
    };
  }

  // Session not found (shouldn't happen after error check, but defensive)
  if (!session) {
    return {
      authorized: false,
      error: 'Session not found or access denied'
    };
  }

  // Success - user owns this session
  return {
    authorized: true,
    session
  };
}

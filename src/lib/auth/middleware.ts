import { createServerSupabaseClient } from '@/lib/supabase/client';
import { getSessionToken } from './session';
import { verifyJWT } from './jwt';
import { getUserProfileByExternalId } from './user';
import { User } from '@/types/auth';

/**
 * Authentication Middleware
 *
 * Provides authenticated user context and Supabase client with RLS enforcement.
 */

/**
 * Get currently authenticated user from session
 *
 * @returns User profile data
 * @throws Error if no session token or invalid token
 */
export async function getCurrentUser(): Promise<User> {
  const token = getSessionToken();

  if (!token) {
    throw new Error('No session token');
  }

  // Verify JWT token
  const payload = verifyJWT(token);

  // Get user profile from database
  const userProfile = await getUserProfileByExternalId(payload.sub);

  return {
    id: userProfile.id,
    externalUserId: userProfile.external_user_id,
    email: userProfile.email,
    name: userProfile.full_name,
    metadata: userProfile.metadata,
  };
}

/**
 * Create Supabase client with RLS context set for authenticated user
 *
 * This is the main function used by API endpoints to get an authenticated
 * Supabase client with Row Level Security properly enforced.
 *
 * @returns Object with authenticated Supabase client and user data
 * @throws Error if user is not authenticated
 */
export async function createAuthenticatedSupabaseClient() {
  const user = await getCurrentUser();
  const supabase = createServerSupabaseClient();

  // Set RLS context for this session
  // This calls the set_session_user_id() database function
  await supabase.rpc('set_session_user_id', { user_id: user.id });

  return { supabase, user };
}

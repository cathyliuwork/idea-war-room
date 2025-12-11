import { createServerSupabaseClient } from '@/lib/supabase/client';
import { JWTPayload } from '@/types/auth';

/**
 * User Profile Database Operations
 *
 * Handles user profile creation, updates, and lookups.
 */

/**
 * Create or update user profile from JWT payload
 *
 * Uses upsert to handle both new users and returning users.
 * The external_user_id (JWT sub claim) is used as the unique identifier.
 *
 * @param payload - Decoded JWT payload
 * @returns Internal user UUID
 * @throws Error if database operation fails
 */
export async function upsertUserProfile(payload: JWTPayload): Promise<string> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        external_user_id: payload.sub,
        email: payload.email,
        full_name: payload.name || null,
        metadata: payload.metadata || {},
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'external_user_id',
        ignoreDuplicates: false,
      }
    )
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to upsert user profile: ${error.message}`);
  }

  return data.id;
}

/**
 * Get user profile by external user ID
 *
 * @param externalUserId - External user ID from JWT sub claim
 * @returns User profile data
 * @throws Error if user not found
 */
export async function getUserProfileByExternalId(externalUserId: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('external_user_id', externalUserId)
    .single();

  if (error) {
    throw new Error(`User not found: ${error.message}`);
  }

  return data;
}

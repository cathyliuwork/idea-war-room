import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for server-side use with service role key
 *
 * This client has full database access and bypasses Row Level Security (RLS).
 * RLS is enforced separately using set_session_user_id() RPC call.
 *
 * @returns Supabase client instance
 * @throws Error if environment variables are missing
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

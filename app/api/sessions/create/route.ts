import { NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';

/**
 * Create New Session
 *
 * Creates a new MVTA analysis session for the authenticated user.
 * Initial status is 'intake'.
 *
 * POST /api/sessions/create
 */
export async function POST() {
  try {
    const { supabase, user } = await createAuthenticatedSupabaseClient();

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        status: 'intake',
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return NextResponse.json(
      { session_id: data.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create session failed:', error);

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

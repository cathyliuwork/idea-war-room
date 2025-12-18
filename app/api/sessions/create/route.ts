import { NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { checkCanCreateSession } from '@/lib/auth/quota';

/**
 * Create New Session
 *
 * Creates a new MVTA analysis session for the authenticated user.
 * Initial status is 'intake'.
 * Enforces session quota limits based on membership tier.
 *
 * POST /api/sessions/create
 *
 * Returns:
 * - 201: Session created successfully
 * - 403: Quota exceeded (with quota info)
 * - 500: Server error
 */
export async function POST() {
  try {
    const { supabase, user } = await createAuthenticatedSupabaseClient();

    // Check quota before creating session
    const { canCreate, quota } = await checkCanCreateSession(user);

    if (!canCreate) {
      return NextResponse.json(
        {
          error:
            'Session limit reached. Please upgrade your membership to create more sessions.',
          code: 'QUOTA_EXCEEDED',
          quota,
        },
        { status: 403 }
      );
    }

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

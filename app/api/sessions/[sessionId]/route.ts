import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';

/**
 * Get Session Details
 *
 * Retrieves session information for the authenticated user.
 * RLS ensures users can only access their own sessions.
 *
 * GET /api/sessions/[sessionId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase } = await createAuthenticatedSupabaseClient();

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', params.sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ session: data });
  } catch (error) {
    console.error('Get session failed:', error);

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

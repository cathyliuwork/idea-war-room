import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';

/**
 * Get Session Status
 *
 * GET /api/sessions/[sessionId]/status
 * Returns session status and completion flags for choice page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase } = await createAuthenticatedSupabaseClient();

    const { data: session, error } = await supabase
      .from('sessions')
      .select('id, status, research_completed, analysis_completed, created_at')
      .eq('id', params.sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Get session status failed:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

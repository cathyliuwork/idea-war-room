import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { isValidResearchType } from '@/lib/constants/research';

/**
 * GET /api/sessions/[sessionId]/research/[type]
 *
 * Fetch research snapshot for a specific type
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string; type: string } }
) {
  try {
    const { supabase } = await createAuthenticatedSupabaseClient();
    const { sessionId, type } = params;

    // Validate research type
    if (!isValidResearchType(type)) {
      return NextResponse.json(
        { error: 'Invalid research type', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch research snapshot for this type
    const { data: snapshot, error: snapshotError } = await supabase
      .from('research_snapshots')
      .select('*')
      .eq('session_id', sessionId)
      .eq('research_type', type)
      .single();

    if (snapshotError || !snapshot) {
      return NextResponse.json(
        {
          error: 'Research not found for this type',
          code: 'RESEARCH_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Return snapshot
    return NextResponse.json({
      research_snapshot_id: snapshot.id,
      research_type: snapshot.research_type,
      queries: snapshot.queries || [],
      results: snapshot.results || [],
      created_at: snapshot.created_at,
    });
  } catch (error) {
    console.error('Unexpected error in research type API:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

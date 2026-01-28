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
  props: { params: Promise<{ sessionId: string; type: string }> }
) {
  const params = await props.params;
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

    // Calculate possibly_failed flag
    // If queries exist but results are empty, synthesis likely failed
    const queries = snapshot.queries || [];
    const results = snapshot.results || [];
    const possiblyFailed = queries.length > 0 && results.length === 0;

    // Return snapshot with possibly_failed flag
    return NextResponse.json({
      research_snapshot_id: snapshot.id,
      research_type: snapshot.research_type,
      queries,
      results,
      created_at: snapshot.created_at,
      possibly_failed: possiblyFailed,
    });
  } catch (error) {
    console.error('Unexpected error in research type API:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[sessionId]/research/[type]
 *
 * Delete research snapshot to enable retry
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ sessionId: string; type: string }> }
) {
  const params = await props.params;
  try {
    const { supabase, user } = await createAuthenticatedSupabaseClient();
    const { sessionId, type } = params;

    // Validate research type
    if (!isValidResearchType(type)) {
      return NextResponse.json(
        { error: 'Invalid research type' },
        { status: 400 }
      );
    }

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 403 }
      );
    }

    // Delete research snapshot
    const { error: deleteError } = await supabase
      .from('research_snapshots')
      .delete()
      .eq('session_id', sessionId)
      .eq('research_type', type);

    if (deleteError) {
      throw new Error(`Failed to delete research: ${deleteError.message}`);
    }

    console.log(`🗑️ Deleted ${type} research snapshot for session ${sessionId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting research:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

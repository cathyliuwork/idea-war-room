import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { verifySessionOwnership } from '@/lib/auth/session-ownership';
import { getAllResearchTypes } from '@/lib/constants/research';

/**
 * GET /api/sessions/[sessionId]/research/status
 *
 * Returns completion status for all research types
 *
 * SECURITY: Verifies session ownership before returning research status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase, user } = await createAuthenticatedSupabaseClient();
    const { sessionId } = params;

    // CRITICAL: Verify user owns this session
    const { authorized, error: ownershipError } = await verifySessionOwnership(
      supabase,
      sessionId,
      user.id
    );

    if (!authorized) {
      return NextResponse.json(
        { error: ownershipError || 'Session not found or access denied', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch all research snapshots for this session
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('research_snapshots')
      .select('id, research_type, created_at')
      .eq('session_id', sessionId);

    if (snapshotsError) {
      console.error('Error fetching research snapshots:', snapshotsError);
      return NextResponse.json(
        { error: 'Failed to fetch research status', code: 'FETCH_FAILED' },
        { status: 500 }
      );
    }

    // Build status map for all available research types
    const allTypes = getAllResearchTypes();
    const availableTypes: Record<
      string,
      { completed: boolean; snapshot_id?: string; created_at?: string }
    > = {};

    for (const type of allTypes) {
      const snapshot = snapshots?.find((s: any) => s.research_type === type);
      availableTypes[type] = {
        completed: !!snapshot,
        snapshot_id: snapshot?.id,
        created_at: snapshot?.created_at,
      };
    }

    // Calculate completed types list
    const completedTypes = snapshots?.map((s: any) => s.research_type) || [];

    return NextResponse.json({
      completed_types: completedTypes,
      available_types: availableTypes,
    });
  } catch (error) {
    console.error('Unexpected error in research status API:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

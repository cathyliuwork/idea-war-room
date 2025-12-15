import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { verifySessionOwnership } from '@/lib/auth/session-ownership';

/**
 * Damage Report API Endpoint
 *
 * GET /api/sessions/[sessionId]/report
 * Retrieves MVTA damage report for display
 *
 * SECURITY: Verifies session ownership before returning sensitive data
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase, user } = await createAuthenticatedSupabaseClient();

    // CRITICAL: Verify user owns this session before accessing report
    const { authorized, error: ownershipError } = await verifySessionOwnership(
      supabase,
      params.sessionId,
      user.id
    );

    if (!authorized) {
      return NextResponse.json(
        { error: ownershipError || 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch damage report
    const { data: report, error: reportError } = await supabase
      .from('damage_reports')
      .select('*')
      .eq('session_id', params.sessionId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Damage report not found. Please complete analysis first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Get damage report failed:', error);

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

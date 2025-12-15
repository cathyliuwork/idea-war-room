import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { verifySessionOwnership } from '@/lib/auth/session-ownership';

/**
 * Get Session Status
 *
 * GET /api/sessions/[sessionId]/status
 * Returns session status and completion flags for choice page
 *
 * SECURITY: Verifies session ownership before returning status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase, user } = await createAuthenticatedSupabaseClient();

    // CRITICAL: Verify user owns this session
    const { authorized, session, error: ownershipError } = await verifySessionOwnership(
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

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Get session status failed:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

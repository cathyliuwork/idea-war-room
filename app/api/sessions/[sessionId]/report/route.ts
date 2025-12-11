import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';

/**
 * Damage Report API Endpoint
 *
 * GET /api/sessions/[sessionId]/report
 * Retrieves MVTA damage report for display
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase } = await createAuthenticatedSupabaseClient();

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

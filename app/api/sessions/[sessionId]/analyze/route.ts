import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { verifySessionOwnership } from '@/lib/auth/session-ownership';
import { runMVTAAnalysis } from '@/lib/llm/prompts/mvta-analysis';

/**
 * MVTA Analysis API Endpoint
 *
 * POST /api/sessions/[sessionId]/analyze
 * Executes MVTA red team analysis on structured idea (independent of research)
 *
 * SECURITY: Verifies session ownership before triggering analysis
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase, user } = await createAuthenticatedSupabaseClient();

    // CRITICAL: Verify user owns this session before triggering analysis
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

    // 1. Fetch structured idea
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('structured_idea')
      .eq('session_id', params.sessionId)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json(
        { error: 'Idea not found or access denied' },
        { status: 404 }
      );
    }

    // 2. Run MVTA analysis (completely independent - no research data)
    console.log(`Starting MVTA analysis for session ${params.sessionId}...`);
    const mvtaReport = await runMVTAAnalysis(idea.structured_idea);

    // 3. Save damage report to database
    const { data: damageReport, error: reportError } = await supabase
      .from('damage_reports')
      .insert({
        session_id: params.sessionId,
        vulnerabilities: mvtaReport.vulnerabilities,
        cascading_failures: mvtaReport.cascading_failures,
        vector_synthesis: mvtaReport.vector_synthesis,
        recommendations: mvtaReport.recommendations,
      })
      .select('id')
      .single();

    if (reportError) {
      throw new Error(`Failed to save damage report: ${reportError.message}`);
    }

    // 4. Update session status to 'completed' and set analysis_completed flag
    await supabase
      .from('sessions')
      .update({
        status: 'completed',
        analysis_completed: true,
      })
      .eq('id', params.sessionId);

    console.log(`MVTA analysis complete for session ${params.sessionId}`);

    return NextResponse.json(
      {
        damage_report_id: damageReport.id,
        vulnerabilities_count: mvtaReport.vulnerabilities.length,
        cascading_failures_count: mvtaReport.cascading_failures.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('MVTA analysis failed:', error);

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

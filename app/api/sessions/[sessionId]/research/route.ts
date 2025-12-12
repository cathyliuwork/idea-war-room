import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { conductResearch } from '@/lib/search/research-engine';

/**
 * Research API Endpoint
 *
 * POST /api/sessions/[sessionId]/research
 * Initiates research phase: generates queries, executes searches, synthesizes results
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase } = await createAuthenticatedSupabaseClient();

    // 1. Verify session and fetch structured idea
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

    // 2. Conduct research (query generation → search → synthesis)
    console.log(`Starting research for session ${params.sessionId}...`);
    const researchSnapshot = await conductResearch(idea.structured_idea);

    // 3. Save research snapshot to database
    const { data: snapshot, error: snapshotError } = await supabase
      .from('research_snapshots')
      .insert({
        session_id: params.sessionId,
        competitor_queries: researchSnapshot.competitor_queries,
        community_queries: researchSnapshot.community_queries,
        regulatory_queries: researchSnapshot.regulatory_queries,
        competitors: researchSnapshot.competitors,
        community_signals: researchSnapshot.community_signals,
        regulatory_signals: researchSnapshot.regulatory_signals,
      })
      .select('id')
      .single();

    if (snapshotError) {
      throw new Error(`Failed to save research: ${snapshotError.message}`);
    }

    // 4. Set research_completed flag (keep status as 'choice')
    await supabase
      .from('sessions')
      .update({ research_completed: true })
      .eq('id', params.sessionId);

    console.log(`Research complete for session ${params.sessionId}`);

    return NextResponse.json(
      {
        research_snapshot_id: snapshot.id,
        competitors_found: researchSnapshot.competitors.length,
        community_signals_found: researchSnapshot.community_signals.length,
        regulatory_signals_found: researchSnapshot.regulatory_signals.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Research failed:', error);

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

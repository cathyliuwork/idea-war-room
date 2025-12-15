import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { conductResearch } from '@/lib/search/research-engine';
import { isValidResearchType, ResearchType } from '@/lib/constants/research';

/**
 * Research API Endpoint (UPDATED for multi-type support)
 *
 * POST /api/sessions/[sessionId]/research?type=competitor|community|regulatory
 * Initiates research for specific type: generates queries, executes searches, synthesizes results
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase } = await createAuthenticatedSupabaseClient();

    // Extract and validate research type from query params
    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get('type');

    if (!typeParam || !isValidResearchType(typeParam)) {
      return NextResponse.json(
        { error: 'Invalid or missing research type parameter. Use ?type=competitor|community|regulatory' },
        { status: 400 }
      );
    }

    // Type assertion after validation
    const type = typeParam as 'competitor' | 'community' | 'regulatory';

    // Check if this type already exists
    const { data: existing } = await supabase
      .from('research_snapshots')
      .select('id')
      .eq('session_id', params.sessionId)
      .eq('research_type', type)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Research type '${type}' already completed for this session` },
        { status: 409 }
      );
    }

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

    // 2. Conduct research (only the requested type)
    console.log(`Starting ${type} research for session ${params.sessionId}...`);
    const researchSnapshot = await conductResearch(idea.structured_idea, type);

    // 3. Extract type-specific data
    let queries: string[] = [];
    let results: any[] = [];

    switch (type) {
      case 'competitor':
        queries = researchSnapshot.competitor_queries;
        results = researchSnapshot.competitors;
        break;
      case 'community':
        queries = researchSnapshot.community_queries;
        results = researchSnapshot.community_signals;
        break;
      case 'regulatory':
        queries = researchSnapshot.regulatory_queries;
        results = researchSnapshot.regulatory_signals;
        break;
    }

    // 4. Save research snapshot to database (NEW SCHEMA)
    const { data: snapshot, error: snapshotError } = await supabase
      .from('research_snapshots')
      .insert({
        session_id: params.sessionId,
        research_type: type,
        queries: queries,
        results: results,
      })
      .select('id')
      .single();

    if (snapshotError) {
      throw new Error(`Failed to save research: ${snapshotError.message}`);
    }

    // 5. Set research_completed flag (keep status as 'choice')
    await supabase
      .from('sessions')
      .update({ research_completed: true })
      .eq('id', params.sessionId);

    console.log(`${type} research complete for session ${params.sessionId}`);

    return NextResponse.json(
      {
        research_snapshot_id: snapshot.id,
        research_type: type,
        results_count: results.length,
        queries: queries,
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

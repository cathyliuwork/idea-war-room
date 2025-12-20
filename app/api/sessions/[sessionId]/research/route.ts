import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { verifySessionOwnership } from '@/lib/auth/session-ownership';
import { conductResearch } from '@/lib/search/research-engine';
import { isValidResearchType, ResearchType } from '@/lib/constants/research';
import type { TypedResearchResult } from '@/lib/validation/schemas';
import { getLanguage } from '@/i18n/get-language';
import { getValidPromptLanguage } from '@/lib/llm/prompts/language-instructions';

/**
 * Research API Endpoint (UPDATED for multi-type support)
 *
 * POST /api/sessions/[sessionId]/research?type=competitor|community|regulatory
 * Initiates research for specific type: generates queries, executes searches, synthesizes results
 *
 * SECURITY: Verifies session ownership before triggering research
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase, user } = await createAuthenticatedSupabaseClient();

    // Parse request body for optional reuse_queries
    let reuseQueries: string[] | null = null;
    try {
      const body = await request.json();
      if (body.reuse_queries && Array.isArray(body.reuse_queries)) {
        reuseQueries = body.reuse_queries;
        console.log(`♻️ Received ${body.reuse_queries.length} queries to reuse`);
      }
    } catch (e) {
      // No body or invalid JSON, continue without reuse_queries
    }

    // CRITICAL: Verify user owns this session before triggering research
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

    // Check if this type already exists - if so, delete it to allow retry
    const { data: existing } = await supabase
      .from('research_snapshots')
      .select('id')
      .eq('session_id', params.sessionId)
      .eq('research_type', type)
      .single();

    if (existing) {
      // Delete existing to allow retry
      await supabase.from('research_snapshots').delete().eq('id', existing.id);

      console.log(`🔄 Deleted existing ${type} research to allow retry`);
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

    // 2. Get language from cookie for synthesis output
    const language = getValidPromptLanguage(getLanguage());

    // 3. Conduct research (only the requested type)
    console.log(`Starting ${type} research for session ${params.sessionId} in ${language}...`);
    if (reuseQueries) {
      console.log(`♻️ Reusing ${reuseQueries.length} saved queries (skipping query generation)`);
    }
    // Type assertion needed because TypeScript can't resolve overloads with union types
    const researchResult = await conductResearch(
      idea.structured_idea,
      type as any,
      reuseQueries || undefined,
      language
    );

    // Phase 2: Use typed result directly (no need to extract from old format)
    const typedResult = researchResult as TypedResearchResult;

    // Detect potential synthesis failure
    // If queries were generated but results are empty, synthesis likely failed
    const possiblyFailed =
      typedResult.queries.length > 0 && typedResult.results.length === 0;

    // 3. Save research snapshot to database
    const { data: snapshot, error: snapshotError } = await supabase
      .from('research_snapshots')
      .insert({
        session_id: params.sessionId,
        research_type: typedResult.research_type,
        queries: typedResult.queries,
        results: typedResult.results,
      })
      .select('id')
      .single();

    if (snapshotError) {
      throw new Error(`Failed to save research: ${snapshotError.message}`);
    }

    // 4. Set research_completed flag
    await supabase
      .from('sessions')
      .update({ research_completed: true })
      .eq('id', params.sessionId);

    console.log(`${type} research complete for session ${params.sessionId}`);

    // 5. Return type-specific response
    return NextResponse.json(
      {
        research_snapshot_id: snapshot.id,
        research_type: typedResult.research_type,
        results_count: typedResult.results.length,
        queries: typedResult.queries,
        possibly_failed: possiblyFailed,
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

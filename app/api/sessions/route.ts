import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { getQuotaInfo } from '@/lib/auth/quota';

// Force dynamic rendering (required for authenticated routes)
export const dynamic = 'force-dynamic';

/**
 * GET /api/sessions
 *
 * Fetch list of all user's sessions with status and completion flags
 * Used by dashboard to display session history
 *
 * Query parameters:
 * - limit: Number of sessions to return (default: 10)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await createAuthenticatedSupabaseClient();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Fetch all sessions including drafts (left join with ideas)
  // Note: Service role key bypasses RLS, so we must manually filter by user_id
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      status,
      research_completed,
      analysis_completed,
      created_at,
      ideas(structured_idea)
    `)
    .eq('user_id', user.id) // CRITICAL: Filter by current user
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count total sessions for current user
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Format response
  const formattedSessions = sessions.map((s: any) => {
    // ideas is null for draft sessions, or an object when idea exists
    const structuredIdea = s.ideas?.structured_idea;
    const isDraft = !s.ideas;

    // Generate title based on session state
    let title: string;
    if (isDraft) {
      title = 'Untitled Draft';
    } else if (structuredIdea?.high_concept) {
      title = structuredIdea.high_concept;
    } else if (structuredIdea?.value_proposition) {
      title =
        structuredIdea.value_proposition.substring(0, 50) +
        (structuredIdea.value_proposition.length > 50 ? '...' : '');
    } else {
      title = `Idea Analysis [${s.id}]`;
    }

    return {
      id: s.id,
      status: s.status,
      research_completed: s.research_completed,
      analysis_completed: s.analysis_completed,
      created_at: s.created_at,
      high_concept: title,
      is_draft: isDraft,
    };
  });

  // Get quota info for the user
  const quota = await getQuotaInfo(user);

  return NextResponse.json({
    sessions: formattedSessions,
    total_count: count || 0,
    quota,
  });
}

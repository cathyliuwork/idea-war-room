import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { structureIdea } from '@/lib/llm/prompts/structure-idea';

/**
 * Submit Idea for Structuring
 *
 * Receives raw idea input from intake form, uses LLM to structure it
 * into MVTA format, and saves to database.
 *
 * POST /api/sessions/[sessionId]/idea
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { rawInput } = await request.json();

    if (!rawInput || typeof rawInput !== 'string') {
      return NextResponse.json(
        { error: 'rawInput is required and must be a string' },
        { status: 400 }
      );
    }

    const { supabase } = await createAuthenticatedSupabaseClient();

    // Verify session exists and belongs to user (RLS handles this)
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('id', params.sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Structure idea using LLM (Prompt A)
    const structuredIdea = await structureIdea(rawInput);

    // Save idea to database
    const { data, error } = await supabase
      .from('ideas')
      .insert({
        session_id: params.sessionId,
        raw_input: rawInput,
        structured_idea: structuredIdea,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save idea: ${error.message}`);
    }

    // Update session status to 'research' (ready for next phase)
    await supabase
      .from('sessions')
      .update({ status: 'research' })
      .eq('id', params.sessionId);

    return NextResponse.json(
      {
        idea_id: data.id,
        structured_idea: structuredIdea,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit idea failed:', error);

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Get Idea for Session
 *
 * Retrieves the idea associated with this session.
 *
 * GET /api/sessions/[sessionId]/idea
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { supabase } = await createAuthenticatedSupabaseClient();

    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('session_id', params.sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Idea not found for this session' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ idea: data });
  } catch (error) {
    console.error('Get idea failed:', error);

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

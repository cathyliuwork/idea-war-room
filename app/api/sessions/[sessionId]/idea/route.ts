import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { verifySessionOwnership } from '@/lib/auth/session-ownership';
import { StructuredIdeaSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

/**
 * Submit Idea (Form-based)
 *
 * Receives structured idea directly from form (no LLM extraction).
 * Validates with Zod schema and saves to database.
 *
 * POST /api/sessions/[sessionId]/idea
 *
 * SECURITY: Verifies session ownership before accepting submission
 */
export async function POST(request: NextRequest, props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  try {
    const body = await request.json();
    const { structured_idea, source = 'form' } = body;

    if (!structured_idea) {
      return NextResponse.json(
        { error: 'structured_idea is required', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    // Validate with Zod schema (no LLM call)
    const validatedIdea = StructuredIdeaSchema.parse(structured_idea);

    const { supabase, user } = await createAuthenticatedSupabaseClient();

    // CRITICAL: Verify user owns this session before accepting idea submission
    const { authorized, session, error: ownershipError } = await verifySessionOwnership(
      supabase,
      params.sessionId,
      user.id
    );

    if (!authorized) {
      return NextResponse.json(
        { error: ownershipError || 'Session not found or access denied', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Save idea to database
    const { data, error } = await supabase
      .from('ideas')
      .insert({
        session_id: params.sessionId,
        raw_input: JSON.stringify(structured_idea), // Store form JSON string
        structured_idea: validatedIdea,
        source: source, // 'form' or 'ai'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save idea: ${error.message}`);
    }

    // Update session status to 'choice' (ready for user to select next action)
    await supabase
      .from('sessions')
      .update({ status: 'choice' })
      .eq('id', params.sessionId);

    return NextResponse.json(
      {
        idea_id: data.id,
        structured_idea: validatedIdea,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit idea failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_FAILED',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: (error as Error).message,
        code: 'DATABASE_ERROR',
      },
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
 *
 * SECURITY: Verifies session ownership before returning sensitive data
 */
export async function GET(request: NextRequest, props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  try {
    const { supabase, user } = await createAuthenticatedSupabaseClient();

    // CRITICAL: Verify user owns this session before accessing idea
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

import { NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/auth/middleware';
import { getQuotaInfo } from '@/lib/auth/quota';

// Force dynamic rendering (required for authenticated routes)
export const dynamic = 'force-dynamic';

/**
 * GET /api/sessions/quota
 *
 * Returns session quota information for the authenticated user.
 * Used by frontend to display quota status and determine if user can create sessions.
 *
 * Response:
 * {
 *   quota: {
 *     used: number,
 *     limit: number | null,
 *     remaining: number | null,
 *     isLimitReached: boolean,
 *     memberLevel: number
 *   }
 * }
 */
export async function GET() {
  try {
    const { user } = await createAuthenticatedSupabaseClient();

    const quota = await getQuotaInfo(user);

    return NextResponse.json({ quota });
  } catch (error) {
    console.error('Get quota failed:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

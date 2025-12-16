import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { upsertUserProfile } from '@/lib/auth/user';
import { setSessionCookie } from '@/lib/auth/session';

/**
 * Authentication Callback Endpoint
 *
 * Handles JWT authentication from parent project or mock login.
 * Verifies token, creates/updates user profile, sets session cookie, redirects to dashboard.
 *
 * GET /api/auth/callback?token=<jwt>
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      );
    }

    // Verify JWT signature and expiration
    const payload = verifyJWT(token);

    // Create or update user profile in database
    await upsertUserProfile(payload);

    // Set session cookie and redirect to dashboard
    // Use NEXT_PUBLIC_APP_URL for redirect to ensure correct domain in Docker/production
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
    const response = NextResponse.redirect(new URL('/dashboard', baseUrl));
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('Auth callback failed:', error);

    return NextResponse.json(
      {
        error: 'Authentication failed',
        details: (error as Error).message,
      },
      { status: 401 }
    );
  }
}

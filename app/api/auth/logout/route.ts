import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

/**
 * Logout Endpoint
 *
 * Clears session cookie and redirects to login page.
 *
 * POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  const loginUrl =
    process.env.AUTH_MODE === 'mock'
      ? '/api/auth/mock/login'
      : process.env.NEXT_PUBLIC_PARENT_LOGIN_URL || '/';

  // Use NEXT_PUBLIC_APP_URL for redirect to ensure correct domain in Docker/production
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
  const response = NextResponse.redirect(new URL(loginUrl, baseUrl));
  clearSessionCookie(response);

  return response;
}

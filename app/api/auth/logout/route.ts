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

  const response = NextResponse.redirect(new URL(loginUrl, request.url));
  clearSessionCookie(response);

  return response;
}

import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

/**
 * Logout Endpoint (Mock Mode)
 *
 * Clears session cookie and redirects to mock login page.
 * For JWT mode, use /api/auth/clear-session instead.
 *
 * POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/api/auth/mock/login', request.url));
  clearSessionCookie(response);
  return response;
}

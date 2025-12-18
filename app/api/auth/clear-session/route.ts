import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

/**
 * Clear Session Endpoint
 *
 * Clears session cookie and returns JSON response.
 * Used by goToParent() to clear session before redirecting to parent site.
 * Unlike /logout, this does NOT redirect - just clears cookie and returns success.
 *
 * POST /api/auth/clear-session
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}

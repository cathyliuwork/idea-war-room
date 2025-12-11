import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';

/**
 * Get Current User Session
 *
 * Returns currently authenticated user or 401 if not authenticated.
 * Used by frontend AuthContext to check login status.
 *
 * GET /api/auth/session
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (error) {
    // Not authenticated - return null user
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Session Cookie Management
 *
 * Handles setting, clearing, and retrieving session cookies.
 */

const SESSION_COOKIE_NAME = 'auth_token';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Set session cookie with JWT token
 *
 * @param response - Next.js response object
 * @param token - JWT token to store in cookie
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear session cookie (logout)
 *
 * @param response - Next.js response object
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
}

/**
 * Get session token from cookies (server-side)
 *
 * @returns JWT token string or null if not found
 */
export function getSessionToken(): string | null {
  try {
    return cookies().get(SESSION_COOKIE_NAME)?.value || null;
  } catch (error) {
    // Cookies might not be available in some contexts
    return null;
  }
}

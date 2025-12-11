import jwt from 'jsonwebtoken';
import { JWTPayload } from '@/types/auth';

/**
 * JWT Verification and Token Extraction Utilities
 */

const JWT_SECRET =
  process.env.AUTH_MODE === 'mock'
    ? 'dev-mode-secret-key-minimum-32-characters-long-placeholder'
    : process.env.JWT_SECRET || '';

const JWT_ALGORITHM = 'HS256';

/**
 * Verify and decode a JWT token
 *
 * @param token - JWT token string
 * @returns Decoded JWT payload
 * @throws Error if token is invalid, expired, or missing required fields
 */
export function verifyJWT(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    }) as JWTPayload;

    // Validate required fields
    if (!payload.sub || !payload.email) {
      throw new Error('Invalid JWT: missing required fields (sub, email)');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('JWT expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid JWT signature');
    }
    throw error;
  }
}

/**
 * Extract JWT token from request (cookie or query parameter)
 *
 * Priority: Query parameter > Cookie
 *
 * @param request - Next.js request object
 * @returns JWT token string or null if not found
 */
export function extractJWT(request: Request): string | null {
  const url = new URL(request.url);

  // Check query parameter first (used by callback endpoint)
  const tokenFromQuery = url.searchParams.get('token');
  if (tokenFromQuery) return tokenFromQuery;

  // Check cookie (used by authenticated requests)
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map((c) => c.split('='))
  );

  return cookies['auth_token'] || null;
}

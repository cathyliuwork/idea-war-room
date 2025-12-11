import jwt from 'jsonwebtoken';
import { MockUser } from '@/types/auth';

/**
 * Mock Authentication for Development
 *
 * Provides mock user management and JWT generation for local testing
 * without requiring parent project integration.
 */

const MOCK_JWT_SECRET = 'dev-mode-secret-key-minimum-32-characters-long-placeholder';

/**
 * Get list of mock users from environment variable
 *
 * Format: id:email:name;id:email:name
 * Example: test-user-1:alice@example.com:Alice Developer;test-user-2:bob@example.com:Bob Tester
 *
 * @returns Array of mock users
 */
export function getMockUsers(): MockUser[] {
  const mockUsersEnv = process.env.MOCK_USERS || '';

  if (!mockUsersEnv) {
    // Default mock users if not configured
    return [
      { id: 'test-user-1', email: 'alice@example.com', name: 'Alice Developer' },
      { id: 'test-user-2', email: 'bob@example.com', name: 'Bob Tester' },
    ];
  }

  return mockUsersEnv.split(';').map((userStr) => {
    const [id, email, name] = userStr.split(':');
    return { id, email, name };
  });
}

/**
 * Generate mock JWT token for development
 *
 * Creates a JWT token with the same structure as production tokens,
 * but uses a development-only secret.
 *
 * @param user - Mock user to generate token for
 * @returns JWT token string
 */
export function generateMockJWT(user: MockUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      metadata: { mode: 'development' },
    },
    MOCK_JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

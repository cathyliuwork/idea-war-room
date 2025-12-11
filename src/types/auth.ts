/**
 * Authentication Type Definitions
 *
 * Central type definitions for JWT authentication, user profiles, and mock users.
 */

/**
 * JWT Payload Structure
 *
 * This is the structure of the JWT token payload received from the parent project
 * or generated in mock mode for development.
 */
export interface JWTPayload {
  /** User ID from parent project (maps to external_user_id in database) */
  sub: string;

  /** User email address */
  email: string;

  /** User full name (optional) */
  name?: string;

  /** Issued at timestamp (Unix time) */
  iat: number;

  /** Expiration timestamp (Unix time) */
  exp: number;

  /** Additional metadata from parent project (optional) */
  metadata?: Record<string, any>;
}

/**
 * User Profile
 *
 * Represents an authenticated user with data from the user_profiles table.
 * This is what gets stored in the database and returned by API endpoints.
 */
export interface User {
  /** Internal UUID (primary key in user_profiles table) */
  id: string;

  /** External user ID from parent project (JWT sub claim) */
  externalUserId: string;

  /** User email address */
  email: string;

  /** User full name (nullable) */
  name: string | null;

  /** Additional metadata from JWT payload */
  metadata: Record<string, any>;
}

/**
 * Mock User (Dev Mode Only)
 *
 * Simplified user structure for mock authentication during development.
 * Parsed from MOCK_USERS environment variable.
 */
export interface MockUser {
  /** Mock user ID (e.g., "test-user-1") */
  id: string;

  /** Mock user email */
  email: string;

  /** Mock user display name */
  name: string;
}

/**
 * Auth Context Type
 *
 * Type definition for the React AuthContext provider value.
 */
export interface AuthContextType {
  /** Currently authenticated user (null if not authenticated) */
  user: User | null;

  /** Loading state while fetching user */
  isLoading: boolean;

  /** Sign out function */
  signOut: () => Promise<void>;
}

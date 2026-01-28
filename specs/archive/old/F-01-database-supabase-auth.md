# F-01: Database & Authentication

**Version**: 1.0
**Last Updated**: 2025-12-08
**Priority**: CRITICAL
**Status**: ✅ Spec Complete

---

## Quick Reference

**What**: Core infrastructure - Supabase setup, user authentication, database schema implementation, and Row-Level Security (RLS) policies.

**Why**: Foundation for all features. Every user action requires authentication and secure data storage.

**Dependencies**:
- S-03: Database Schema (defines tables and RLS policies)

**Used By**:
- F-02: Idea Intake Form (creates sessions and ideas)
- F-03: Research Engine (stores research snapshots)
- F-04: MVTA Red Team Simulation (stores damage reports)
- F-06: Interactive Q&A Session (queries session data)
- F-08: Feedback Collection (stores user feedback)
- F-09: Session History (queries user sessions)

**Implementation Status**:
- [ ] PRD documented
- [ ] Technical design complete
- [ ] Tests defined
- [ ] Implementation started
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Deployed to production

---

## Dependencies

### Required System Modules
- [S-03: Database Schema](../system/S-03-database-schema.md) - Complete data model including tables, indexes, RLS policies

### External Services
- **Supabase** - Managed PostgreSQL with built-in auth
  - PostgreSQL 15
  - Supabase Auth (email/password, magic links)
  - Row-Level Security (RLS)
  - Auto-generated REST API

---

## PRD: Product Requirements

### Overview

This feature implements the foundational data layer and user authentication system for Idea War Room. Users must create accounts to save their MVTA analyses, and all data must be secured with proper isolation between users.

**Key Capabilities**:
1. User account creation (email/password)
2. Email verification
3. Login/logout
4. Database schema deployment
5. Row-Level Security enforcement
6. User profile management

### User Flow

**Scenario 1: New User Registration**

**Step 1**: User lands on Idea War Room homepage
- User: Clicks "Sign Up" button
- System: Displays registration form

**Step 2**: User enters credentials
- User: Enters email and password (min 8 characters)
- System: Validates email format and password strength

**Step 3**: Submit registration
- User: Clicks "Create Account"
- System: Creates auth user, sends verification email, creates user_profiles record, redirects to dashboard

**Step 4**: Email verification
- User: Clicks verification link in email
- System: Marks email as verified, allows full access

---

**Scenario 2: Existing User Login**

**Step 1**: User clicks "Log In"
- User: Clicks "Log In" button on homepage
- System: Displays login form

**Step 2**: Enter credentials
- User: Enters email and password
- System: Validates credentials with Supabase Auth

**Step 3**: Successful login
- User: Clicks "Log In"
- System: Issues session token, redirects to dashboard

**Step 4**: Authenticated session
- User: Navigates app with authenticated session
- System: All API requests include auth token, RLS policies enforce data isolation

---

**Scenario 3: Logout**

**Step 1**: User clicks "Log Out"
- User: Clicks "Log Out" in navigation menu
- System: Destroys session token, redirects to homepage

---

### UI Components

**Component 1: SignUp Form**
- **Location**: `/signup` route
- **Purpose**: User registration
- **Elements**:
  - Email input field (type="email", required)
  - Password input field (type="password", min 8 chars, required)
  - Confirm password input field
  - "Create Account" submit button
  - Link to login page ("Already have an account? Log in")
  - Error message display area

**Component 2: Login Form**
- **Location**: `/login` route
- **Purpose**: User authentication
- **Elements**:
  - Email input field
  - Password input field
  - "Log In" submit button
  - "Forgot password?" link
  - Link to signup page ("Don't have an account? Sign up")
  - Error message display area

**Component 3: User Profile Menu**
- **Location**: App navigation bar (top right)
- **Purpose**: User account actions
- **Elements**:
  - User email display
  - "Profile" link
  - "Log Out" button

**Component 4: Protected Route Wrapper**
- **Location**: Wraps all authenticated pages
- **Purpose**: Redirect unauthenticated users to login
- **Elements**:
  - Loading spinner (while checking auth state)
  - Redirect to `/login` if unauthenticated
  - Render children if authenticated

---

### Business Rules

1. **Email Uniqueness**: Email addresses must be unique across all users
2. **Password Strength**: Minimum 8 characters, must include at least one letter and one number
3. **Email Verification**: Users can log in before verification, but certain actions may require verified email (future enhancement)
4. **Session Expiration**: Sessions expire after 7 days of inactivity
5. **Data Isolation**: Users can ONLY access their own sessions, ideas, reports (enforced by RLS)

---

### Acceptance Criteria

- [ ] User can register with email/password
- [ ] System sends verification email after registration
- [ ] User can log in with valid credentials
- [ ] User cannot log in with invalid credentials (clear error message)
- [ ] User can log out and session is destroyed
- [ ] Unauthenticated users are redirected to login page when accessing protected routes
- [ ] Database schema is deployed to Supabase (all 6 tables)
- [ ] RLS policies enforce data isolation (user A cannot query user B's data)
- [ ] User profile is automatically created on signup
- [ ] Password reset flow works (send reset email, user clicks link, sets new password)

---

## Technical Implementation

### API Endpoints

**Endpoint 1: POST /api/auth/signup**

**Purpose**: Create new user account

**Request**:
```typescript
interface SignUpRequest {
  email: string;
  password: string;
}
```

**Response** (Success - 201):
```typescript
interface SignUpResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
  message: string;
}
```

**Response** (Error - 400):
```typescript
interface ErrorResponse {
  error: string;
  code: 'EMAIL_EXISTS' | 'WEAK_PASSWORD' | 'INVALID_EMAIL';
}
```

**Implementation**:
```typescript
// app/api/auth/signup/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: 'SIGNUP_FAILED' },
      { status: 400 }
    );
  }

  // Create user profile (automatic via trigger or manual)
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: data.user!.id,
      email: data.user!.email!,
      full_name: null
    });

  if (profileError) {
    console.error('Profile creation failed:', profileError);
    // User account exists but profile failed - handle in profile route
  }

  return NextResponse.json({
    user: { id: data.user!.id, email: data.user!.email },
    session: data.session,
    message: 'Account created. Please check your email to verify.'
  }, { status: 201 });
}
```

---

**Endpoint 2: POST /api/auth/login**

**Purpose**: Authenticate existing user

**Request**:
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response** (Success - 200):
```typescript
interface LoginResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}
```

**Response** (Error - 401):
```typescript
interface ErrorResponse {
  error: string;
  code: 'INVALID_CREDENTIALS';
}
```

**Implementation**:
```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return NextResponse.json(
      { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
    session: data.session
  });
}
```

---

**Endpoint 3: POST /api/auth/logout**

**Purpose**: Destroy user session

**Request**: No body required

**Response** (Success - 200):
```typescript
interface LogoutResponse {
  message: string;
}
```

**Implementation**:
```typescript
// app/api/auth/logout/route.ts
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });

  await supabase.auth.signOut();

  return NextResponse.json({ message: 'Logged out successfully' });
}
```

---

**Endpoint 4: GET /api/auth/session**

**Purpose**: Get current user session (for client-side auth checks)

**Response** (Success - 200):
```typescript
interface SessionResponse {
  user: {
    id: string;
    email: string;
  } | null;
  session: {
    access_token: string;
  } | null;
}
```

**Implementation**:
```typescript
// app/api/auth/session/route.ts
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();

  return NextResponse.json({
    user: session?.user ?? null,
    session: session
  });
}
```

---

### Database Schema

**See [S-03: Database Schema](../system/S-03-database-schema.md) for complete schema definitions.**

**Tables to Deploy**:
1. `user_profiles` - User account information
2. `sessions` - MVTA analysis sessions
3. `ideas` - Structured ideas (MVTA format)
4. `research_snapshots` - Research results
5. `damage_reports` - MVTA analysis outputs
6. `feedback` - User feedback on reports

**Migration File**: `supabase/migrations/001_initial_schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- (Continue for all 6 tables - see S-03 for full definitions)
```

---

### Frontend Components

**Component 1: SignUpForm**

**File**: `src/components/auth/SignUpForm.tsx`

**Props**: None (standalone component)

**State**:
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);
```

**Example Implementation**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Create Account</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-sm text-center">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          Log in
        </a>
      </p>
    </form>
  );
}
```

---

**Component 2: LoginForm**

**File**: `src/components/auth/LoginForm.tsx`

**Implementation**: Similar to SignUpForm, simplified (no password confirmation)

---

**Component 3: ProtectedRoute**

**File**: `src/components/auth/ProtectedRoute.tsx`

**Props**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Example Implementation**:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
```

---

### State Management

**Auth Context**:
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Tests

### Tier 1 Critical Path Test

**Test Name**: `User Signup and Login - Happy Path`

**Description**: Verify that a user can create an account, log in, and access protected resources with proper data isolation.

**Preconditions**:
- Database is empty (no existing user with test email)
- Supabase is running and accessible

**Steps**:
1. Navigate to `/signup`
2. Enter email: `test@example.com`, password: `password123`
3. Submit signup form
4. Verify account created (check user_profiles table)
5. Log out
6. Navigate to `/login`
7. Enter same credentials
8. Submit login form
9. Verify redirect to `/dashboard`
10. Verify user session exists
11. Create a test session (POST /api/sessions)
12. Verify session is saved with correct user_id
13. Query sessions as different user (should return empty)

**Expected Results**:
- Signup succeeds with 201 status
- user_profiles record exists with matching email
- Login succeeds with 200 status
- Session token is valid
- Protected route is accessible
- RLS policy prevents cross-user data access

**Failure Impact**: ❌ **BLOCKS DEPLOYMENT** (Tier 1 tests must pass)

---

### E2E Tests

**Test 1: User Registration Flow**
```typescript
import { test, expect } from '@playwright/test';

test('User can register with email and password', async ({ page }) => {
  // Arrange
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecurePass123';

  // Act
  await page.goto('/signup');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[id="password"]', testPassword);
  await page.fill('input[id="confirm-password"]', testPassword);
  await page.click('button[type="submit"]');

  // Assert
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});

test('Registration fails with weak password', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[id="password"]', 'weak');
  await page.fill('input[id="confirm-password"]', 'weak');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=/password must be at least 8 characters/i')).toBeVisible();
});
```

**Test 2: Login Flow**
```typescript
test('User can log in with valid credentials', async ({ page }) => {
  // Precondition: User exists (use test fixture)
  const testEmail = 'existing@example.com';
  const testPassword = 'password123';

  await page.goto('/login');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});

test('Login fails with invalid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'wrong@example.com');
  await page.fill('input[type="password"]', 'wrongpass');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=/invalid email or password/i')).toBeVisible();
});
```

**Test 3: Protected Route Redirect**
```typescript
test('Unauthenticated user redirected to login', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL('/login');
});
```

---

### Integration Tests

**Test 1: Signup API Endpoint**
```typescript
import { describe, it, expect } from 'vitest';

describe('POST /api/auth/signup', () => {
  it('should create user and profile', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePass123'
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('email');
    expect(data.session).toHaveProperty('access_token');
  });

  it('should reject duplicate email', async () => {
    const email = 'duplicate@example.com';

    // Create first user
    await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' })
    });

    // Try to create duplicate
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/already exists|duplicate/i);
  });
});
```

**Test 2: RLS Policy Enforcement**
```typescript
describe('RLS Policy Enforcement', () => {
  it('should prevent user A from accessing user B data', async () => {
    // Create two users
    const userA = await createTestUser('userA@example.com');
    const userB = await createTestUser('userB@example.com');

    // User A creates a session
    const sessionA = await createTestSession(userA.id);

    // User B tries to query User A's session
    const supabaseB = createSupabaseClient(userB.session.access_token);
    const { data, error } = await supabaseB
      .from('sessions')
      .select('*')
      .eq('id', sessionA.id);

    expect(data).toHaveLength(0); // RLS blocks access
  });
});
```

---

### Unit Tests

**Test 1: Password Validation**
```typescript
import { validatePassword } from '@/lib/auth/validation';

describe('Password Validation', () => {
  it('should reject passwords < 8 characters', () => {
    expect(validatePassword('short')).toBe(false);
  });

  it('should accept passwords >= 8 characters', () => {
    expect(validatePassword('password123')).toBe(true);
  });
});
```

---

## Notes

### Future Enhancements

- **OAuth Providers**: Add Google, GitHub OAuth for easier signup
- **Two-Factor Authentication**: Optional 2FA for enhanced security
- **Password Reset**: Email-based password reset flow
- **Email Verification Required**: Block certain actions until email verified
- **Account Deletion**: Allow users to delete their accounts and all data
- **Profile Customization**: Allow users to set display name, avatar

### Known Limitations

- Email verification is sent but not enforced (users can use app without verifying)
- No rate limiting on signup/login endpoints (vulnerable to brute force)
- Sessions expire after 7 days (not configurable in MVP)
- No admin panel for user management

### References

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js App Router Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

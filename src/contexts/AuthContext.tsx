'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType } from '@/types/auth';

/**
 * Authentication Context
 *
 * Provides global authentication state and functions to all components.
 */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 *
 * Wraps the app and provides authentication state.
 * Fetches user session on mount and provides signOut function.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if running in mock mode
  const isMockMode = process.env.NEXT_PUBLIC_AUTH_MODE === 'mock';

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out (mock mode only) - clears session and redirects to mock login
  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/api/auth/mock/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigate back to parent website (production mode)
  // Clears session cookie before redirecting
  const goToParent = async () => {
    try {
      // Clear session cookie first
      // Use redirect: 'manual' to prevent fetch from following the redirect (which causes CORS error)
      await fetch('/api/auth/logout', { method: 'POST', redirect: 'manual' });
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
    // Redirect to parent site regardless of logout success
    const parentHomeUrl = process.env.NEXT_PUBLIC_PARENT_HOME_URL || '/';
    window.location.href = parentHomeUrl;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isMockMode, signOut, goToParent }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 *
 * Access authentication state and functions from any component.
 * Must be used within AuthProvider.
 *
 * @example
 * const { user, isLoading, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SessionCard from './components/SessionCard';
import EmptyState from './components/EmptyState';

/**
 * Dashboard Page
 *
 * Protected route that displays user information and provides access to main features.
 * Redirects to login if not authenticated.
 */
export default function Dashboard() {
  const { user, isLoading, isMockMode, signOut, goToParent } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      const loginUrl =
        process.env.NEXT_PUBLIC_AUTH_MODE === 'mock'
          ? '/api/auth/mock/login'
          : process.env.NEXT_PUBLIC_PARENT_LOGIN_URL || '/';
      router.push(loginUrl);
    }
  }, [user, isLoading, router]);

  // Fetch sessions when user is loaded
  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/sessions');
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleNewAnalysis = async () => {
    const res = await fetch('/api/sessions/create', { method: 'POST' });
    const data = await res.json();
    router.push(`/analyze/${data.session_id}/intake`);
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Dev Mode Warning Banner */}
      {process.env.NEXT_PUBLIC_AUTH_MODE === 'mock' && (
        <div className="bg-severity-3-bg border-b-2 border-severity-3-significant px-4 py-2 text-center text-sm">
          <span className="font-semibold">⚠️ Dev Mode Active</span>
          <span className="text-text-secondary ml-2">
            Mock authentication is enabled
          </span>
        </div>
      )}

      {/* Header */}
      <header className="bg-bg-primary border-b border-border-light">
        <div className="max-w-container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Idea War Room
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Multi-Vector Threat Analysis Platform
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm font-medium text-text-primary">
                  {user.name}
                </div>
                <div className="text-xs text-text-secondary">{user.email}</div>
              </div>
              {isMockMode ? (
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-medium rounded-lg hover:border-border-dark transition-colors"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={goToParent}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-medium rounded-lg hover:border-border-dark transition-colors"
                >
                  Back to Home
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-container mx-auto px-8 py-12">
        <div className="bg-bg-primary rounded-lg shadow-card p-8 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Welcome to Idea War Room
          </h2>
          <p className="text-text-secondary mb-6">
            Ready to stress-test your startup idea? Start a new analysis session to get
            evidence-backed adversarial insights in 30-45 minutes.
          </p>

          <button
            className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50"
            onClick={handleNewAnalysis}
          >
            Start New Analysis
          </button>
        </div>

        {/* Recent Sessions */}
        <div className="bg-bg-primary rounded-lg shadow-card p-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Recent Sessions
          </h3>

          {sessionsLoading ? (
            <p className="text-text-secondary text-sm">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <EmptyState onNewAnalysis={handleNewAnalysis} />
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SessionCard from './components/SessionCard';
import EmptyState from './components/EmptyState';
import QuotaDisplay from './components/QuotaDisplay';
import UpgradePrompt from './components/UpgradePrompt';
import { SessionQuota } from '@/types/quota';

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
  const [quota, setQuota] = useState<SessionQuota | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      const loginUrl =
        process.env.NEXT_PUBLIC_AUTH_MODE === 'mock'
          ? '/api/auth/mock/login'
          : process.env.NEXT_PUBLIC_PARENT_LOGIN_URL || '/';
      router.push(loginUrl);
    }
  }, [user, isLoading, router]);

  // Fetch sessions and quota when user is loaded
  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/sessions');
        const data = await res.json();
        setSessions(data.sessions || []);
        if (data.quota) {
          setQuota(data.quota);
        }
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
    setCreateError(null);

    const res = await fetch('/api/sessions/create', { method: 'POST' });
    const data = await res.json();

    // Handle quota exceeded response from server
    if (res.status === 403 && data.code === 'QUOTA_EXCEEDED') {
      setQuota(data.quota);
      return;
    }

    if (!res.ok) {
      setCreateError(data.error || 'Failed to create session');
      return;
    }

    router.push(`/analyze/${data.session_id}/intake`);
  };

  const isCreateDisabled = quota?.isLimitReached || false;

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
        {/* Upgrade Prompt - auto show when limit reached */}
        {quota?.isLimitReached && (
          <div className="mb-8">
            <UpgradePrompt quota={quota} />
          </div>
        )}

        <div className="bg-bg-primary rounded-lg shadow-card p-8 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Welcome to Idea War Room
          </h2>

          <p className="text-text-secondary mb-6">
            Ready to stress-test your startup idea? Start a new analysis session
            to get evidence-backed adversarial insights in 30-45 minutes.
          </p>

          {createError && (
            <p className="text-severity-1-catastrophic text-sm mb-4">
              {createError}
            </p>
          )}

          <button
            className={`px-6 py-3 font-semibold rounded-lg transition-colors shadow-sm ${
              isCreateDisabled
                ? 'bg-border-medium text-text-tertiary cursor-not-allowed'
                : 'bg-brand-primary text-white hover:bg-brand-hover'
            }`}
            onClick={handleNewAnalysis}
            disabled={isCreateDisabled}
          >
            Start New Analysis
          </button>

          {/* Remaining sessions hint */}
          {quota && quota.remaining !== null && !isCreateDisabled && (
            <p className="text-text-secondary text-sm mt-3 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {quota.remaining} free {quota.remaining === 1 ? 'session' : 'sessions'} remaining
            </p>
          )}
          {quota && quota.limit === null && (
            <p className="text-text-secondary text-sm mt-3 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Unlimited sessions available
            </p>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-bg-primary rounded-lg shadow-card p-8">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-semibold text-text-primary">
              Recent Sessions
            </h3>
            {quota && (
              <div className="w-48">
                <QuotaDisplay quota={quota} variant="full" />
              </div>
            )}
          </div>

          {sessionsLoading ? (
            <p className="text-text-secondary text-sm">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <EmptyState onNewAnalysis={handleNewAnalysis} quota={quota} />
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

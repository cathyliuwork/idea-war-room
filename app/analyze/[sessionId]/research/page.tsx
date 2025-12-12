'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * Research Page (Simplified MVP)
 *
 * Initiates and displays research phase results.
 * User clicks button to start research, sees loading state, then results summary.
 */

interface ResearchResults {
  research_snapshot_id: string;
  competitors_found: number;
  community_signals_found: number;
  regulatory_signals_found: number;
}

export default function ResearchPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState<ResearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/mock/login');
    }
  }, [user, isLoading, router]);

  const handleStartResearch = async () => {
    setIsResearching(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/research`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Research failed');
      }

      const data = await res.json();
      setResults(data);

      alert(
        `Research complete!\n\n` +
          `✅ Found ${data.competitors_found} competitors\n` +
          `✅ Analyzed ${data.community_signals_found} community discussions\n` +
          `✅ Identified ${data.regulatory_signals_found} regulatory considerations\n\n` +
          `Returning to choice page...`
      );

      // Navigate back to choice page
      router.push(`/analyze/${sessionId}/choice`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsResearching(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-12">
      <div className="max-w-reading mx-auto px-6">
        <div className="bg-bg-primary rounded-lg shadow-card p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Research Phase</h1>
          <p className="text-text-secondary mb-6">
            We'll now research competitors, community discussions, and regulatory context to
            provide evidence-backed analysis. This takes 2-5 minutes.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-severity-1-bg border border-severity-1-catastrophic rounded-lg text-sm text-severity-1-catastrophic">
              {error}
            </div>
          )}

          {!results && (
            <div className="space-y-4">
              <button
                onClick={handleStartResearch}
                className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isResearching}
              >
                {isResearching ? 'Researching... (This may take 2-5 minutes)' : 'Start Research'}
              </button>

              {isResearching && (
                <div className="p-4 bg-brand-light border border-brand-primary rounded-lg">
                  <p className="text-sm text-text-secondary">
                    <strong className="text-text-primary">🔬 Research in progress:</strong>
                    <br />
                    1. Generating targeted research queries...
                    <br />
                    2. Searching for competitors and alternatives...
                    <br />
                    3. Analyzing community discussions and reviews...
                    <br />
                    4. Checking regulatory requirements...
                    <br />
                    5. Synthesizing findings with AI...
                  </p>
                </div>
              )}
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="p-4 bg-brand-light border border-brand-primary rounded-lg">
                <h2 className="font-semibold text-text-primary mb-2">Research Complete! 🎉</h2>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>✅ Found {results.competitors_found} competitors</li>
                  <li>✅ Analyzed {results.community_signals_found} community discussions</li>
                  <li>
                    ✅ Identified {results.regulatory_signals_found} regulatory considerations
                  </li>
                </ul>
              </div>

              <button
                onClick={() => router.push(`/analyze/${sessionId}/analysis`)}
                className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-sm"
              >
                Start MVTA Red Team Analysis
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-brand-light border border-brand-primary rounded-lg">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">💡 MVP Note:</strong> This is a simplified
            version. Full version will show real-time progress updates and display detailed
            research cards as results arrive.
          </p>
        </div>
      </div>
    </div>
  );
}

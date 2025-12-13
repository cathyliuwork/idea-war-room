'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { isValidResearchType, getResearchTypeConfig } from '@/lib/constants/research';

/**
 * Research Page (UPDATED for multi-type support)
 *
 * Initiates and displays research phase results for specific type.
 * Requires ?type=competitor|community|regulatory parameter.
 */

interface ResearchResults {
  research_snapshot_id: string;
  research_type: string;
  results_count: number;
  queries: string[];
}

export default function ResearchPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const sessionId = params.sessionId as string;
  const type = searchParams.get('type');

  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState<ResearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate type parameter
  const isValidType = type && isValidResearchType(type);
  const typeConfig = isValidType ? getResearchTypeConfig(type) : null;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/mock/login');
    }
  }, [user, isLoading, router]);

  const handleStartResearch = async () => {
    if (!type || !isValidType) {
      setError('Invalid or missing research type parameter. Use ?type=competitor|community|regulatory');
      return;
    }

    setIsResearching(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/research?type=${type}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Research failed');
      }

      const data = await res.json();
      setResults(data);

      // Navigate directly to results page (no alert)
      router.push(`/analyze/${sessionId}/research/${type}`);
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

  // Show error if type is invalid
  if (!isValidType) {
    return (
      <div className="min-h-screen bg-bg-secondary py-12">
        <div className="max-w-reading mx-auto px-6">
          <div className="bg-bg-primary rounded-lg shadow-card p-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Invalid Research Type</h1>
            <p className="text-text-secondary mb-6">
              Please select a valid research type from the research types page.
            </p>
            <button
              onClick={() => router.push(`/analyze/${sessionId}/research-choice`)}
              className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors"
            >
              Back to Research Types
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-12">
      <div className="max-w-reading mx-auto px-6">
        <div className="bg-bg-primary rounded-lg shadow-card p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {typeConfig?.icon} {typeConfig?.label}
          </h1>
          <p className="text-text-secondary mb-6">
            {typeConfig?.description} This takes 1-3 minutes.
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
                    2. {type === 'competitor' && 'Searching for competitors and alternatives...'}
                    {type === 'community' && 'Analyzing community discussions and reviews...'}
                    {type === 'regulatory' && 'Checking regulatory requirements...'}
                    <br />
                    3. Synthesizing findings with AI...
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

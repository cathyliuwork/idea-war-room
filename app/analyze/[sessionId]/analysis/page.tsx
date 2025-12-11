'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * Analysis Page (MVTA Red Team Simulation)
 *
 * Executes MVTA analysis and shows loading state.
 * On completion, navigates to report page (F-05 - not yet implemented).
 */

interface AnalysisResults {
  damage_report_id: string;
  vulnerabilities_count: number;
  cascading_failures_count: number;
}

export default function AnalysisPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/mock/login');
    }
  }, [user, isLoading, router]);

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/analyze`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json();
      setResults(data);

      alert(
        `MVTA Analysis Complete! 🎯\n\n` +
          `Red Team found:\n` +
          `- ${data.vulnerabilities_count} vulnerabilities across 5 vectors\n` +
          `- ${data.cascading_failures_count} cascading failure chains\n\n` +
          `Navigating to Damage Report...`
      );

      // Navigate to damage report page
      router.push(`/analyze/${sessionId}/report`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsAnalyzing(false);
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
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            MVTA Red Team Analysis
          </h1>
          <p className="text-text-secondary mb-6">
            Our AI red team will now attack your idea from 5 adversarial perspectives across
            all threat vectors. This takes 2-3 minutes.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-severity-1-bg border border-severity-1-catastrophic rounded-lg text-sm text-severity-1-catastrophic">
              {error}
            </div>
          )}

          {!results && (
            <div className="space-y-4">
              <button
                onClick={handleStartAnalysis}
                className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Red Team is attacking... (2-3 min)' : 'Start MVTA Analysis'}
              </button>

              {isAnalyzing && (
                <div className="p-4 bg-brand-light border border-brand-primary rounded-lg">
                  <p className="text-sm text-text-secondary">
                    <strong className="text-text-primary">🎯 Red Team in progress:</strong>
                    <br />
                    1. Technical Penetration Tester - attacking product integrity...
                    <br />
                    2. Competitor CEO - probing market vulnerabilities...
                    <br />
                    3. Social Critic - examining ethical implications...
                    <br />
                    4. Regulatory Officer - checking compliance gaps...
                    <br />
                    5. Political Strategist - testing narrative weaponization...
                  </p>
                </div>
              )}
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="p-4 bg-brand-light border border-brand-primary rounded-lg">
                <h2 className="font-semibold text-text-primary mb-2">
                  Analysis Complete! 🎯
                </h2>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>✅ Found {results.vulnerabilities_count} vulnerabilities</li>
                  <li>✅ Identified {results.cascading_failures_count} cascading failures</li>
                  <li>✅ Damage report ready for review</li>
                </ul>
              </div>

              <button
                onClick={() => router.push(`/analyze/${sessionId}/report`)}
                className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-sm"
              >
                View Damage Report
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-brand-light border border-brand-primary rounded-lg">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">💡 MVP Note:</strong> This is a simplified
            loading screen. Full version will show real-time attack simulation progress with
            animated visuals.
          </p>
        </div>
      </div>
    </div>
  );
}

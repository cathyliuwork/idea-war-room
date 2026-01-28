'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';

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
  const { t } = useTranslation();
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

      // Navigate directly to report page
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
        <div className="text-text-secondary">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-12">
      <div className="max-w-reading mx-auto px-6">
        <div className="bg-bg-primary rounded-lg shadow-card p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {t('analysis.title')} - MVTA
          </h1>
          <p className="text-text-secondary mb-6">
            {t('analysis.analyzingIdea')}
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
                className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? t('analysis.attackingInProgress') : t('analysis.startAnalysis')}
              </button>

              {isAnalyzing && (
                <div className="p-4 bg-brand-light border border-brand-primary rounded-lg">
                  <p className="text-sm text-text-secondary">
                    <strong className="text-text-primary">🎯 {t('analysis.mvtaInProgressTitle')}</strong>
                    <br />
                    {t('analysis.mvtaStep1')}
                    <br />
                    {t('analysis.mvtaStep2')}
                    <br />
                    {t('analysis.mvtaStep3')}
                    <br />
                    {t('analysis.mvtaStep4')}
                    <br />
                    {t('analysis.mvtaStep5')}
                  </p>
                </div>
              )}
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="p-4 bg-brand-light border border-brand-primary rounded-lg">
                <h2 className="font-semibold text-text-primary mb-2">
                  {t('analysis.analysisCompleteTitle')} 🎯
                </h2>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>✅ {t('analysis.foundVulnerabilities').replace('{count}', String(results.vulnerabilities_count))}</li>
                  <li>✅ {t('analysis.identifiedCascadingFailures').replace('{count}', String(results.cascading_failures_count))}</li>
                  <li>✅ {t('analysis.damageReportReady')}</li>
                </ul>
              </div>

              <button
                onClick={() => router.push(`/analyze/${sessionId}/report`)}
                className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-xs"
              >
                {t('analysis.viewDamageReport')}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-brand-light border border-brand-primary rounded-lg">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">💡 {t('analysis.mvpNoteTitle')}</strong> {t('analysis.mvpNoteContent')}
          </p>
        </div>
      </div>
    </div>
  );
}

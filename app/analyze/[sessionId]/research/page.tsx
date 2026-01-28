'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { isValidResearchType, getResearchTypeConfig } from '@/lib/constants/research';
import { useTranslation } from '@/i18n';

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
  const { t } = useTranslation();

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
      // Check if there are saved queries from a retry
      const storageKey = `retry_queries_${sessionId}_${type}`;
      const savedQueries = localStorage.getItem(storageKey);
      let reuseQueries = null;

      if (savedQueries) {
        try {
          reuseQueries = JSON.parse(savedQueries);
          console.log(`♻️ Reusing ${reuseQueries.length} queries from previous attempt`);
        } catch (e) {
          console.error('Failed to parse saved queries:', e);
        }
      }

      // Make API call with optional reuse_queries
      const res = await fetch(`/api/sessions/${sessionId}/research?type=${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: reuseQueries ? JSON.stringify({ reuse_queries: reuseQueries }) : undefined,
      });

      // Clear saved queries after use
      if (savedQueries) {
        localStorage.removeItem(storageKey);
        console.log('🗑️ Cleared saved queries from localStorage');
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Research failed');
      }

      const data = await res.json();
      setResults(data);

      // Navigate directly to results page
      router.push(`/analyze/${sessionId}/research/${type}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsResearching(false);
    }
  };

  // Auto-start research if this is a retry (has saved queries)
  useEffect(() => {
    if (!isLoading && user && sessionId && type && isValidType) {
      const storageKey = `retry_queries_${sessionId}_${type}`;
      const savedQueries = localStorage.getItem(storageKey);

      if (savedQueries && !isResearching && !results && !error) {
        console.log('🔄 Auto-starting research from retry');
        handleStartResearch();
      }
    }
  }, [isLoading, user, sessionId, type, isValidType]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">{t('common.loading')}</div>
      </div>
    );
  }

  // Show error if type is invalid
  if (!isValidType) {
    return (
      <div className="min-h-screen bg-bg-secondary py-12">
        <div className="max-w-reading mx-auto px-6">
          <div className="bg-bg-primary rounded-lg shadow-card p-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">{t('research.invalidType')}</h1>
            <p className="text-text-secondary mb-6">
              {t('research.invalidTypeMessage')}
            </p>
            <button
              onClick={() => router.push(`/analyze/${sessionId}/research-choice`)}
              className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors"
            >
              {t('research.backToResearchTypes')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get step 2 text based on research type
  const getStep2Text = () => {
    if (type === 'competitor') return t('research.researchStep2Competitor');
    if (type === 'community') return t('research.researchStep2Community');
    if (type === 'regulatory') return t('research.researchStep2Regulatory');
    return '';
  };

  return (
    <div className="min-h-screen bg-bg-secondary py-12">
      <div className="max-w-reading mx-auto px-6">
        <div className="bg-bg-primary rounded-lg shadow-card p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {typeConfig?.icon} {t(`research.types.${type}.label`)}
          </h1>
          <p className="text-text-secondary mb-6">
            {t(`research.types.${type}.description`)}
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
                className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isResearching}
              >
                {isResearching ? t('research.researching') : t('research.startResearch')}
              </button>

              {isResearching && (
                <div className="p-4 bg-brand-light border border-brand-primary rounded-lg">
                  <p className="text-sm text-text-secondary">
                    <strong className="text-text-primary">🔬 {t('research.researchInProgressTitle')}</strong>
                    <br />
                    {t('research.researchStep1')}
                    <br />
                    {getStep2Text()}
                    <br />
                    {t('research.researchStep3')}
                  </p>
                </div>
              )}
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="p-4 bg-brand-light border border-brand-primary rounded-lg">
                <h2 className="font-semibold text-text-primary mb-2">{t('research.researchCompleteTitle')} 🎉</h2>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>✅ {t(`research.types.${type}.label`)}: {t('research.foundResults', { count: results.results_count })}</li>
                  <li>✅ {t('research.generatedQueries', { count: results.queries.length })}</li>
                  <li>✅ {t('research.analysisDataReady')}</li>
                </ul>
              </div>

              <button
                onClick={() => router.push(`/analyze/${sessionId}/research/${type}`)}
                className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-xs"
              >
                {t('research.viewResults')}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-brand-light border border-brand-primary rounded-lg">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">💡 {t('research.mvpNoteTitle')}</strong> {t('research.mvpNoteContent')}
          </p>
        </div>
      </div>
    </div>
  );
}

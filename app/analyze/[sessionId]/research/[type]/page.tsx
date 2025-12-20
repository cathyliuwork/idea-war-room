'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  isValidResearchType,
  getResearchTypeConfig,
  ResearchType,
} from '@/lib/constants/research';
import { useTranslation } from '@/i18n';

/**
 * Research Results Page (Dynamic Route)
 *
 * Generic results viewer for any research type
 * Route: /analyze/[sessionId]/research/[type]
 *
 * Supports all current and future research types without code changes
 */

interface ResearchSnapshot {
  research_snapshot_id: string;
  research_type: string;
  queries: string[];
  results: any[];
  created_at: string;
  possibly_failed?: boolean;
}

export default function ResearchResultsPage() {
  const { t, language } = useTranslation();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const type = params.type as string;

  const [snapshot, setSnapshot] = useState<ResearchSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  // Validate research type
  const isValid = isValidResearchType(type);
  const config = isValid ? getResearchTypeConfig(type) : null;

  // Handle retry
  const handleRetry = async () => {
    if (!sessionId || !type) return;

    setIsRetrying(true);
    setError(null);

    try {
      // 1. First, read the existing queries before deleting
      const response = await fetch(
        `/api/sessions/${sessionId}/research/${type}`
      );

      if (response.ok) {
        const data = await response.json();
        // Save queries to localStorage for reuse
        if (data.queries && data.queries.length > 0) {
          localStorage.setItem(
            `retry_queries_${sessionId}_${type}`,
            JSON.stringify(data.queries)
          );
          console.log(`💾 Saved ${data.queries.length} queries for retry`);
        }
      }

      // 2. Delete the failed snapshot
      await fetch(`/api/sessions/${sessionId}/research/${type}`, {
        method: 'DELETE',
      });

      // 3. Redirect to execution page to run research again
      router.push(`/analyze/${sessionId}/research?type=${type}`);
    } catch (err) {
      console.error('Error retrying research:', err);
      setError('Failed to retry. Please try again.');
      setIsRetrying(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/mock/login');
    }
  }, [user, isLoading, router]);

  // Fetch research results
  useEffect(() => {
    async function fetchResults() {
      if (!sessionId || !isValid) return;

      try {
        setIsLoadingData(true);

        const res = await fetch(
          `/api/sessions/${sessionId}/research/${type}`
        );

        if (res.status === 404) {
          setError('No research results found for this type');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to fetch research results');
        }

        const data = await res.json();
        setSnapshot(data);
      } catch (err) {
        console.error('Error fetching research results:', err);
        setError((err as Error).message);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchResults();
  }, [sessionId, type, isValid]);

  // Get localized label for research type
  const getLocalizedLabel = (researchType: string) => {
    return t(`research.types.${researchType}.label`);
  };

  const getLocalizedDescription = (researchType: string) => {
    return t(`research.types.${researchType}.description`);
  };

  // Invalid type
  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            {t('research.invalidType')}
          </h2>
          <p className="text-text-secondary mb-6">
            {t('research.typeNotRecognized').replace('{type}', type)}
          </p>
          <button
            onClick={() =>
              router.push(`/analyze/${sessionId}/research-choice`)
            }
            className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors"
          >
            {t('research.backToResearchTypes')}
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">{t('research.loadingResults')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            {error.includes('not found')
              ? t('research.noResultsFound')
              : t('research.errorLoadingResults')}
          </h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() =>
                router.push(`/analyze/${sessionId}/research?type=${type}`)
              }
              className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors"
            >
              {t('research.runResearch')}
            </button>
            <button
              onClick={() =>
                router.push(`/analyze/${sessionId}/research-choice`)
              }
              className="px-6 py-3 border border-border-medium text-text-primary rounded-lg hover:border-border-dark transition-colors"
            >
              {t('research.backToResearchTypes')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No snapshot
  if (!snapshot) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {config?.icon} {getLocalizedLabel(type)} {t('research.results')}
              </h1>
              <p className="text-text-secondary">{getLocalizedDescription(type)}</p>
            </div>
            <button
              onClick={() =>
                router.push(`/analyze/${sessionId}/research-choice`)
              }
              className="px-6 py-3 border border-border-medium text-text-primary rounded-lg hover:border-border-dark transition-colors"
            >
              {t('research.backToResearchPage')}
            </button>
          </div>

          {/* Metadata */}
          <div className="bg-surface-elevated border border-border-light rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              {t('research.completedOn')}{' '}
              <span className="font-semibold text-text-primary">
                {new Date(snapshot.created_at).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
              </span>
            </div>
            <div className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">
                {snapshot.results.length}
              </span>{' '}
              {t('research.resultsFound')}
            </div>
          </div>
        </div>

        {/* Queries Used */}
        <details className="mb-8 bg-surface-elevated border border-border-light rounded-lg">
          <summary className="px-6 py-4 cursor-pointer font-semibold text-text-primary hover:bg-surface-base transition-colors">
            📋 {t('research.searchQueriesUsed')} ({snapshot.queries.length})
          </summary>
          <div className="px-6 pb-4 space-y-2">
            {snapshot.queries.map((query, index) => (
              <div
                key={index}
                className="bg-surface-base border border-border-light rounded px-4 py-2 text-sm text-text-secondary"
              >
                {index + 1}. {query}
              </div>
            ))}
          </div>
        </details>

        {/* Results */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            {t('research.researchResults')}
          </h2>

          {snapshot.results.length === 0 ? (
            <div className="bg-surface-elevated border border-border-light rounded-lg p-12 text-center">
              {snapshot.possibly_failed ? (
                // Synthesis likely failed - show retry option
                <>
                  <div className="mb-6">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                      {t('research.researchMayHaveFailed')}
                    </h3>
                    <p className="text-text-secondary mb-4">
                      {t('research.researchFailedDesc')}
                    </p>
                  </div>
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRetrying ? t('research.retrying') : t('research.retryResearch')}
                  </button>
                </>
              ) : (
                // Legitimate empty results (rare)
                <>
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-text-secondary">
                    {t('research.noResultsForType')}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {snapshot.results.map((result, index) => (
                <ResultCard
                  key={index}
                  result={result}
                  type={type as ResearchType}
                  index={index}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Generic Result Card Component
 * Renders different layouts based on research type
 */
function ResultCard({
  result,
  type,
  index,
  t,
}: {
  result: any;
  type: ResearchType;
  index: number;
  t: (key: string) => string;
}) {
  // Type-specific rendering
  switch (type) {
    case 'competitor':
      return <CompetitorCard result={result} index={index} t={t} />;
    case 'community':
      return <CommunityCard result={result} index={index} t={t} />;
    case 'regulatory':
      return <RegulatoryCard result={result} index={index} t={t} />;
    default:
      // Fallback for future types: generic JSON display
      return <GenericCard result={result} index={index} t={t} />;
  }
}

function CompetitorCard({ result, index, t }: { result: any; index: number; t: (key: string) => string }) {
  return (
    <div className="bg-surface-elevated border border-border-light rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-text-primary">
            {result.name || `${t('research.types.competitor.label')} ${index + 1}`}
          </h3>
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-primary hover:underline"
            >
              {result.url}
            </a>
          )}
        </div>
      </div>

      {result.summary && (
        <p className="text-sm text-text-secondary mb-4">{result.summary}</p>
      )}

      {result.pricing && (
        <p className="text-sm text-text-secondary mb-4">
          <strong>{t('research.pricing')}:</strong> {result.pricing}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {result.strengths && result.strengths.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-600 mb-2">
              {t('research.strengths')}:
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              {result.strengths.map((s: string, i: number) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        )}

        {result.weaknesses && result.weaknesses.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-600 mb-2">
              {t('research.weaknesses')}:
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              {result.weaknesses.map((w: string, i: number) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunityCard({ result, index, t }: { result: any; index: number; t: (key: string) => string }) {
  const sentimentColors: Record<string, string> = {
    positive: 'bg-green-500/20 text-green-600',
    negative: 'bg-red-500/20 text-red-600',
    neutral: 'bg-gray-500/20 text-gray-600',
  };

  return (
    <div className="bg-surface-elevated border border-border-light rounded-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-text-primary">
          {result.title || `${t('research.types.community.label')} ${index + 1}`}
        </h3>
        {result.sentiment && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${sentimentColors[result.sentiment] || sentimentColors.neutral}`}
          >
            {result.sentiment}
          </span>
        )}
      </div>

      {result.snippet && (
        <blockquote className="border-l-4 border-brand-primary pl-4 mb-4 italic text-sm text-text-secondary">
          &quot;{result.snippet}&quot;
        </blockquote>
      )}

      {result.source && (
        <p className="text-xs text-text-tertiary mb-2">
          {t('research.source')}: {result.source}
        </p>
      )}

      {result.themes && result.themes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.themes.map((theme: string, i: number) => (
            <span
              key={i}
              className="px-2 py-1 bg-surface-base text-text-secondary text-xs rounded"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {result.url && (
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-primary hover:underline mt-3 inline-block"
        >
          {t('research.viewOriginalDiscussion')} →
        </a>
      )}
    </div>
  );
}

function RegulatoryCard({ result, index, t }: { result: any; index: number; t: (key: string) => string }) {
  return (
    <div className="bg-surface-elevated border border-border-light rounded-lg p-6">
      <h3 className="text-lg font-bold text-text-primary mb-3">
        {result.name || result.regulation || `${t('research.types.regulatory.label')} ${index + 1}`}
      </h3>

      {result.summary && (
        <p className="text-sm text-text-secondary mb-4">{result.summary}</p>
      )}

      {(result.requirements || result.compliance_requirements) && (result.requirements || result.compliance_requirements).length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-text-primary mb-2">
            {t('research.complianceRequirements')}:
          </p>
          <ul className="text-sm text-text-secondary space-y-1">
            {(result.requirements || result.compliance_requirements).map((req: string, i: number) => (
              <li key={i}>• {req}</li>
            ))}
          </ul>
        </div>
      )}

      {result.penalties && (
        <div className="bg-red-50/10 border border-red-500/20 rounded p-3">
          <p className="text-sm font-semibold text-red-600 mb-1">
            {t('research.penaltiesForNonCompliance')}:
          </p>
          <p className="text-sm text-text-secondary">{result.penalties}</p>
        </div>
      )}

      {result.applicability && (
        <p className="text-xs text-text-tertiary mt-3">
          <strong>{t('research.applicability')}:</strong> {result.applicability}
        </p>
      )}
    </div>
  );
}

function GenericCard({ result, index, t }: { result: any; index: number; t: (key: string) => string }) {
  return (
    <div className="bg-surface-elevated border border-border-light rounded-lg p-6">
      <h3 className="text-lg font-bold text-text-primary mb-3">
        {t('research.result')} {index + 1}
      </h3>
      <pre className="text-xs text-text-secondary overflow-auto bg-surface-base rounded p-4">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

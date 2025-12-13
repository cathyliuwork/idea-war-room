'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { RESEARCH_TYPE_CONFIGS, ResearchType } from '@/lib/constants/research';
import ResearchTypeCard from './components/ResearchTypeCard';

/**
 * Research Type Selection Page (F-08: Research Engine)
 *
 * Allows users to select which type of research to conduct.
 * Supports multiple research types per idea - users can run each type independently.
 */

interface ResearchStatus {
  [key: string]: {
    completed: boolean;
    snapshot_id?: string;
  };
}

export default function ResearchChoicePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [researchStatus, setResearchStatus] = useState<ResearchStatus>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/mock/login');
    }
  }, [user, isLoading, router]);

  // Fetch research completion status for all types
  useEffect(() => {
    async function fetchResearchStatus() {
      if (!sessionId) return;

      try {
        setIsLoadingData(true);

        const res = await fetch(`/api/sessions/${sessionId}/research/status`);
        if (!res.ok) {
          throw new Error('Failed to fetch research status');
        }

        const data = await res.json();
        setResearchStatus(data.available_types || {});
      } catch (err) {
        console.error('Error fetching research status:', err);
        setError((err as Error).message);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchResearchStatus();
  }, [sessionId]);

  // Handle card click
  const handleCardClick = (type: ResearchType) => {
    const typeStatus = researchStatus[type];

    if (typeStatus?.completed) {
      // Navigate to dynamic results page: /research/[type]
      router.push(`/analyze/${sessionId}/research/${type}`);
    } else {
      // Navigate to research execution page with type parameter
      router.push(`/analyze/${sessionId}/research?type=${type}`);
    }
  };

  // Loading state
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Error</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            onClick={() => router.push(`/analyze/${sessionId}/choice`)}
            className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors"
          >
            Back to Choice Page
          </button>
        </div>
      </div>
    );
  }

  // Calculate completion count
  const completedCount = Object.values(researchStatus).filter(
    (status) => status.completed
  ).length;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Online Research
              </h1>
              <p className="text-text-secondary">
                Select the type of research you want to conduct for your idea.
                You can run multiple types independently.
              </p>
            </div>
            <button
              onClick={() => router.push(`/analyze/${sessionId}/choice`)}
              className="px-6 py-3 border border-border-medium text-text-primary rounded-lg hover:border-border-dark transition-colors flex-shrink-0"
            >
              Back to Idea Page
            </button>
          </div>

          {/* Progress indicator */}
          {completedCount > 0 && (
            <div className="bg-surface-elevated border border-border-light rounded-lg px-4 py-3">
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-brand-primary">
                  {completedCount}
                </span>{' '}
                of {RESEARCH_TYPE_CONFIGS.length} research types completed
              </p>
            </div>
          )}
        </div>

        {/* Research Type Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {RESEARCH_TYPE_CONFIGS.map((config) => (
            <ResearchTypeCard
              key={config.id}
              config={config}
              completed={researchStatus[config.id]?.completed || false}
              onClick={() => handleCardClick(config.id as ResearchType)}
            />
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-surface-elevated border border-border-light rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            💡 How it works
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>• Click on a research type to start gathering intelligence</li>
            <li>• Each research type runs independently (1-3 minutes each)</li>
            <li>
              • You can run one, two, or all three types for your idea
            </li>
            <li>
              • Once completed, click again to view results
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

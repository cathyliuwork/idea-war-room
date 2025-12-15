'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { StructuredIdea } from '@/lib/validation/schemas';
import IdeaSummary from './components/IdeaSummary';
import ActionButtons from './components/ActionButtons';

/**
 * Choice Page (F-03: Idea Analysis Choice Page)
 *
 * Post-intake branching page where users choose between MVTA Analysis or Online Research.
 * Displays idea summary and two independent action buttons.
 */

interface SessionStatus {
  id: string;
  status: string;
  research_completed: boolean;
  analysis_completed: boolean;
  created_at: string;
}

export default function ChoicePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionStatus | null>(null);
  const [idea, setIdea] = useState<StructuredIdea | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/mock/login');
    }
  }, [user, isLoading, router]);

  // Fetch session status and idea data
  useEffect(() => {
    async function fetchData() {
      if (!sessionId) return;

      try {
        setIsLoadingData(true);

        // Fetch session status
        const statusRes = await fetch(`/api/sessions/${sessionId}/status`);
        if (!statusRes.ok) {
          throw new Error('Failed to fetch session status');
        }
        const statusData = await statusRes.json();
        setSession(statusData.session);

        // Fetch idea
        const ideaRes = await fetch(`/api/sessions/${sessionId}/idea`);
        if (!ideaRes.ok) {
          throw new Error('Failed to fetch idea');
        }
        const ideaData = await ideaRes.json();
        setIdea(ideaData.idea.structured_idea);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError((err as Error).message);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [sessionId]);

  // Navigation handlers
  const handleStartResearch = () => {
    // Navigate to research type selection page
    router.push(`/analyze/${sessionId}/research-choice`);
  };

  const handleStartAnalysis = () => {
    router.push(`/analyze/${sessionId}/analysis`);
  };

  const handleViewReport = () => {
    router.push(`/analyze/${sessionId}/report`);
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
  if (error || !session || !idea) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Error</h2>
          <p className="text-text-secondary mb-6">{error || 'Failed to load data'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Choose Your Next Step
            </h1>
            <p className="text-text-secondary">
              Your idea has been saved. Select how you&apos;d like to proceed.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 border border-border-medium text-text-primary rounded-lg hover:border-border-dark transition-colors flex-shrink-0"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Idea Summary */}
        <IdeaSummary
          idea={idea}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />

        {/* Action Buttons */}
        <ActionButtons
          session={session}
          onStartResearch={handleStartResearch}
          onStartAnalysis={handleStartAnalysis}
          onViewReport={handleViewReport}
        />
      </div>
    </div>
  );
}

'use client';

import { useTranslation } from '@/i18n';

interface SessionStatus {
  id: string;
  status: string;
  research_completed: boolean;
  analysis_completed: boolean;
  created_at: string;
}

interface ActionButtonsProps {
  session: SessionStatus;
  onStartResearch: () => void;
  onStartAnalysis: () => void;
  onViewReport: () => void;
  researchCompletedCount: number;
  researchTotalCount: number;
}

/**
 * ActionButtons Component
 *
 * Displays two action cards (MVTA Analysis and Online Research)
 * with dynamic button states based on completion flags.
 */
export default function ActionButtons({
  session,
  onStartResearch,
  onStartAnalysis,
  onViewReport,
  researchCompletedCount,
  researchTotalCount,
}: ActionButtonsProps) {
  const { t } = useTranslation();

  // Research button: label changes based on completion state
  // 0/3: "开始调研", 1-2/3: "继续调研", 3/3: "查看结果"
  const allResearchCompleted = researchCompletedCount === researchTotalCount;
  const someResearchCompleted = researchCompletedCount > 0 && researchCompletedCount < researchTotalCount;
  const noResearchCompleted = researchCompletedCount === 0;

  let researchButtonLabel: string;
  if (allResearchCompleted) {
    researchButtonLabel = t('research.viewResults');
  } else if (someResearchCompleted) {
    researchButtonLabel = t('choice.continueResearch');
  } else {
    researchButtonLabel = t('choice.startResearch');
  }

  const researchBadge = allResearchCompleted
    ? t('choice.completed')
    : someResearchCompleted
      ? `${researchCompletedCount}/${researchTotalCount}`
      : t('choice.notStarted');
  const researchBadgeColor = allResearchCompleted
    ? 'bg-green-100 text-green-800'
    : someResearchCompleted
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-gray-100 text-gray-800';

  // Analysis button label changes based on completion state
  const analysisCompleted = session.analysis_completed;
  const analysisButtonLabel = analysisCompleted ? t('choice.reviewReport') : t('choice.startMvta');
  const analysisBadge = analysisCompleted ? t('choice.completed') : t('choice.notStarted');
  const analysisBadgeColor = analysisCompleted
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';

  // Determine if MVTA should be highlighted (when research is done but MVTA is not)
  const highlightAnalysis = session.research_completed && !session.analysis_completed;

  // Handle MVTA button click - view report if completed, run analysis if not
  const handleAnalysisClick = () => {
    if (analysisCompleted) {
      onViewReport();
    } else {
      onStartAnalysis();
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-8">
      {/* MVTA Analysis Card */}
      <div
        className={`bg-white rounded-lg shadow-md border-2 p-6 transition-all flex flex-col ${
          highlightAnalysis
            ? 'border-brand-primary ring-2 ring-brand-primary ring-opacity-50'
            : 'border-gray-200 hover:border-brand-primary'
        }`}
      >
        <div className="flex items-start mb-4">
          <div className="shrink-0 mr-4">
            <div className="w-12 h-12 bg-brand-light rounded-lg flex items-center justify-center">
              <svg
                className="w-7 h-7 text-brand-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-text-primary mb-2">
              {t('choice.mvtaTitle')}
            </h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${analysisBadgeColor}`}
            >
              {analysisBadge}
            </span>
          </div>
        </div>

        <p className="text-text-secondary mb-6">
          {t('choice.mvtaDesc')}
        </p>

        {/* Main Action Button */}
        <div className="mt-auto">
        <button
          onClick={handleAnalysisClick}
          className="w-full px-6 py-3 rounded-lg font-semibold transition-colors bg-brand-primary text-white hover:bg-brand-hover border-2 border-transparent"
        >
          {analysisButtonLabel}
        </button>

        <p className="mt-3 text-sm text-text-secondary">
          {highlightAnalysis
            ? t('choice.recommendedHint')
            : t('choice.coreFeatureHint')}
        </p>
        </div>
      </div>

      {/* Online Research Card */}
      <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:border-brand-primary p-6 transition-all flex flex-col">
        <div className="flex items-start mb-4">
          <div className="shrink-0 mr-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg
                className="w-7 h-7 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-text-primary mb-2">
              {t('choice.researchTitle')}
            </h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${researchBadgeColor}`}
            >
              {researchBadge}
            </span>
          </div>
        </div>

        <p className="text-text-secondary mb-6">
          {t('choice.researchDesc')}
        </p>

        <div className="mt-auto">
        <button
          onClick={onStartResearch}
          className="w-full px-6 py-3 rounded-lg font-semibold transition-colors bg-white text-brand-primary border-2 border-brand-primary hover:bg-brand-light"
        >
          {researchButtonLabel}
        </button>

        <p className="mt-3 text-sm text-text-secondary">
          {allResearchCompleted
            ? t('choice.viewMoreResearch')
            : someResearchCompleted
              ? t('choice.continueResearchHint')
              : t('choice.optionalResearchHint')}
        </p>
        </div>
      </div>
    </div>
  );
}

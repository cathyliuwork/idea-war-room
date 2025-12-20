'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n';

interface SessionCardProps {
  session: {
    id: string;
    status: 'intake' | 'choice' | 'completed' | 'failed';
    research_completed: boolean;
    analysis_completed: boolean;
    created_at: string;
    high_concept: string;
    is_draft?: boolean;
  };
}

export default function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();
  const { t, language } = useTranslation();

  const getStatusBadge = () => {
    // Draft sessions get special badge
    if (session.is_draft) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          {t('dashboard.draft')}
        </span>
      );
    }

    const statusConfig = {
      intake: { label: t('dashboard.inProgress'), color: 'bg-yellow-100 text-yellow-800' },
      choice: { label: t('dashboard.inProgress'), color: 'bg-blue-100 text-blue-800' },
      completed: { label: t('dashboard.completed'), color: 'bg-green-100 text-green-800' },
      failed: { label: t('common.error'), color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[session.status];
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getActionButton = () => {
    // Draft sessions - Continue to intake
    if (session.is_draft) {
      return (
        <button
          onClick={() => router.push(`/analyze/${session.id}/intake`)}
          className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-hover"
        >
          {t('dashboard.continueAnalysis')}
        </button>
      );
    }

    if (session.status === 'completed') {
      return (
        <button
          onClick={() => router.push(`/analyze/${session.id}/report`)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('dashboard.viewReport')}
        </button>
      );
    }

    if (session.status === 'failed') {
      return (
        <button
          onClick={() => router.push(`/analyze/${session.id}/analysis`)}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          {t('common.retry')}
        </button>
      );
    }

    // intake or choice - Resume button
    const resumePath =
      session.status === 'intake'
        ? `/analyze/${session.id}/intake`
        : `/analyze/${session.id}/choice`;

    return (
      <button
        onClick={() => router.push(resumePath)}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        {t('dashboard.continueAnalysis')}
      </button>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: language !== 'zh',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3
            className={`text-lg font-bold mb-2 ${session.is_draft ? 'text-text-tertiary italic' : ''}`}
          >
            {session.high_concept.length > 100
              ? `${session.high_concept.substring(0, 100)}...`
              : session.high_concept}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{formatDate(session.created_at)}</span>
            {getStatusBadge()}
            {!session.is_draft && session.research_completed && (
              <span className="text-xs text-green-600">✓ Research</span>
            )}
            {!session.is_draft && session.analysis_completed && (
              <span className="text-xs text-green-600">✓ MVTA</span>
            )}
          </div>
        </div>
        <div className="ml-4">{getActionButton()}</div>
      </div>
    </div>
  );
}

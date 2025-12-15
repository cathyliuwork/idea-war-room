'use client';

import { useRouter } from 'next/navigation';

interface SessionCardProps {
  session: {
    id: string;
    status: 'intake' | 'choice' | 'completed' | 'failed';
    research_completed: boolean;
    analysis_completed: boolean;
    created_at: string;
    high_concept: string;
  };
}

export default function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();

  const getStatusBadge = () => {
    const statusConfig = {
      intake: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
      choice: { label: 'Ready', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[session.status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getActionButton = () => {
    if (session.status === 'completed') {
      return (
        <button
          onClick={() => router.push(`/analyze/${session.id}/report`)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View Report
        </button>
      );
    }

    if (session.status === 'failed') {
      return (
        <button
          onClick={() => router.push(`/analyze/${session.id}/analysis`)}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Retry Analysis
        </button>
      );
    }

    // intake or choice - Resume button
    const resumePath = session.status === 'intake'
      ? `/analyze/${session.id}/intake`
      : `/analyze/${session.id}/choice`;

    return (
      <button
        onClick={() => router.push(resumePath)}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        Resume
      </button>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">
            {session.high_concept.length > 100
              ? `${session.high_concept.substring(0, 100)}...`
              : session.high_concept}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{formatDate(session.created_at)}</span>
            {getStatusBadge()}
            {session.research_completed && (
              <span className="text-xs text-green-600">✓ Research</span>
            )}
            {session.analysis_completed && (
              <span className="text-xs text-green-600">✓ MVTA</span>
            )}
          </div>
        </div>
        <div className="ml-4">
          {getActionButton()}
        </div>
      </div>
    </div>
  );
}

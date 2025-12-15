'use client';

interface EmptyStateProps {
  onNewAnalysis: () => void;
}

export default function EmptyState({ onNewAnalysis }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🎯</div>
      <h2 className="text-2xl font-bold mb-2">No analyses yet</h2>
      <p className="text-gray-600 mb-6">Ready to stress-test your first idea?</p>
      <button
        onClick={onNewAnalysis}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Analyze Your First Idea
      </button>
    </div>
  );
}

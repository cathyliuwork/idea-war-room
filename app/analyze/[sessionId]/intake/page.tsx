'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * Idea Intake Page (Simplified MVP)
 *
 * Collects founder's startup idea in a simple textarea format.
 * Full wizard (7 questions) can be added in future iteration.
 */
export default function IntakePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [rawInput, setRawInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/mock/login');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/idea`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit idea');
      }

      const data = await res.json();
      alert('Idea structured successfully! Next: Research phase (F-03)');
      console.log('Structured idea:', data.structured_idea);

      // Navigate back to dashboard for now
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-12">
      <div className="max-w-reading mx-auto px-6">
        <div className="bg-bg-primary rounded-lg shadow-card p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Describe Your Startup Idea
          </h1>
          <p className="text-text-secondary mb-6">
            Tell us about your startup idea. Include the problem you're solving, your target users,
            and what success looks like.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Your Idea (be as detailed as possible)
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                className="w-full h-64 px-4 py-3 border border-border-medium rounded-lg focus:border-brand-primary focus:ring-2 focus:ring-brand-light outline-none transition-colors resize-none text-text-primary"
                placeholder="Example: We're building a platform that helps indie hackers validate their startup ideas through AI-powered adversarial analysis. The problem is that founders spend weeks gathering feedback, only to realize critical flaws too late. Our target users are solopreneurs and early-stage founders. Success in 18 months means 10,000 validated ideas with 70% accuracy on risk prediction..."
                required
                minLength={100}
              />
              <p className="text-xs text-text-tertiary mt-2">
                Minimum 100 characters. Be specific about the problem, solution, target users, and success metrics.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-severity-1-bg border border-severity-1-catastrophic rounded-lg text-sm text-severity-1-catastrophic">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-border-medium text-text-secondary rounded-lg hover:border-border-dark transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || rawInput.length < 100}
              >
                {isSubmitting ? 'Structuring with AI...' : 'Submit & Continue'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 p-4 bg-brand-light border border-brand-primary rounded-lg">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">💡 Tip:</strong> The more detail you provide,
            the better our AI can analyze potential vulnerabilities. Include assumptions, competitive
            landscape, and any unique advantages you have.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import IntakeWizard from './components/IntakeWizard';

/**
 * Idea Intake Page (3-Step Wizard)
 *
 * Collects founder's startup idea through structured form fields.
 * No AI extraction - user directly controls all field content.
 */
export default function IntakePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/mock/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <IntakeWizard sessionId={sessionId} />
    </div>
  );
}

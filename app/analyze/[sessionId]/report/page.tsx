'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Vulnerability, CascadingFailure, VectorSynthesis, Recommendation } from '@/lib/validation/schemas';
import { useTranslation } from '@/i18n';

/**
 * Damage Report Page (F-05)
 *
 * Displays MVTA analysis results with severity-coded vulnerability cards,
 * cascading failures, vector synthesis, and recommendations.
 */

interface DamageReport {
  id: string;
  vulnerabilities: Vulnerability[];
  cascading_failures: CascadingFailure[];
  vector_synthesis: VectorSynthesis[];
  recommendations: Recommendation[];
  created_at: string;
}

const SEVERITY_COLORS = {
  1: { bg: 'bg-severity-1-bg', border: 'border-severity-1-catastrophic', text: 'text-severity-1-catastrophic' },
  2: { bg: 'bg-severity-2-bg', border: 'border-severity-2-critical', text: 'text-severity-2-critical' },
  3: { bg: 'bg-severity-3-bg', border: 'border-severity-3-significant', text: 'text-severity-3-significant' },
  4: { bg: 'bg-severity-4-bg', border: 'border-severity-4-moderate', text: 'text-severity-4-moderate' },
  5: { bg: 'bg-severity-5-bg', border: 'border-severity-5-resilient', text: 'text-severity-5-resilient' },
};

export default function ReportPage() {
  const { t, language } = useTranslation();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [report, setReport] = useState<DamageReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get localized severity labels
  const getSeverityLabel = (score: number) => t(`report.severity.${score}`);

  // Get localized vector names
  const getVectorName = (vector: string) => t(`report.vectors.${vector}`);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/mock/login');
      return;
    }

    if (user) {
      fetchReport();
    }
  }, [user, isLoading]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/report`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load report');
      }
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-severity-1-bg border border-severity-1-catastrophic rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-severity-1-catastrophic mb-2">{t('common.error')}</h2>
          <p className="text-sm text-text-secondary">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors"
          >
            {t('report.backToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const avgScore = report.vector_synthesis.reduce((sum, v) => sum + v.overall_score, 0) / 5;
  const criticalVulns = report.vulnerabilities.filter(v => v.severity_score <= 2).length;

  return (
    <div className="min-h-screen bg-bg-secondary py-12">
      <div className="max-w-container mx-auto px-8">
        {/* Header */}
        <div className="bg-bg-primary rounded-lg shadow-card p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">{t('report.title')}</h1>
              <p className="text-text-secondary">
                {t('report.subtitle')} • {new Date(report.created_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
              </p>
            </div>
            <button
              onClick={() => router.push(`/analyze/${sessionId}/choice`)}
              className="px-6 py-3 border border-border-medium text-text-primary rounded-lg hover:border-border-dark transition-colors shrink-0"
            >
              {t('research.backToIdea')}
            </button>
          </div>

          {/* Executive Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-bg-secondary rounded-lg">
              <div className="text-sm text-text-secondary">{t('report.overallResilience')}</div>
              <div className={`text-2xl font-bold ${SEVERITY_COLORS[Math.round(avgScore) as keyof typeof SEVERITY_COLORS].text}`}>
                {avgScore.toFixed(1)} / 5.0
              </div>
            </div>
            <div className="p-4 bg-bg-secondary rounded-lg">
              <div className="text-sm text-text-secondary">{t('report.vulnerabilitiesFound')}</div>
              <div className="text-2xl font-bold text-text-primary">{report.vulnerabilities.length}</div>
            </div>
            <div className="p-4 bg-bg-secondary rounded-lg">
              <div className="text-sm text-text-secondary">{t('report.criticalCatastrophic')}</div>
              <div className="text-2xl font-bold text-severity-2-critical">{criticalVulns}</div>
            </div>
          </div>
        </div>

        {/* Vector Synthesis */}
        <div className="bg-bg-primary rounded-lg shadow-card p-8 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">{t('report.threatVectorOverview')}</h2>
          <div className="space-y-4">
            {report.vector_synthesis.map((vector) => (
              <div key={vector.vector} className="border-l-4 pl-4" style={{ borderColor: SEVERITY_COLORS[vector.overall_score as keyof typeof SEVERITY_COLORS].border.replace('border-', '') }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-text-primary">{getVectorName(vector.vector)}</h3>
                  <span className={`px-3 py-1 rounded-sm text-sm font-medium ${SEVERITY_COLORS[vector.overall_score as keyof typeof SEVERITY_COLORS].bg} ${SEVERITY_COLORS[vector.overall_score as keyof typeof SEVERITY_COLORS].text}`}>
                    {vector.overall_score} - {getSeverityLabel(vector.overall_score)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{vector.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vulnerabilities by Vector */}
        <div className="bg-bg-primary rounded-lg shadow-card p-8 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">{t('report.vulnerabilities')}</h2>
          <div className="space-y-3">
            {report.vulnerabilities.map((vuln, idx) => {
              const colors = SEVERITY_COLORS[vuln.severity_score as keyof typeof SEVERITY_COLORS];
              return (
                <div key={idx} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-text-primary">{vuln.attack_name}</h3>
                    <span className={`px-2 py-1 rounded-sm text-xs font-medium ${colors.text}`}>
                      {vuln.severity_score} - {getSeverityLabel(vuln.severity_score)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{vuln.rationale}</p>
                  {vuln.recommendation && (
                    <p className="text-sm text-brand-primary">→ {vuln.recommendation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cascading Failures */}
        {report.cascading_failures.length > 0 && (
          <div className="bg-bg-primary rounded-lg shadow-card p-8 mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4">{t('report.cascadingFailures')}</h2>
            <div className="space-y-4">
              {report.cascading_failures.map((cascade, idx) => (
                <div key={idx} className="p-4 bg-severity-2-bg border border-severity-2-critical rounded-lg">
                  <div className="font-semibold text-text-primary mb-2">{t('report.trigger')}: {cascade.trigger}</div>
                  <div className="space-y-1 mb-2">
                    {cascade.chain.map((step, i) => (
                      <div key={i} className="text-sm text-text-secondary pl-4">
                        {i + 1}. {step}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-medium text-severity-1-catastrophic">
                    {t('report.finalImpact')}: {cascade.final_impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-bg-primary rounded-lg shadow-card p-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">{t('report.recommendations')}</h2>
          <div className="space-y-3">
            {report.recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-brand-light border border-brand-primary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-severity-2-bg text-severity-2-critical' :
                    rec.priority === 'medium' ? 'bg-severity-3-bg text-severity-3-significant' :
                    'bg-severity-4-bg text-severity-4-moderate'
                  }`}>
                    {rec.priority.toUpperCase()}
                  </span>
                  <span className="font-semibold text-text-primary">{rec.action}</span>
                </div>
                <p className="text-sm text-text-secondary">{rec.rationale}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

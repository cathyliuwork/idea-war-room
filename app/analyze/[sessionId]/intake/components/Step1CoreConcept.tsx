'use client';

import { UseFormReturn } from 'react-hook-form';
import { StructuredIdea } from '@/lib/validation/schemas';
import { useTranslation } from '@/i18n';

interface Step1CoreConceptProps {
  form: UseFormReturn<StructuredIdea>;
}

export default function Step1CoreConcept({ form }: Step1CoreConceptProps) {
  const { t } = useTranslation();
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const highConcept = watch('high_concept') || '';
  const valueProposition = watch('value_proposition') || '';
  const successMetric = watch('success_metric_18m') || '';

  const getCharCounterColor = (length: number, max: number) => {
    const percentage = (length / max) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-500';
    return 'text-text-tertiary';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t('intake.step1Title')}
        </h2>
        <p className="text-text-secondary">
          {t('intake.step1Desc')}
        </p>
      </div>

      {/* High Concept */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('intake.highConceptLabel')} <span className="text-severity-1-catastrophic">*</span>
        </label>
        <input
          type="text"
          {...register('high_concept')}
          maxLength={150}
          placeholder={t('intake.highConceptPlaceholder')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-light outline-none transition-colors text-text-primary ${
            errors.high_concept
              ? 'border-severity-1-catastrophic'
              : 'border-border-medium focus:border-brand-primary'
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.high_concept && (
            <p className="text-sm text-severity-1-catastrophic">
              {errors.high_concept.message}
            </p>
          )}
          <span className={`text-xs ml-auto ${getCharCounterColor(highConcept.length, 150)}`}>
            {highConcept.length} / 150
          </span>
        </div>
      </div>

      {/* Value Proposition */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('intake.valuePropositionLabel')} <span className="text-severity-1-catastrophic">*</span>
        </label>
        <textarea
          {...register('value_proposition')}
          maxLength={300}
          rows={4}
          placeholder={t('intake.valuePropositionPlaceholder')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-light outline-none transition-colors resize-none text-text-primary ${
            errors.value_proposition
              ? 'border-severity-1-catastrophic'
              : 'border-border-medium focus:border-brand-primary'
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.value_proposition && (
            <p className="text-sm text-severity-1-catastrophic">
              {errors.value_proposition.message}
            </p>
          )}
          <span className={`text-xs ml-auto ${getCharCounterColor(valueProposition.length, 300)}`}>
            {valueProposition.length} / 300
          </span>
        </div>
      </div>

      {/* Success Metric */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('intake.successMetricLabel')} <span className="text-severity-1-catastrophic">*</span>
        </label>
        <input
          type="text"
          {...register('success_metric_18m')}
          maxLength={150}
          placeholder={t('intake.successMetricPlaceholder')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-light outline-none transition-colors text-text-primary ${
            errors.success_metric_18m
              ? 'border-severity-1-catastrophic'
              : 'border-border-medium focus:border-brand-primary'
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.success_metric_18m && (
            <p className="text-sm text-severity-1-catastrophic">
              {errors.success_metric_18m.message}
            </p>
          )}
          <span className={`text-xs ml-auto ${getCharCounterColor(successMetric.length, 150)}`}>
            {successMetric.length} / 150
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { UseFormReturn } from 'react-hook-form';
import { StructuredIdea } from '@/lib/validation/schemas';
import { useTranslation } from '@/i18n';

interface Step2EnvironmentProps {
  form: UseFormReturn<StructuredIdea>;
}

export default function Step2Environment({ form }: Step2EnvironmentProps) {
  const { t } = useTranslation();
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const userPersona = watch('environment.user_persona') || '';
  const competitiveLandscape = watch('environment.competitive_landscape') || '';
  const regulatoryContext = watch('environment.regulatory_context') || '';

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
          {t('intake.step2Title')}
        </h2>
        <p className="text-text-secondary">
          {t('intake.step2Desc')}
        </p>
      </div>

      {/* User Persona */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('intake.userPersonaLabel')} <span className="text-severity-1-catastrophic">*</span>
        </label>
        <textarea
          {...register('environment.user_persona')}
          maxLength={300}
          rows={4}
          placeholder={t('intake.userPersonaPlaceholder')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-light outline-none transition-colors resize-none text-text-primary ${
            errors.environment?.user_persona
              ? 'border-severity-1-catastrophic'
              : 'border-border-medium focus:border-brand-primary'
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.environment?.user_persona && (
            <p className="text-sm text-severity-1-catastrophic">
              {errors.environment.user_persona.message}
            </p>
          )}
          <span className={`text-xs ml-auto ${getCharCounterColor(userPersona.length, 300)}`}>
            {userPersona.length} / 300
          </span>
        </div>
      </div>

      {/* Competitive Landscape */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('intake.competitiveLandscapeLabel')} <span className="text-severity-1-catastrophic">*</span>
        </label>
        <textarea
          {...register('environment.competitive_landscape')}
          maxLength={400}
          rows={5}
          placeholder={t('intake.competitiveLandscapePlaceholder')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-light outline-none transition-colors resize-none text-text-primary ${
            errors.environment?.competitive_landscape
              ? 'border-severity-1-catastrophic'
              : 'border-border-medium focus:border-brand-primary'
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.environment?.competitive_landscape && (
            <p className="text-sm text-severity-1-catastrophic">
              {errors.environment.competitive_landscape.message}
            </p>
          )}
          <span className={`text-xs ml-auto ${getCharCounterColor(competitiveLandscape.length, 400)}`}>
            {competitiveLandscape.length} / 400
          </span>
        </div>
      </div>

      {/* Regulatory Context */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('intake.regulatoryContextLabel')}
        </label>
        <textarea
          {...register('environment.regulatory_context')}
          maxLength={400}
          rows={4}
          placeholder={t('intake.regulatoryContextPlaceholder')}
          className="w-full px-4 py-3 border border-border-medium rounded-lg focus:border-brand-primary focus:ring-2 focus:ring-brand-light outline-none transition-colors resize-none text-text-primary"
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${getCharCounterColor(regulatoryContext.length, 400)}`}>
            {regulatoryContext.length} / 400
          </span>
        </div>
      </div>
    </div>
  );
}

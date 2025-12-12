'use client';

import { UseFormReturn } from 'react-hook-form';
import { StructuredIdea } from '@/lib/validation/schemas';

interface Step1CoreConceptProps {
  form: UseFormReturn<StructuredIdea>;
}

export default function Step1CoreConcept({ form }: Step1CoreConceptProps) {
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

  const fillExample = () => {
    form.setValue('high_concept', 'A platform that helps solo founders validate startup ideas through AI-powered adversarial analysis');
    form.setValue('value_proposition', 'Founders spend weeks gathering feedback, only to realize critical flaws too late. We help solo founders and early-stage entrepreneurs identify risks before investing time and money.');
    form.setValue('success_metric_18m', '10,000 validated ideas with 70% accuracy on risk prediction');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Core Concept
          </h2>
          <p className="text-text-secondary">
            Let's start with the essentials. Describe your idea in a clear and concise way.
          </p>
        </div>
        <button
          type="button"
          onClick={fillExample}
          className="px-4 py-2 text-sm border border-brand-primary text-brand-primary rounded-lg hover:bg-brand-light transition-colors"
        >
          Fill Example
        </button>
      </div>

      {/* High Concept */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Describe your idea in one sentence <span className="text-severity-1-catastrophic">*</span>
        </label>
        <input
          type="text"
          {...register('high_concept')}
          maxLength={150}
          placeholder="A platform that helps solo founders validate startup ideas through AI-powered adversarial analysis"
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
          What problem does this solve, and for whom? <span className="text-severity-1-catastrophic">*</span>
        </label>
        <textarea
          {...register('value_proposition')}
          maxLength={300}
          rows={4}
          placeholder="Founders spend weeks gathering feedback, only to realize critical flaws too late. We help solo founders and early-stage entrepreneurs identify risks before investing time and money."
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
          What does success look like in 18 months? (Be specific and measurable) <span className="text-severity-1-catastrophic">*</span>
        </label>
        <input
          type="text"
          {...register('success_metric_18m')}
          maxLength={150}
          placeholder="10,000 validated ideas with 70% accuracy on risk prediction"
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

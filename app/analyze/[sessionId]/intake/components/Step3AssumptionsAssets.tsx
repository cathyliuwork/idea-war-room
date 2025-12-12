'use client';

import { UseFormReturn } from 'react-hook-form';
import { StructuredIdea } from '@/lib/validation/schemas';
import ArrayFieldInput from './ArrayFieldInput';

interface Step3AssumptionsAssetsProps {
  form: UseFormReturn<StructuredIdea>;
}

export default function Step3AssumptionsAssets({ form }: Step3AssumptionsAssetsProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;

  const marketAssumptions = watch('assumptions.market') || [];
  const technicalAssumptions = watch('assumptions.technical') || [];
  const businessModelAssumptions = watch('assumptions.business_model') || [];
  const keyAssets = watch('assets.key_assets') || [];
  const brandNarrative = watch('assets.brand_narrative') || [];

  const fillExample = () => {
    setValue('assumptions.market', [
      'Solo founders spend 2 hours/day gathering feedback',
      'Founders are willing to pay $20/month for validation tools'
    ], { shouldValidate: true });
    setValue('assumptions.technical', [
      'LLMs can accurately analyze startup ideas with proper prompting'
    ], { shouldValidate: true });
    setValue('assumptions.business_model', [
      'SaaS subscription model works for validation tools',
      'Founders prefer self-service over consulting'
    ], { shouldValidate: true });
    setValue('assets.key_assets', [
      '10 years of experience in AI/ML',
      'Network of 500+ founders for beta testing'
    ], { shouldValidate: true });
    setValue('assets.brand_narrative', [
      'Founded by Y Combinator alumni',
      'Previously built and sold a successful SaaS product'
    ], { shouldValidate: true });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Assumptions & Assets
          </h2>
          <p className="text-text-secondary">
            These fields are optional but help us provide a more comprehensive analysis. Skip any that don't apply.
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

      {/* Assumptions Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-text-primary border-b border-border-medium pb-2">
          Assumptions
        </h3>

        <ArrayFieldInput
          label="Market Assumptions"
          helperText="What are your key assumptions about the target market?"
          maxLength={200}
          placeholder="e.g., Solo founders spend 2 hours/day gathering feedback"
          values={marketAssumptions}
          onChange={(values) => setValue('assumptions.market', values, { shouldValidate: true })}
          error={errors.assumptions?.market?.message}
        />

        <ArrayFieldInput
          label="Technical Assumptions"
          helperText="What technical capabilities or feasibility are you assuming?"
          maxLength={200}
          placeholder="e.g., LLMs can accurately analyze startup ideas"
          values={technicalAssumptions}
          onChange={(values) => setValue('assumptions.technical', values, { shouldValidate: true })}
          error={errors.assumptions?.technical?.message}
        />

        <ArrayFieldInput
          label="Business Model Assumptions"
          helperText="Assumptions about pricing, distribution, or revenue?"
          maxLength={200}
          placeholder="e.g., Users will pay $20/month for validation tools"
          values={businessModelAssumptions}
          onChange={(values) => setValue('assumptions.business_model', values, { shouldValidate: true })}
          error={errors.assumptions?.business_model?.message}
        />
      </div>

      {/* Assets Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-text-primary border-b border-border-medium pb-2">
          Assets & Advantages
        </h3>

        <ArrayFieldInput
          label="Key Assets & Resources"
          helperText="What unique advantages do you have? (Skills, IP, distribution channels, partnerships)"
          maxLength={150}
          placeholder="e.g., 10 years of experience in AI/ML"
          values={keyAssets}
          onChange={(values) => setValue('assets.key_assets', values, { shouldValidate: true })}
          error={errors.assets?.key_assets?.message}
        />

        <ArrayFieldInput
          label="Brand Narrative Strengths"
          helperText="What compelling stories or brand elements do you have?"
          maxLength={150}
          placeholder="e.g., Founded by Y Combinator alumni"
          values={brandNarrative}
          onChange={(values) => setValue('assets.brand_narrative', values, { shouldValidate: true })}
          error={errors.assets?.brand_narrative?.message}
        />
      </div>

      <div className="bg-brand-light border border-brand-primary rounded-lg p-4">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">💡 Tip:</strong> While these fields are optional, providing more detail helps our AI generate a more thorough adversarial analysis.
        </p>
      </div>
    </div>
  );
}

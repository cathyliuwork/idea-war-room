'use client';

import { UseFormReturn } from 'react-hook-form';
import { StructuredIdea } from '@/lib/validation/schemas';
import ArrayFieldInput from './ArrayFieldInput';
import { useTranslation, useLanguage } from '@/i18n';
import { getCharLimits } from '@/lib/validation/char-limits';

interface Step3AssumptionsAssetsProps {
  form: UseFormReturn<StructuredIdea>;
}

export default function Step3AssumptionsAssets({ form }: Step3AssumptionsAssetsProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const limits = getCharLimits(language);
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t('intake.step3Title')}
        </h2>
        <p className="text-text-secondary">
          {t('intake.step3Desc')}
        </p>
      </div>

      {/* Assumptions Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-text-primary border-b border-border-medium pb-2">
          {t('intake.assumptionsTitle')}
        </h3>

        <ArrayFieldInput
          label={t('intake.marketAssumptionsLabel')}
          helperText={t('intake.marketAssumptionsHelper')}
          maxLength={limits.assumptions_item}
          placeholder={t('intake.marketAssumptionsPlaceholder')}
          values={marketAssumptions}
          onChange={(values) => setValue('assumptions.market', values, { shouldValidate: true })}
          error={errors.assumptions?.market?.message}
          addButtonLabel={t('intake.addAnother')}
          noItemsText={t('intake.noItemsYet')}
        />

        <ArrayFieldInput
          label={t('intake.technicalAssumptionsLabel')}
          helperText={t('intake.technicalAssumptionsHelper')}
          maxLength={limits.assumptions_item}
          placeholder={t('intake.technicalAssumptionsPlaceholder')}
          values={technicalAssumptions}
          onChange={(values) => setValue('assumptions.technical', values, { shouldValidate: true })}
          error={errors.assumptions?.technical?.message}
          addButtonLabel={t('intake.addAnother')}
          noItemsText={t('intake.noItemsYet')}
        />

        <ArrayFieldInput
          label={t('intake.businessModelAssumptionsLabel')}
          helperText={t('intake.businessModelAssumptionsHelper')}
          maxLength={limits.assumptions_item}
          placeholder={t('intake.businessModelAssumptionsPlaceholder')}
          values={businessModelAssumptions}
          onChange={(values) => setValue('assumptions.business_model', values, { shouldValidate: true })}
          error={errors.assumptions?.business_model?.message}
          addButtonLabel={t('intake.addAnother')}
          noItemsText={t('intake.noItemsYet')}
        />
      </div>

      {/* Assets Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-text-primary border-b border-border-medium pb-2">
          {t('intake.assetsTitle')}
        </h3>

        <ArrayFieldInput
          label={t('intake.keyAssetsLabel')}
          helperText={t('intake.keyAssetsHelper')}
          maxLength={limits.assets_item}
          placeholder={t('intake.keyAssetsPlaceholder')}
          values={keyAssets}
          onChange={(values) => setValue('assets.key_assets', values, { shouldValidate: true })}
          error={errors.assets?.key_assets?.message}
          addButtonLabel={t('intake.addAnother')}
          noItemsText={t('intake.noItemsYet')}
        />

        <ArrayFieldInput
          label={t('intake.brandNarrativeLabel')}
          helperText={t('intake.brandNarrativeHelper')}
          maxLength={limits.assets_item}
          placeholder={t('intake.brandNarrativePlaceholder')}
          values={brandNarrative}
          onChange={(values) => setValue('assets.brand_narrative', values, { shouldValidate: true })}
          error={errors.assets?.brand_narrative?.message}
          addButtonLabel={t('intake.addAnother')}
          noItemsText={t('intake.noItemsYet')}
        />
      </div>

      <div className="bg-brand-light border border-brand-primary rounded-lg p-4">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">{t('intake.tipTitle')}</strong> {t('intake.tipContent')}
        </p>
      </div>
    </div>
  );
}

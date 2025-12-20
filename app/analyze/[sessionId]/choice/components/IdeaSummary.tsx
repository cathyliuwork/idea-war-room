'use client';

import { StructuredIdea } from '@/lib/validation/schemas';
import { useTranslation } from '@/i18n';

interface IdeaSummaryProps {
  idea: StructuredIdea;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

/**
 * IdeaSummary Component
 *
 * Displays idea summary with collapsible full details.
 * Default: Shows Step 1 fields (high_concept, value_proposition, success_metric)
 * Expanded: Shows all fields from all steps
 */
export default function IdeaSummary({
  idea,
  isExpanded,
  onToggleExpand,
}: IdeaSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
      <h2 className="text-2xl font-bold text-text-primary mb-4">{t('choice.yourIdea')}</h2>

      {/* Step 1 Fields (Always Visible) */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1">
            {t('choice.highConcept')}
          </label>
          <p className="text-text-primary">{idea.high_concept}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1">
            {t('choice.valueProposition')}
          </label>
          <p className="text-text-primary">{idea.value_proposition}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1">
            {t('choice.successMetric18m')}
          </label>
          <p className="text-text-primary">{idea.success_metric_18m}</p>
        </div>
      </div>

      {/* Expandable Section */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
          {/* Step 2: Environment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('choice.businessContext')}
            </h3>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">
                {t('choice.userPersona')}
              </label>
              <p className="text-text-primary">{idea.environment.user_persona}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">
                {t('choice.competitiveLandscape')}
              </label>
              <p className="text-text-primary">
                {idea.environment.competitive_landscape}
              </p>
            </div>

            {idea.environment.regulatory_context && (
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">
                  {t('choice.regulatoryContext')}
                </label>
                <p className="text-text-primary">
                  {idea.environment.regulatory_context}
                </p>
              </div>
            )}
          </div>

          {/* Step 3: Assumptions */}
          {(idea.assumptions.market.length > 0 ||
            idea.assumptions.technical.length > 0 ||
            idea.assumptions.business_model.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {t('choice.assumptions')}
              </h3>

              {idea.assumptions.market.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">
                    {t('choice.marketAssumptions')}
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {idea.assumptions.market.map((item, idx) => (
                      <li key={idx} className="text-text-primary">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {idea.assumptions.technical.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">
                    {t('choice.technicalAssumptions')}
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {idea.assumptions.technical.map((item, idx) => (
                      <li key={idx} className="text-text-primary">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {idea.assumptions.business_model.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">
                    {t('choice.businessModelAssumptions')}
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {idea.assumptions.business_model.map((item, idx) => (
                      <li key={idx} className="text-text-primary">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Assets */}
          {(idea.assets?.key_assets.length > 0 ||
            idea.assets?.brand_narrative.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {t('choice.assetsAdvantages')}
              </h3>

              {idea.assets.key_assets.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">
                    {t('choice.keyAssets')}
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {idea.assets.key_assets.map((item, idx) => (
                      <li key={idx} className="text-text-primary">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {idea.assets.brand_narrative.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">
                    {t('choice.brandNarrativeStrengths')}
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {idea.assets.brand_narrative.map((item, idx) => (
                      <li key={idx} className="text-text-primary">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={onToggleExpand}
        className="mt-6 flex items-center text-brand-primary hover:text-brand-hover font-medium transition-colors"
      >
        <svg
          className={`w-5 h-5 mr-2 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        {isExpanded ? t('choice.showLess') : t('choice.showFullDetails')}
      </button>
    </div>
  );
}

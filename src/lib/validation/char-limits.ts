/**
 * Character Limits Configuration
 *
 * Defines character limits for form fields based on language.
 * Chinese text is more information-dense, so limits are halved.
 */

import type { Language } from '@/i18n';

/**
 * Base limits (for English)
 */
const BASE_LIMITS = {
  high_concept: 1000,
  value_proposition: 2000,
  success_metric_18m: 2000,
  user_persona: 2000,
  competitive_landscape: 2000,
  regulatory_context: 2000,
  assumptions_item: 1000,
  assets_item: 1000,
} as const;

/**
 * Language multipliers
 */
const LANGUAGE_MULTIPLIERS: Record<Language, number> = {
  en: 1,
  zh: 0.5,
};

export type CharLimitKey = keyof typeof BASE_LIMITS;

/**
 * Get character limit for a field based on language
 */
export function getCharLimit(field: CharLimitKey, language: Language): number {
  const baseLimit = BASE_LIMITS[field];
  const multiplier = LANGUAGE_MULTIPLIERS[language] ?? 1;
  return Math.round(baseLimit * multiplier);
}

/**
 * Get all character limits for a language
 */
export function getCharLimits(language: Language) {
  const multiplier = LANGUAGE_MULTIPLIERS[language] ?? 1;
  return {
    high_concept: Math.round(BASE_LIMITS.high_concept * multiplier),
    value_proposition: Math.round(BASE_LIMITS.value_proposition * multiplier),
    success_metric_18m: Math.round(BASE_LIMITS.success_metric_18m * multiplier),
    user_persona: Math.round(BASE_LIMITS.user_persona * multiplier),
    competitive_landscape: Math.round(BASE_LIMITS.competitive_landscape * multiplier),
    regulatory_context: Math.round(BASE_LIMITS.regulatory_context * multiplier),
    assumptions_item: Math.round(BASE_LIMITS.assumptions_item * multiplier),
    assets_item: Math.round(BASE_LIMITS.assets_item * multiplier),
  };
}

/**
 * Hook to get character limits based on current language
 */
export function useCharLimits() {
  // This will be used in components with useLanguage hook
  // Import dynamically to avoid circular dependencies
  const { useLanguage } = require('@/i18n');
  const { language } = useLanguage();
  return getCharLimits(language);
}

/**
 * Maximum limits (for backend validation - use English limits as max)
 */
export const MAX_LIMITS = BASE_LIMITS;

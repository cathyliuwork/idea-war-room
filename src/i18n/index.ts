/**
 * i18n Module Entry Point
 *
 * Re-exports all i18n related functions and types.
 *
 * NOTE: Server-only functions (getLanguage) are in get-language.ts
 * and should be imported directly from '@/i18n/get-language' in Server Components.
 */

// Types
export type { Language, LanguageContextType, Translations } from './types';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './types';

// Client-side context and hooks
export { LanguageProvider, useLanguage, useTranslation } from './context';

// Client-side language detection
export { getLanguageClient, LANGUAGE_COOKIE_NAME } from './get-language-client';

// Constants and sample data
export { SAMPLE_IDEAS, getSampleIdea, SAMPLE_IDEA_NAMES, getSampleIdeaName } from './constants';

// Translation files
import en from './locales/en.json';
import zh from './locales/zh.json';

export const translations = { en, zh } as const;

/**
 * Get translations for a given language
 */
export function getTranslations(language: Language): typeof en {
  return translations[language];
}

// Import Language type for the function signature
import type { Language } from './types';

/**
 * Server-Side Language Detection
 *
 * Reads the language preference from cookies.
 * Used in Server Components and API routes.
 */

import { cookies } from 'next/headers';
import { Language, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './types';

export const LANGUAGE_COOKIE_NAME = 'lang';

/**
 * Get language from cookie (server-side)
 * Returns default language if cookie not set or invalid
 */
export async function getLanguage(): Promise<Language> {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;

    if (lang && SUPPORTED_LANGUAGES.includes(lang as Language)) {
      return lang as Language;
    }
  } catch {
    // cookies() might throw in some contexts, fall back to default
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Check if a string is a valid language code
 */
export function isValidLanguage(lang: string | null | undefined): lang is Language {
  return !!lang && SUPPORTED_LANGUAGES.includes(lang as Language);
}

/**
 * Get language or default if invalid
 */
export function getValidLanguage(lang: string | null | undefined): Language {
  return isValidLanguage(lang) ? lang : DEFAULT_LANGUAGE;
}

// Re-export types for convenience
export type { Language } from './types';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './types';

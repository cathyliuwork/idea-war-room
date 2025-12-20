/**
 * Client-Side Language Detection
 *
 * Reads the language preference from cookies on the client side.
 * Used in Client Components.
 */

import { Language, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './types';

export const LANGUAGE_COOKIE_NAME = 'lang';

/**
 * Get language from cookie (client-side)
 * Returns default language if cookie not set or invalid
 */
export function getLanguageClient(): Language {
  if (typeof document === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === LANGUAGE_COOKIE_NAME) {
        if (value && SUPPORTED_LANGUAGES.includes(value as Language)) {
          return value as Language;
        }
      }
    }
  } catch {
    // Fall back to default
  }

  return DEFAULT_LANGUAGE;
}

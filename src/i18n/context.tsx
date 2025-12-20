'use client';

/**
 * Language Context Provider
 *
 * Provides language and translation function to client components.
 * Language is determined server-side from cookie and passed to this provider.
 */

import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { Language, LanguageContextType, TranslationValue } from './types';

const LanguageContext = createContext<LanguageContextType | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
  language: Language;
  translations: Record<string, TranslationValue>;
}

/**
 * Get nested value from object using dot notation
 * e.g., getValue({ a: { b: 'c' } }, 'a.b') => 'c'
 */
function getValue(obj: Record<string, TranslationValue>, path: string): TranslationValue | undefined {
  const keys = path.split('.');
  let value: TranslationValue | undefined = obj;

  for (const key of keys) {
    if (value === undefined || value === null || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    value = (value as Record<string, TranslationValue>)[key];
  }

  return value;
}

export function LanguageProvider({
  children,
  language,
  translations,
}: LanguageProviderProps) {
  /**
   * Translation function
   * @param key - Dot-notation key (e.g., 'dashboard.welcome')
   * @param params - Optional parameters to interpolate (e.g., { count: 3 })
   * @returns Translated string, or the key if translation not found
   */
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getValue(translations, key);

      // Handle missing translation
      if (value === undefined || value === null) {
        console.warn(`[i18n] Translation missing for key: ${key}`);
        return key;
      }

      // Handle array values (return as JSON for debugging)
      if (Array.isArray(value)) {
        console.warn(`[i18n] Key "${key}" is an array, use direct access instead`);
        return key;
      }

      // Handle object values (should use nested key)
      if (typeof value === 'object') {
        console.warn(`[i18n] Key "${key}" is an object, use nested key instead`);
        return key;
      }

      // Handle string interpolation
      if (typeof value === 'string' && params) {
        return value.replace(/\{(\w+)\}/g, (_, name) => {
          const replacement = params[name];
          return replacement !== undefined ? String(replacement) : `{${name}}`;
        });
      }

      return String(value);
    },
    [translations]
  );

  const contextValue = useMemo(
    () => ({
      language,
      t,
    }),
    [language, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 * Must be used within LanguageProvider
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

/**
 * Hook to get translation function only
 * Shorthand for useLanguage().t
 */
export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}

export default LanguageProvider;

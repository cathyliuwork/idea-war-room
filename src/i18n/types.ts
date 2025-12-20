/**
 * i18n Type Definitions
 *
 * Defines the types for internationalization support.
 */

export type Language = 'en' | 'zh';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'zh'];
export const DEFAULT_LANGUAGE: Language = 'en';

export interface LanguageContextType {
  language: Language;
  t: (key: string, params?: Record<string, string | number>) => string;
}

/**
 * Type for translation files
 * Nested object structure allowing dot-notation access
 */
export type TranslationValue = string | string[] | { [key: string]: TranslationValue };

export interface Translations {
  common: {
    loading: string;
    error: string;
    backToDashboard: string;
    backToHome: string;
    submit: string;
    next: string;
    back: string;
    retry: string;
    cancel: string;
    save: string;
    delete: string;
    confirm: string;
  };
  home: {
    title: string;
    subtitle: string;
    signIn: string;
    authRequired: string;
    footer: string;
    mockLogin: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    welcome: string;
    welcomeDesc: string;
    startNewAnalysis: string;
    recentSessions: string;
    loadingSessions: string;
    noSessions: string;
    logout: string;
    backToParent: string;
    devModeWarning: string;
    mockAuthEnabled: string;
    sessionsRemaining: string;
    unlimitedSessions: string;
    viewReport: string;
    viewDetails: string;
    continueAnalysis: string;
    inProgress: string;
    completed: string;
    draft: string;
  };
  intake: {
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    highConceptLabel: string;
    highConceptPlaceholder: string;
    valuePropositionLabel: string;
    valuePropositionPlaceholder: string;
    successMetricLabel: string;
    successMetricPlaceholder: string;
    userPersonaLabel: string;
    userPersonaPlaceholder: string;
    competitiveLandscapeLabel: string;
    competitiveLandscapePlaceholder: string;
    regulatoryContextLabel: string;
    regulatoryContextPlaceholder: string;
    marketAssumptionsLabel: string;
    marketAssumptionsHelper: string;
    technicalAssumptionsLabel: string;
    businessModelAssumptionsLabel: string;
    keyAssetsLabel: string;
    brandNarrativeLabel: string;
    addItem: string;
    submitAndContinue: string;
    loadExample: string;
    quickExamples: string;
    autoSaveMessage: string;
    required: string;
  };
  choice: {
    title: string;
    subtitle: string;
    mvtaTitle: string;
    mvtaDesc: string;
    researchTitle: string;
    researchDesc: string;
    startMvta: string;
    startResearch: string;
  };
  research: {
    title: string;
    subtitle: string;
    backToIdea: string;
    completedCount: string;
    howItWorks: string;
    howItWorksDesc: string[];
    inProgress: string;
    completed: string;
    notStarted: string;
    viewResults: string;
    startResearch: string;
    types: {
      competitor: {
        label: string;
        description: string;
        shortDesc: string;
      };
      community: {
        label: string;
        description: string;
        shortDesc: string;
      };
      regulatory: {
        label: string;
        description: string;
        shortDesc: string;
      };
    };
  };
  analysis: {
    title: string;
    subtitle: string;
    inProgress: string;
    completed: string;
    runningMvta: string;
    analyzingIdea: string;
  };
  report: {
    title: string;
    subtitle: string;
    overallResilience: string;
    vulnerabilitiesFound: string;
    criticalCatastrophic: string;
    threatVectorOverview: string;
    vulnerabilities: string;
    cascadingFailures: string;
    recommendations: string;
    trigger: string;
    finalImpact: string;
    chain: string;
    severity: Record<string, string>;
    vectors: {
      technical: string;
      market: string;
      social: string;
      legal: string;
      narrative: string;
    };
    exportReport: string;
    backToDashboard: string;
  };
  quota: {
    tiers: Record<string, string>;
    sessionsUsed: string;
    unlimited: string;
    upgrade: string;
  };
  errors: {
    sessionNotFound: string;
    unauthorized: string;
    networkError: string;
    serverError: string;
    validationFailed: string;
  };
}

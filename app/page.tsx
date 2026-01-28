import { getTranslations } from '@/i18n';
import { getLanguage } from '@/i18n/get-language';

export default async function Home() {
  const isMockMode = process.env.AUTH_MODE === 'mock';
  const parentLoginUrl = process.env.NEXT_PUBLIC_PARENT_LOGIN_URL || '/';

  // Get translations
  const language = await getLanguage();
  const t = getTranslations(language);

  // Mock mode: show mock login button
  if (isMockMode) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            {t.home.title}
          </h1>
          <p className="text-lg text-text-secondary mb-8">
            {t.home.subtitle}
          </p>
          <a
            href="/api/auth/mock/login"
            className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors"
          >
            {t.home.mockLogin}
          </a>
        </div>
      </main>
    );
  }

  // JWT mode: show elegant landing page with login button
  return (
    <main className="min-h-screen bg-linear-to-b from-bg-primary to-bg-secondary flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-bg-primary rounded-2xl shadow-card p-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-3">
            {t.home.title}
          </h1>
          <p className="text-text-secondary mb-6">
            {t.home.subtitle}
          </p>

          <a
            href={parentLoginUrl}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-hover transition-colors shadow-xs"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            {t.home.signIn}
          </a>

          <p className="text-sm text-text-secondary mt-4">
            {t.home.authRequired}
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-secondary mt-6">
          {t.home.footer}
        </p>
      </div>
    </main>
  );
}

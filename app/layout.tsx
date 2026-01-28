import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider, getTranslations } from '@/i18n';
import { getLanguage } from '@/i18n/get-language';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Idea War Room',
  description: 'AI-powered Multi-Vector Threat Analysis for startup ideas',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = await getLanguage();
  const translations = getTranslations(language);

  return (
    <html lang={language} className={inter.variable}>
      <body className="font-sans antialiased">
        <LanguageProvider language={language} translations={translations}>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

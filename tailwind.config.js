/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        // Neutrals (90% of UI)
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F9FAFB',
        'bg-tertiary': '#F3F4F6',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',
        'border-light': '#E5E7EB',
        'border-medium': '#D1D5DB',
        'border-dark': '#9CA3AF',

        // Brand Accent (Strategic Use)
        'brand-primary': '#2563EB',
        'brand-hover': '#1D4ED8',
        'brand-light': '#DBEAFE',

        // Severity Scale (MVTA Vulnerability Scoring)
        'severity-1-catastrophic': '#DC2626',
        'severity-1-bg': '#FEE2E2',
        'severity-2-critical': '#EA580C',
        'severity-2-bg': '#FFEDD5',
        'severity-3-significant': '#D97706',
        'severity-3-bg': '#FEF3C7',
        'severity-4-moderate': '#059669',
        'severity-4-bg': '#D1FAE5',
        'severity-5-resilient': '#10B981',
        'severity-5-bg': '#D1FAE5',
      },
      spacing: {
        // Micro spacing (4-8px)
        'micro-1': '4px',
        'micro-2': '8px',
        // Small spacing (12-16px)
        'small-1': '12px',
        'small-2': '16px',
        // Medium spacing (24-32px)
        'medium-1': '24px',
        'medium-2': '32px',
        // Large spacing (40-48px)
        'large-1': '40px',
        'large-2': '48px',
        // XL spacing (64-80px)
        'xl-1': '64px',
        'xl-2': '80px',
        // XXL spacing (96px)
        'xxl': '96px',
      },
      maxWidth: {
        'container': '1280px',
        'reading': '720px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}

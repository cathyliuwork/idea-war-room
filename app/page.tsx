export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          Idea War Room
        </h1>
        <p className="text-lg text-text-secondary mb-8">
          AI-powered Multi-Vector Threat Analysis for startup ideas
        </p>
        <a
          href="/api/auth/mock/login"
          className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors"
        >
          Get Started (Mock Login)
        </a>
      </div>
    </main>
  );
}

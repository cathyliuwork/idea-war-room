import { NextRequest, NextResponse } from 'next/server';
import { getMockUsers, generateMockJWT } from '@/lib/auth/mock';

/**
 * Mock Login Page (Dev Mode Only)
 *
 * Displays list of mock users for development testing.
 * Clicking a user generates a mock JWT and redirects to callback.
 *
 * Security: Returns 403 if AUTH_MODE !== 'mock'
 *
 * GET /api/auth/mock/login
 * GET /api/auth/mock/login?user=<userId>
 */
export async function GET(request: NextRequest) {
  // Security check: Only allow in dev mode
  if (process.env.AUTH_MODE !== 'mock') {
    return NextResponse.json(
      { error: 'Mock authentication is disabled' },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('user');

  const mockUsers = getMockUsers();

  // If user ID provided, generate JWT and redirect to callback
  if (userId) {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const token = generateMockJWT(user);
    return NextResponse.redirect(
      new URL(`/api/auth/callback?token=${token}`, request.url)
    );
  }

  // Display mock user selection page
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mock Login - Dev Mode</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #F9FAFB;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            max-width: 500px;
            width: 100%;
          }
          .warning {
            background: #FEF3C7;
            border: 2px solid #F59E0B;
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 32px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .warning-icon {
            font-size: 24px;
            flex-shrink: 0;
          }
          .warning-text {
            color: #92400E;
            font-size: 14px;
            line-height: 1.5;
          }
          .warning-title {
            font-weight: 600;
            margin-bottom: 4px;
          }
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
            padding: 32px;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
          }
          .subtitle {
            color: #6B7280;
            font-size: 14px;
            margin-bottom: 24px;
          }
          .user-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .user-card {
            display: block;
            padding: 16px 20px;
            border: 2px solid #E5E7EB;
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
          }
          .user-card:hover {
            border-color: #2563EB;
            background: #F9FAFB;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          }
          .user-name {
            color: #111827;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .user-email {
            color: #6B7280;
            font-size: 14px;
          }
          .footer {
            margin-top: 24px;
            text-align: center;
            color: #9CA3AF;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">
              <div class="warning-title">Dev Mode Active</div>
              This is a mock authentication page for development only.
              Do not deploy with AUTH_MODE=mock to production.
            </div>
          </div>

          <div class="card">
            <h1>Select Test User</h1>
            <p class="subtitle">Choose a user to login to Idea War Room</p>

            <div class="user-list">
              ${mockUsers
                .map(
                  (user) => `
                <a href="/api/auth/mock/login?user=${user.id}" class="user-card">
                  <div class="user-name">${user.name}</div>
                  <div class="user-email">${user.email}</div>
                </a>
              `
                )
                .join('')}
            </div>

            <div class="footer">
              Idea War Room • Mock Authentication
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

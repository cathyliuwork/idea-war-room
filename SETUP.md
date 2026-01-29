# Idea War Room - Setup Guide

## Phase 0: Project Setup - ✅ COMPLETED

Congratulations! The foundational setup for the Idea War Room MVP is complete.

### What's Been Set Up

#### 1. ✅ Next.js 16 Project (16.1.6)
- TypeScript configured with strict mode
- Tailwind CSS 4 with complete design system (4.1.18)
- App Router structure
- Environment configuration

#### 2. ✅ Dependencies Installed
**Core:**
- `@supabase/supabase-js@2.38.4` - Database client
- `jsonwebtoken@9.0.2` - JWT authentication
- `zod@3.22.4` - Schema validation
- `react-hook-form@7.48.2` - Form management
- `react-markdown@9.0.1` - Markdown rendering
- `lucide-react@0.292.0` - Icons

**Dev Tools:**
- `vitest@1.0.4` - Unit/integration testing
- `@playwright/test@1.40.1` - E2E testing
- `@testing-library/react@14.1.2` - Component testing
- `eslint`, `prettier` - Code quality

#### 3. ✅ Directory Structure
```
idea-war-room/
├── app/                     # Next.js App Router
│   ├── api/auth/           # Auth endpoints (mock login)
│   ├── api/sessions/       # Session management
│   ├── dashboard/          # User dashboard
│   ├── analyze/            # Analysis flow pages
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── src/
│   ├── components/         # React components
│   ├── lib/               # Utilities (auth, llm, search, supabase)
│   ├── contexts/          # React contexts
│   ├── types/             # TypeScript types
│   └── styles/            # Global styles
├── tests/
│   ├── e2e/               # Playwright E2E tests
│   ├── integration/       # API tests
│   └── setup.ts           # Test configuration
└── supabase/
    └── migrations/        # Database schema
```

#### 4. ✅ Database Schema Ready
- **Complete SQL migration**: `supabase/migrations/001_initial_schema.sql`
- **6 tables**: user_profiles, sessions, ideas, research_snapshots, damage_reports, feedback
- **Custom RLS functions**: get_current_user_id(), set_session_user_id()
- **Row-Level Security**: Enforced on all tables
- **Indexes**: Optimized for performance

#### 5. ✅ Configuration Files
- `.env.local` - Environment variables (needs your Supabase & AI Builders API keys)
- `tailwind.config.js` - Complete design system (severity colors, spacing, fonts)
- `vitest.config.ts` - Unit/integration test configuration
- `playwright.config.ts` - E2E test configuration
- `.eslintrc.json`, `.prettierrc` - Code quality tools

#### 6. ✅ Verification Complete
- ✅ TypeScript type checking passes
- ✅ ESLint passes (no warnings/errors)
- ✅ Next.js builds successfully

---

## Next Steps: Configure External Services

### Step 1: Create Supabase Project (REQUIRED)

1. **Go to** https://supabase.com
2. **Create new project**: "idea-war-room-dev"
3. **Wait** for project initialization (~2 minutes)
4. **Get credentials**:
   - Go to: Project Settings → API
   - Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy **anon public** key
   - Copy **service_role** key (keep secret!)

5. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[your-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=eyJ[your-service-role-key]
   ```

### Step 2: Apply Database Migration

```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref [your-project-ref]

# Apply migration (creates all 6 tables + RLS policies)
supabase db push
```

### Step 3: Configure AI Builders API Key

**Update `.env.local`**:
```bash
AI_BUILDERS_API_KEY=[your-api-key]
```

You already have this key! Just add it to the file.

---

## Development Commands

```bash
# Start development server
pnpm dev
# → http://localhost:3000

# Type checking
pnpm type-check

# Linting
pnpm lint

# Unit/integration tests
pnpm test

# E2E tests (requires dev server running)
pnpm test:e2e

# Build for production
pnpm build
```

---

## Test the Setup

Once you've configured Supabase and AI Builders API:

```bash
# Start dev server
pnpm dev
```

Visit:
- **Landing page**: http://localhost:3000
- **Mock login**: http://localhost:3000/api/auth/mock/login
  - Select "Alice Developer" or "Bob Tester"
  - Should redirect to dashboard (coming in Phase 1: F-01)

---

## What's Next: Phase 1 - F-01 Authentication

Now that the foundation is set up, the next phase is to implement **F-01: External Authentication Integration**.

**What you'll build**:
1. JWT verification and session management
2. User profile creation/update
3. Mock authentication UI (for local testing)
4. Protected routes with RLS enforcement
5. Auth context and hooks

**Estimated time**: 1 week (following feature-by-feature complete approach)

**Success criteria**:
- User can login via mock mode
- Session cookie is set securely
- Dashboard displays authenticated user
- RLS policies enforce data isolation
- All E2E tests pass

---

## File Structure Reference

### Critical Files Created

1. **`supabase/migrations/001_initial_schema.sql`** (520 lines)
   - Complete database schema with RLS

2. **`.env.local`**
   - Environment configuration (needs your API keys)

3. **`tailwind.config.js`**
   - Design system (colors, spacing, typography)

4. **`package.json`**
   - All dependencies and scripts

5. **Testing configs**: `vitest.config.ts`, `playwright.config.ts`

### Key Directories

- **`app/`**: Next.js pages and API routes
- **`src/lib/`**: Utilities (auth, llm, search, supabase)
- **`src/components/`**: React components
- **`tests/`**: Unit, integration, and E2E tests
- **`supabase/migrations/`**: Database schema

---

## Troubleshooting

### "Can't connect to Supabase"
- Check `.env.local` has correct URLs and keys
- Verify Supabase project is active (not paused)
- Run migration: `supabase db push`

### "Build fails"
- Run `pnpm type-check` to see TypeScript errors
- Check all imports use `@/` alias correctly

### "Tests fail"
- Ensure `tests/setup.ts` exists
- Check environment variables in test setup

---

## Project Status

**Phase 0: Project Setup** ✅ **COMPLETE**

**Ready for**: Phase 1 - F-01 Authentication Implementation

**Dependencies installed**: ✅
**Directory structure**: ✅
**Database schema**: ✅
**Configuration**: ✅
**Build verification**: ✅

🎉 **You're ready to start building features!**

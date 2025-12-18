# F-09: Session History

**Version**: 2.1
**Last Updated**: 2025-12-15
**Priority**: MEDIUM
**Status**: ✅ Spec Complete

---

## Quick Reference

**What**: View past MVTA analysis sessions, re-open damage reports, and compare different idea iterations.

**Why**: Founders often iterate on ideas. Session history allows them to track changes, revisit past analyses, and see progress.

**Dependencies**:
- F-01: External Authentication Integration (authenticates user, filters sessions)
- F-02: Idea Intake Form (session creation)
- F-04: MVTA Red Team Simulation (damage reports)
- F-05: Damage Report Display (report viewing)

**Used By**: None (terminal feature)

**Implementation Status**:
- [x] PRD documented
- [x] Technical design complete
- [x] Tests defined
- [x] Implementation started
- [x] Implementation complete
- [ ] Tests passing
- [ ] Deployed to production

---

## Dependencies

### Required Features
- [F-01: External Authentication Integration](./F-01-database-auth.md) - JWT-based user authentication
- [F-02: Idea Intake Form](./F-02-idea-intake-form.md) - Session creation
- [F-04: MVTA Red Team Simulation](./F-04-mvta-red-team-simulation.md) - Reports
- [F-05: Damage Report Display](./F-05-damage-report-display.md) - Report viewing

### Required System Modules
- [S-03: Database Schema](../system/S-03-database-schema.md) - sessions, ideas, damage_reports tables

---

## PRD: Product Requirements

### Overview

The Session History feature provides a chronological list of all MVTA analyses a user has completed. Each session shows:
- **High Concept**: One-sentence idea summary
- **Date**: When analysis was completed
- **Status**: Intake, Choice, Completed, Failed
- **Action**: "View Report" button or "Resume" button depending on status

**Use Cases**:
- **Iterate on Ideas**: Revisit past analyses after pivoting
- **Compare Versions**: See how idea evolved over time
- **Reference Past Work**: Share old reports with new advisors

**Target Location**: Dashboard page (user's first view after login)

**Note on Branching Workflow**:
After completing intake, sessions have status='choice' where users can independently:
- Run online research (sets research_completed=true)
- Run MVTA analysis (sets analysis_completed=true, status='completed')
- Do both in any order

The session history shows completion of both phases independently via completion flags.

---

### User Flow

**Step 1**: User logs in and lands on dashboard
- User: Completes login
- System: Navigates to `/dashboard`
- User: Sees welcome message and session history list

**Step 2**: View session history
- User: Sees list of past sessions (most recent first)
- System: Displays each session as a card:
  - High concept (e.g., "AI email assistant for founders")
  - Date (e.g., "Analyzed 2 days ago")
  - Status badge (Completed, Failed, In Progress)
  - "View Report" button (if completed)

**Step 3**: Open past report
- User: Clicks "View Report" on a completed session
- System: Navigates to `/analyze/[session_id]/report`
- User: Views full damage report

**Step 4**: Start new analysis
- User: Clicks "Analyze New Idea" button at top of dashboard
- System: Creates new session, navigates to intake form

**Step 5**: Resume incomplete session
- User: Sees session with status "In Progress" (status='intake') or "Ready" (status='choice')
- User: Clicks "Resume"
- System: Navigates based on status:
  - status='intake' → `/analyze/[session_id]/intake` (continue filling form)
  - status='choice' → `/analyze/[session_id]/choice` (choose research or MVTA)

---

### UI Components

**Component 1: Dashboard**
- **Location**: `/dashboard` route
- **Purpose**: Overview of all user sessions
- **Elements**:
  - Page title: "Your Idea War Room"
  - "Analyze New Idea" button (prominent, top-right)
  - Session history list (cards)
  - Empty state message (if no sessions yet)

**Component 2: SessionCard**
- **Location**: Inside dashboard session list
- **Purpose**: Display one session summary
- **Elements**:
  - High concept text (truncated to 100 chars)
  - Created date (relative, e.g., "3 days ago")
  - Status badge (Completed/Failed/In Progress)
  - Primary action button:
    - "View Report" (if completed)
    - "Resume" (if in progress)
    - "Retry Analysis" (if failed)

**Component 3: EmptyState**
- **Location**: Dashboard when no sessions exist
- **Purpose**: First-time user onboarding
- **Elements**:
  - Illustration or icon
  - Message: "No analyses yet. Ready to stress-test your first idea?"
  - "Analyze New Idea" button

---

### Business Rules

1. **Sorting**: Sessions sorted by created_at DESC (most recent first)
2. **Pagination**: Show 10 sessions per page (load more button if > 10)
3. **Status Display**:
   - `completed`: Show "View Report" button
   - `choice`: Show "Resume" button (navigates to choice page)
   - `intake`: Show "Resume" button (navigates to intake form)
   - `failed`: Show "Retry Analysis" button
4. **Absolute Dates with Year**: Display full date and time (e.g., "Dec 14, 2024, 10:56 PM") to support cross-year session history
5. **High Concept Truncation**: Max 100 characters (ellipsis if longer)
6. **User Isolation**: Users can only see their own sessions. **CRITICAL**: Service role key bypasses RLS, so queries MUST explicitly filter by `user_id`

---

## Session Quota System

### Overview

Session creation is limited based on membership tier to manage resource usage during beta. Users can see their quota usage on the dashboard and receive prompts to upgrade when limits are reached.

### Quota Rules by Membership Tier

| Member Level | Limit | Description |
|--------------|-------|-------------|
| 0 (Free) | 2 sessions | Lifetime limit |
| 1 (Basic) | 5 sessions | Lifetime limit |
| 2+ (Pro) | Unlimited | No restrictions |

**Note**: `member` level comes from JWT payload during authentication.

### Draft Sessions

Sessions without a completed idea (intake form not submitted) are considered "drafts":

- **Definition**: Session record exists but no associated idea record
- **Counts toward quota**: ✓ Yes
- **Displayed in list**: ✓ Yes, with "Draft" badge
- **Action button**: "Continue" → navigates to `/analyze/[session_id]/intake`
- **Title display**: "Untitled Draft" (italic, muted color)

### Quota Display Components

**1. QuotaDisplay**
- Location: Recent Sessions section header
- Shows progress bar and "SESSION USAGE: X of Y"
- Color changes based on usage:
  - Normal: Blue
  - Near limit (1 remaining): Amber
  - Limit reached: Red

**2. UpgradePrompt**
- Location: Above welcome card (auto-shown when limit reached)
- Amber background with upgrade messaging
- "Upgrade Now" button links to parent site

**3. Remaining Sessions Hint**
- Location: Below "Start New Analysis" button
- Shows "ⓘ X free sessions remaining"
- Hidden when limit reached

### Quota Enforcement

**On Dashboard Load**:
- API returns quota info with session list
- UI displays quota status
- If limit reached: upgrade prompt shown, create button disabled

**On Session Create (POST /api/sessions/create)**:
- Check quota before insert
- If limit exceeded: return 403 with `QUOTA_EXCEEDED` code
- Response includes current quota for UI update

---

### Acceptance Criteria

- [ ] Dashboard displays list of user's past sessions
- [ ] Sessions sorted by most recent first (by created_at DESC)
- [ ] Each session shows high concept, absolute date with year, and status
- [ ] "View Report" button navigates to report page for completed sessions
- [ ] "Resume" button navigates to correct page based on status (intake/choice)
- [ ] "Analyze New Idea" button creates new session
- [ ] Empty state shown for users with no sessions
- [ ] Pagination works for users with > 10 sessions
- [ ] **CRITICAL**: User isolation enforced (users can't see others' sessions)
  - Test by logging in as different users
  - Verify each user only sees their own sessions
  - Verify session counts are per-user, not global

---

## Technical Implementation

### API Endpoints

**Endpoint 1: GET /api/sessions**

**Purpose**: Fetch user's session history

**Query Parameters**:
- `limit`: Number of sessions to return (default: 10)
- `offset`: Pagination offset (default: 0)

**Response** (Success - 200):
```typescript
interface SessionListResponse {
  sessions: Array<{
    id: string;
    status: 'intake' | 'choice' | 'completed' | 'failed';
    research_completed: boolean;
    analysis_completed: boolean;
    created_at: string;
    high_concept: string;
    is_draft: boolean;  // true if no idea submitted yet
  }>;
  total_count: number;
  quota: {
    used: number;
    limit: number | null;  // null = unlimited
    remaining: number | null;
    isLimitReached: boolean;
    memberLevel: number;
  };
}
```

**Implementation**:
```typescript
// app/api/sessions/route.ts
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Use custom auth middleware instead of Supabase Auth
  const { supabase, user } = await createAuthenticatedSupabaseClient();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch sessions with ideas
  // CRITICAL: Service role key bypasses RLS, must explicitly filter by user_id
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      status,
      research_completed,
      analysis_completed,
      created_at,
      ideas!inner(structured_idea)
    `)
    .eq('user_id', user.id)  // CRITICAL: Filter by current user
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count total sessions for current user
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);  // CRITICAL: Filter by current user

  // Format response with smart title generation
  // Note: Supabase join returns ideas as OBJECT (not array) with structure: { structured_idea: {...} }
  const formattedSessions = sessions.map(s => {
    const structuredIdea = s.ideas?.structured_idea;  // Object access, not array[0]

    // Smart title fallback: high_concept → value_proposition → session ID
    let title: string;
    if (structuredIdea?.high_concept) {
      title = structuredIdea.high_concept;
    } else if (structuredIdea?.value_proposition) {
      title = structuredIdea.value_proposition.substring(0, 50) +
              (structuredIdea.value_proposition.length > 50 ? '...' : '');
    } else {
      title = `Idea Analysis [${s.id}]`;  // Full session ID as last resort
    }

    return {
      id: s.id,
      status: s.status,
      research_completed: s.research_completed,
      analysis_completed: s.analysis_completed,
      created_at: s.created_at,
      high_concept: title
    };
  });

  return NextResponse.json({
    sessions: formattedSessions,
    total_count: count || 0
  });
}
```

---

### Frontend Components

**Component 1: DashboardPage**

**File**: `src/app/dashboard/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SessionCard from '@/components/dashboard/SessionCard';

export default function DashboardPage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data.sessions);
      setIsLoading(false);
    };

    fetchSessions();
  }, []);

  const handleNewAnalysis = async () => {
    // Create new session
    const res = await fetch('/api/sessions', { method: 'POST' });
    const data = await res.json();
    router.push(`/analyze/${data.session_id}/intake`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Your Idea War Room</h1>
          <p className="text-gray-600">View past analyses or start a new one</p>
        </div>
        <button
          onClick={handleNewAnalysis}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Analyze New Idea
        </button>
      </div>

      {/* Session List */}
      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold mb-2">No analyses yet</h2>
          <p className="text-gray-600 mb-6">Ready to stress-test your first idea?</p>
          <button
            onClick={handleNewAnalysis}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Analyze Your First Idea
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Component 2: SessionCard**

**File**: `src/components/dashboard/SessionCard.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';

export default function SessionCard({ session }: { session: any }) {
  const router = useRouter();

  const getStatusBadge = () => {
    const statusConfig = {
      intake: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
      choice: { label: 'Ready', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[session.status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getActionButton = () => {
    if (session.status === 'completed') {
      return (
        <button
          onClick={() => router.push(`/analyze/${session.id}/report`)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View Report
        </button>
      );
    }

    if (session.status === 'failed') {
      return (
        <button
          onClick={() => router.push(`/analyze/${session.id}/analysis`)}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Retry Analysis
        </button>
      );
    }

    // intake or choice - Resume button
    const resumePath = session.status === 'intake'
      ? `/analyze/${session.id}/intake`
      : `/analyze/${session.id}/choice`;

    return (
      <button
        onClick={() => router.push(resumePath)}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        Resume
      </button>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Display absolute date with year and time in user's local timezone
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    // Example output: "Dec 14, 2024, 10:56 PM"
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">
            {session.high_concept.length > 100
              ? `${session.high_concept.substring(0, 100)}...`
              : session.high_concept}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{formatDate(session.created_at)}</span>
            {getStatusBadge()}
            {session.research_completed && (
              <span className="text-xs text-green-600">✓ Research</span>
            )}
            {session.analysis_completed && (
              <span className="text-xs text-green-600">✓ MVTA</span>
            )}
          </div>
        </div>
        <div className="ml-4">
          {getActionButton()}
        </div>
      </div>
    </div>
  );
}
```

---

## Security & Data Isolation

### Critical Security Issue: Service Role Key Bypasses RLS

**Problem**: The application uses Supabase Service Role Key for server-side database access, which bypasses Row Level Security (RLS) policies by default.

**Impact**: Without explicit filtering, ALL users would see ALL sessions regardless of ownership.

**Solution**: Every query MUST explicitly filter by `user_id`:

```typescript
// WRONG - Service role key bypasses RLS
const { data } = await supabase
  .from('sessions')
  .select('*');  // Returns ALL sessions for ALL users!

// CORRECT - Explicit user_id filtering
const { data } = await supabase
  .from('sessions')
  .select('*')
  .eq('user_id', user.id);  // Only current user's sessions
```

### Implementation Checklist

For ANY endpoint that queries user data:

- [ ] Call `createAuthenticatedSupabaseClient()` to get authenticated user
- [ ] Verify `user` is not null (return 401 if missing)
- [ ] Add `.eq('user_id', user.id)` to ALL queries that fetch user-scoped data
- [ ] Add `.eq('user_id', user.id)` to count/aggregate queries
- [ ] Test with multiple users to verify isolation

**Testing Multi-User Isolation**:
1. Login as User A, create sessions
2. Logout, login as User B
3. Verify User B does NOT see User A's sessions
4. Create sessions as User B
5. Verify each user only sees their own data

### Supabase Join Behavior

**Important**: Supabase's `.select()` with joins returns different data structures:

```typescript
// Without join - returns array of sessions
.select('*')  // → sessions: [{...}, {...}]

// With INNER join - returns sessions with nested object (NOT array!)
.select('ideas!inner(structured_idea)')  // → session.ideas = { structured_idea: {...} }
```

**Incorrect** (treats as array):
```typescript
const highConcept = session.ideas[0]?.structured_idea?.high_concept;  // ❌ undefined!
```

**Correct** (treats as object):
```typescript
const highConcept = session.ideas?.structured_idea?.high_concept;  // ✅ Works!
```

---

## Tests

### Tier 1 Critical Path Test

**Test Name**: `Session History - Happy Path`

**Description**: Verify user can view past sessions and open reports.

**Steps**:
1. Create multiple test sessions for user
2. Navigate to `/dashboard`
3. Verify sessions displayed
4. Click "View Report" on completed session
5. Verify navigates to report page

**Expected Results**:
- Sessions list displays correctly
- Sessions sorted by date (newest first)
- Navigation works

**Failure Impact**: Low (not blocking MVP)

---

### E2E Tests

```typescript
test('User can view session history', async ({ page }) => {
  await createMultipleSessions(page, 3);

  await page.goto('/dashboard');

  await expect(page.locator('h1:has-text("Your Idea War Room")')).toBeVisible();
  await expect(page.locator('[data-testid="session-card"]')).toHaveCount(3);
});

test('User can open past report', async ({ page }) => {
  const sessionId = await createCompletedSession(page);

  await page.goto('/dashboard');
  await page.click(`[data-session-id="${sessionId}"] button:has-text("View Report")`);

  await expect(page).toHaveURL(new RegExp(`/analyze/${sessionId}/report`));
});
```

---

### Integration Tests

```typescript
describe('GET /api/sessions', () => {
  it('should return user sessions', async () => {
    await createTestSessions(3);

    const response = await fetch('/api/sessions');

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.sessions).toHaveLength(3);
    expect(data.total_count).toBe(3);
  });

  it('should enforce user isolation (CRITICAL SECURITY TEST)', async () => {
    const userA = await createTestUser('alice@example.com');
    const userB = await createTestUser('bob@example.com');

    // Create sessions for both users
    const sessionA1 = await createTestSession(userA);
    const sessionA2 = await createTestSession(userA);
    const sessionB1 = await createTestSession(userB);

    // User A should only see their 2 sessions
    const responseA = await fetch('/api/sessions', {
      headers: { Authorization: `Bearer ${userA.token}` }
    });
    const dataA = await responseA.json();
    expect(dataA.sessions).toHaveLength(2);
    expect(dataA.total_count).toBe(2);
    expect(dataA.sessions.map(s => s.id)).toContain(sessionA1.id);
    expect(dataA.sessions.map(s => s.id)).toContain(sessionA2.id);
    expect(dataA.sessions.map(s => s.id)).not.toContain(sessionB1.id);

    // User B should only see their 1 session
    const responseB = await fetch('/api/sessions', {
      headers: { Authorization: `Bearer ${userB.token}` }
    });
    const dataB = await responseB.json();
    expect(dataB.sessions).toHaveLength(1);
    expect(dataB.total_count).toBe(1);
    expect(dataB.sessions[0].id).toBe(sessionB1.id);
    expect(dataB.sessions.map(s => s.id)).not.toContain(sessionA1.id);
    expect(dataB.sessions.map(s => s.id)).not.toContain(sessionA2.id);
  });

  it('should return sessions with absolute dates and year', async () => {
    await createTestSession();

    const response = await fetch('/api/sessions');
    const data = await response.json();

    // Verify high_concept is populated (not fallback ID)
    expect(data.sessions[0].high_concept).not.toMatch(/^Idea Analysis \[/);

    // Verify created_at is ISO string
    expect(data.sessions[0].created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
```

---

## Notes

### Implementation Lessons Learned

**1. Service Role Key Security Issue (Dec 15, 2025)**

During implementation, discovered critical security issue: Service role key bypasses RLS by default. Initial implementation relied on RLS policies without explicit user_id filtering, causing all users to see all sessions.

**Root Cause**: Supabase service role key has admin privileges and ignores RLS policies.

**Fix**: Added explicit `.eq('user_id', user.id)` to all queries.

**Lesson**: Never rely on RLS alone when using service role key. Always explicitly filter by user_id.

**2. Supabase Join Returns Object, Not Array (Dec 15, 2025)**

Supabase's INNER join syntax `ideas!inner(structured_idea)` returns a nested object, not an array:
- Expected: `session.ideas[0].structured_idea`
- Actual: `session.ideas.structured_idea`

Caused initial "Untitled Idea" bug where all sessions showed fallback title.

**Lesson**: Always test Supabase join queries and verify data structure before assuming array access.

**3. Date Format Evolution (Dec 15, 2025)**

Initial spec called for relative dates ("2 days ago"). Changed to absolute dates with year ("Dec 14, 2024, 10:56 PM") for better UX across years.

**Rationale**:
- Users may reference sessions from previous years
- Absolute dates are clearer for cross-year comparisons
- Timezone displayed is user's local timezone (browser-based)

### Future Enhancements

- **Search/Filter**: Filter sessions by date range, status, or keyword
- **Bulk Actions**: Delete multiple sessions at once
- **Session Comparison**: Side-by-side comparison of two analyses
- **Export All**: Download all reports as ZIP archive
- **Session Tags**: Allow users to tag sessions (e.g., "SaaS", "B2B")

### Known Limitations

- No search functionality
- No session deletion (users can't remove old sessions)
- No session renaming (high concept is fixed)
- Limited to 10 sessions per page (manual pagination)
- Dates shown in browser's local timezone (may confuse users in different timezones)

### References

- [S-03: Database Schema](../system/S-03-database-schema.md) - sessions table
- [F-01: External Authentication Integration](./F-01-database-auth.md) - JWT authentication & RLS
- [F-05: Damage Report Display](./F-05-damage-report-display.md) - Report viewing

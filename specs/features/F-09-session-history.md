# F-09: Session History

**Version**: 1.0
**Last Updated**: 2025-12-08
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
- [ ] PRD documented
- [ ] Technical design complete
- [ ] Tests defined
- [ ] Implementation started
- [ ] Implementation complete
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
- **Status**: Intake, Research, Analysis, Completed, Failed
- **Action**: "View Report" button

**Use Cases**:
- **Iterate on Ideas**: Revisit past analyses after pivoting
- **Compare Versions**: See how idea evolved over time
- **Reference Past Work**: Share old reports with new advisors

**Target Location**: Dashboard page (user's first view after login)

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
- User: Sees session with status "In Progress - Research"
- User: Clicks "Resume"
- System: Navigates to last incomplete step (e.g., `/analyze/[session_id]/research`)

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
   - `intake`, `research`, `analysis`: Show "Resume" button
   - `failed`: Show "Retry Analysis" button
4. **Relative Dates**: Use relative formatting ("2 days ago", "1 week ago")
5. **High Concept Truncation**: Max 100 characters (ellipsis if longer)
6. **RLS Enforcement**: Users can only see their own sessions (enforced by database RLS)

---

### Acceptance Criteria

- [ ] Dashboard displays list of user's past sessions
- [ ] Sessions sorted by most recent first
- [ ] Each session shows high concept, date, and status
- [ ] "View Report" button navigates to report page
- [ ] "Resume" button navigates to last incomplete step
- [ ] "Analyze New Idea" button creates new session
- [ ] Empty state shown for users with no sessions
- [ ] Pagination works for users with > 10 sessions
- [ ] RLS enforced (users can't see others' sessions)

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
    status: 'intake' | 'research' | 'analysis' | 'completed' | 'failed';
    created_at: string;
    high_concept: string;
    has_report: boolean;
  }>;
  total_count: number;
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
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      status,
      created_at,
      ideas!inner(structured_idea),
      damage_reports(id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count total sessions
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const formattedSessions = sessions.map(s => ({
    id: s.id,
    status: s.status,
    created_at: s.created_at,
    high_concept: s.ideas[0]?.structured_idea?.high_concept || 'Untitled Idea',
    has_report: s.damage_reports.length > 0
  }));

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
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      intake: 'bg-yellow-100 text-yellow-800',
      research: 'bg-blue-100 text-blue-800',
      analysis: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[session.status]}`}>
        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
      </span>
    );
  };

  const getActionButton = () => {
    if (session.status === 'completed' && session.has_report) {
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

    // In progress
    return (
      <button
        onClick={() => router.push(`/analyze/${session.id}/${session.status}`)}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        Resume
      </button>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
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

  it('should enforce RLS (only own sessions)', async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();

    await createTestSession(userA);
    await createTestSession(userB);

    // User A should only see their session
    const response = await fetch('/api/sessions', {
      headers: { Authorization: `Bearer ${userA.token}` }
    });

    const data = await response.json();
    expect(data.sessions).toHaveLength(1);
  });
});
```

---

## Notes

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

### References

- [S-03: Database Schema](../system/S-03-database-schema.md) - sessions table
- [F-01: External Authentication Integration](./F-01-database-auth.md) - JWT authentication & RLS
- [F-05: Damage Report Display](./F-05-damage-report-display.md) - Report viewing

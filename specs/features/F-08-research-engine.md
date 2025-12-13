# F-08: Research Engine

**Version**: 2.0
**Last Updated**: 2025-12-12
**Priority**: OPTIONAL
**Status**: 🚧 Spec Updated (supports single-type research)

---

## Quick Reference

**What**: Execute **single-type** research queries (Competitor, Community, or Regulatory) using AI Builders Search API. Users select research type before execution, and can run multiple types independently for the same idea.

**Why**: Evidence-backed analysis provides stronger validation of MVTA insights. Splitting research into types allows users to focus on specific intelligence areas.

**Status**: OPTIONAL - Users can choose to skip research and run MVTA directly with idea data only.

**Dependencies**:
- F-01: Database & Authentication (stores research snapshots)
- F-02: Idea Intake Form (uses structured idea to generate queries)
- F-03: Idea Analysis Choice Page (user navigation) - REQUIRED
- S-03: Database Schema (research_snapshots table with research_type field)
- S-04: LLM Integration (Prompt B for query generation)
- S-05: Search & Research Integration (AI Builders Search API)

**Used By**:
- F-04: MVTA Red Team Simulation (optionally consumes research snapshot)

**Navigation Flow**:
- Entry: User clicks "Online Research" on Choice Page (F-03) → navigates to Research Type Selection page
- Type Selection: User selects one of three research types (Competitor, Community, Regulatory)
- Execution: System runs research for selected type only
- Exit: After completion, returns to Choice Page (F-03)
- Re-entry: User can select different types for the same idea (multiple independent research runs)

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
- [F-01: Database & Authentication](./F-01-database-auth.md) - Database writes
- [F-02: Idea Intake Form](./F-02-idea-intake-form.md) - Structured idea input
- [F-03: Idea Analysis Choice Page](./F-03-idea-analysis-choice-page.md) - User navigation

### Required System Modules
- [S-03: Database Schema](../system/S-03-database-schema.md) - research_snapshots table
- [S-04: LLM Integration](../system/S-04-llm-integration.md) - Prompt B (query generation)
- [S-05: Search & Research Integration](../system/S-05-search-research-integration.md) - Search API client

### External Services
- AI Builders API - Search and LLM services

---

## PRD: Product Requirements

### Overview

The Research Engine is the intelligence-gathering phase of MVTA analysis. After a founder's idea is structured (F-02), this feature allows users to conduct **targeted research** by selecting one of three research types:

1. **🏢 Competitor Research** - Analyze existing solutions, pricing, strengths/weaknesses
2. **👥 Community Voice** - Listen to user discussions on Reddit, forums, social media
3. **📋 Regulatory Research** - Identify compliance requirements and legal considerations

**New Multi-Type Architecture**:
- Users can run **one research type at a time**
- Each type produces an independent research snapshot
- Users can run **multiple types for the same idea** (e.g., Competitor first, then Community)
- Completed research can be viewed again without re-running

**Research Flow**:
1. **Type Selection** (new): User chooses research type on `/analyze/[sessionId]/research-choice`
2. **Query Generation**: LLM generates queries for selected type only
3. **Execution**: Web searches via AI Builders Search API
4. **Synthesis**: Results structured into type-specific snapshot
5. **Storage**: Snapshot saved with research_type field
6. **Navigation**: Returns to Choice Page (F-03)

**Target Duration**: 1-3 minutes per research type (shorter than original full research)

**Key Design Goals**:
- **Focus**: Users get targeted intelligence for their chosen area
- **Transparency**: Show queries and results in real-time
- **Flexibility**: Run one type or all types, in any order
- **Reliability**: Handle API failures gracefully (partial data OK)
- **Speed**: Parallelize searches within selected type

---

### User Flow

**NEW Step 1: Research Type Selection**
- User: Completes intake form, navigates to Choice Page (F-03)
- User: Clicks "Online Research" button from Choice Page
- System: Navigates to `/analyze/[sessionId]/research-choice`
- User: Sees three research type cards:
  - 🏢 **Competitor Research** - "Analyze existing solutions and alternatives"
  - 👥 **Community Voice** - "Listen to user discussions and feedback"
  - 📋 **Regulatory Research** - "Identify compliance and legal requirements"
- User: Sees status badges on each card:
  - "Not Started" (clickable, starts research)
  - "Completed ✓" (clickable, views results)
- User: Clicks on one research type card

**Step 2: Research Execution** (if "Not Started")
- System: Navigates to `/analyze/[sessionId]/research?type=competitor` (or community/regulatory)
- User: Sees progress: "Generating competitor research queries..."
- System: Calls LLM (Prompt B) with structured idea + research type
- System: Receives queries for selected type only (5-10 queries)
- User: Sees query topics displayed (e.g., "Searching: AI-powered market validation tools")

**Step 3: Search Execution** (UPDATED - Simplified Progress)
- User: Sees simplified progress indicator (3 steps):
  1. "Generating targeted research queries..."
  2. Type-specific step:
     - Competitor: "Searching for competitors and alternatives..."
     - Community: "Analyzing community discussions and reviews..."
     - Regulatory: "Checking regulatory requirements..."
  3. "Synthesizing findings with AI..."
- System: Executes queries in parallel via AI Builders Search API
- System: Synthesizes results using LLM
- **Note**: MVP shows simplified progress; full version will show real-time cards

**Step 4: Research Complete** (UPDATED - Auto-navigation)
- System: Saves research snapshot with research_type field
- System: Updates completion tracking (stores research_type in session metadata)
- System: **Automatically navigates** to results page (no user action needed)
- System: Navigates to `/analyze/[sessionId]/research/[type]` (e.g., `/research/competitor`)

**Step 5: View Results**
- **If just completed**: User automatically lands on results page
- **If previously completed**: User clicks completed research type card from research-choice page
- System: Navigates to dynamic results page: `/analyze/[sessionId]/research/[type]`
  - Examples: `/research/competitor`, `/research/community`, `/research/regulatory`
- User: Views research results with type-specific cards
- User: Can click "Back to Research Types" or "Back to Choice Page"

**Repeat**: User can return to research-choice page and select different types

---

### UI Components

**NEW Component 1: ResearchTypeSelection**
- **Location**: `/analyze/[sessionId]/research-choice` route
- **Purpose**: Let users select which research type to run
- **Elements**:
  - Page title: "Choose Research Type"
  - Subtitle: "Select the type of research you want to conduct for your idea"
  - Three research type cards (grid layout):
    - **Competitor Research Card**
      - Icon: 🏢
      - Title: "Competitor Research"
      - Description: "Analyze existing solutions, pricing strategies, and competitive landscape"
      - Status badge: "Not Started" / "Completed ✓"
      - Button: "Start Research" / "View Results"
    - **Community Voice Card**
      - Icon: 👥
      - Title: "Community Voice"
      - Description: "Listen to user discussions on Reddit, forums, and social media"
      - Status badge: "Not Started" / "Completed ✓"
      - Button: "Start Research" / "View Results"
    - **Regulatory Research Card**
      - Icon: 📋
      - Title: "Regulatory Research"
      - Description: "Identify compliance requirements and legal considerations"
      - Status badge: "Not Started" / "Completed ✓"
      - Button: "Start Research" / "View Results"
  - "Back to Choice Page" button at bottom

**Component 2: ResearchProgress** (UPDATED)
- **Location**: `/analyze/[sessionId]/research?type=competitor` (or community/regulatory)
- **Purpose**: Show real-time research progress for selected type
- **NEW Elements**:
  - Research type indicator (e.g., "🏢 Competitor Research")
  - Query topics display (show what's being searched)
  - Progress bar (0-100%)
  - Current stage label ("Generating queries", "Searching...", etc.)
  - Live result cards appearing as data arrives (type-specific)
  - "Back to Choice Page" button (when complete)

**Component 3: CompetitorCard**
- **Location**: Research results section
- **Purpose**: Display one competitor profile
- **Elements**:
  - Competitor name
  - Website URL (clickable link)
  - Summary (1-2 sentences)
  - Pricing info (if available)
  - Strengths list (3-5 items)
  - Weaknesses list (3-5 items)

**Component 3: CommunitySignalCard**
- **Location**: Research results section
- **Purpose**: Display one community discussion
- **Elements**:
  - Source icon (Reddit, forum, etc.)
  - Discussion title
  - Snippet (key quote, max 200 chars)
  - Sentiment badge (positive/negative/neutral, color-coded)
  - Themes tags (e.g., "pricing", "usability")
  - Link to original discussion

**Component 4: RegulatorySignalCard**
- **Location**: Research results section (optional)
- **Purpose**: Display regulatory requirement
- **Elements**:
  - Regulation name (e.g., "GDPR")
  - Summary
  - Compliance requirements list
  - Penalties description
  - Applicability context

**NEW Component 5: ResearchResultsView** (UPDATED - Dynamic Route)
- **Location**: `/analyze/[sessionId]/research/[type]` (single dynamic route)
  - Examples: `/research/competitor`, `/research/community`, `/research/regulatory`
- **Purpose**: Display completed research for specific type (universal component for all types)
- **Elements**:
  - Research type header (dynamic: `{icon} {label}`)
  - Query topics used (collapsible details section)
  - Results grid (renders type-specific cards based on `type` parameter):
    - **Competitor**: CompetitorCard (name, URL, pricing, strengths/weaknesses)
    - **Community**: CommunitySignalCard (source, sentiment, themes, quotes)
    - **Regulatory**: RegulatorySignalCard (regulation name, requirements, penalties)
  - Summary stats (e.g., "5 results found")
  - "Back to Research Types" button → `/research-choice`
  - "Back to Choice Page" button → `/choice`
- **Future extensibility**: GenericCard fallback for new types (displays JSON)

---

### Business Rules

1. **Research Type Selection**: User must select one of three types (competitor, community, regulatory)
2. **Query Generation**: LLM generates 5-10 queries for **selected type only**
3. **Parallel Execution**: Queries run in parallel (max 5 concurrent requests)
4. **Result Limits**: Max 10 results per query
5. **Deduplication**: Results from same domain are deduplicated (keep highest relevance)
6. **Graceful Degradation**: If search API fails, continue with empty results (don't block analysis)
7. **Timeout**: Individual query timeout = 30 seconds; total research timeout = 3 minutes (per type)
8. **Synthesis**: LLM synthesizes raw results into type-specific structured data
9. **Multiple Research Runs**: Same session can have multiple research snapshots (one per type)
10. **Completion Tracking**: Session metadata tracks which research types have been completed
11. **View vs Re-run**: Clicking completed type shows results; re-run feature deferred to future
12. **Query Display**: Show query topics to users during execution for transparency

---

### Acceptance Criteria

**Research Type Selection**:
- [ ] Research-choice page displays three research type cards
- [ ] Each card shows correct icon, title, description
- [ ] Status badges show "Not Started" or "Completed ✓" correctly
- [ ] Button text changes based on completion state ("Start Research" vs "View Results")
- [ ] Clicking on card navigates to correct route

**Research Execution**:
- [ ] System generates queries for **selected type only**
- [ ] Query topics are displayed to user during execution
- [ ] Queries are executed via AI Builders Search API
- [ ] Results are fetched and deduplicated
- [ ] Type-specific synthesis:
  - [ ] Competitor: profiles with pricing, strengths, weaknesses
  - [ ] Community: signals with sentiment and themes
  - [ ] Regulatory: requirements with compliance details
- [ ] Research snapshot saved with research_type field
- [ ] User sees real-time progress during research
- [ ] Partial results acceptable (if some queries fail)
- [ ] Research completes within 3 minutes (per type)

**Multi-Type Support**:
- [ ] Same session can have multiple research snapshots (different types)
- [ ] Database enforces UNIQUE(session_id, research_type)
- [ ] Completion status tracked per type
- [ ] User can run multiple types in any order

**Results Viewing**:
- [ ] Completed research navigates to type-specific results page
- [ ] Results page displays queries used
- [ ] Results page shows type-specific cards
- [ ] "Back to Choice Page" button works correctly
- [ ] Re-run feature deferred (clicking completed type shows results only)

---

## Technical Implementation

### API Endpoints

**NEW Endpoint 1: GET /api/sessions/[sessionId]/research/status**

**Purpose**: Get completion status of all research types

**Response** (Success - 200):
```typescript
interface ResearchStatusResponse {
  completed_types: ('competitor' | 'community' | 'regulatory')[];
  available_types: {
    competitor: { completed: boolean; snapshot_id?: string };
    community: { completed: boolean; snapshot_id?: string };
    regulatory: { completed: boolean; snapshot_id?: string };
  };
}
```

**UPDATED Endpoint 2: POST /api/sessions/[sessionId]/research**

**Purpose**: Initiate research for **specific type** (generate queries, execute searches, synthesize results)

**Request Query Parameters**:
- `type`: Required, one of 'competitor' | 'community' | 'regulatory'

**Example**: `POST /api/sessions/[sessionId]/research?type=competitor`

**Response** (Success - 201):
```typescript
interface ResearchResponse {
  research_snapshot_id: string;
  research_type: 'competitor' | 'community' | 'regulatory';
  results_count: number; // e.g., competitors_found, signals_found, etc.
  queries: string[]; // Query topics for transparency
}
```

**Error Codes**:
- `SESSION_NOT_FOUND`: Session ID invalid
- `IDEA_NOT_FOUND`: No structured idea exists for this session
- `RESEARCH_FAILED`: All research queries failed
- `INVALID_TYPE`: Research type parameter missing or invalid
- `ALREADY_COMPLETED`: Research type already completed for this session (409 Conflict)

**Implementation**:
```typescript
// app/api/sessions/[sessionId]/research/route.ts
import { conductResearch } from '@/lib/search/research-engine';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  // Verify session and fetch structured idea
  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('structured_idea')
    .eq('session_id', params.sessionId)
    .single();

  if (ideaError || !idea) {
    return NextResponse.json(
      { error: 'Idea not found', code: 'IDEA_NOT_FOUND' },
      { status: 404 }
    );
  }

  try {
    // Conduct research (see S-05 for implementation)
    const researchSnapshot = await conductResearch(idea.structured_idea);

    // Save to database
    const { data: snapshot, error: snapshotError } = await supabase
      .from('research_snapshots')
      .insert({
        session_id: params.sessionId,
        competitor_queries: researchSnapshot.competitor_queries || [],
        community_queries: researchSnapshot.community_queries || [],
        regulatory_queries: researchSnapshot.regulatory_queries || [],
        competitors: researchSnapshot.competitors,
        community_signals: researchSnapshot.community_signals,
        regulatory_signals: researchSnapshot.regulatory_signals
      })
      .select()
      .single();

    if (snapshotError) {
      throw new Error(`Failed to save research: ${snapshotError.message}`);
    }

    // Update session status to 'analysis'
    await supabase
      .from('sessions')
      .update({ status: 'analysis' })
      .eq('id', params.sessionId);

    return NextResponse.json({
      research_snapshot_id: snapshot.id,
      competitors_found: researchSnapshot.competitors.length,
      community_signals_found: researchSnapshot.community_signals.length,
      regulatory_signals_found: researchSnapshot.regulatory_signals.length
    }, { status: 201 });

  } catch (error) {
    console.error('Research failed:', error);

    return NextResponse.json({
      error: 'Research failed. Please try again.',
      code: 'RESEARCH_FAILED'
    }, { status: 500 });
  }
}
```

---

**NEW Endpoint 3: GET /api/sessions/[sessionId]/research/[type]**

**Purpose**: Fetch completed research snapshot for specific type

**URL Parameters**:
- `type`: One of 'competitor' | 'community' | 'regulatory'

**Example**: `GET /api/sessions/[sessionId]/research/competitor`

**Response** (Success - 200):
```typescript
interface ResearchSnapshotResponse {
  research_snapshot_id: string;
  research_type: 'competitor' | 'community' | 'regulatory';
  queries: string[];
  results: CompetitorResult[] | CommunitySignal[] | RegulatorySignal[];
  created_at: string;
}
```

**Error Codes**:
- `SESSION_NOT_FOUND`: Session ID invalid
- `RESEARCH_NOT_FOUND`: No research completed for this type (404)

**Endpoint 4: GET /api/sessions/[sessionId]/research/progress** (Optional)

**Purpose**: Stream real-time research progress (SSE - Server-Sent Events)

**Query Parameters**:
- `type`: Required, research type being executed

**Response Format**:
```typescript
// SSE event stream
data: {"stage": "generating_queries", "progress": 10, "type": "competitor"}

data: {"stage": "searching", "progress": 30, "message": "Query 3 of 7", "query_topic": "AI market validation tools"}

data: {"stage": "complete", "progress": 100, "results_count": 5}
```

**Implementation**: (Optional for MVP - can use polling instead)

---

### Database Schema

**UPDATED Table: research_snapshots** (from S-03)
```sql
CREATE TABLE research_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL,  -- No CHECK constraint for future extensibility

  -- Generated queries (only for selected type)
  queries JSONB DEFAULT '[]'::jsonb,

  -- Fetched results (structure depends on research_type)
  results JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique constraint: one snapshot per type per session
  UNIQUE (session_id, research_type)
);

CREATE INDEX idx_research_snapshots_session ON research_snapshots(session_id);
CREATE INDEX idx_research_snapshots_type ON research_snapshots(research_type);
```

**Schema Rationale**:
- **research_type**: Identifies which type of research was conducted
  - **No CHECK constraint**: Validation done at application layer for future extensibility
  - **Current valid types**: 'competitor', 'community', 'regulatory' (enforced in code)
  - **Future extensibility**: Adding new types requires only code changes, no DB migration
- **queries**: Stores only the queries for selected type (simpler than three separate fields)
- **results**: JSONB structure depends on type:
  - `competitor`: Array of CompetitorResult objects
  - `community`: Array of CommunitySignal objects
  - `regulatory`: Array of RegulatorySignal objects
- **UNIQUE constraint**: Ensures one snapshot per (session_id, research_type) pair
- **Removed session_id UNIQUE**: Now allows multiple research snapshots per session

**Application-Layer Validation**:
```typescript
// lib/constants/research.ts
export const RESEARCH_TYPES = ['competitor', 'community', 'regulatory'] as const;
export type ResearchType = typeof RESEARCH_TYPES[number];

// Validate in API handlers
export function isValidResearchType(type: string): type is ResearchType {
  return RESEARCH_TYPES.includes(type as ResearchType);
}
```

**Session Metadata** (OPTIONAL - for quick lookup):
```typescript
// Can add to sessions table metadata field:
metadata: {
  research_completed_types: ['competitor', 'community'] // Array of completed types
}
```

---

### Frontend Components

**Component 1: ResearchProgress**

**File**: `src/components/research/ResearchProgress.tsx`

**Props**:
```typescript
interface ResearchProgressProps {
  sessionId: string;
}
```

**State**:
```typescript
const [stage, setStage] = useState<ResearchStage>('generating_queries');
const [progress, setProgress] = useState(0);
const [competitors, setCompetitors] = useState<CompetitorResult[]>([]);
const [communitySignals, setCommunitySignals] = useState<CommunitySignal[]>([]);
const [regulatorySignals, setRegulatorySignals] = useState<RegulatorySignal[]>([]);
const [isComplete, setIsComplete] = useState(false);
```

**Example Implementation**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CompetitorCard from './CompetitorCard';
import CommunitySignalCard from './CommunitySignalCard';

export default function ResearchProgress({ sessionId }: ResearchProgressProps) {
  const [stage, setStage] = useState('generating_queries');
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [competitors, setCompetitors] = useState([]);
  const [communitySignals, setCommunitySignals] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Start research
    const runResearch = async () => {
      try {
        // Initiate research
        const res = await fetch(`/api/sessions/${sessionId}/research`, {
          method: 'POST'
        });

        if (!res.ok) {
          throw new Error('Research failed');
        }

        const data = await res.json();

        // Fetch complete research snapshot
        const snapshotRes = await fetch(`/api/sessions/${sessionId}/research-snapshot`);
        const snapshot = await snapshotRes.json();

        setCompetitors(snapshot.competitors);
        setCommunitySignals(snapshot.community_signals);
        setProgress(100);
        setIsComplete(true);

      } catch (error) {
        alert('Research failed. Please try again.');
      }
    };

    runResearch();
  }, [sessionId]);

  const handleProceed = () => {
    router.push(`/analyze/${sessionId}/analysis`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Research Phase</h1>
      <p className="text-gray-600 mb-8">
        Gathering evidence from competitors, community discussions, and regulations...
      </p>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {isComplete ? 'Research complete!' : 'Researching...'}
        </p>
      </div>

      {/* Results */}
      <div className="space-y-8">
        {/* Competitors */}
        {competitors.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Competitors Found ({competitors.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {competitors.map((comp, i) => (
                <CompetitorCard key={i} competitor={comp} />
              ))}
            </div>
          </div>
        )}

        {/* Community Signals */}
        {communitySignals.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Community Discussions ({communitySignals.length})
            </h2>
            <div className="space-y-3">
              {communitySignals.map((signal, i) => (
                <CommunitySignalCard key={i} signal={signal} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Proceed Button */}
      {isComplete && (
        <div className="mt-8 text-center">
          <button
            onClick={handleProceed}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Proceed to MVTA Analysis
          </button>
        </div>
      )}
    </div>
  );
}
```

---

**Component 2: CompetitorCard**

**File**: `src/components/research/CompetitorCard.tsx`

**Implementation**:
```typescript
interface CompetitorCardProps {
  competitor: {
    name: string;
    url: string;
    summary: string;
    pricing?: string;
    strengths: string[];
    weaknesses: string[];
  };
}

export default function CompetitorCard({ competitor }: CompetitorCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold mb-1">{competitor.name}</h3>
      <a
        href={competitor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline mb-3 block"
      >
        {competitor.url}
      </a>

      <p className="text-sm text-gray-700 mb-3">{competitor.summary}</p>

      {competitor.pricing && (
        <p className="text-sm text-gray-600 mb-3">
          <strong>Pricing:</strong> {competitor.pricing}
        </p>
      )}

      <div className="space-y-2">
        <div>
          <p className="text-xs font-semibold text-green-700 mb-1">Strengths:</p>
          <ul className="text-xs space-y-1">
            {competitor.strengths.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold text-red-700 mb-1">Weaknesses:</p>
          <ul className="text-xs space-y-1">
            {competitor.weaknesses.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

---

### State Management

**Research Context** (optional):
```typescript
// src/contexts/ResearchContext.tsx
interface ResearchContextType {
  competitors: CompetitorResult[];
  communitySignals: CommunitySignal[];
  regulatorySignals: RegulatorySignal[];
  isLoading: boolean;
}
```

---

### Prompt Engineering

**See [S-04: LLM Integration](../system/S-04-llm-integration.md) for Prompt B (Generate Research Queries).**

**See [S-05: Search & Research Integration](../system/S-05-search-research-integration.md) for synthesis prompts.**

---

## Tests

### Tier 1 Critical Path Test

**Test Name**: `Research Execution - Happy Path`

**Description**: Verify that research queries are generated, executed, and results are saved correctly.

**Preconditions**:
- Structured idea exists for session
- AI Builders Search API is accessible

**Steps**:
1. Call POST `/api/sessions/[sessionId]/research`
2. Verify LLM generates queries
3. Verify queries are executed via Search API
4. Verify results are synthesized
5. Verify research_snapshots record is created
6. Verify session status updated to 'analysis'

**Expected Results**:
- Research completes successfully
- At least 1 competitor found
- At least 1 community signal found
- Research snapshot saved to database
- Session status = 'analysis'

**Failure Impact**: ❌ **BLOCKS DEPLOYMENT**

---

### E2E Tests

**Test 1: Complete Research Flow**
```typescript
test('Research phase completes and displays results', async ({ page }) => {
  const sessionId = await createTestSessionWithIdea(page);

  await page.goto(`/analyze/${sessionId}/research`);

  // Wait for research to complete (may take up to 5 minutes)
  await expect(page.locator('text=/research complete/i')).toBeVisible({ timeout: 300000 });

  // Verify results displayed
  await expect(page.locator('text=/competitors found/i')).toBeVisible();
  await expect(page.locator('text=/community discussions/i')).toBeVisible();

  // Proceed to analysis
  await page.click('button:has-text("Proceed to MVTA Analysis")');
  await expect(page).toHaveURL(new RegExp(`/analyze/${sessionId}/analysis`));
});
```

---

### Integration Tests

**Test 1: Research API**
```typescript
describe('POST /api/sessions/[sessionId]/research', () => {
  it('should generate queries and execute research', async () => {
    const sessionId = await createSessionWithStructuredIdea();

    const response = await fetch(`/api/sessions/${sessionId}/research`, {
      method: 'POST'
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data).toHaveProperty('research_snapshot_id');
    expect(data.competitors_found).toBeGreaterThan(0);
  });
});
```

---

### Unit Tests

**Test 1: Query Deduplication**
```typescript
import { deduplicateByURL } from '@/lib/search/research-engine';

describe('Result Deduplication', () => {
  it('should remove duplicate domains', () => {
    const results = [
      { url: 'https://example.com/page1', title: 'Page 1' },
      { url: 'https://example.com/page2', title: 'Page 2' },
      { url: 'https://other.com/page1', title: 'Other Page' }
    ];

    const deduped = deduplicateByURL(results);

    expect(deduped).toHaveLength(2);
    expect(deduped.map(r => new URL(r.url).hostname)).toEqual(['example.com', 'other.com']);
  });
});
```

---

## Notes

### Future Enhancements

- **Manual Query Input**: Allow users to add custom research queries
- **Result Filtering**: Let users exclude irrelevant competitors or signals
- **Deep Scraping**: Fetch full web pages (not just snippets) for richer context
- **Historical Tracking**: Track competitor changes over time
- **Export Research**: Download research snapshot as PDF/JSON

### Known Limitations

- No real-time web scraping (relies on AI Builders indexed data)
- English-only for MVP
- Max 25 queries per session (to control API costs)
- No video/podcast analysis (text-only sources)

### References

- [S-04: LLM Integration](../system/S-04-llm-integration.md) - Prompt B
- [S-05: Search & Research Integration](../system/S-05-search-research-integration.md) - Search client

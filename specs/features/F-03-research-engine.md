# F-03: Research Engine

**Version**: 1.0
**Last Updated**: 2025-12-08
**Priority**: CRITICAL
**Status**: ✅ Spec Complete

---

## Quick Reference

**What**: Execute research queries using AI Builders Search API, fetch competitor data, community signals (Reddit, forums), and regulatory context. Synthesize results into research snapshot for MVTA analysis.

**Why**: Evidence-backed analysis requires real-world data. This feature fetches the facts that ground the red team simulation.

**Dependencies**:
- F-01: Database & Authentication (stores research snapshots)
- F-02: Idea Intake Form (uses structured idea to generate queries)
- S-03: Database Schema (research_snapshots table)
- S-04: LLM Integration (Prompt B for query generation)
- S-05: Search & Research Integration (AI Builders Search API)

**Used By**:
- F-04: MVTA Red Team Simulation (consumes research snapshot for evidence-based analysis)

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

### Required System Modules
- [S-03: Database Schema](../system/S-03-database-schema.md) - research_snapshots table
- [S-04: LLM Integration](../system/S-04-llm-integration.md) - Prompt B (query generation)
- [S-05: Search & Research Integration](../system/S-05-search-research-integration.md) - Search API client

### External Services
- AI Builders API - Search and LLM services

---

## PRD: Product Requirements

### Overview

The Research Engine is the intelligence-gathering phase of MVTA analysis. After a founder's idea is structured (F-02), this feature:
1. **Generates research queries** using LLM (Prompt B)
2. **Executes web searches** via AI Builders Search API
3. **Fetches evidence** from competitors, community discussions, and regulatory sources
4. **Synthesizes results** into structured research snapshot
5. **Stores snapshot** for use in red team analysis (F-04)

**Target Duration**: 2-5 minutes (depending on query count and API latency)

**Key Design Goals**:
- **Transparency**: Show users what's being researched in real-time
- **Reliability**: Handle API failures gracefully (partial data OK)
- **Quality**: Prioritize recent, relevant results
- **Speed**: Parallelize searches where possible

---

### User Flow

**Step 1**: User completes intake form and reviews structured idea
- User: Clicks "Proceed to Research" from review page
- System: Navigates to `/analyze/[session_id]/research`, updates session status to 'research'

**Step 2**: Query Generation Phase
- User: Sees progress indicator: "Generating research queries..."
- System: Calls LLM (Prompt B) with structured idea
- System: Receives 3 query categories:
  - competitor_queries (5-10 queries)
  - community_queries (5-10 queries)
  - regulatory_queries (0-5 queries, only if domain is sensitive)

**Step 3**: Competitor Research
- User: Sees progress: "Searching for competitors... (Query 1 of 7)"
- System: Executes competitor queries in parallel via AI Builders Search API
- System: Synthesizes results into competitor profiles using LLM
- User: Sees competitor cards appear as results arrive

**Step 4**: Community Listening
- User: Sees progress: "Listening to community discussions... (Query 1 of 8)"
- System: Executes community queries (focus on Reddit, forums, reviews)
- System: Classifies sentiment and extracts themes using LLM
- User: Sees community signal cards appear

**Step 5**: Regulatory Context (if applicable)
- User: Sees progress: "Checking regulatory context..."
- System: Executes regulatory queries
- System: Synthesizes compliance requirements
- User: Sees regulatory signals (or "No regulatory concerns identified")

**Step 6**: Research Complete
- User: Sees summary:
  - "Found 5 competitors"
  - "Analyzed 12 community discussions"
  - "Identified 2 regulatory considerations"
- System: Saves complete research snapshot to database
- System: Updates session status to 'analysis'
- User: Clicks "Proceed to Analysis" button
- System: Navigates to `/analyze/[session_id]/analysis`

---

### UI Components

**Component 1: ResearchProgress**
- **Location**: `/analyze/[session_id]/research` route
- **Purpose**: Show real-time research progress
- **Elements**:
  - Progress bar (0-100%)
  - Current stage label ("Generating queries", "Searching competitors", etc.)
  - Live result cards appearing as data arrives
  - Time estimate ("~3 minutes remaining")

**Component 2: CompetitorCard**
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

---

### Business Rules

1. **Query Generation**: LLM generates 10-25 total queries (5-10 competitor, 5-10 community, 0-5 regulatory)
2. **Parallel Execution**: Queries within same category run in parallel (max 5 concurrent requests)
3. **Result Limits**: Max 10 results per query
4. **Deduplication**: Results from same domain are deduplicated (keep highest relevance)
5. **Graceful Degradation**: If search API fails, continue with empty results (don't block analysis)
6. **Timeout**: Individual query timeout = 30 seconds; total research timeout = 5 minutes
7. **Synthesis**: LLM synthesizes raw results into structured profiles (competitors, signals, regulations)

---

### Acceptance Criteria

- [ ] System generates research queries from structured idea
- [ ] Queries are executed via AI Builders Search API
- [ ] Results are fetched and deduplicated
- [ ] Competitor profiles are synthesized with LLM
- [ ] Community signals are classified with sentiment and themes
- [ ] Regulatory signals are extracted (if applicable)
- [ ] Research snapshot is saved to database
- [ ] User sees real-time progress during research
- [ ] Partial results are acceptable (if some queries fail)
- [ ] Research completes within 5 minutes
- [ ] "Proceed to Analysis" button navigates correctly

---

## Technical Implementation

### API Endpoints

**Endpoint 1: POST /api/sessions/[sessionId]/research**

**Purpose**: Initiate research phase (generate queries, execute searches, synthesize results)

**Request**: No body required

**Response** (Success - 201):
```typescript
interface ResearchResponse {
  research_snapshot_id: string;
  competitors_found: number;
  community_signals_found: number;
  regulatory_signals_found: number;
}
```

**Error Codes**:
- `SESSION_NOT_FOUND`: Session ID invalid
- `IDEA_NOT_FOUND`: No structured idea exists for this session
- `RESEARCH_FAILED`: All research queries failed

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

**Endpoint 2: GET /api/sessions/[sessionId]/research/progress**

**Purpose**: Stream real-time research progress (SSE - Server-Sent Events)

**Response Format**:
```typescript
// SSE event stream
data: {"stage": "generating_queries", "progress": 10}

data: {"stage": "searching_competitors", "progress": 30, "message": "Query 3 of 7"}

data: {"stage": "searching_community", "progress": 60, "message": "Query 5 of 8"}

data: {"stage": "complete", "progress": 100}
```

**Implementation** (Optional for MVP - can use polling instead):
```typescript
// app/api/sessions/[sessionId]/research/progress/route.ts
export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Poll session status and send updates
      // (Full SSE implementation details omitted for brevity)
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

---

### Database Schema

**Table: research_snapshots** (from S-03)
```sql
CREATE TABLE research_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,

  -- Generated queries
  competitor_queries JSONB DEFAULT '[]'::jsonb,
  community_queries JSONB DEFAULT '[]'::jsonb,
  regulatory_queries JSONB DEFAULT '[]'::jsonb,

  -- Fetched results
  competitors JSONB DEFAULT '[]'::jsonb,
  community_signals JSONB DEFAULT '[]'::jsonb,
  regulatory_signals JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
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

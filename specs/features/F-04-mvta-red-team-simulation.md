# F-04: MVTA Red Team Simulation

**Version**: 1.0
**Last Updated**: 2025-12-08
**Priority**: CRITICAL
**Status**: ✅ Spec Complete

---

## Quick Reference

**What**: Core MVTA analysis using LLM (Prompt C) - simulates 5 red team personas attacking the idea across all threat vectors, scores vulnerabilities (1-5), identifies cascading failures, and generates actionable recommendations.

**Why**: This is the core value proposition of Idea War Room. The red team simulation provides professional-grade adversarial analysis regardless of whether online research was conducted.

**Research Dependency**: OPTIONAL - MVTA can run with or without research data:
- **With Research**: Uses competitor data, community signals, regulatory context as evidence
- **Without Research**: Uses founder's competitive landscape description and stated assumptions

**Dependencies**:
- F-01: Database & Authentication (saves damage reports)
- F-02: Idea Intake Form (structured idea input) - REQUIRED
- F-03: Idea Analysis Choice Page (user navigation) - REQUIRED
- F-08: Research Engine (research snapshot for evidence) - OPTIONAL
- S-03: Database Schema (damage_reports table)
- S-04: LLM Integration (Prompt C for MVTA analysis)

**Used By**:
- F-05: Damage Report Display (renders MVTA results)
- F-06: Interactive Q&A Session (uses report as context)

**Navigation**:
- Entry: User clicks "MVTA Analysis" on Choice Page (F-03)
- Exit: After completion, navigates directly to Damage Report page (F-05). User can return to Choice Page via "Back to Idea Choice" button

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
- [F-02: Idea Intake Form](./F-02-idea-intake-form.md) - Structured idea (REQUIRED)
- [F-03: Idea Analysis Choice Page](./F-03-idea-analysis-choice-page.md) - User navigation (REQUIRED)
- [F-08: Research Engine](./F-08-research-engine.md) - Research snapshot (OPTIONAL)

### Required System Modules
- [S-03: Database Schema](../system/S-03-database-schema.md) - damage_reports table
- [S-04: LLM Integration](../system/S-04-llm-integration.md) - Prompt C (MVTA red team)

### External Services
- AI Builders API - LLM for MVTA analysis

---

## PRD: Product Requirements

### Overview

The MVTA Red Team Simulation is the analytical core of Idea War Room. It simulates 5 professional adversarial roles (Technical Pentester, Competitor CEO, Social Critic, Regulatory Officer, Political Strategist) attacking the startup idea across 18+ attack vectors grouped into 5 threat categories.

**5 Threat Vectors**:
1. **Technical & Product Integrity**: Scalability, usability, fragility
2. **Market & Economic Viability**: Competition, value proposition, customer apathy
3. **Social & Ethical Resonance**: Misuse, cancel culture, ethical slippery slopes
4. **Legal & Regulatory Compliance**: Loopholes closing, litigation, jurisdictional conflicts
5. **Narrative & Political Weaponization**: Malicious reframing, guilt-by-association

**Scoring System** (1-5 scale):
- **1 = Catastrophic**: Kill shot, unrecoverable
- **2 = Critical**: Requires fundamental pivot
- **3 = Significant**: Major risk
- **4 = Moderate**: Manageable risk
- **5 = Resilient**: Negligible threat

**Key Outputs**:
- **Vulnerabilities**: List of specific threats with scores, evidence citations, and rationale
- **Cascading Failures**: Sequences of events where one failure triggers others
- **Vector Synthesis**: Summary assessment for each of the 5 vectors
- **Recommendations**: Actionable next steps to validate/mitigate critical risks

**Target Duration**: 2-3 minutes (LLM processing time)

---

### User Flow

**Step 1**: User selects MVTA Analysis from Choice Page
- User: Clicks "Start MVTA Analysis" button from Choice Page (F-03)
- System: Navigates to `/analyze/[session_id]/analysis`, keeps session status as 'choice'

**Step 2**: Analysis Initiation
- User: Sees loading screen: "Red Team is attacking your idea..."
- System: Fetches structured idea from database
- System: Optionally fetches research snapshot if available (not required)
- System: Calls LLM (Prompt C) with idea + optional research + MVTA instructions
- User: Sees progress indicator (estimated 2-3 minutes)
- Note: Analysis proceeds successfully whether or not research was completed

**Step 3**: Processing
- System: LLM generates MVTA report (JSON format):
  - vulnerabilities array (15-25 items)
  - cascading_failures array (3-5 chains)
  - vector_synthesis array (5 items, one per vector)
  - recommendations array (5-10 items)
- System: Validates JSON schema
- System: Saves to damage_reports table

**Step 4**: Analysis Complete
- User: Sees "Analysis Complete!" message
- System: Updates session status to 'completed' and sets analysis_completed=true
- System: Navigates back to `/analyze/[session_id]/choice` (Choice Page - F-03)
- User: Can click "View Damage Report" button to navigate to `/analyze/[session_id]/report` (F-05)

---

### UI Components

**Component 1: AnalysisLoader**
- **Location**: `/analyze/[session_id]/analysis` route
- **Purpose**: Transparency during LLM processing
- **Elements**:
  - Animated "war room" visual (optional: radar scanning effect)
  - Status message: "Red Team is simulating attacks..."
  - Progress bar (indeterminate, since LLM time varies)
  - Fun facts about MVTA methodology (to keep user engaged)
  - Estimated time: "This takes 2-3 minutes"

**Component 2: AnalysisError**
- **Location**: Shown if LLM fails
- **Purpose**: Error recovery
- **Elements**:
  - Error message: "Analysis failed. This is rare!"
  - Explanation of failure (API timeout, invalid response, etc.)
  - "Retry Analysis" button
  - "Contact Support" link

---

### Business Rules

1. **Input Requirements**: Must have structured idea + research snapshot
2. **LLM Model**: Use Claude 3.5 Sonnet (high quality needed for nuanced analysis)
3. **Temperature**: 0.7 (balance creativity and consistency)
4. **Max Tokens**: 8000 (damage reports are long)
5. **Validation**: Output must match MVTA JSON schema (Zod validation)
6. **Retry Logic**: Max 3 retries on failure (exponential backoff)
7. **Timeout**: 5 minutes total (if exceeded, show error)
8. **All Vectors Required**: Report must cover all 5 vectors (no partial reports)
9. **Evidence Citations**: Vulnerabilities must reference research data (competitor index, community signal ID, etc.)

---

### Acceptance Criteria

- [ ] System fetches structured idea and research snapshot
- [ ] System calls LLM (Prompt C) with MVTA instructions
- [ ] LLM returns valid JSON matching schema
- [ ] Report includes vulnerabilities for all 5 vectors
- [ ] Vulnerabilities cite research evidence
- [ ] Cascading failures are identified (if applicable)
- [ ] Recommendations are actionable and specific
- [ ] Damage report is saved to database
- [ ] Session status updated to 'completed'
- [ ] User is redirected to report page
- [ ] Error handling: Retry on failure, show clear error message

---

## Technical Implementation

### API Endpoints

**Endpoint 1: POST /api/sessions/[sessionId]/analyze**

**Purpose**: Execute MVTA red team analysis

**Request**: No body required

**Response** (Success - 201):
```typescript
interface AnalyzeResponse {
  damage_report_id: string;
  vulnerabilities_count: number;
  cascading_failures_count: number;
}
```

**Error Codes**:
- `SESSION_NOT_FOUND`: Session invalid
- `RESEARCH_NOT_FOUND`: No research snapshot exists
- `ANALYSIS_FAILED`: LLM failed to generate valid report
- `VALIDATION_FAILED`: Report doesn't match schema

**Implementation**:
```typescript
// app/api/sessions/[sessionId]/analyze/route.ts
import { runMVTAAnalysis } from '@/lib/llm/prompts';
import { validateMVTAReport } from '@/lib/validation/mvta-schema';

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  // Fetch idea and research
  const { data: idea } = await supabase
    .from('ideas')
    .select('structured_idea')
    .eq('session_id', params.sessionId)
    .single();

  const { data: research } = await supabase
    .from('research_snapshots')
    .select('*')
    .eq('session_id', params.sessionId)
    .single();

  if (!idea || !research) {
    return NextResponse.json(
      { error: 'Missing required data', code: 'RESEARCH_NOT_FOUND' },
      { status: 404 }
    );
  }

  try {
    // Run MVTA analysis (see S-04)
    const report = await runMVTAAnalysis(
      idea.structured_idea,
      {
        competitors: research.competitors,
        community_signals: research.community_signals,
        regulatory_signals: research.regulatory_signals
      }
    );

    // Validate
    const validatedReport = validateMVTAReport(report);

    // Save to database
    const { data: damageReport, error } = await supabase
      .from('damage_reports')
      .insert({
        session_id: params.sessionId,
        vulnerabilities: validatedReport.vulnerabilities,
        cascading_failures: validatedReport.cascading_failures,
        vector_synthesis: validatedReport.vector_synthesis,
        recommendations: validatedReport.recommendations
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save report: ${error.message}`);
    }

    // Update session status
    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', params.sessionId);

    return NextResponse.json({
      damage_report_id: damageReport.id,
      vulnerabilities_count: validatedReport.vulnerabilities.length,
      cascading_failures_count: validatedReport.cascading_failures.length
    }, { status: 201 });

  } catch (error) {
    console.error('MVTA analysis failed:', error);

    return NextResponse.json({
      error: 'Analysis failed. Please try again.',
      code: 'ANALYSIS_FAILED'
    }, { status: 500 });
  }
}
```

---

### Database Schema

**Table: damage_reports** (from S-03)
```sql
CREATE TABLE damage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  vulnerabilities JSONB NOT NULL,
  cascading_failures JSONB NOT NULL,
  vector_synthesis JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Frontend Components

**Component 1: AnalysisLoader**

**File**: `src/components/analysis/AnalysisLoader.tsx`

**Implementation**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalysisLoader({ sessionId }: { sessionId: string }) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/analyze`, {
          method: 'POST'
        });

        if (!res.ok) {
          throw new Error('Analysis failed');
        }

        // Success - navigate to report
        router.push(`/analyze/${sessionId}/report`);

      } catch (err) {
        setError('Analysis failed. Please try again.');
        setIsAnalyzing(false);
      }
    };

    runAnalysis();
  }, [sessionId, router]);

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
      <h2 className="text-2xl font-bold mb-2">Red Team is Attacking Your Idea...</h2>
      <p className="text-gray-600">This takes 2-3 minutes</p>
    </div>
  );
}
```

---

### Prompt Engineering

**See [S-04: LLM Integration](../system/S-04-llm-integration.md) for complete Prompt C definition.**

**Key Elements**:
- System prompt defines 5 red team roles and 18+ attack simulations
- User prompt passes structured idea + research snapshot
- Instructions require JSON output with vulnerabilities, cascading failures, synthesis, recommendations
- Scoring mandatory (1-5 scale)
- Evidence citations required

---

## Tests

### Tier 1 Critical Path Test

**Test Name**: `MVTA Analysis - Happy Path`

**Description**: Verify end-to-end MVTA analysis execution.

**Preconditions**:
- Structured idea exists
- Research snapshot exists
- AI Builders API accessible

**Steps**:
1. Call POST `/api/sessions/[sessionId]/analyze`
2. Verify LLM called with correct inputs
3. Verify valid JSON returned
4. Verify all 5 vectors covered
5. Verify damage report saved to database
6. Verify session status = 'completed'

**Expected Results**:
- Analysis completes successfully
- Report contains 15-25 vulnerabilities
- All vulnerabilities have scores 1-5
- Report saved to database

**Failure Impact**: ❌ **BLOCKS DEPLOYMENT**

---

### E2E Tests

**Test 1: Complete Analysis Flow**
```typescript
test('MVTA analysis completes and generates report', async ({ page }) => {
  const sessionId = await createSessionWithResearch(page);

  await page.goto(`/analyze/${sessionId}/analysis`);

  // Wait for analysis (may take 3+ minutes)
  await expect(page).toHaveURL(new RegExp(`/analyze/${sessionId}/report`), {
    timeout: 300000
  });

  // Verify report displayed
  await expect(page.locator('text=/damage report/i')).toBeVisible();
});
```

---

### Integration Tests

**Test 1: Analysis API**
```typescript
describe('POST /api/sessions/[sessionId]/analyze', () => {
  it('should generate MVTA report', async () => {
    const sessionId = await createSessionWithResearch();

    const response = await fetch(`/api/sessions/${sessionId}/analyze`, {
      method: 'POST'
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data).toHaveProperty('damage_report_id');
    expect(data.vulnerabilities_count).toBeGreaterThan(10);
  });
});
```

---

### Unit Tests

**Test 1: MVTA Schema Validation**
```typescript
import { validateMVTAReport } from '@/lib/validation/mvta-schema';

describe('MVTA Report Validation', () => {
  it('should accept valid report', () => {
    const report = {
      vulnerabilities: [
        {
          vector: 'Market & Economic Viability',
          simulation: 'Competitor War Game',
          description: 'Strong competition',
          score: 2,
          rationale: 'Based on research',
          evidence_refs: { competitors: [0], community_signals: [], regulatory_signals: [] }
        }
      ],
      cascading_failures: [],
      vector_synthesis: [
        {
          vector: 'Market & Economic Viability',
          summary: 'High risk',
          overall_score: 2
        }
      ],
      recommendations: [
        {
          risk_index: 0,
          action_type: 'Customer Discovery',
          description: 'Interview 10 users'
        }
      ]
    };

    expect(() => validateMVTAReport(report)).not.toThrow();
  });
});
```

---

## Notes

### Future Enhancements

- **Analysis Customization**: Let users select which vectors to focus on
- **Severity Filters**: Show only critical (score 1-2) vulnerabilities
- **Re-run Analysis**: Allow multiple analyses for same idea (track changes over time)
- **Compare Analyses**: Side-by-side comparison of before/after pivots

### Known Limitations

- No human-in-the-loop (fully automated red team)
- Single LLM provider (no fallback)
- No streaming output (full report arrives at once)
- English-only analysis

### References

- [S-04: LLM Integration](../system/S-04-llm-integration.md) - Prompt C
- [S-03: Database Schema](../system/S-03-database-schema.md) - damage_reports table

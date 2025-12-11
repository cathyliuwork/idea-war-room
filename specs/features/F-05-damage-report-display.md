# F-05: Damage Report Display

**Version**: 1.0
**Last Updated**: 2025-12-08
**Priority**: CRITICAL
**Status**: ✅ Spec Complete

---

## Quick Reference

**What**: Structured UI for displaying MVTA damage report - executive summary, vulnerabilities by vector, severity-coded cards, cascading failure chains, and recommendations.

**Why**: The damage report is the primary output users see. Must be scannable, professional, and actionable.

**Dependencies**:
- F-04: MVTA Red Team Simulation (generates damage report data)

**Used By**:
- F-06: Interactive Q&A Session (context for follow-up questions)
- F-07: Export & Sharing (content to export)
- F-08: Feedback Collection (users provide feedback on this display)

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
- [F-04: MVTA Red Team Simulation](./F-04-mvta-red-team-simulation.md) - Damage report data

### Required System Modules
- [S-03: Database Schema](../system/S-03-database-schema.md) - damage_reports table

---

## PRD: Product Requirements

### Overview

The Damage Report Display renders the MVTA analysis results in a structured, severity-coded format. The UI prioritizes critical threats (score 1-2) and provides clear visual hierarchy.

**Key Sections**:
1. **Executive Summary**: High-level overview with overall threat level
2. **Vector Sections**: 5 sections (one per threat vector) with vulnerability cards
3. **Cascading Failures**: Visual chains showing domino effects
4. **Recommendations**: Actionable next steps with priority indicators
5. **Evidence References**: Links to research data that informed analysis

**Visual Design**:
- **Score 1-2 (Critical)**: Red background, urgent visual treatment
- **Score 3 (Significant)**: Yellow/orange background
- **Score 4-5 (Moderate/Resilient)**: Green/gray background

---

### User Flow

**Step 1**: Analysis completes, user navigated to report
- User: Lands on `/analyze/[session_id]/report`
- System: Fetches damage report from database
- User: Sees page title: "Damage Report"

**Step 2**: Executive Summary
- User: Sees top section with:
  - Overall threat level (Critical/High/Moderate/Low)
  - Vulnerability count by severity
  - Key threats summary (top 3 critical vulnerabilities)

**Step 3**: Scroll through vector sections
- User: Scrolls to see 5 vector sections:
  1. Market & Economic Viability
  2. Technical & Product Integrity
  3. Social & Ethical Resonance
  4. Legal & Regulatory Compliance
  5. Narrative & Political Weaponization
- Each section shows:
  - Vector name
  - Overall vector score
  - List of vulnerability cards

**Step 4**: Inspect vulnerability cards
- User: Clicks or hovers on vulnerability card
- System: Expands card to show:
  - Full description
  - Detailed rationale
  - Evidence citations (links to research)
  - Related recommendations

**Step 5**: Review cascading failures
- User: Scrolls to "Cascading Failures" section
- System: Shows failure chains as flow diagrams
- User: Sees domino sequences (Event 1 → Event 2 → Event 3 → Failure)

**Step 6**: Action recommendations
- User: Scrolls to "Recommendations" section
- System: Shows prioritized list of next steps
- User: Sees action type badges (Customer Discovery, Pricing Experiment, etc.)

---

### UI Components

**Component 1: DamageReportHeader**
- **Location**: Top of report page
- **Purpose**: Executive summary
- **Elements**:
  - Page title: "Damage Report"
  - Overall threat badge (Critical/High/Moderate/Low)
  - Vulnerability count by severity
  - Quick stats (e.g., "5 critical vulnerabilities found")

**Component 2: VectorSection**
- **Location**: Main content area (repeated 5 times)
- **Purpose**: Group vulnerabilities by vector
- **Elements**:
  - Vector name (h2)
  - Vector overall score badge
  - Vector summary text
  - Grid of VulnerabilityCard components

**Component 3: VulnerabilityCard**
- **Location**: Inside VectorSection
- **Purpose**: Display one vulnerability
- **Elements**:
  - Severity indicator (color-coded border/background)
  - Simulation name (e.g., "Competitor War Game")
  - Description (2-3 sentences)
  - Score badge (1-5)
  - "View Details" expand button
  - (Expanded) Rationale text
  - (Expanded) Evidence links

**Component 4: CascadingFailureChain**
- **Location**: Cascading Failures section
- **Purpose**: Visualize failure sequences
- **Elements**:
  - Flow diagram (Event 1 → Event 2 → Event 3...)
  - Severity badge
  - Narrative text explaining the chain

**Component 5: RecommendationCard**
- **Location**: Recommendations section
- **Purpose**: Show actionable next step
- **Elements**:
  - Action type badge (Customer Discovery, Technical Spike, etc.)
  - Priority indicator (High/Medium/Low based on linked vulnerability score)
  - Description (1-2 specific steps)
  - Link to related vulnerability

---

### Business Rules

1. **Sorting**: Vulnerabilities sorted by score (1 first, 5 last) within each vector
2. **Color Coding**:
   - Score 1-2: Red (#DC2626)
   - Score 3: Orange (#F59E0B)
   - Score 4-5: Green (#10B981)
3. **Evidence Links**: Citations link to research snapshot (show competitor/community signal details)
4. **Expandable Cards**: Vulnerabilities start collapsed, expand on click
5. **Responsive Design**: Mobile-friendly (cards stack vertically on small screens)

---

### Acceptance Criteria

- [ ] Report displays all 5 vector sections
- [ ] Vulnerabilities are sorted by severity (critical first)
- [ ] Color coding matches severity (red/orange/green)
- [ ] Executive summary shows overall threat level
- [ ] Cascading failures displayed as visual chains
- [ ] Recommendations show action type badges
- [ ] Evidence citations link to research data
- [ ] Responsive layout works on mobile
- [ ] Report loads in < 500ms (data already in database)

---

## Technical Implementation

### API Endpoints

**Endpoint 1: GET /api/sessions/[sessionId]/report**

**Purpose**: Fetch complete damage report for display

**Response** (Success - 200):
```typescript
interface ReportResponse {
  report_id: string;
  created_at: string;
  vulnerabilities: Vulnerability[];
  cascading_failures: CascadingFailure[];
  vector_synthesis: VectorSummary[];
  recommendations: Recommendation[];
}
```

**Implementation**:
```typescript
// app/api/sessions/[sessionId]/report/route.ts
export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('damage_reports')
    .select('*')
    .eq('session_id', params.sessionId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Report not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    report_id: data.id,
    created_at: data.created_at,
    vulnerabilities: data.vulnerabilities,
    cascading_failures: data.cascading_failures,
    vector_synthesis: data.vector_synthesis,
    recommendations: data.recommendations
  });
}
```

---

### Frontend Components

**Component 1: DamageReportPage**

**File**: `src/app/analyze/[sessionId]/report/page.tsx`

**Implementation**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import VectorSection from '@/components/report/VectorSection';
import CascadingFailureChain from '@/components/report/CascadingFailureChain';
import RecommendationCard from '@/components/report/RecommendationCard';

export default function DamageReportPage({ params }: { params: { sessionId: string } }) {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const res = await fetch(`/api/sessions/${params.sessionId}/report`);
      const data = await res.json();
      setReport(data);
      setIsLoading(false);
    };

    fetchReport();
  }, [params.sessionId]);

  if (isLoading) {
    return <div>Loading report...</div>;
  }

  // Group vulnerabilities by vector
  const vectors = ['Market & Economic Viability', 'Technical & Product Integrity',
                   'Social & Ethical Resonance', 'Legal & Regulatory Compliance',
                   'Narrative & Political Weaponization'];

  const groupedVulnerabilities = vectors.map(vector => ({
    name: vector,
    vulnerabilities: report.vulnerabilities.filter(v => v.vector === vector),
    synthesis: report.vector_synthesis.find(s => s.vector === vector)
  }));

  // Calculate overall threat level
  const criticalCount = report.vulnerabilities.filter(v => v.score <= 2).length;
  const overallThreat = criticalCount >= 5 ? 'Critical' :
                        criticalCount >= 3 ? 'High' :
                        criticalCount >= 1 ? 'Moderate' : 'Low';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Damage Report</h1>
        <div className="flex items-center gap-4 mb-4">
          <span className={`px-4 py-2 rounded-full font-semibold ${
            overallThreat === 'Critical' ? 'bg-red-100 text-red-800' :
            overallThreat === 'High' ? 'bg-orange-100 text-orange-800' :
            overallThreat === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            Overall Threat: {overallThreat}
          </span>
          <span className="text-gray-600">
            {criticalCount} critical vulnerabilities
          </span>
        </div>
      </div>

      {/* Vector Sections */}
      {groupedVulnerabilities.map((vector, i) => (
        <VectorSection
          key={i}
          name={vector.name}
          vulnerabilities={vector.vulnerabilities}
          synthesis={vector.synthesis}
        />
      ))}

      {/* Cascading Failures */}
      {report.cascading_failures.length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Cascading Failures</h2>
          <div className="space-y-6">
            {report.cascading_failures.map((failure, i) => (
              <CascadingFailureChain key={i} failure={failure} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-6">Recommended Actions</h2>
        <div className="space-y-4">
          {report.recommendations.map((rec, i) => (
            <RecommendationCard
              key={i}
              recommendation={rec}
              linkedVulnerability={report.vulnerabilities[rec.risk_index]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Component 2: VulnerabilityCard**

**File**: `src/components/report/VulnerabilityCard.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function VulnerabilityCard({ vulnerability }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const severityColor = vulnerability.score <= 2 ? 'border-red-500 bg-red-50' :
                        vulnerability.score === 3 ? 'border-orange-500 bg-orange-50' :
                        'border-green-500 bg-green-50';

  return (
    <div className={`border-l-4 rounded-lg p-4 ${severityColor}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold">{vulnerability.simulation}</h4>
        <span className="px-2 py-1 rounded text-sm font-semibold">
          Score: {vulnerability.score}
        </span>
      </div>

      <p className="text-sm mb-2">{vulnerability.description}</p>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-blue-600 hover:underline"
      >
        {isExpanded ? 'Hide Details' : 'View Details'}
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-700 mb-3">
            <strong>Rationale:</strong> {vulnerability.rationale}
          </p>

          {vulnerability.evidence_refs && (
            <div className="text-xs text-gray-600">
              <strong>Evidence:</strong>
              {vulnerability.evidence_refs.competitors.length > 0 && (
                <span> {vulnerability.evidence_refs.competitors.length} competitors</span>
              )}
              {vulnerability.evidence_refs.community_signals.length > 0 && (
                <span>, {vulnerability.evidence_refs.community_signals.length} community signals</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Tests

### Tier 1 Critical Path Test

**Test Name**: `Damage Report Display - Happy Path`

**Description**: Verify damage report renders correctly with all sections.

**Preconditions**:
- Damage report exists in database

**Steps**:
1. Navigate to `/analyze/[sessionId]/report`
2. Verify executive summary displays
3. Verify all 5 vector sections render
4. Verify vulnerabilities sorted by severity
5. Verify color coding correct
6. Verify expand/collapse works

**Expected Results**:
- Report displays without errors
- All sections visible
- Severity colors correct

**Failure Impact**: ❌ **BLOCKS DEPLOYMENT**

---

### E2E Tests

```typescript
test('Damage report displays correctly', async ({ page }) => {
  const sessionId = await createSessionWithReport(page);

  await page.goto(`/analyze/${sessionId}/report`);

  await expect(page.locator('h1:has-text("Damage Report")')).toBeVisible();
  await expect(page.locator('text=/overall threat/i')).toBeVisible();
  await expect(page.locator('text=/market & economic viability/i')).toBeVisible();
});
```

---

## Notes

### Future Enhancements

- **Interactive Charts**: Visualize vulnerability distribution
- **Filter by Severity**: Show only critical vulnerabilities
- **Print View**: Optimized layout for printing
- **Annotations**: Allow users to add notes to vulnerabilities

### Known Limitations

- No real-time updates (report is static after generation)
- No collaborative commenting
- No comparison with previous analyses

### References

- [F-04: MVTA Red Team Simulation](./F-04-mvta-red-team-simulation.md) - Data source
- [S-01: UI/UX Design System](../system/S-01-uiux-design.md) - Design tokens

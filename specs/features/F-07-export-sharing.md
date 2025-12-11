# F-07: Export & Sharing

**Version**: 1.0
**Last Updated**: 2025-12-08
**Priority**: HIGH
**Status**: ✅ Spec Complete

---

## Quick Reference

**What**: Export damage report as markdown for easy sharing with co-founders, advisors, or investors.

**Why**: Founders need to share analysis results with stakeholders. Markdown format is portable and readable.

**Dependencies**:
- F-05: Damage Report Display (content to export)

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
- [F-05: Damage Report Display](./F-05-damage-report-display.md) - Report content

---

## PRD: Product Requirements

### Overview

The Export & Sharing feature allows founders to copy their damage report as formatted markdown. This enables:
- Sharing with co-founders via email/Slack
- Pasting into Notion, Google Docs, or Obsidian
- Version control (commit to Git)
- Offline review

**Export Format**: Markdown (.md) with:
- Structured headings
- Severity badges (emoji indicators)
- Bullet lists for vulnerabilities
- Tables for recommendations

**Target Action**: One-click "Copy as Markdown" button

---

### User Flow

**Step 1**: User views damage report
- User: Scrolls to top or bottom of report
- System: Shows "Export" button in prominent location

**Step 2**: Click export button
- User: Clicks "Copy as Markdown"
- System: Serializes damage report to markdown format
- System: Copies markdown to clipboard using `navigator.clipboard` API

**Step 3**: Confirmation
- User: Sees toast notification: "Report copied to clipboard!"
- System: Markdown is ready to paste anywhere

**Step 4**: Paste elsewhere
- User: Opens email, Notion, or text editor
- User: Pastes (Cmd+V / Ctrl+V)
- System: Markdown renders with proper formatting

---

### UI Components

**Component 1: ExportButton**
- **Location**: Top-right of damage report page
- **Purpose**: Trigger markdown export
- **Elements**:
  - Button text: "Copy as Markdown"
  - Icon: Clipboard or export icon
  - Hover state: Tooltip explaining action

**Component 2: ExportSuccessToast**
- **Location**: Bottom-right corner (temporary overlay)
- **Purpose**: Confirm successful copy
- **Elements**:
  - Success message: "Report copied to clipboard!"
  - Auto-dismiss after 3 seconds
  - Optional "Dismiss" button

---

### Business Rules

1. **Markdown Format**: Use standard markdown syntax
2. **Severity Indicators**: Use emoji for visual cues (🔴 Critical, 🟠 Significant, 🟢 Resilient)
3. **Section Structure**:
   - H1: Report title
   - H2: Vector names
   - H3: Vulnerability names
   - Lists: Bullet points for strengths/weaknesses
4. **Clipboard API**: Use `navigator.clipboard.writeText()` (fallback for unsupported browsers)
5. **No PII**: Markdown export is safe to share (no user email, session IDs, or private data)

---

### Acceptance Criteria

- [ ] "Copy as Markdown" button visible on report page
- [ ] Clicking button copies markdown to clipboard
- [ ] Toast notification confirms success
- [ ] Markdown format renders correctly when pasted
- [ ] All report sections included (vulnerabilities, cascading failures, recommendations)
- [ ] Severity indicators use emoji
- [ ] Clipboard API works in all major browsers

---

## Technical Implementation

### Markdown Serialization

**File**: `src/lib/export/markdown-serializer.ts`

```typescript
interface DamageReport {
  vulnerabilities: Vulnerability[];
  cascading_failures: CascadingFailure[];
  vector_synthesis: VectorSummary[];
  recommendations: Recommendation[];
}

export function serializeReportToMarkdown(report: DamageReport, ideaTitle: string): string {
  let markdown = `# ${ideaTitle} - MVTA Damage Report\n\n`;

  // Executive Summary
  const criticalCount = report.vulnerabilities.filter(v => v.score <= 2).length;
  markdown += `## Executive Summary\n\n`;
  markdown += `- **Critical Vulnerabilities**: ${criticalCount}\n`;
  markdown += `- **Total Vulnerabilities**: ${report.vulnerabilities.length}\n\n`;

  // Group by vector
  const vectors = ['Market & Economic Viability', 'Technical & Product Integrity',
                   'Social & Ethical Resonance', 'Legal & Regulatory Compliance',
                   'Narrative & Political Weaponization'];

  vectors.forEach(vector => {
    const vulns = report.vulnerabilities.filter(v => v.vector === vector);
    if (vulns.length === 0) return;

    markdown += `## ${vector}\n\n`;

    vulns.forEach(v => {
      const severityEmoji = v.score <= 2 ? '🔴' :
                            v.score === 3 ? '🟠' : '🟢';

      markdown += `### ${severityEmoji} ${v.simulation} (Score: ${v.score})\n\n`;
      markdown += `${v.description}\n\n`;
      markdown += `**Rationale**: ${v.rationale}\n\n`;
    });
  });

  // Cascading Failures
  if (report.cascading_failures.length > 0) {
    markdown += `## Cascading Failures\n\n`;

    report.cascading_failures.forEach((failure, i) => {
      markdown += `### Failure Chain ${i + 1}\n\n`;
      failure.chain.forEach((event, j) => {
        markdown += `${j + 1}. ${event}\n`;
      });
      markdown += `\n**Narrative**: ${failure.narrative}\n\n`;
    });
  }

  // Recommendations
  markdown += `## Recommended Actions\n\n`;

  report.recommendations.forEach((rec, i) => {
    markdown += `${i + 1}. **[${rec.action_type}]** ${rec.description}\n`;
  });

  markdown += `\n---\n\n*Generated by Idea War Room*\n`;

  return markdown;
}
```

---

### Frontend Implementation

**Component: ExportButton**

**File**: `src/components/report/ExportButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { serializeReportToMarkdown } from '@/lib/export/markdown-serializer';

export default function ExportButton({ report, ideaTitle }: { report: any; ideaTitle: string }) {
  const [showToast, setShowToast] = useState(false);

  const handleExport = async () => {
    const markdown = serializeReportToMarkdown(report, ideaTitle);

    try {
      await navigator.clipboard.writeText(markdown);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

    } catch (error) {
      // Fallback for unsupported browsers
      const textarea = document.createElement('textarea');
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy as Markdown
      </button>

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
          Report copied to clipboard!
        </div>
      )}
    </>
  );
}
```

---

## Tests

### Tier 1 Critical Path Test

**Test Name**: `Export as Markdown - Happy Path`

**Description**: Verify markdown export produces valid format.

**Steps**:
1. Click "Copy as Markdown" button
2. Verify clipboard contains markdown
3. Verify markdown includes all sections
4. Verify severity emoji indicators present

**Expected Results**:
- Markdown copied successfully
- All report sections included
- Format is valid markdown

**Failure Impact**: Low (not blocking MVP)

---

### Unit Tests

```typescript
import { serializeReportToMarkdown } from '@/lib/export/markdown-serializer';

describe('Markdown Serialization', () => {
  it('should serialize report to valid markdown', () => {
    const report = {
      vulnerabilities: [
        {
          vector: 'Market & Economic Viability',
          simulation: 'Competitor War Game',
          description: 'Strong competition',
          score: 2,
          rationale: 'Evidence-based',
          evidence_refs: { competitors: [], community_signals: [], regulatory_signals: [] }
        }
      ],
      cascading_failures: [],
      vector_synthesis: [],
      recommendations: [
        {
          risk_index: 0,
          action_type: 'Customer Discovery',
          description: 'Interview 10 users'
        }
      ]
    };

    const markdown = serializeReportToMarkdown(report, 'Test Idea');

    expect(markdown).toContain('# Test Idea - MVTA Damage Report');
    expect(markdown).toContain('## Market & Economic Viability');
    expect(markdown).toContain('🔴 Competitor War Game');
    expect(markdown).toContain('## Recommended Actions');
  });
});
```

---

## Notes

### Future Enhancements

- **PDF Export**: Generate PDF version
- **Email Sharing**: Send report via email directly
- **Public Links**: Generate shareable public links (with expiration)
- **CSV Export**: Export vulnerabilities as CSV for spreadsheet analysis

### Known Limitations

- Markdown only (no PDF, DOCX, or HTML export)
- No custom formatting options
- No embedded images or charts

### References

- [F-05: Damage Report Display](./F-05-damage-report-display.md) - Content source

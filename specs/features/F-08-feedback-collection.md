# F-08: Feedback Collection

**Version**: 1.0
**Last Updated**: 2025-12-08
**Priority**: MEDIUM
**Status**: ✅ Spec Complete

---

## Quick Reference

**What**: Collect user feedback on damage report quality (rating 1-5 + optional text feedback). Used for prompt tuning and quality monitoring.

**Why**: Feedback helps improve MVTA analysis quality over time. Identifies when prompts need tuning or analysis is missing real risks.

**Dependencies**:
- F-05: Damage Report Display (context for feedback)
- S-03: Database Schema (feedback table)

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
- [F-05: Damage Report Display](./F-05-damage-report-display.md) - Report context

### Required System Modules
- [S-03: Database Schema](../system/S-03-database-schema.md) - feedback table

---

## PRD: Product Requirements

### Overview

After reviewing their damage report, users can provide feedback on quality:
- **Rating**: 1-5 stars (required)
- **Feedback Text**: Optional free-form comments
- **Captured Real Risks**: Yes/No checkbox (required)

**Use Cases**:
- **Product Team**: Monitor analysis quality, identify prompt improvements
- **Users**: Feel heard, contribute to product improvement

**Target Interaction Time**: < 30 seconds

---

### User Flow

**Step 1**: User finishes reviewing damage report
- User: Scrolls to bottom of report page
- System: Shows feedback section with call-to-action

**Step 2**: Feedback prompt
- User: Sees: "How helpful was this analysis?"
- System: Displays:
  - 5-star rating selector
  - Checkbox: "This captured my real risks"
  - Optional text area: "Any suggestions?"
  - Submit button

**Step 3**: User provides rating
- User: Clicks 3 stars
- System: Highlights selected stars

**Step 4**: User adds optional feedback
- User: Types: "Competitor analysis was spot-on, but regulatory section was too generic"
- User: Checks "This captured my real risks"
- User: Clicks "Submit Feedback"

**Step 5**: Confirmation
- System: Saves feedback to database
- System: Shows toast: "Thank you for your feedback!"
- System: Hides feedback form (already submitted)

---

### UI Components

**Component 1: FeedbackSection**
- **Location**: Bottom of damage report page
- **Purpose**: Collect quality feedback
- **Elements**:
  - Heading: "How helpful was this analysis?"
  - 5-star rating selector (interactive)
  - Checkbox: "This captured my real risks"
  - Textarea: "Any suggestions to improve?" (optional, max 500 chars)
  - Submit button: "Submit Feedback"

**Component 2: StarRating**
- **Location**: Inside FeedbackSection
- **Purpose**: Visual rating selector
- **Elements**:
  - 5 star icons (filled/unfilled based on selection)
  - Hover effect (preview rating)
  - Click to lock rating

**Component 3: FeedbackSuccessToast**
- **Location**: Bottom-right corner
- **Purpose**: Confirm submission
- **Elements**:
  - Message: "Thank you for your feedback!"
  - Auto-dismiss after 3 seconds

---

### Business Rules

1. **One Submission Per Report**: Users can only submit feedback once per damage report
2. **Rating Required**: Must select 1-5 stars (cannot submit without rating)
3. **Checkbox Required**: "Captured real risks" checkbox must be checked or unchecked
4. **Text Optional**: Feedback text is optional (max 500 chars)
5. **Anonymous Collection**: Feedback is linked to damage report but user identity preserved (not public)
6. **No Editing**: Once submitted, feedback cannot be edited (to maintain data integrity)

---

### Acceptance Criteria

- [ ] Feedback section displays below damage report
- [ ] User can select rating (1-5 stars)
- [ ] User can check "Captured real risks" checkbox
- [ ] User can optionally add text feedback (max 500 chars)
- [ ] Submit button disabled until rating and checkbox provided
- [ ] Feedback saved to database on submit
- [ ] Toast confirmation shown after submission
- [ ] Form hidden after successful submission (prevent duplicate submissions)
- [ ] Feedback linked to correct damage report

---

## Technical Implementation

### API Endpoints

**Endpoint 1: POST /api/sessions/[sessionId]/feedback**

**Purpose**: Submit user feedback on damage report

**Request**:
```typescript
interface FeedbackRequest {
  damage_report_id: string;
  rating: number; // 1-5
  feedback_text?: string; // Optional
  captured_real_risks: boolean;
}
```

**Response** (Success - 201):
```typescript
interface FeedbackResponse {
  feedback_id: string;
  message: string;
}
```

**Error Codes**:
- `INVALID_RATING`: Rating not between 1-5
- `REPORT_NOT_FOUND`: Damage report doesn't exist
- `DUPLICATE_FEEDBACK`: Feedback already submitted for this report

**Implementation**:
```typescript
// app/api/sessions/[sessionId]/feedback/route.ts
export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { damage_report_id, rating, feedback_text, captured_real_risks } = await request.json();

  // Validate rating
  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'Rating must be between 1 and 5', code: 'INVALID_RATING' },
      { status: 400 }
    );
  }

  // Check for duplicate feedback
  const { data: existing } = await supabase
    .from('feedback')
    .select('id')
    .eq('damage_report_id', damage_report_id);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: 'Feedback already submitted', code: 'DUPLICATE_FEEDBACK' },
      { status: 400 }
    );
  }

  // Insert feedback
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      damage_report_id,
      rating,
      feedback_text: feedback_text || null,
      captured_real_risks
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    feedback_id: data.id,
    message: 'Thank you for your feedback!'
  }, { status: 201 });
}
```

---

### Database Schema

**Table: feedback** (from S-03)
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  damage_report_id UUID NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  captured_real_risks BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Frontend Components

**Component 1: FeedbackSection**

**File**: `src/components/report/FeedbackSection.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function FeedbackSection({
  sessionId,
  damageReportId
}: {
  sessionId: string;
  damageReportId: string;
}) {
  const [rating, setRating] = useState(0);
  const [capturedRisks, setCapturedRisks] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || capturedRisks === null) {
      alert('Please provide a rating and answer the checkbox question');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          damage_report_id: damageReportId,
          rating,
          feedback_text: feedbackText,
          captured_real_risks: capturedRisks
        })
      });

      if (!res.ok) {
        throw new Error('Submission failed');
      }

      setIsSubmitted(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

    } catch (error) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 font-medium">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-bold mb-4">How helpful was this analysis?</h2>

        {/* Star Rating */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="text-3xl focus:outline-none"
            >
              {star <= rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>

        {/* Captured Real Risks Checkbox */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={capturedRisks === true}
              onChange={(e) => setCapturedRisks(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-sm">This captured my real risks</span>
          </label>
        </div>

        {/* Optional Text Feedback */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Any suggestions to improve? (optional)
          </label>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What could be better?"
          />
          <p className="text-xs text-gray-500 mt-1">{feedbackText.length}/500 characters</p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || capturedRisks === null || isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
          Thank you for your feedback!
        </div>
      )}
    </>
  );
}
```

---

## Tests

### Tier 1 Critical Path Test

**Test Name**: `Feedback Submission - Happy Path`

**Description**: Verify user can submit feedback successfully.

**Steps**:
1. Navigate to damage report page
2. Scroll to feedback section
3. Select 4-star rating
4. Check "Captured real risks" checkbox
5. Enter optional text
6. Click "Submit Feedback"
7. Verify feedback saved to database

**Expected Results**:
- Feedback saved with correct rating and text
- Toast confirmation shown
- Form hidden after submission

**Failure Impact**: Low (not blocking MVP)

---

### E2E Tests

```typescript
test('User can submit feedback', async ({ page }) => {
  const sessionId = await createSessionWithReport(page);

  await page.goto(`/analyze/${sessionId}/report`);
  await page.scrollTo('text=/how helpful/i');

  // Select 4 stars
  await page.click('button:has-text("⭐"):nth-child(4)');

  // Check checkbox
  await page.check('input[type="checkbox"]');

  // Optional text
  await page.fill('textarea', 'Great analysis!');

  // Submit
  await page.click('button:has-text("Submit Feedback")');

  await expect(page.locator('text=/thank you/i')).toBeVisible();
});
```

---

### Integration Tests

```typescript
describe('POST /api/sessions/[sessionId]/feedback', () => {
  it('should save feedback to database', async () => {
    const { sessionId, reportId } = await createSessionWithReport();

    const response = await fetch(`/api/sessions/${sessionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        damage_report_id: reportId,
        rating: 4,
        feedback_text: 'Helpful analysis',
        captured_real_risks: true
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('feedback_id');
  });

  it('should reject invalid rating', async () => {
    const { sessionId, reportId } = await createSessionWithReport();

    const response = await fetch(`/api/sessions/${sessionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        damage_report_id: reportId,
        rating: 6, // Invalid
        captured_real_risks: true
      })
    });

    expect(response.status).toBe(400);
  });
});
```

---

## Notes

### Future Enhancements

- **Detailed Feedback**: Ask specific questions (e.g., "Which section was most helpful?")
- **Follow-up Questions**: AI asks clarifying questions based on low ratings
- **Public Reviews**: Allow users to optionally share testimonials
- **Feedback Dashboard**: Admin view of aggregate feedback metrics

### Known Limitations

- One submission per report (no editing)
- No AI analysis of feedback text (manual review required)
- No follow-up communication with users based on feedback

### References

- [S-03: Database Schema](../system/S-03-database-schema.md) - feedback table
- [F-05: Damage Report Display](./F-05-damage-report-display.md) - Context

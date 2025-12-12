# F-02: Idea Intake Form

> **归档说明**: 此规格描述的是旧版AI提取模式（已废弃）。
> 新版本采用表单直接输入模式，详见当前的 `specs/features/F-02-idea-intake-form.md`
> 归档日期: 2025-12-11

**Version**: 1.0
**Last Updated**: 2025-12-08
**Priority**: CRITICAL
**Status**: ✅ Spec Complete

---

## Quick Reference

**What**: Conversational multi-step form for capturing founder's raw idea and converting it into MVTA-structured format using LLM (Prompt A).

**Why**: The intake form is the entry point for all MVTA analyses. It must be simple, non-intimidating, and produce high-quality structured data for downstream analysis.

**Dependencies**:
- F-01: External Authentication Integration (authenticates user, provides user context)
- S-03: Database Schema (ideas table, sessions table)
- S-04: LLM Integration (Prompt A for idea structuring)

**Used By**:
- F-03: Research Engine (uses structured idea to generate queries)
- F-04: MVTA Red Team Simulation (analyzes structured idea)

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

### Required System Modules
- [S-03: Database Schema](../system/S-03-database-schema.md) - `sessions` and `ideas` tables
- [S-04: LLM Integration](../system/S-04-llm-integration.md) - Prompt A for structuring raw input

### External Services
- AI Builders API - LLM for idea structuring

---

## PRD: Product Requirements

### Overview

The Idea Intake Form is the first step in the MVTA analysis workflow. Founders describe their startup idea in free-form text, answering 5-7 key questions. The system uses LLM (Prompt A) to convert these raw answers into a structured MVTA JSON format that downstream features can process.

**Key Design Goals**:
1. **Low friction**: No jargon, no complex fields, just conversational questions
2. **Progressive disclosure**: Show one question at a time (wizard-style)
3. **Flexibility**: Allow founders to write as much or as little as they want
4. **Transparency**: Show AI processing step ("Structuring your idea...")
5. **Review step**: Let founders review structured output before proceeding

**Target Completion Time**: 5-10 minutes

---

### User Flow

**Step 1**: User lands on dashboard, clicks "Analyze New Idea"
- User: Clicks "Analyze New Idea" button on dashboard
- System: Creates new session (status='intake'), navigates to `/analyze/[session_id]/intake`

**Step 2**: Introduction screen
- User: Sees welcome message explaining the process
- System: Displays:
  - "Let's validate your idea with MVTA"
  - "Answer 5-7 questions about your startup (takes 5-10 minutes)"
  - "We'll structure your answers and run a red team analysis"
  - "Start" button

**Step 3**: Question 1 - High-Level Concept
- User: Sees question: "What's your idea? (Describe it in 1-2 sentences)"
- System: Shows textarea, "Next" button
- User: Enters answer, clicks "Next"
- System: Saves answer to local state, advances to Q2

**Step 4**: Question 2 - Problem & Value Proposition
- User: Sees question: "What problem does this solve, and for whom?"
- System: Shows textarea, "Back" and "Next" buttons
- User: Enters answer, clicks "Next"

**Step 5**: Question 3 - Success Metric
- User: Sees question: "What does success look like in 18 months? (Be specific)"
- User: Enters answer, clicks "Next"

**Step 6**: Question 4 - Assumptions
- User: Sees question: "What are you assuming about the market, technology, or business model?"
- User: Enters answer (can leave blank), clicks "Next"

**Step 7**: Question 5 - Assets & Advantages
- User: Sees question: "What unique advantages do you have? (Skills, connections, distribution, IP, etc.)"
- User: Enters answer (can leave blank), clicks "Next"

**Step 8**: Question 6 - Target Users & Market
- User: Sees question: "Who are your target users, and who are the main competitors?"
- User: Enters answer, clicks "Next"

**Step 9**: Question 7 - Regulatory Context (Optional)
- User: Sees question: "Are there any legal or regulatory considerations? (Leave blank if not applicable)"
- User: Enters answer or skips, clicks "Submit"

**Step 10**: Processing
- User: Sees loading spinner with message "Structuring your idea using MVTA framework..."
- System: Calls LLM (Prompt A) to convert raw answers into structured JSON
- System: Saves structured idea to database (ideas table)

**Step 11**: Review Structured Output
- User: Sees structured idea displayed in cards:
  - High Concept
  - Value Proposition
  - Success Metric (18 months)
  - Market Assumptions
  - Technical Assumptions
  - Business Model Assumptions
  - Key Assets
  - Brand Narrative
  - Target User Persona
  - Competitive Landscape
  - Regulatory Context
- System: Shows "Looks good? Proceed to Research" button and "Edit" button
- User: Reviews, clicks "Proceed to Research"
- System: Updates session status to 'research', navigates to `/analyze/[session_id]/research`

---

### UI Components

**Component 1: IntakeWizard**
- **Location**: `/analyze/[session_id]/intake` route
- **Purpose**: Multi-step form wrapper
- **Elements**:
  - Progress indicator (Step X of 7)
  - Current question display
  - Textarea input
  - Navigation buttons ("Back", "Next", "Submit")
  - Auto-save indicator

**Component 2: QuestionCard**
- **Location**: Inside IntakeWizard
- **Purpose**: Display one question at a time
- **Elements**:
  - Question title (large, clear)
  - Helper text (optional, smaller font)
  - Textarea (auto-expanding, min 3 rows, max 10 rows)
  - Character counter (optional)

**Component 3: StructuredIdeaReview**
- **Location**: `/analyze/[session_id]/intake/review` route
- **Purpose**: Show structured MVTA output for founder review
- **Elements**:
  - Card grid (2 columns on desktop, 1 on mobile)
  - Each card shows one MVTA field
  - "Edit Answers" button (returns to Step 1 with saved answers)
  - "Proceed to Research" button

**Component 4: ProcessingSpinner**
- **Location**: Between form submission and review
- **Purpose**: Transparency during LLM processing
- **Elements**:
  - Animated spinner
  - Status message ("Structuring your idea...")
  - Estimated time ("This takes ~30 seconds")

---

### Business Rules

1. **Session Creation**: A new session is created when user clicks "Analyze New Idea" (status='intake')
2. **Auto-save**: Answers are saved to session state every 5 seconds (local storage fallback)
3. **Navigation**: Users can go back to previous questions and edit answers
4. **Required Fields**: Questions 1, 2, 3, and 6 are required; others are optional
5. **LLM Processing**: Prompt A converts raw answers into structured JSON (see S-04)
6. **Validation**: Structured output must match MVTA schema (Zod validation)
7. **Retry Logic**: If LLM fails, show error and retry button (max 3 retries)

---

### Acceptance Criteria

- [ ] User can start new analysis session from dashboard
- [ ] Form shows one question at a time (wizard style)
- [ ] User can navigate back to previous questions
- [ ] User can submit form after answering required questions
- [ ] System calls LLM (Prompt A) to structure raw answers
- [ ] Structured idea is saved to database (ideas table)
- [ ] User sees review screen with structured output
- [ ] User can proceed to research phase after reviewing
- [ ] Error handling: Show clear message if LLM fails, allow retry
- [ ] Auto-save: Answers persist if user refreshes page

---

## Technical Implementation

### API Endpoints

**Endpoint 1: POST /api/sessions**

**Purpose**: Create new MVTA analysis session

**Request**: No body required (user ID from auth token)

**Response** (Success - 201):
```typescript
interface CreateSessionResponse {
  session_id: string;
  status: 'intake';
  created_at: string;
}
```

**Implementation**:
```typescript
// app/api/sessions/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // Use custom auth middleware instead of Supabase Auth
  const { supabase, user } = await createAuthenticatedSupabaseClient();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      status: 'intake'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    session_id: data.id,
    status: data.status,
    created_at: data.created_at
  }, { status: 201 });
}
```

---

**Endpoint 2: POST /api/sessions/[sessionId]/ideas**

**Purpose**: Submit raw idea answers and structure with LLM

**Request**:
```typescript
interface SubmitIdeaRequest {
  raw_input: string; // Concatenated answers from all questions
}
```

**Response** (Success - 201):
```typescript
interface SubmitIdeaResponse {
  idea_id: string;
  structured_idea: StructuredIdea; // MVTA JSON schema
}
```

**Error Codes**:
- `SESSION_NOT_FOUND`: Session ID invalid
- `LLM_FAILED`: LLM structuring failed (suggest retry)
- `VALIDATION_FAILED`: Structured output doesn't match schema

**Implementation**:
```typescript
// app/api/sessions/[sessionId]/ideas/route.ts
import { structureIdea } from '@/lib/llm/prompts';
import { validateStructuredIdea } from '@/lib/validation/idea-schema';

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { raw_input } = await request.json();

  // Verify session exists and belongs to user
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      { status: 404 }
    );
  }

  try {
    // Call LLM (Prompt A) to structure idea
    const structured_idea = await structureIdea(raw_input);

    // Validate output
    const validatedIdea = validateStructuredIdea(structured_idea);

    // Save to database
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .insert({
        session_id: params.sessionId,
        raw_input,
        structured_idea: validatedIdea
      })
      .select()
      .single();

    if (ideaError) {
      return NextResponse.json({ error: ideaError.message }, { status: 500 });
    }

    return NextResponse.json({
      idea_id: idea.id,
      structured_idea: validatedIdea
    }, { status: 201 });

  } catch (error) {
    console.error('Idea structuring failed:', error);

    return NextResponse.json({
      error: 'Failed to structure idea. Please try again.',
      code: 'LLM_FAILED'
    }, { status: 500 });
  }
}
```

---

### Database Schema

**Table: sessions** (from S-03)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'intake' CHECK (status IN ('intake', 'research', 'analysis', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Table: ideas** (from S-03)
```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  raw_input TEXT NOT NULL,
  structured_idea JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Frontend Components

**Component 1: IntakeWizard**

**File**: `src/components/intake/IntakeWizard.tsx`

**Props**:
```typescript
interface IntakeWizardProps {
  sessionId: string;
}
```

**State**:
```typescript
const [currentStep, setCurrentStep] = useState(0);
const [answers, setAnswers] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

**Questions Array**:
```typescript
const QUESTIONS = [
  {
    id: 'high_concept',
    title: "What's your idea?",
    helper: "Describe it in 1-2 sentences. What does it do?",
    required: true
  },
  {
    id: 'problem_value',
    title: "What problem does this solve, and for whom?",
    helper: "Who experiences this pain point?",
    required: true
  },
  {
    id: 'success_metric',
    title: "What does success look like in 18 months?",
    helper: "Be specific: revenue, users, impact?",
    required: true
  },
  {
    id: 'assumptions',
    title: "What are you assuming?",
    helper: "About the market, technology, or business model",
    required: false
  },
  {
    id: 'assets',
    title: "What unique advantages do you have?",
    helper: "Skills, connections, distribution, IP, etc.",
    required: false
  },
  {
    id: 'target_users',
    title: "Who are your target users and main competitors?",
    helper: "Be as specific as possible",
    required: true
  },
  {
    id: 'regulatory',
    title: "Any legal or regulatory considerations?",
    helper: "Leave blank if not applicable",
    required: false
  }
];
```

**Example Implementation**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionCard from './QuestionCard';
import ProcessingSpinner from './ProcessingSpinner';

export default function IntakeWizard({ sessionId }: IntakeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const currentQuestion = QUESTIONS[currentStep];
  const isLastStep = currentStep === QUESTIONS.length - 1;

  const handleNext = () => {
    if (currentQuestion.required && !answers[currentQuestion.id]?.trim()) {
      alert('This question is required');
      return;
    }

    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Concatenate all answers into raw_input
    const raw_input = QUESTIONS.map(q =>
      `Q: ${q.title}\nA: ${answers[q.id] || 'N/A'}\n`
    ).join('\n');

    try {
      const res = await fetch(`/api/sessions/${sessionId}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_input })
      });

      if (!res.ok) {
        throw new Error('Submission failed');
      }

      const data = await res.json();

      // Navigate to review page
      router.push(`/analyze/${sessionId}/intake/review`);

    } catch (error) {
      alert('Failed to process your idea. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <ProcessingSpinner message="Structuring your idea using MVTA framework..." />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="text-sm text-gray-600 mb-2">
          Step {currentStep + 1} of {QUESTIONS.length}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      <QuestionCard
        question={currentQuestion}
        value={answers[currentQuestion.id] || ''}
        onChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: value })}
      />

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isLastStep ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
```

---

**Component 2: QuestionCard**

**File**: `src/components/intake/QuestionCard.tsx`

**Props**:
```typescript
interface QuestionCardProps {
  question: {
    id: string;
    title: string;
    helper: string;
    required: boolean;
  };
  value: string;
  onChange: (value: string) => void;
}
```

**Implementation**:
```typescript
export default function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-2">
        {question.title}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </h2>

      {question.helper && (
        <p className="text-gray-600 mb-4">{question.helper}</p>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[120px] max-h-[300px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        placeholder="Type your answer here..."
      />
    </div>
  );
}
```

---

**Component 3: StructuredIdeaReview**

**File**: `src/components/intake/StructuredIdeaReview.tsx`

**Props**:
```typescript
interface StructuredIdeaReviewProps {
  sessionId: string;
  structuredIdea: StructuredIdea;
}
```

**Implementation**:
```typescript
'use client';

import { useRouter } from 'next/navigation';

export default function StructuredIdeaReview({
  sessionId,
  structuredIdea
}: StructuredIdeaReviewProps) {
  const router = useRouter();

  const handleProceed = () => {
    router.push(`/analyze/${sessionId}/research`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Review Your Structured Idea</h1>
      <p className="text-gray-600 mb-8">
        We've structured your idea using the MVTA framework. Review and proceed to research.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* High Concept */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">High Concept</h3>
          <p className="text-lg">{structuredIdea.high_concept}</p>
        </div>

        {/* Value Proposition */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Value Proposition</h3>
          <p className="text-lg">{structuredIdea.value_proposition}</p>
        </div>

        {/* Success Metric */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Success Metric (18m)</h3>
          <p className="text-lg">{structuredIdea.success_metric_18m}</p>
        </div>

        {/* Assumptions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Key Assumptions</h3>
          <div className="space-y-2">
            {structuredIdea.assumptions.market.map((a, i) => (
              <p key={i} className="text-sm">• {a}</p>
            ))}
            {structuredIdea.assumptions.technical.map((a, i) => (
              <p key={i} className="text-sm">• {a}</p>
            ))}
            {structuredIdea.assumptions.business_model.map((a, i) => (
              <p key={i} className="text-sm">• {a}</p>
            ))}
          </div>
        </div>

        {/* Key Assets */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Key Assets</h3>
          <div className="space-y-2">
            {structuredIdea.assets.key_assets.map((a, i) => (
              <p key={i} className="text-sm">• {a}</p>
            ))}
          </div>
        </div>

        {/* Environment */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Target Market</h3>
          <p className="text-sm mb-2"><strong>User:</strong> {structuredIdea.environment.user_persona}</p>
          <p className="text-sm"><strong>Competitors:</strong> {structuredIdea.environment.competitive_landscape}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Edit Answers
        </button>

        <button
          onClick={handleProceed}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Looks Good - Proceed to Research
        </button>
      </div>
    </div>
  );
}
```

---

### State Management

**Local Storage (Auto-save)**:
```typescript
// src/lib/intake/auto-save.ts
export function saveAnswersToLocalStorage(sessionId: string, answers: Record<string, string>) {
  localStorage.setItem(`intake-${sessionId}`, JSON.stringify(answers));
}

export function loadAnswersFromLocalStorage(sessionId: string): Record<string, string> {
  const saved = localStorage.getItem(`intake-${sessionId}`);
  return saved ? JSON.parse(saved) : {};
}

export function clearAnswersFromLocalStorage(sessionId: string) {
  localStorage.removeItem(`intake-${sessionId}`);
}
```

---

### Prompt Engineering

**See [S-04: LLM Integration](../system/S-04-llm-integration.md) for complete Prompt A definition.**

**Summary of Prompt A**:
- **Input**: Raw concatenated answers from 7 questions
- **Output**: Structured JSON matching MVTA schema
- **Rules**: No fabrication, extract key points only, use empty strings/arrays if data missing

---

## Tests

### Tier 1 Critical Path Test

**Test Name**: `Idea Intake and Structuring - Happy Path`

**Description**: Verify that a user can complete the intake form, submit answers, and receive structured MVTA output.

**Preconditions**:
- User is authenticated
- Session is created (status='intake')
- AI Builders API is accessible

**Steps**:
1. Navigate to `/analyze/[session_id]/intake`
2. Fill in Question 1: "An AI-powered email assistant for busy founders"
3. Click "Next"
4. Fill in Question 2: "Founders waste 2 hours/day on email. This automates responses."
5. Click "Next"
6. Fill in Question 3: "10,000 paying users at $20/mo = $200K MRR"
7. Continue through remaining questions (can skip optional ones)
8. Click "Submit"
9. Wait for LLM processing
10. Verify structured idea is saved to database
11. Verify review page displays structured output
12. Verify "Proceed to Research" button navigates correctly

**Expected Results**:
- Form accepts all answers
- LLM returns valid structured JSON
- Structured idea is saved to `ideas` table with correct session_id
- Review page displays all MVTA fields correctly
- No errors during submission

**Failure Impact**: ❌ **BLOCKS DEPLOYMENT** (Tier 1 tests must pass)

---

### E2E Tests

**Test 1: Complete Intake Flow**
```typescript
import { test, expect } from '@playwright/test';

test('User can complete intake form and review structured idea', async ({ page }) => {
  // Precondition: User logged in, session created
  const sessionId = await createTestSession(page);

  await page.goto(`/analyze/${sessionId}/intake`);

  // Step 1: Answer Question 1
  await page.fill('textarea', 'An AI coding assistant for React developers');
  await page.click('button:has-text("Next")');

  // Step 2: Answer Question 2
  await page.fill('textarea', 'React developers struggle with boilerplate code and debugging');
  await page.click('button:has-text("Next")');

  // Step 3: Answer Question 3
  await page.fill('textarea', '50,000 active users and $100K MRR');
  await page.click('button:has-text("Next")');

  // Skip optional questions (click Next without filling)
  await page.click('button:has-text("Next")'); // Q4
  await page.click('button:has-text("Next")'); // Q5

  // Step 6: Answer Question 6
  await page.fill('textarea', 'Target: Frontend developers at startups. Competitors: GitHub Copilot, Cursor');
  await page.click('button:has-text("Next")');

  // Step 7: Skip regulatory question
  await page.click('button:has-text("Submit")');

  // Wait for processing
  await expect(page.locator('text=/structuring your idea/i')).toBeVisible();

  // Verify review page loads
  await expect(page).toHaveURL(new RegExp(`/analyze/${sessionId}/intake/review`));
  await expect(page.locator('text=/high concept/i')).toBeVisible();
  await expect(page.locator('text=/value proposition/i')).toBeVisible();
});
```

**Test 2: Required Field Validation**
```typescript
test('Cannot proceed without required fields', async ({ page }) => {
  const sessionId = await createTestSession(page);

  await page.goto(`/analyze/${sessionId}/intake`);

  // Try to skip required question
  await page.click('button:has-text("Next")');

  await expect(page.locator('text=/required/i')).toBeVisible();
});
```

---

### Integration Tests

**Test 1: Idea Submission API**
```typescript
describe('POST /api/sessions/[sessionId]/ideas', () => {
  it('should structure idea using LLM and save to database', async () => {
    const sessionId = await createTestSessionInDb();

    const response = await fetch(`/api/sessions/${sessionId}/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_input: 'Q: What is your idea?\nA: An AI email assistant for founders'
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data).toHaveProperty('idea_id');
    expect(data.structured_idea).toHaveProperty('high_concept');
    expect(data.structured_idea).toHaveProperty('value_proposition');
    expect(data.structured_idea).toHaveProperty('assumptions');
  });

  it('should fail if session does not exist', async () => {
    const response = await fetch('/api/sessions/invalid-id/ideas', {
      method: 'POST',
      body: JSON.stringify({ raw_input: 'test' })
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe('SESSION_NOT_FOUND');
  });
});
```

**Test 2: LLM Prompt Validation**
```typescript
describe('LLM Prompt A - Idea Structuring', () => {
  it('should return valid MVTA JSON schema', async () => {
    const rawInput = `
      Q: What's your idea?
      A: A SaaS tool for email marketing automation targeted at SMBs.

      Q: What problem does this solve?
      A: SMBs can't afford Mailchimp and find it too complex.
    `;

    const structured = await structureIdea(rawInput);

    expect(structured).toHaveProperty('high_concept');
    expect(structured).toHaveProperty('value_proposition');
    expect(structured).toHaveProperty('assumptions');
    expect(Array.isArray(structured.assumptions.market)).toBe(true);
  });
});
```

---

### Unit Tests

**Test 1: Answer Validation**
```typescript
import { validateAnswers } from '@/lib/intake/validation';

describe('Answer Validation', () => {
  it('should reject when required fields are empty', () => {
    const answers = {
      high_concept: '',
      problem_value: 'Some text',
      success_metric: 'Some text'
    };

    expect(validateAnswers(answers)).toBe(false);
  });

  it('should accept when all required fields are filled', () => {
    const answers = {
      high_concept: 'AI assistant',
      problem_value: 'Solve X for Y',
      success_metric: '100K users',
      target_users: 'Developers'
    };

    expect(validateAnswers(answers)).toBe(true);
  });
});
```

---

## Notes

### Future Enhancements

- **Voice Input**: Allow founders to speak their answers (transcribe to text)
- **Example Ideas**: Show sample answers for inspiration
- **Save Draft**: Allow users to save incomplete forms and resume later
- **Collaborative Input**: Allow co-founders to contribute to answers
- **Multi-language Support**: Translate questions and accept non-English answers
- **Idea Templates**: Pre-fill questions based on industry (SaaS, marketplace, B2B)

### Known Limitations

- No real-time collaboration (single user fills form)
- LLM structuring is one-way (can't edit structured output directly)
- No version history for answers
- Auto-save relies on localStorage (not synced to server until submission)

### References

- [S-04: LLM Integration](../system/S-04-llm-integration.md) - Prompt A details
- [S-03: Database Schema](../system/S-03-database-schema.md) - ideas table schema

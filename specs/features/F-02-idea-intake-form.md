# F-02: Idea Intake Form

**Version**: 2.0
**Last Updated**: 2025-12-11
**Priority**: CRITICAL
**Status**: 📝 Spec In Progress

---

## Change History
- **v2.0 (2025-12-11)**: Changed from AI extraction to direct form input (3-step wizard)
- **v1.0 (2025-12-08)**: Initial version (AI extraction mode, archived at `specs/archive/old/F-02-idea-intake-form-ai-extraction.md`)

---

## Quick Reference

**What**: 3-step wizard form where users directly fill structured fields to generate MVTA-formatted data (no AI extraction needed)

**Why**:
- Increase efficiency: Direct input is faster than AI extraction (no 30+ second LLM wait)
- Increase accuracy: Users directly control each field content, avoiding AI misinterpretation
- Reduce cost: Remove LLM dependency (save ~$0.02 per submission)
- Simplify flow: Fewer processing steps, smoother user experience

**Key Changes** (vs v1.0):
- ❌ Removed: AI extraction flow (Prompt A call)
- ❌ Removed: 7 free-text questions
- ✅ Added: 3-step structured form
- ✅ Added: Dynamic array input component (for assumptions, assets fields)
- ✅ Added: Auto-save to localStorage (2-second debounce)
- ✅ Added: Field-level real-time validation
- ✅ Added: Character counter

**Dependencies**:
- F-01: External Authentication Integration (authenticates user)
- S-03: Database Schema (ideas table, sessions table) **Needs source field added**

**Used By**:
- F-03: Research Engine (uses structured idea to generate queries)
- F-04: MVTA Red Team Simulation (analyzes structured idea)

**Implementation Status**:
- [x] PRD documented
- [ ] Technical design complete
- [ ] Tests defined
- [ ] Implementation started
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Deployed to production

---

## PRD: Product Requirements

### Overview

3-step wizard form where users directly fill MVTA framework fields. Replaces the previous "free-text → AI extraction" model with full user control over data entry.

**3-Step Wizard Design**:

1. **Step 1: Core Concept** (Required)
   - high_concept (single-line, 150 chars)
   - value_proposition (multi-line, 300 chars)
   - success_metric_18m (single-line, 150 chars)

2. **Step 2: Environment & Context** (Partially Required)
   - user_persona (required, multi-line, 300 chars)
   - competitive_landscape (required, multi-line, 400 chars)
   - regulatory_context (optional, multi-line, 400 chars)

3. **Step 3: Assumptions & Assets** (Optional)
   - assumptions: market / technical / business_model (dynamic arrays)
   - assets: key_assets / brand_narrative (dynamic arrays)

**Target Completion Time**: 8-12 minutes

**Key Design Principles**:
- **Progressive disclosure**: Show only relevant fields per step, avoid information overload
- **Clear required/optional indicators**: Users know exactly what must be filled
- **Real-time feedback**: Character counters, validation errors display immediately
- **Data persistence**: Auto-save prevents data loss
- **Mobile-friendly**: Responsive design for phones and tablets

---

### User Flow

**Main Flow**:

1. **Start Analysis Session**
   - User: Clicks "Analyze New Idea" on dashboard
   - System: Creates new session (status='intake'), navigates to `/analyze/[sessionId]/intake`

2. **Step 1: Fill Core Concept**
   - User: Sees Step 1 form (Progress: 33%)
   - User: Fills high_concept (required, single-line, 150 char limit)
   - User: Fills value_proposition (required, multi-line, 300 char limit)
   - User: Fills success_metric_18m (required, single-line, 150 char limit)
   - System: Displays real-time character counter (e.g., "45 / 150")
   - System: Auto-saves to localStorage after 2 seconds
   - User: Clicks "Next"
   - System: Validates required fields, proceeds to Step 2 if valid

3. **Step 2: Fill Environment & Context**
   - User: Sees Step 2 form (Progress: 67%)
   - User: Fills user_persona (required, multi-line, 300 chars)
   - User: Fills competitive_landscape (required, multi-line, 400 chars)
   - User: Fills regulatory_context (optional, multi-line, 400 chars)
   - User: Clicks "Next"
   - System: Validates required fields, proceeds to Step 3 if valid

4. **Step 3: Fill Assumptions & Assets**
   - User: Sees Step 3 form (Progress: 100%)
   - User: **Assumptions** (optional):
     - Clicks "+ Add Market Assumption" → new input field appears
     - Fills market assumption (200 char limit per item)
     - Clicks "X" to remove an assumption
     - Same for: technical assumptions, business model assumptions
   - User: **Assets** (optional):
     - Clicks "+ Add Key Asset" → new input field appears
     - Fills key asset (150 char limit per item)
     - Same for: brand narrative
   - System: All fields optional, user can skip entire step
   - User: Clicks "Submit & Continue"
   - System: Validates entire form
   - System: Calls `POST /api/sessions/[sessionId]/idea` (no LLM call)
   - System: Saves to database (source='form')
   - System: Updates session status='research'
   - System: Navigates to `/analyze/[sessionId]/research`

**Error Handling**:
- **Validation failure**: Display red error text below field, red border on field
- **API failure**: Display toast notification at top, allow retry
- **Network disconnection**: Data already saved in localStorage, restore on reload

**Edge Cases**:
- **Exit mid-flow**: localStorage draft preserved, restore on return
- **Go back**: All filled data retained
- **Duplicate submission**: Backend checks if session already has idea, prevent duplicate creation

---

### UI Components

#### Component 1: IntakeWizard (Main Container)

**Location**: `/analyze/[sessionId]/intake`

**Purpose**: Manage 3-step wizard state machine, coordinate step components

**State**:
```typescript
const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
const [formData, setFormData] = useState<Partial<StructuredIdea>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

**Features**:
- react-hook-form integration
- Zod validation
- localStorage auto-save (2-second debounce)
- Step navigation
- Progress indicator

---

#### Component 2: ArrayFieldInput (Dynamic Array Input)

**Purpose**: Reusable component for assumptions, assets array fields

**Props**:
```typescript
interface ArrayFieldInputProps {
  label: string;              // "Market Assumptions"
  helperText?: string;        // "What are your key assumptions about..."
  maxLength: number;          // Max chars per item (e.g., 200)
  placeholder: string;        // "e.g., Solo founders spend..."
  values: string[];           // Current value array
  onChange: (values: string[]) => void;
}
```

**UI Pattern**:
```
┌─────────────────────────────────────────────────────────┐
│ Market Assumptions                                       │
│ What are your key assumptions about the market?          │
│ ───────────────────────────────────────────────────────  │
│                                                          │
│ [Solo founders willing to pay $20/mo for validation  ] [X] 178/200 │
│ [No existing tools focus on MVTA methodology        ] [X] 45/200  │
│ [+ Add Another Market Assumption]                        │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Dynamic add/remove input fields
- Independent character counter per item
- "X" button to delete (minimum 0 items)
- "+ Add" button

---

#### Component 3: Step1CoreConcept

**Fields**:
1. **High Concept** (single-line input)
   - Label: "Describe your idea in one sentence"
   - Placeholder: "A platform that helps solo founders validate startup ideas through AI-powered adversarial analysis"
   - Max: 150 chars
   - Required: true

2. **Value Proposition** (textarea)
   - Label: "What problem does this solve, and for whom?"
   - Placeholder: "Founders spend weeks gathering feedback, only to realize critical flaws too late. We help solo founders and early-stage entrepreneurs identify risks before investing time and money."
   - Max: 300 chars
   - Rows: 4
   - Required: true

3. **Success Metric (18m)** (single-line input)
   - Label: "What does success look like in 18 months? (Be specific and measurable)"
   - Placeholder: "10,000 validated ideas with 70% accuracy on risk prediction"
   - Max: 150 chars
   - Required: true

---

#### Component 4: Step2Environment

**Fields**:

1. **User Persona** (textarea)
   - Label: "Target User Persona"
   - Placeholder: "Solo founders and early-stage entrepreneurs (25-45 years old) who are technical enough to understand product development but lack market validation experience"
   - Max: 300 chars
   - Rows: 4
   - Required: true

2. **Competitive Landscape** (textarea)
   - Label: "Competitive Landscape"
   - Placeholder: "Similar tools: ProductHunt validation, BetaList feedback, Reddit communities. None combine automated research with adversarial analysis."
   - Max: 400 chars
   - Rows: 5
   - Required: true

3. **Regulatory Context** (textarea)
   - Label: "Regulatory Context (Leave blank if not applicable)"
   - Placeholder: "Describe relevant regulations (GDPR, financial services, healthcare, etc.) if applicable"
   - Max: 400 chars
   - Rows: 4
   - Required: false

---

#### Component 5: Step3AssumptionsAssets

**Section A: Assumptions** (All Optional)

1. **Market Assumptions** (ArrayFieldInput)
   - Label: "Market Assumptions"
   - Helper: "What are your key assumptions about the target market?"
   - Max per item: 200 chars
   - Placeholder: "e.g., Solo founders spend 2 hours/day gathering feedback"

2. **Technical Assumptions** (ArrayFieldInput)
   - Label: "Technical Assumptions"
   - Helper: "What technical capabilities or feasibility are you assuming?"
   - Max per item: 200 chars

3. **Business Model Assumptions** (ArrayFieldInput)
   - Label: "Business Model Assumptions"
   - Helper: "Assumptions about pricing, distribution, or revenue?"
   - Max per item: 200 chars

**Section B: Assets** (All Optional)

4. **Key Assets** (ArrayFieldInput)
   - Label: "Key Assets & Resources"
   - Helper: "What unique advantages do you have? (Skills, IP, distribution channels, partnerships)"
   - Max per item: 150 chars

5. **Brand Narrative** (ArrayFieldInput)
   - Label: "Brand Narrative Strengths"
   - Helper: "What compelling stories or brand elements do you have?"
   - Max per item: 150 chars

---

#### Component 6: ProgressIndicator

**Purpose**: Display current step progress

**UI**:
```
┌───────────────────────────────────────────┐
│ Step 1 of 3                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ █████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  33% │
│                                           │
│ ● Core Concept  ○ Environment  ○ Assumptions & Assets │
└───────────────────────────────────────────┘
```

**Features**:
- Step number (1 of 3, 2 of 3, 3 of 3)
- Progress bar (33%, 67%, 100%)
- Step name indicators (● current step, ○ other steps)

---

#### Component 7: FormNavigation

**Purpose**: Navigation buttons (Back, Next, Submit)

**Props**:
```typescript
interface FormNavigationProps {
  currentStep: 1 | 2 | 3;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canProceed: boolean;  // Current step validation passed
}
```

**UI**:
```
┌─────────────────────────────────────────┐
│  [← Back]              [Next →]         │  // Step 1, 2
│  [← Back]         [Submit & Continue →] │  // Step 3
└─────────────────────────────────────────┘
```

**Button States**:
- "Back": Disabled on Step 1
- "Next": Disabled when required fields not filled
- "Submit & Continue": Shows spinner + "Submitting..." during submission

---

### Business Rules

1. **Required Field Checks**:
   - Step 1: high_concept, value_proposition, success_metric_18m
   - Step 2: user_persona, competitive_landscape
   - Step 3: All fields optional

2. **Character Limits Strictly Enforced**:
   - Input disabled when limit reached
   - Character counter color changes:
     - < 80%: Gray
     - 80%-100%: Orange
     - 100%: Red

3. **Auto-save**:
   - Triggers 2 seconds after form data changes
   - Saves to `localStorage` key: `idea-intake-draft-${sessionId}`
   - Auto-restore on page load (if exists)

4. **Step Validation**:
   - Validate current step when clicking "Next"
   - Show errors and prevent advance if required fields empty
   - Can go back to previous step to modify

5. **Data Submission**:
   - Validate entire form on submit (Zod validation)
   - Clear localStorage draft on success
   - Keep draft on failure, show error

6. **source Field**:
   - All ideas submitted via form marked as `source='form'`
   - Distinguishes from legacy AI extraction `source='ai'`

---

### Acceptance Criteria

- [ ] User can start new analysis session from dashboard
- [ ] 3-step wizard displays correctly, progress indicator accurate
- [ ] All required field validation works
- [ ] Character counters update in real-time
- [ ] Dynamic array inputs can add/remove items
- [ ] Auto-save works (2-second debounce)
- [ ] Page reload restores draft
- [ ] Can go back to previous step to modify data
- [ ] Submit success saves data to database (source='form')
- [ ] Session status updates to 'research'
- [ ] Submit redirects to research page
- [ ] Error handling: clear error messages displayed
- [ ] Mobile responsive design works

---

## Technical Implementation

### API Endpoints

**Endpoint: POST /api/sessions/[sessionId]/idea**

**Purpose**: Save structured idea (no LLM call)

**Request**:
```typescript
interface SubmitIdeaRequest {
  structured_idea: StructuredIdea;  // Direct from form
  source: 'form';                   // Mark as form input
}
```

**Response** (Success - 201):
```typescript
interface SubmitIdeaResponse {
  idea_id: string;
  structured_idea: StructuredIdea;
}
```

**Error Codes**:
- `400 VALIDATION_FAILED`: Zod validation failed (return field-level errors)
- `404 SESSION_NOT_FOUND`: Session ID invalid
- `500 DATABASE_ERROR`: Database save failed

**Implementation**:
```typescript
// app/api/sessions/[sessionId]/idea/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { structured_idea, source = 'form' } = await request.json();

    // Zod validation (no LLM call)
    const validatedIdea = StructuredIdeaSchema.parse(structured_idea);

    const { supabase } = await createAuthenticatedSupabaseClient();

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('id', params.sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Save to database
    const { data, error } = await supabase
      .from('ideas')
      .insert({
        session_id: params.sessionId,
        raw_input: JSON.stringify(structured_idea), // Store form JSON string
        structured_idea: validatedIdea,
        source: source, // New field
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save idea: ${error.message}`);
    }

    // Update session status
    await supabase
      .from('sessions')
      .update({ status: 'research' })
      .eq('id', params.sessionId);

    return NextResponse.json(
      { idea_id: data.id, structured_idea: validatedIdea },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit idea failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: (error as Error).message, code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}
```

---

### Database Schema

**Table: ideas** (Modified)

**New Field**:
```sql
ALTER TABLE ideas
ADD COLUMN source VARCHAR(10) DEFAULT 'ai' CHECK (source IN ('form', 'ai'));
```

**Complete Schema**:
```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  raw_input TEXT NOT NULL,              -- AI: free text; Form: JSON string
  structured_idea JSONB NOT NULL,       -- MVTA JSON format
  source VARCHAR(10) NOT NULL DEFAULT 'ai' CHECK (source IN ('form', 'ai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Migration**: See `supabase/migrations/002_add_source_to_ideas.sql`

---

### Frontend Components

#### File Structure
```
app/analyze/[sessionId]/intake/
├── page.tsx                           # Main page, renders IntakeWizard
├── components/
│   ├── IntakeWizard.tsx               # Wizard state machine
│   ├── Step1CoreConcept.tsx           # Step 1 form fields
│   ├── Step2Environment.tsx           # Step 2 form fields
│   ├── Step3AssumptionsAssets.tsx     # Step 3 form fields (arrays)
│   ├── ArrayFieldInput.tsx            # Reusable array input component
│   ├── ProgressIndicator.tsx          # Progress bar and stepper
│   └── FormNavigation.tsx             # Back/Next/Submit buttons
```

#### IntakeWizard.tsx

**State Management**:
```typescript
// react-hook-form
const form = useForm<StructuredIdea>({
  resolver: zodResolver(StructuredIdeaSchema),
  defaultValues: {
    high_concept: '',
    value_proposition: '',
    success_metric_18m: '',
    assumptions: {
      market: [],
      technical: [],
      business_model: [],
    },
    assets: {
      key_assets: [],
      brand_narrative: [],
    },
    environment: {
      user_persona: '',
      competitive_landscape: '',
      regulatory_context: '',
    },
  },
});

const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
const [isSubmitting, setIsSubmitting] = useState(false);
```

**Auto-save**:
```typescript
const formData = form.watch();

useEffect(() => {
  const timeoutId = setTimeout(() => {
    localStorage.setItem(
      `idea-intake-draft-${sessionId}`,
      JSON.stringify(formData)
    );
  }, 2000);

  return () => clearTimeout(timeoutId);
}, [formData, sessionId]);
```

**Restore from localStorage**:
```typescript
useEffect(() => {
  const savedDraft = localStorage.getItem(`idea-intake-draft-${sessionId}`);
  if (savedDraft) {
    try {
      const parsed = JSON.parse(savedDraft);
      form.reset(parsed);
    } catch (e) {
      console.error('Failed to restore draft:', e);
    }
  }
}, [sessionId]);
```

**Submit**:
```typescript
const handleSubmit = async (data: StructuredIdea) => {
  setIsSubmitting(true);

  try {
    const res = await fetch(`/api/sessions/${sessionId}/idea`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structured_idea: data,
        source: 'form',
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to submit');
    }

    // Clear localStorage draft
    localStorage.removeItem(`idea-intake-draft-${sessionId}`);

    // Navigate to research page
    router.push(`/analyze/${sessionId}/research`);
  } catch (error) {
    alert((error as Error).message);
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### Validation

**Zod Schemas** (`src/lib/validation/schemas.ts`):

```typescript
export const StructuredIdeaSchema = z.object({
  high_concept: z.string().min(10, 'At least 10 characters').max(150, 'Maximum 150 characters'),
  value_proposition: z.string().min(20, 'At least 20 characters').max(300, 'Maximum 300 characters'),
  success_metric_18m: z.string().min(10, 'At least 10 characters').max(150, 'Maximum 150 characters'),

  assumptions: z.object({
    market: z.array(z.string().max(200, 'Each item max 200 characters')).default([]),
    technical: z.array(z.string().max(200)).default([]),
    business_model: z.array(z.string().max(200)).default([]),
  }).default({ market: [], technical: [], business_model: [] }),

  assets: z.object({
    key_assets: z.array(z.string().max(150)).default([]),
    brand_narrative: z.array(z.string().max(150)).default([]),
  }).default({ key_assets: [], brand_narrative: [] }),

  environment: z.object({
    user_persona: z.string().min(20, 'At least 20 characters').max(300, 'Maximum 300 characters'),
    competitive_landscape: z.string().min(20, 'At least 20 characters').max(400, 'Maximum 400 characters'),
    regulatory_context: z.string().max(400).default(''),
  }),
});

// Step-by-step validation
export const Step1Schema = StructuredIdeaSchema.pick({
  high_concept: true,
  value_proposition: true,
  success_metric_18m: true,
});

export const Step2Schema = StructuredIdeaSchema.pick({
  environment: true,
});

export const Step3Schema = StructuredIdeaSchema.pick({
  assumptions: true,
  assets: true,
});
```

---

## Tests

### Tier 1 Critical Path Test

**Test Name**: `Idea Intake Form - 3-Step Wizard Happy Path`

**Description**: Verify user can complete 3-step wizard, submit form, data saved correctly

**Preconditions**:
- User authenticated
- Session created (status='intake')

**Steps**:
1. Navigate to `/analyze/[sessionId]/intake`
2. **Step 1**:
   - Fill high_concept: "AI-powered idea validation platform"
   - Fill value_proposition: "Helps solo founders identify risks before investing time and money"
   - Fill success_metric_18m: "10,000 validated ideas, 70% accuracy"
   - Click "Next"
3. **Step 2**:
   - Fill user_persona: "Solo founders and early-stage entrepreneurs"
   - Fill competitive_landscape: "Similar tools: ProductHunt, BetaList, but none combine automated research with adversarial analysis"
   - Skip regulatory_context
   - Click "Next"
4. **Step 3**:
   - Add 1 market assumption: "Founders spend 2 hours/day gathering feedback"
   - Skip other fields (optional)
   - Click "Submit & Continue"
5. Verify data saved to database:
   - `ideas` table has new record
   - `source = 'form'`
   - `structured_idea` matches submitted data
6. Verify session status updated to 'research'
7. Verify redirect to `/analyze/[sessionId]/research`

**Expected Results**:
- 3-step wizard flows smoothly
- Required field validation works
- Data saved correctly (source='form')
- Session status updated correctly
- No errors occur

**Failure Impact**: ❌ **BLOCKS DEPLOYMENT** (Tier 1)

---

### E2E Tests

**Test 1: Complete Wizard Flow**
```typescript
import { test, expect } from '@playwright/test';

test('User completes 3-step wizard and submits idea', async ({ page }) => {
  const sessionId = await createTestSession(page);

  await page.goto(`/analyze/${sessionId}/intake`);

  // Step 1
  await expect(page.locator('text=/step 1 of 3/i')).toBeVisible();
  await page.fill('[name="high_concept"]', 'AI idea validation platform');
  await page.fill('[name="value_proposition"]', 'Helps founders identify risks early');
  await page.fill('[name="success_metric_18m"]', '10K users, 70% accuracy');
  await page.click('button:has-text("Next")');

  // Step 2
  await expect(page.locator('text=/step 2 of 3/i')).toBeVisible();
  await page.fill('[name="environment.user_persona"]', 'Solo founders, 25-45 years old');
  await page.fill('[name="environment.competitive_landscape"]', 'ProductHunt, BetaList');
  await page.click('button:has-text("Next")');

  // Step 3
  await expect(page.locator('text=/step 3 of 3/i')).toBeVisible();
  await page.click('button:has-text("Add Market Assumption")');
  await page.fill('[name="assumptions.market.0"]', 'Founders lack validation tools');
  await page.click('button:has-text("Submit & Continue")');

  // Verify redirect
  await expect(page).toHaveURL(new RegExp(`/analyze/${sessionId}/research`));
});
```

**Test 2: Required Field Validation**
```typescript
test('Cannot proceed without required fields', async ({ page }) => {
  const sessionId = await createTestSession(page);
  await page.goto(`/analyze/${sessionId}/intake`);

  // Try to proceed without filling required fields
  await page.click('button:has-text("Next")');

  // Should see validation errors
  await expect(page.locator('text=/at least 10 characters/i')).toBeVisible();
});
```

**Test 3: Auto-save and Restore**
```typescript
test('Auto-saves draft and restores on reload', async ({ page }) => {
  const sessionId = await createTestSession(page);
  await page.goto(`/analyze/${sessionId}/intake`);

  // Fill some fields
  await page.fill('[name="high_concept"]', 'Test idea');

  // Wait for auto-save (2 seconds)
  await page.waitForTimeout(2500);

  // Reload page
  await page.reload();

  // Verify data restored
  const value = await page.inputValue('[name="high_concept"]');
  expect(value).toBe('Test idea');
});
```

---

### Integration Tests

**Test 1: API Endpoint - Successful Submission**
```typescript
describe('POST /api/sessions/[sessionId]/idea', () => {
  it('should save form data without calling LLM', async () => {
    const sessionId = await createTestSessionInDb();

    const response = await fetch(`/api/sessions/${sessionId}/idea`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structured_idea: {
          high_concept: 'AI validation platform',
          value_proposition: 'Helps founders validate ideas',
          success_metric_18m: '10K users',
          assumptions: { market: [], technical: [], business_model: [] },
          assets: { key_assets: [], brand_narrative: [] },
          environment: {
            user_persona: 'Solo founders',
            competitive_landscape: 'ProductHunt, BetaList',
            regulatory_context: '',
          },
        },
        source: 'form',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('idea_id');
    expect(data.structured_idea.high_concept).toBe('AI validation platform');

    // Verify in database
    const idea = await getIdeaFromDb(data.idea_id);
    expect(idea.source).toBe('form');
  });

  it('should return 400 if validation fails', async () => {
    const sessionId = await createTestSessionInDb();

    const response = await fetch(`/api/sessions/${sessionId}/idea`, {
      method: 'POST',
      body: JSON.stringify({
        structured_idea: {
          high_concept: 'Too short', // < 10 chars
        },
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('VALIDATION_FAILED');
  });
});
```

---

### Unit Tests

**Test 1: ArrayFieldInput Component**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ArrayFieldInput from './ArrayFieldInput';

describe('ArrayFieldInput', () => {
  it('should add new field when clicking "Add"', () => {
    const handleChange = jest.fn();
    render(
      <ArrayFieldInput
        label="Market Assumptions"
        maxLength={200}
        placeholder="Test"
        values={[]}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByText(/add/i));
    expect(handleChange).toHaveBeenCalledWith(['']);
  });

  it('should remove field when clicking X', () => {
    const handleChange = jest.fn();
    render(
      <ArrayFieldInput
        label="Market Assumptions"
        maxLength={200}
        placeholder="Test"
        values={['Item 1', 'Item 2']}
        onChange={handleChange}
      />
    );

    const removeButtons = screen.getAllByLabelText('Remove');
    fireEvent.click(removeButtons[0]);
    expect(handleChange).toHaveBeenCalledWith(['Item 2']);
  });
});
```

---

## Notes

### Key Differences from v1.0

| Aspect | v1.0 (AI Extraction) | v2.0 (Form Input) |
|--------|---------------------|-------------------|
| Input Method | 7 free-text questions | 3-step structured form |
| Processing | LLM extraction (Prompt A) | Direct validation and save |
| Completion Time | 5-10 min + 30s wait | 8-12 minutes |
| Accuracy | Depends on LLM understanding | User directly controls |
| Cost | ~$0.02 per submission | No LLM cost |
| Data Source | source='ai' | source='form' |
| Auto-save | None | 2-second debounce |
| Field Validation | On submit only | Real-time + step-by-step |

### Future Enhancements

- **AI-Assisted Suggestions**: Add "Get AI Suggestion" button next to each field (optional)
- **Template Library**: Pre-fill examples based on industry (SaaS, Marketplace, B2B, etc.)
- **Draft Management**: Save multiple drafts, display incomplete intakes on dashboard
- **Collaborative Editing**: Allow team members to collaborate on filling form
- **Voice Input**: Support voice-to-text on mobile
- **Internationalization**: Multi-language UI and placeholders

### Known Limitations

- Auto-save only client-side (localStorage), server doesn't store drafts
- No real-time collaboration
- No version history
- Array fields don't support drag-to-reorder

### References

- [S-03: Database Schema](../system/S-03-database-schema.md) - ideas table schema
- [S-04: LLM Integration](../system/S-04-llm-integration.md) - Though Prompt A no longer used, other prompts still referenced
- [Zod Documentation](https://zod.dev/) - Schema validation
- [React Hook Form](https://react-hook-form.com/) - Form state management

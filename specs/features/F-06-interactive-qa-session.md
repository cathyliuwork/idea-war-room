# F-06: Interactive Q&A Session

**Version**: 1.0
**Last Updated**: 2025-12-08
**Priority**: HIGH
**Status**: ✅ Spec Complete

---

## Quick Reference

**What**: Follow-up Q&A chat interface grounded in damage report context, powered by LLM (Prompt D). Founders ask clarifying questions about vulnerabilities, recommendations, or next steps.

**Why**: Damage reports are dense. Founders need clarification on specific threats, implementation steps, or prioritization.

**Dependencies**:
- F-04: MVTA Red Team Simulation (damage report as context)
- F-05: Damage Report Display (UI context for Q&A)
- S-04: LLM Integration (Prompt D for follow-up questions)

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
- [F-04: MVTA Red Team Simulation](./F-04-mvta-red-team-simulation.md) - Damage report data
- [F-05: Damage Report Display](./F-05-damage-report-display.md) - Report context

### Required System Modules
- [S-04: LLM Integration](../system/S-04-llm-integration.md) - Prompt D (follow-up Q&A)

---

## PRD: Product Requirements

### Overview

After viewing their damage report, founders often have follow-up questions:
- "How do I validate the competitor risk you identified?"
- "Which vulnerability should I address first?"
- "Can you explain this cascading failure in simpler terms?"

The Interactive Q&A feature provides a chat interface where the LLM answers questions grounded in the damage report, structured idea, and research snapshot.

**Key Capabilities**:
1. Chat interface below damage report
2. Questions answered using Prompt D (context-aware)
3. Answers cite specific vulnerabilities/recommendations
4. Conversation history preserved (in-memory for MVP)
5. Prevent scope creep (reject off-topic questions like "how do I raise funding?")

---

### User Flow

**Step 1**: User viewing damage report
- User: Scrolls to bottom of report page
- System: Shows Q&A section with input field and example questions

**Step 2**: User asks first question
- User: Types question: "Which vulnerability should I address first?"
- User: Clicks "Ask" button
- System: Shows "Thinking..." indicator

**Step 3**: LLM responds
- System: Calls LLM (Prompt D) with question + report context
- System: Displays answer below question
- System: Answer cites specific vulnerabilities (e.g., "Based on Vulnerability #2...")

**Step 4**: Follow-up questions
- User: Asks follow-up: "How do I validate that risk?"
- System: Includes previous Q&A in context
- System: Responds with actionable steps

**Step 5**: Scope management
- User: Asks off-topic question: "How do I pitch to investors?"
- System: Politely declines: "That's outside the scope of MVTA analysis. Focus on validating your idea's risks first."

---

### UI Components

**Component 1: QASection**
- **Location**: Bottom of damage report page
- **Purpose**: Chat interface
- **Elements**:
  - Section title: "Ask Follow-Up Questions"
  - Example questions (clickable pills)
  - Message thread (question-answer pairs)
  - Input field (textarea)
  - "Ask" button
  - Character limit indicator (max 500 chars per question)

**Component 2: QAMessage**
- **Location**: Inside QASection message thread
- **Purpose**: Display one Q&A pair
- **Elements**:
  - User question (right-aligned, blue bubble)
  - AI answer (left-aligned, gray bubble)
  - Timestamp
  - "Copy Answer" button

**Component 3: ExampleQuestions**
- **Location**: Top of QASection
- **Purpose**: Suggest common questions
- **Elements**:
  - Pill buttons with pre-written questions
  - Examples:
    - "Which vulnerability should I prioritize?"
    - "How do I validate the competitor risk?"
    - "What's the fastest way to test this assumption?"

---

### Business Rules

1. **Context Window**: Include entire damage report + structured idea + research snapshot in each LLM call
2. **Conversation History**: Include previous 5 Q&A pairs (prevent token overflow)
3. **Question Length**: Max 500 characters per question
4. **Response Time**: Target < 10 seconds per answer
5. **Scope Boundaries**: Reject off-topic questions (fundraising, marketing, hiring, etc.)
6. **Citation Format**: Answers should reference specific vulnerabilities by index or name

---

### Acceptance Criteria

- [ ] Chat interface renders below damage report
- [ ] User can submit questions
- [ ] LLM responds with context-aware answers
- [ ] Answers cite specific vulnerabilities/recommendations
- [ ] Conversation history preserved during session
- [ ] Off-topic questions politely declined
- [ ] Example questions clickable and pre-fill input
- [ ] Character limit enforced (500 chars)

---

## Technical Implementation

### API Endpoints

**Endpoint 1: POST /api/sessions/[sessionId]/qa**

**Purpose**: Answer follow-up question about damage report

**Request**:
```typescript
interface QARequest {
  question: string;
  conversation_history?: Array<{ question: string; answer: string }>;
}
```

**Response** (Success - 200):
```typescript
interface QAResponse {
  answer: string;
  response_time_ms: number;
}
```

**Implementation**:
```typescript
// app/api/sessions/[sessionId]/qa/route.ts
import { answerFollowUpQuestion } from '@/lib/llm/prompts';

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const { question, conversation_history } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  // Fetch context
  const { data: idea } = await supabase.from('ideas')
    .select('structured_idea').eq('session_id', params.sessionId).single();

  const { data: research } = await supabase.from('research_snapshots')
    .select('*').eq('session_id', params.sessionId).single();

  const { data: report } = await supabase.from('damage_reports')
    .select('*').eq('session_id', params.sessionId).single();

  const startTime = Date.now();

  try {
    const answer = await answerFollowUpQuestion(question, {
      ideaSchema: idea.structured_idea,
      researchSnapshot: research,
      damageReport: report,
      conversationHistory: conversation_history || []
    });

    return NextResponse.json({
      answer,
      response_time_ms: Date.now() - startTime
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}
```

---

### Frontend Components

**Component 1: QASection**

**File**: `src/components/report/QASection.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function QASection({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const exampleQuestions = [
    "Which vulnerability should I prioritize?",
    "How do I validate the competitor risk?",
    "What's the fastest way to test this assumption?"
  ];

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isLoading) return;

    setMessages([...messages, { role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          conversation_history: messages.filter((_, i) => i >= messages.length - 10)
        })
      });

      const data = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold mb-4">Ask Follow-Up Questions</h2>

      {/* Example Questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {exampleQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(q)}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Thread */}
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg px-4 py-2 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 bg-gray-100 rounded-lg">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(input);
            }
          }}
          placeholder="Ask a question about your damage report..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
          maxLength={500}
          disabled={isLoading}
        />
        <button
          onClick={() => handleSubmit(input)}
          disabled={!input.trim() || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ask
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        {input.length}/500 characters
      </p>
    </div>
  );
}
```

---

### Prompt Engineering

**See [S-04: LLM Integration](../system/S-04-llm-integration.md) for complete Prompt D definition.**

**Key Elements**:
- System prompt defines role as "MVTA Q&A assistant"
- User prompt includes question + full context (idea, research, report)
- Instructions to cite specific vulnerabilities
- Instructions to reject off-topic questions

---

## Tests

### Tier 1 Critical Path Test

**Test Name**: `Q&A Session - Happy Path`

**Description**: Verify user can ask question and receive context-aware answer.

**Preconditions**:
- Damage report exists
- AI Builders API accessible

**Steps**:
1. Submit question via POST /api/sessions/[sessionId]/qa
2. Verify LLM called with correct context
3. Verify answer received
4. Verify answer cites vulnerabilities

**Expected Results**:
- Answer returned successfully
- Answer is relevant to question
- Answer references report data

**Failure Impact**: Moderate (not blocking MVP, but important for UX)

---

### E2E Tests

```typescript
test('User can ask question and receive answer', async ({ page }) => {
  const sessionId = await createSessionWithReport(page);

  await page.goto(`/analyze/${sessionId}/report`);
  await page.scrollTo('text=/ask follow-up questions/i');

  await page.fill('textarea', 'Which vulnerability should I prioritize?');
  await page.click('button:has-text("Ask")');

  await expect(page.locator('text=/based on/i')).toBeVisible({ timeout: 15000 });
});
```

---

## Notes

### Future Enhancements

- **Persistent History**: Save Q&A to database
- **Voice Input**: Allow voice questions
- **Multi-turn Context**: Better conversation tracking
- **Suggested Follow-ups**: AI suggests related questions

### Known Limitations

- No conversation persistence (in-memory only)
- No multi-user chat (single founder per session)
- English-only

### References

- [S-04: LLM Integration](../system/S-04-llm-integration.md) - Prompt D

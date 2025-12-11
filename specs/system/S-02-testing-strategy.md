# S-02: Testing Strategy

**Version**: 1.0
**Last Updated**: 2025-12-08
**Status**: ✅ Spec Complete

---

## Quick Reference

**Purpose**: Comprehensive testing strategy for Idea War Room, defining test pyramid, coverage goals, and quality gates for deployment.

**Dependencies**: None

**Used By**: All feature specifications (F-01 through F-09)

**Testing Philosophy**: Critical path coverage first (Tier 1 tests block deployment), then comprehensive integration and unit tests. AI-generated content requires special validation strategies (output structure, not semantic correctness).

---

## Testing Principles

### 1. Test Pyramid Structure

```
       ┌─────────┐
       │   E2E   │  ← Few, slow, high-value (critical user journeys)
       └─────────┘
      ┌───────────┐
      │Integration│  ← API endpoints, LLM integration, database
      └───────────┘
    ┌───────────────┐
    │     Unit      │  ← Many, fast, component logic
    └───────────────┘
```

**Target Ratios** (MVP):
- Unit Tests: 70% (fast feedback on component logic)
- Integration Tests: 20% (API contracts, LLM responses)
- E2E Tests: 10% (critical user journeys only)

### 2. Tier 1 Critical Path Tests

**Definition**: Tests that MUST pass before any deployment. These cover the core user journey from idea submission to damage report delivery.

**Failure Impact**: ❌ **BLOCKS DEPLOYMENT**

**Tier 1 Coverage**:
1. User can submit idea → structured JSON created → saved to database
2. Research engine generates queries → fetches results → saves snapshot
3. MVTA analysis runs → vulnerabilities scored → damage report generated
4. Damage report displays correctly → user can export → markdown copied

### 3. AI Output Testing Strategy

**Challenge**: Cannot test semantic correctness of AI analysis (too subjective).

**Solution**: Test structure, format, and integration, not content quality.

**What We Test**:
- ✅ LLM returns valid JSON matching schema
- ✅ Vulnerability scores are 1-5 integers
- ✅ All required fields populated (no null/undefined)
- ✅ Evidence references match research snapshot indices
- ✅ Markdown rendering doesn't break

**What We DON'T Test**:
- ❌ Whether the MVTA analysis is "good" or "insightful"
- ❌ Semantic accuracy of vulnerability descriptions
- ❌ Whether research queries are "smart"

### 4. Test Data Strategy

**Fixtures**:
- Seed database with 3-5 example ideas (SaaS, marketplace, consumer app)
- Mock AI Builders API responses (deterministic for tests)
- Snapshot research results (avoid live API calls in tests)

**Test Isolation**:
- Each test gets fresh database state (use transactions + rollback)
- Mock external APIs (AI Builders, web searches)
- No test depends on another test's state

---

## Test Tech Stack

### Testing Frameworks

**Unit & Integration Tests**:
- **Vitest** (fast, ESM-native, compatible with Next.js)
- **@testing-library/react** (component testing)
- **@testing-library/user-event** (user interaction simulation)

**E2E Tests**:
- **Playwright** (cross-browser, reliable, fast)
- **@playwright/test** (built-in assertions, fixtures)

**API Testing**:
- **Supertest** (HTTP assertions) OR Playwright API testing

**Mocking**:
- **MSW (Mock Service Worker)** (intercept network requests)
- **Vitest mocks** (module mocking)

### Code Coverage

**Tool**: Vitest built-in coverage (v8 or Istanbul)

**Targets** (MVP):
- Overall: 70%+
- Critical paths: 90%+
- Utilities: 80%+
- UI components: 60%+ (lower threshold, harder to test)

**Coverage Reports**:
- Generate on CI (GitHub Actions)
- Block PR merge if critical path coverage drops below 90%

---

## Testing Layers

### Layer 1: Unit Tests

**Scope**: Individual functions, utilities, component logic (no external dependencies)

**Location**: Co-located with source files
```
src/
├── components/
│   ├── VulnerabilityCard.tsx
│   └── VulnerabilityCard.test.tsx
├── lib/
│   ├── mvta-parser.ts
│   └── mvta-parser.test.ts
```

**Example Test Cases**:

#### Utility Function: Parse MVTA JSON

```typescript
// lib/mvta-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseMVTAResponse, validateVulnerability } from './mvta-parser';

describe('parseMVTAResponse', () => {
  it('parses valid MVTA JSON', () => {
    const input = {
      vulnerabilities: [
        {
          vector: 'Market & Economic Viability',
          simulation: 'Competitor War Game',
          description: 'Strong competitor X exists',
          score: 2,
          rationale: 'Evidence from research',
          evidence_refs: { competitors: [0], community_signals: [], regulatory_signals: [] }
        }
      ],
      cascading_failures: [],
      vector_synthesis: [],
      recommendations: []
    };

    const result = parseMVTAResponse(JSON.stringify(input));

    expect(result.vulnerabilities).toHaveLength(1);
    expect(result.vulnerabilities[0].score).toBe(2);
  });

  it('throws error on invalid score', () => {
    const input = {
      vulnerabilities: [
        { score: 6 } // Invalid: score > 5
      ]
    };

    expect(() => parseMVTAResponse(JSON.stringify(input))).toThrow('Invalid vulnerability score');
  });
});

describe('validateVulnerability', () => {
  it('accepts valid vulnerability', () => {
    const vuln = {
      vector: 'Market & Economic Viability',
      simulation: 'Competitor War Game',
      description: 'Test',
      score: 3,
      rationale: 'Test rationale',
      evidence_refs: { competitors: [], community_signals: [], regulatory_signals: [] }
    };

    expect(() => validateVulnerability(vuln)).not.toThrow();
  });

  it('rejects vulnerability with missing required field', () => {
    const vuln = {
      vector: 'Market & Economic Viability',
      // Missing: simulation
      description: 'Test',
      score: 3,
      rationale: 'Test',
      evidence_refs: { competitors: [], community_signals: [], regulatory_signals: [] }
    };

    expect(() => validateVulnerability(vuln)).toThrow('Missing required field: simulation');
  });
});
```

#### Component: Vulnerability Card

```typescript
// components/VulnerabilityCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VulnerabilityCard } from './VulnerabilityCard';

describe('VulnerabilityCard', () => {
  const mockVulnerability = {
    vector: 'Market & Economic Viability',
    simulation: 'Competitor War Game',
    description: 'A strong competitor exists with 80% market share',
    score: 1,
    rationale: 'Based on 3 competitor reviews',
    evidence_refs: { competitors: [0, 1], community_signals: [], regulatory_signals: [] }
  };

  it('renders vulnerability score badge', () => {
    render(<VulnerabilityCard vulnerability={mockVulnerability} />);

    expect(screen.getByText(/Score: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Catastrophic/i)).toBeInTheDocument();
  });

  it('applies correct severity color class', () => {
    const { container } = render(<VulnerabilityCard vulnerability={mockVulnerability} />);

    const card = container.querySelector('.border-severity-1-catastrophic');
    expect(card).toBeInTheDocument();
  });

  it('displays evidence reference count', () => {
    render(<VulnerabilityCard vulnerability={mockVulnerability} />);

    expect(screen.getByText(/2 sources/i)).toBeInTheDocument();
  });
});
```

---

### Layer 2: Integration Tests

**Scope**: API endpoints, database interactions, external service integration (with mocks)

**Location**: `tests/integration/`

**Example Test Cases**:

#### API Endpoint: Create Idea

```typescript
// tests/integration/api/ideas/create.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/ideas/create/route';
import { supabase } from '@/lib/supabase';

describe('POST /api/ideas/create', () => {
  beforeEach(async () => {
    // Setup: Clean database
    await supabase.from('ideas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  it('creates idea and returns session ID', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        rawInput: 'A SaaS tool for email marketing automation',
        userId: 'test-user-123'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.sessionId).toBeDefined();
    expect(data.structuredIdea).toHaveProperty('high_concept');
    expect(data.structuredIdea).toHaveProperty('value_proposition');
  });

  it('returns 400 for missing rawInput', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { userId: 'test-user-123' } // Missing rawInput
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toContain('rawInput is required');
  });

  it('saves structured idea to database', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        rawInput: 'A marketplace for freelance designers',
        userId: 'test-user-123'
      }
    });

    await handler(req, res);

    const { data: savedIdea } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', 'test-user-123')
      .single();

    expect(savedIdea).toBeDefined();
    expect(savedIdea.structured_idea).toHaveProperty('high_concept');
  });
});
```

#### LLM Integration: MVTA Analysis

```typescript
// tests/integration/llm/mvta-analysis.test.ts
import { describe, it, expect, vi } from 'vitest';
import { runMVTAAnalysis } from '@/lib/llm/mvta-analysis';
import { mockAIBuildersAPI } from '@/tests/mocks/ai-builders';

// Mock AI Builders API
vi.mock('@/lib/llm/client', () => ({
  llmClient: mockAIBuildersAPI
}));

describe('runMVTAAnalysis', () => {
  it('returns structured MVTA response', async () => {
    const ideaSchema = {
      high_concept: 'Email automation SaaS',
      value_proposition: 'Save time on email marketing',
      success_metric_18m: '1000 paying customers',
      assumptions: { market: ['SMBs need email tools'], technical: [], business_model: [] },
      assets: { key_assets: [], brand_narrative: [] },
      environment: { user_persona: 'SMB owner', competitive_landscape: '', regulatory_context: '' }
    };

    const researchSnapshot = {
      competitors: [{ name: 'Mailchimp', url: 'mailchimp.com', summary: 'Market leader' }],
      community_signals: [],
      regulatory_signals: []
    };

    const result = await runMVTAAnalysis(ideaSchema, researchSnapshot);

    expect(result).toHaveProperty('vulnerabilities');
    expect(result.vulnerabilities).toBeInstanceOf(Array);
    expect(result.vulnerabilities.length).toBeGreaterThan(0);
    expect(result.vulnerabilities[0]).toHaveProperty('score');
    expect(result.vulnerabilities[0].score).toBeGreaterThanOrEqual(1);
    expect(result.vulnerabilities[0].score).toBeLessThanOrEqual(5);
  });

  it('handles LLM timeout gracefully', async () => {
    // Mock timeout
    mockAIBuildersAPI.setSimulateTimeout(true);

    const ideaSchema = { /* ... */ };
    const researchSnapshot = { /* ... */ };

    await expect(runMVTAAnalysis(ideaSchema, researchSnapshot)).rejects.toThrow('LLM request timed out');
  });
});
```

---

### Layer 3: E2E Tests (Tier 1 Critical Path)

**Scope**: Complete user journeys through the UI

**Location**: `tests/e2e/`

**Example Test Cases**:

#### Tier 1: Complete MVTA Analysis Flow

```typescript
// tests/e2e/critical-path.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tier 1 Critical Path: MVTA Analysis', () => {
  test('User can submit idea and receive damage report', async ({ page }) => {
    // Step 1: Land on homepage
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Stress-test your startup idea');

    // Step 2: Start analysis
    await page.click('button:has-text("Start MVTA Analysis")');
    await expect(page).toHaveURL(/\/intake/);

    // Step 3: Fill idea intake form
    await page.fill('input[name="high_concept"]', 'A SaaS tool for automated email marketing');
    await page.fill('textarea[name="value_proposition"]', 'Helps SMBs save time on email campaigns');
    await page.fill('input[name="success_metric_18m"]', '1000 paying customers');

    // Market assumptions
    await page.click('button:has-text("Add Market Assumption")');
    await page.fill('input[name="assumptions.market.0"]', 'SMBs struggle with email marketing tools');

    // Assets
    await page.fill('textarea[name="assets.key_assets"]', 'Email templates, automation workflows');

    // Environment
    await page.fill('textarea[name="environment.user_persona"]', 'Small business owner, 10-50 employees');
    await page.fill('textarea[name="environment.competitive_landscape"]', 'Mailchimp, ConvertKit dominate');

    // Submit
    await page.click('button:has-text("Continue to Research")');

    // Step 4: Wait for research phase
    await expect(page.locator('text=Generating research queries')).toBeVisible();
    await expect(page.locator('text=Analyzing competitors')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Research complete')).toBeVisible({ timeout: 60000 });

    // Step 5: MVTA analysis phase
    await page.click('button:has-text("Run MVTA Analysis")');
    await expect(page.locator('text=Red Team simulation in progress')).toBeVisible();
    await expect(page.locator('text=Analysis complete')).toBeVisible({ timeout: 90000 });

    // Step 6: Damage report displayed
    await expect(page).toHaveURL(/\/report\/[a-f0-9-]+/);
    await expect(page.locator('h1')).toContainText('Damage Report');

    // Verify executive summary
    await expect(page.locator('section:has-text("Executive Summary")')).toBeVisible();
    await expect(page.locator('text=/Top \d+ Vulnerabilities/i')).toBeVisible();

    // Verify at least one vector section
    await expect(page.locator('section:has-text("Market & Economic Viability")')).toBeVisible();

    // Verify vulnerability cards
    const vulnCards = page.locator('[data-testid="vulnerability-card"]');
    await expect(vulnCards).toHaveCountGreaterThan(0);

    // Verify score badge exists
    await expect(page.locator('text=/Score: [1-5]/i')).toBeVisible();

    // Step 7: Export report
    await page.click('button:has-text("Export Report")');

    // Wait for clipboard copy (check toast notification)
    await expect(page.locator('text=Report copied to clipboard')).toBeVisible({ timeout: 3000 });
  });

  test('User can ask follow-up question', async ({ page }) => {
    // Pre-condition: Navigate to existing damage report
    await page.goto('/report/test-session-123'); // Use seeded test data

    // Step 1: Open Q&A
    await page.click('button:has-text("Ask Follow-up Question")');
    await expect(page.locator('[data-testid="qa-modal"]')).toBeVisible();

    // Step 2: Ask question
    await page.fill('textarea[name="question"]', 'How can I reduce the market risk?');
    await page.click('button:has-text("Send")');

    // Step 3: Verify AI response
    await expect(page.locator('[data-testid="qa-response"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="qa-response"]')).toContainText(/market/i);

    // Step 4: Verify conversation history
    const messages = page.locator('[data-testid="qa-message"]');
    await expect(messages).toHaveCountGreaterThanOrEqual(2); // Question + Answer
  });
});
```

---

## Quality Gates

### Pre-Commit
- ESLint passes (no errors)
- TypeScript compiles (no type errors)
- Prettier formatting applied

### CI Pipeline (GitHub Actions)

**On Pull Request**:
1. Install dependencies
2. Run TypeScript type check
3. Run ESLint
4. Run Vitest (unit + integration tests)
   - Coverage report generated
   - Must maintain 70%+ overall, 90%+ critical path
5. Build Next.js app (ensure no build errors)
6. Run Playwright E2E tests (Tier 1 only)
   - Must pass 100% (blocks merge if fails)

**On Merge to Main**:
1. All PR checks
2. Full E2E test suite (Tier 1 + Tier 2)
3. Deploy to staging (if not deployment configured yet, skip this)

### Pre-Deployment Checklist

- [ ] All Tier 1 tests passing (100%)
- [ ] No TypeScript errors
- [ ] No ESLint errors (warnings allowed)
- [ ] Code coverage ≥ 70% overall
- [ ] Code coverage ≥ 90% on critical paths
- [ ] Manual smoke test on staging (if applicable)
- [ ] Environment variables configured

---

## Test Data Management

### Fixtures

**Location**: `tests/fixtures/`

**Example Fixtures**:

```typescript
// tests/fixtures/ideas.ts
export const fixtureIdeas = [
  {
    id: 'test-idea-1',
    userId: 'test-user-1',
    rawInput: 'A SaaS tool for email marketing automation',
    structuredIdea: {
      high_concept: 'Email automation for SMBs',
      value_proposition: 'Save 10 hours/week on email campaigns',
      success_metric_18m: '1000 paying customers',
      assumptions: {
        market: ['SMBs struggle with email tools', 'Willing to pay $50/mo'],
        technical: ['Email APIs are reliable'],
        business_model: ['Subscription model works for SMBs']
      },
      assets: {
        key_assets: ['Email templates', 'Automation workflows'],
        brand_narrative: ['Time-saving', 'Easy to use']
      },
      environment: {
        user_persona: 'SMB owner, 10-50 employees',
        competitive_landscape: 'Mailchimp, ConvertKit dominate',
        regulatory_context: 'CAN-SPAM, GDPR compliance required'
      }
    },
    createdAt: '2025-12-08T10:00:00Z'
  },
  // More fixtures...
];
```

```typescript
// tests/fixtures/mvta-responses.ts
export const fixtureMVTAResponse = {
  vulnerabilities: [
    {
      vector: 'Market & Economic Viability',
      simulation: 'Competitor War Game',
      description: 'Mailchimp has 80% market share with deep integrations',
      score: 2,
      rationale: 'Based on 3 competitor analysis reports and 12 user reviews',
      evidence_refs: {
        competitors: [0, 1],
        community_signals: ['reddit_thread_1', 'review_site_2'],
        regulatory_signals: []
      }
    },
    {
      vector: 'Technical & Product Integrity',
      simulation: 'Scalability Stress Test',
      description: 'Email sending infrastructure may fail at scale',
      score: 3,
      rationale: 'Common issue for email SaaS per 5 postmortems',
      evidence_refs: {
        competitors: [],
        community_signals: ['postmortem_1', 'postmortem_2'],
        regulatory_signals: []
      }
    }
  ],
  cascading_failures: [
    {
      chain: ['Competitor advantage', 'Customer churn', 'Revenue collapse'],
      severity: 1,
      narrative: 'If Mailchimp launches similar feature, users may churn rapidly...'
    }
  ],
  vector_synthesis: [
    {
      vector: 'Market & Economic Viability',
      summary: 'High competitive pressure, need differentiation strategy',
      overall_score: 2
    }
  ],
  recommendations: [
    {
      risk_index: 0,
      action_type: 'Customer Discovery',
      description: 'Interview 20 SMB owners currently using Mailchimp to identify unmet needs'
    }
  ]
};
```

### Seeding Test Database

```typescript
// tests/setup/seed-db.ts
import { supabase } from '@/lib/supabase';
import { fixtureIdeas } from '../fixtures/ideas';

export async function seedTestDatabase() {
  // Clear existing test data
  await supabase.from('ideas').delete().like('id', 'test-%');

  // Insert fixtures
  await supabase.from('ideas').insert(fixtureIdeas);
}

export async function cleanupTestDatabase() {
  await supabase.from('ideas').delete().like('id', 'test-%');
}
```

---

## Mocking Strategy

### Mock AI Builders API

```typescript
// tests/mocks/ai-builders.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { fixtureMVTAResponse } from '../fixtures/mvta-responses';

const AI_BUILDERS_BASE_URL = 'https://space.ai-builders.com/backend';

export const aiBuildersMocks = [
  // Mock LLM completion
  rest.post(`${AI_BUILDERS_BASE_URL}/v1/chat/completions`, (req, res, ctx) => {
    const body = req.body as any;
    const messages = body.messages;

    // Detect intent from system prompt
    if (messages[0].content.includes('MVTA Red Team')) {
      return res(
        ctx.status(200),
        ctx.json({
          choices: [
            {
              message: {
                content: JSON.stringify(fixtureMVTAResponse)
              }
            }
          ]
        })
      );
    }

    // Default response
    return res(
      ctx.status(200),
      ctx.json({
        choices: [
          {
            message: { content: '{"result": "mock response"}' }
          }
        ]
      })
    );
  }),

  // Mock search API
  rest.post(`${AI_BUILDERS_BASE_URL}/v1/search`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        results: [
          {
            title: 'Mailchimp Review',
            url: 'https://example.com/mailchimp-review',
            snippet: 'Mailchimp is the leading email marketing tool...'
          }
        ]
      })
    );
  })
];

export const mockServer = setupServer(...aiBuildersMocks);
```

### Setup in Tests

```typescript
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { mockServer } from './tests/mocks/ai-builders';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
```

---

## Performance Testing (Future)

**Not included in MVP**, but considerations for post-launch:

### Load Testing
- Tool: k6 or Artillery
- Target: 100 concurrent users submitting ideas
- Metric: P95 response time < 5 seconds for MVTA analysis

### LLM Latency Monitoring
- Track AI Builders API response times
- Alert if P95 > 60 seconds
- Consider retry logic and queueing

---

## Related Documents

- [S-00: Architecture Overview](./S-00-architecture.md)
- [S-04: LLM Integration](./S-04-llm-integration.md) - AI testing specifics
- All Feature Specifications (F-01 to F-09) - Feature-specific tests

---

## Notes

### Testing Anti-Patterns to Avoid

❌ **Don't test AI creativity**: "Is this MVTA analysis insightful?" (too subjective)
✅ **Do test AI structure**: "Does this response match the JSON schema?"

❌ **Don't mock everything**: Real database in tests (use transactions), only mock external APIs
✅ **Do mock external services**: AI Builders API, web scraping

❌ **Don't write flaky E2E tests**: Use data-testid, avoid sleep(), wait for explicit conditions
✅ **Do write deterministic tests**: Use fixtures, mock time-sensitive functions

### Known Testing Gaps (MVP)

- No visual regression testing (screenshots)
- No accessibility testing automation (manual WCAG checks only)
- No performance/load testing
- Limited mobile testing (desktop-first MVP)

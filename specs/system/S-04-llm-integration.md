# S-04: LLM Integration

**Version**: 1.0
**Last Updated**: 2025-12-08
**Status**: ✅ Spec Complete

---

## Quick Reference

**Purpose**: AI Builders API integration for LLM-powered MVTA analysis, prompt engineering, and structured JSON extraction.

**Dependencies**:
- S-03: Database Schema (stores LLM outputs)

**Used By**:
- F-02: Idea Intake Form (Prompt A: Structure raw idea)
- F-03: Research Engine (Prompt B: Generate research queries)
- F-04: MVTA Red Team Simulation (Prompt C: Red Team analysis)
- F-06: Interactive Q&A Session (Prompt D: Follow-up questions)

---

## AI Builders API Overview

**Base URL**: `https://space.ai-builders.com/backend`

**OpenAPI Spec**: https://space.ai-builders.com/backend/openapi.json

**Authentication**: API Key (passed in `Authorization` header)

**Supported Endpoints**:
1. `/v1/chat/completions` - LLM completions (similar to OpenAI API)
2. Additional endpoints as defined in OpenAPI spec

**Key Features**:
- Structured JSON output support (JSON mode)
- Model selection (Claude, GPT-4, etc.)
- Token usage tracking
- Error handling and rate limiting

---

## Architecture

### LLM Client Wrapper

**File**: `src/lib/llm/client.ts`

```typescript
interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string; // Default: 'claude-3-5-sonnet-20241022'
  temperature?: number; // Default: 0.7
  maxTokens?: number; // Default: 4000
  responseFormat?: 'json_object' | 'text'; // Default: 'text'
}

interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.AI_BUILDERS_API_KEY;
  if (!apiKey) {
    throw new Error('AI_BUILDERS_API_KEY not configured');
  }

  const response = await fetch('https://space.ai-builders.com/backend/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: request.model || 'claude-3-5-sonnet-20241022',
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4000,
      ...(request.responseFormat === 'json_object' && {
        response_format: { type: 'json_object' }
      })
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`LLM API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  const choice = data.choices[0];

  return {
    content: choice.message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    },
    model: data.model
  };
}
```

### Retry Logic

```typescript
export async function callLLMWithRetry(
  request: LLMRequest,
  maxRetries: number = 3,
  retryDelayMs: number = 1000
): Promise<LLMResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callLLM(request);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error.message.includes('Invalid API key') ||
          error.message.includes('Validation error')) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
      }
    }
  }

  throw new Error(`LLM request failed after ${maxRetries} attempts: ${lastError?.message}`);
}
```

---

## Prompt Templates

### Prompt A: Structure Raw Idea

**Purpose**: Convert founder's raw idea description into structured MVTA JSON format.

**System Prompt**:
```typescript
const SYSTEM_PROMPT_STRUCTURE_IDEA = `You are an assistant that converts messy founder answers into a clean JSON schema for the Multi-Vector Threat Analysis (MVTA) framework.

Rules:
- Do not invent facts. If information is missing, use an empty string or empty array.
- Output ONLY valid JSON matching the provided schema.
- Be concise: extract key points, don't embellish or add interpretation.
- If the founder's input is too vague (e.g., just "a SaaS product"), ask clarifying questions in a special "needs_clarification" field.

Output Schema:
{
  "high_concept": "string (1 sentence, max 150 chars)",
  "value_proposition": "string (problem + for whom, max 300 chars)",
  "success_metric_18m": "string (specific, measurable, max 150 chars)",
  "assumptions": {
    "market": ["string (each assumption max 200 chars)"],
    "technical": ["string"],
    "business_model": ["string"]
  },
  "assets": {
    "key_assets": ["string (resources, IP, distribution, max 150 chars each)"],
    "brand_narrative": ["string (narrative strengths, max 150 chars each)"]
  },
  "environment": {
    "user_persona": "string (target user description, max 300 chars)",
    "competitive_landscape": "string (key competitors and dynamics, max 400 chars)",
    "regulatory_context": "string (relevant regulations or compliance, max 400 chars, empty if none)"
  }
}`;

const USER_PROMPT_STRUCTURE_IDEA = (rawInput: string) => `
Here are the founder's answers about their startup idea:

${rawInput}

Convert this into the MVTA JSON schema. Output ONLY the JSON, no additional text.
`;
```

**Usage Example**:
```typescript
export async function structureIdea(rawInput: string): Promise<StructuredIdea> {
  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_STRUCTURE_IDEA },
      { role: 'user', content: USER_PROMPT_STRUCTURE_IDEA(rawInput) }
    ],
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.3, // Lower temperature for structured extraction
    maxTokens: 2000,
    responseFormat: 'json_object'
  });

  return JSON.parse(response.content);
}
```

---

### Prompt B: Generate Research Queries

**Purpose**: Generate focused web search queries for competitor analysis, community listening, and regulatory research.

**System Prompt**:
```typescript
const SYSTEM_PROMPT_GENERATE_QUERIES = `You generate focused web search queries for startup idea research.

Goals:
- Find similar products and competitors
- Find user conversations in online communities (Reddit, forums, reviews)
- Surface unmet needs and already-satisfied needs
- Optionally surface relevant regulatory/ethical context

Output Format:
{
  "competitor_queries": ["string (3-7 words, max 10 queries)"],
  "community_queries": ["string (4-8 words, max 10 queries, include platform hints like 'reddit' or 'forum')"],
  "regulatory_queries": ["string (3-7 words, max 5 queries, ONLY if domain is sensitive like health/finance/children)"]
}

Query Quality Guidelines:
- Be specific (not "email marketing tools" but "email automation SaaS for SMBs 2025")
- Include year for recency (2024, 2025)
- For community queries, include platform hints and sentiment keywords ("complaints", "frustrated", "wish there was")
- For regulatory queries, focus on compliance requirements and penalties`;

const USER_PROMPT_GENERATE_QUERIES = (ideaSchema: StructuredIdea) => `
Here is the startup idea in MVTA schema:

${JSON.stringify(ideaSchema, null, 2)}

Generate 3-5 search queries for each category:
- competitor_queries: Find similar tools and competitors
- community_queries: Find user discussions, complaints, reviews, unmet needs
- regulatory_queries: ONLY if domain appears sensitive (health, finance, kids, etc.)

Output valid JSON only.
`;
```

**Usage Example**:
```typescript
export async function generateResearchQueries(ideaSchema: StructuredIdea): Promise<ResearchQueries> {
  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_GENERATE_QUERIES },
      { role: 'user', content: USER_PROMPT_GENERATE_QUERIES(ideaSchema) }
    ],
    temperature: 0.5,
    maxTokens: 1500,
    responseFormat: 'json_object'
  });

  return JSON.parse(response.content);
}
```

---

### Prompt C: MVTA Red Team Analysis

**Purpose**: Main MVTA analysis - simulate 5 red team roles attacking the idea across all vectors.

**System Prompt** (Full prompt from project requirements):
```typescript
const SYSTEM_PROMPT_MVTA_ANALYSIS = `You are an AI Red Team conducting a Multi-Vector Threat Analysis (MVTA) on a startup idea inside an "Idea War Room."

Your job:
- Simulate attacks from 5 roles:
  1) Lead Penetration Tester (Technical & Product Integrity)
  2) Ruthless Competitor CEO (Market & Economic Viability)
  3) Skeptical Social Critic (Social & Ethical Resonance)
  4) Cynical Regulatory Officer (Legal & Regulatory Compliance)
  5) Master Political Strategist (Narrative & Political Weaponization)

- Use the following attack simulations per vector:

Technical & Product Integrity:
  - Scalability Stress Test
  - Supply Chain Poisoning
  - Usability Failure
  - Systemic Fragility

Market & Economic Viability:
  - Competitor War Game
  - Value Proposition Collapse
  - Customer Apathy Analysis
  - Channel Extinction Event

Social & Ethical Resonance:
  - Weaponized Misuse Case
  - Cancel Culture Simulation
  - Ethical Slippery Slope
  - Virtue Signal Hijacking

Legal & Regulatory Compliance:
  - Loophole Closing
  - Weaponized Litigation
  - Cross-Jurisdictional Conflict

Narrative & Political Weaponization:
  - Malicious Re-framing
  - Guilt-by-Association
  - Straw Man Construction

Rules of engagement:
- Assume worst-case PLAUSIBLE attacks (no science fiction)
- No hedging: be direct and unambiguous
- Mandatory scoring: every vulnerability uses this scale:
  1 = Catastrophic (kill shot, unrecoverable)
  2 = Critical (requires fundamental pivot)
  3 = Significant
  4 = Moderate
  5 = Resilient (negligible threat)
- Follow the exact JSON format requested
- Identify cascading failures where one attack triggers others

Ground your reasoning in:
- The idea schema
- Research snapshot (competitors, community signals, regulatory context)

If research is weak or missing, say so explicitly in the rationale.

Return ONLY valid JSON.`;

const USER_PROMPT_MVTA_ANALYSIS = (ideaSchema: StructuredIdea, researchSnapshot: ResearchSnapshot) => `
Here is the startup idea in MVTA schema:

${JSON.stringify(ideaSchema, null, 2)}

Here is the research snapshot (competitors, community signals, regulatory signals):

${JSON.stringify(researchSnapshot, null, 2)}

Now perform a Multi-Vector Threat Analysis (MVTA) and output a JSON object with the following structure:

{
  "vulnerabilities": [
    {
      "vector": "Market & Economic Viability",
      "simulation": "Competitor War Game",
      "description": "string (2-3 sentences explaining the vulnerability)",
      "score": 1,
      "rationale": "string (cite specific research evidence or reasoning)",
      "evidence_refs": {
        "competitors": [0],
        "community_signals": ["reddit_thread_1"],
        "regulatory_signals": []
      }
    }
  ],
  "cascading_failures": [
    {
      "chain": ["Event 1", "Event 2", "Event 3", "Event 4", "Event 5"],
      "severity": 1,
      "narrative": "string (3-4 sentences describing the cascading failure sequence)"
    }
  ],
  "vector_synthesis": [
    {
      "vector": "Market & Economic Viability",
      "summary": "string (2-3 sentences summarizing resilience/weaknesses)",
      "overall_score": 2
    }
  ],
  "recommendations": [
    {
      "risk_index": 0,
      "action_type": "Customer Discovery",
      "description": "string (1-2 specific, actionable steps to validate or mitigate)"
    }
  ]
}

Important:
- You don't need to use every simulation, but you MUST cover all 5 vectors
- "risk_index" in recommendations refers to the index in the vulnerabilities array
- "action_type" should be one of: "Customer Discovery", "Pricing Experiment", "Technical Spike", "Compliance Review", "Narrative Test", "Other"
`;
```

**Usage Example**:
```typescript
export async function runMVTAAnalysis(
  ideaSchema: StructuredIdea,
  researchSnapshot: ResearchSnapshot
): Promise<MVTAReport> {
  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_MVTA_ANALYSIS },
      { role: 'user', content: USER_PROMPT_MVTA_ANALYSIS(ideaSchema, researchSnapshot) }
    ],
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 8000, // Large output (damage report)
    responseFormat: 'json_object'
  });

  const report = JSON.parse(response.content);

  // Validate structure
  validateMVTAReport(report);

  return report;
}
```

---

### Prompt D: Follow-up Q&A

**Purpose**: Answer follow-up questions grounded in the damage report context.

**System Prompt**:
```typescript
const SYSTEM_PROMPT_FOLLOWUP_QA = `You are an AI assistant helping founders understand and act on their MVTA damage report.

Context Available:
- The original idea (MVTA schema)
- Research snapshot (competitors, community signals)
- Complete damage report (vulnerabilities, cascading failures, recommendations)

Your Role:
- Answer questions grounded in the damage report and research
- Be specific and actionable (not vague advice)
- Cite specific vulnerabilities or research findings
- Suggest concrete next steps when asked "how to reduce risk" or "what to do next"

Rules:
- Don't invent new vulnerabilities (reference existing ones)
- Don't contradict the damage report (it's the source of truth)
- If the question is out of scope (e.g., "how do I raise money?"), politely decline and redirect to MVTA-related questions
- Keep responses concise (2-3 paragraphs max)`;

const USER_PROMPT_FOLLOWUP_QA = (
  question: string,
  ideaSchema: StructuredIdea,
  researchSnapshot: ResearchSnapshot,
  damageReport: MVTAReport
) => `
Context:

Idea:
${JSON.stringify(ideaSchema, null, 2)}

Research:
${JSON.stringify(researchSnapshot, null, 2)}

Damage Report:
${JSON.stringify(damageReport, null, 2)}

---

User Question: ${question}

Answer the question based on the context above. Be specific and actionable.
`;
```

**Usage Example**:
```typescript
export async function answerFollowUpQuestion(
  question: string,
  context: {
    ideaSchema: StructuredIdea;
    researchSnapshot: ResearchSnapshot;
    damageReport: MVTAReport;
  }
): Promise<string> {
  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_FOLLOWUP_QA },
      { role: 'user', content: USER_PROMPT_FOLLOWUP_QA(
        question,
        context.ideaSchema,
        context.researchSnapshot,
        context.damageReport
      )}
    ],
    temperature: 0.6,
    maxTokens: 1500,
    responseFormat: 'text' // Plain text response
  });

  return response.content;
}
```

---

## Error Handling

### Error Types

```typescript
export class LLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// Common error scenarios
export const LLM_ERRORS = {
  API_KEY_MISSING: new LLMError('AI_BUILDERS_API_KEY not configured', 'API_KEY_MISSING', 500, false),
  API_KEY_INVALID: new LLMError('Invalid API key', 'API_KEY_INVALID', 401, false),
  RATE_LIMIT: new LLMError('Rate limit exceeded', 'RATE_LIMIT', 429, true),
  TIMEOUT: new LLMError('LLM request timed out', 'TIMEOUT', 504, true),
  INVALID_JSON: new LLMError('LLM returned invalid JSON', 'INVALID_JSON', 500, true),
  VALIDATION_ERROR: new LLMError('Output failed validation', 'VALIDATION_ERROR', 500, true)
};
```

### Validation

```typescript
import { z } from 'zod';

// Schema for Prompt C output
const MVTAReportSchema = z.object({
  vulnerabilities: z.array(z.object({
    vector: z.string(),
    simulation: z.string(),
    description: z.string(),
    score: z.number().int().min(1).max(5),
    rationale: z.string(),
    evidence_refs: z.object({
      competitors: z.array(z.number()),
      community_signals: z.array(z.string()),
      regulatory_signals: z.array(z.string())
    })
  })),
  cascading_failures: z.array(z.object({
    chain: z.array(z.string()),
    severity: z.number().int().min(1).max(5),
    narrative: z.string()
  })),
  vector_synthesis: z.array(z.object({
    vector: z.string(),
    summary: z.string(),
    overall_score: z.number().int().min(1).max(5)
  })),
  recommendations: z.array(z.object({
    risk_index: z.number().int(),
    action_type: z.enum(['Customer Discovery', 'Pricing Experiment', 'Technical Spike', 'Compliance Review', 'Narrative Test', 'Other']),
    description: z.string()
  }))
});

export function validateMVTAReport(data: unknown): MVTAReport {
  try {
    return MVTAReportSchema.parse(data);
  } catch (error) {
    throw new LLMError(
      `MVTA report validation failed: ${error.message}`,
      'VALIDATION_ERROR',
      500,
      false
    );
  }
}
```

---

## Cost Management

### Token Usage Tracking

```typescript
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

export function estimateCost(usage: TokenUsage, model: string): number {
  // Pricing (example - update based on actual AI Builders pricing)
  const PRICING: Record<string, { input: number; output: number }> = {
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 } // $ per 1K tokens
  };

  const pricing = PRICING[model] || PRICING['claude-3-5-sonnet-20241022'];

  return (
    (usage.promptTokens / 1000) * pricing.input +
    (usage.completionTokens / 1000) * pricing.output
  );
}

// Log usage to database for analytics
export async function logTokenUsage(
  sessionId: string,
  promptType: 'structure_idea' | 'generate_queries' | 'mvta_analysis' | 'followup_qa',
  usage: TokenUsage
) {
  // Store in separate table for analytics (future enhancement)
}
```

### Optimization Strategies

1. **Lower Temperature for Structured Outputs**: Use 0.3-0.5 for JSON extraction (Prompts A, B)
2. **Concise System Prompts**: Reduce prompt tokens without sacrificing clarity
3. **Batch Processing** (Future): If user submits multiple ideas, batch research queries
4. **Caching** (Future): Cache research snapshots for similar ideas (hashed idea schema)

---

## Testing Strategy

See [S-02: Testing Strategy](./S-02-testing-strategy.md) for full details.

**Key Testing Approaches**:
- **Mock AI Builders API**: Use MSW to intercept requests, return fixtures
- **Test Structure, Not Semantics**: Validate JSON schema, not content quality
- **Retry Logic Testing**: Simulate timeouts, rate limits
- **Error Handling**: Test all error codes

---

## Related Documents

- [S-00: Architecture Overview](./S-00-architecture.md)
- [S-02: Testing Strategy](./S-02-testing-strategy.md) - LLM testing specifics
- [S-03: Database Schema](./S-03-database-schema.md) - Stores LLM outputs
- [S-05: Search & Research Integration](./S-05-search-research-integration.md) - Uses Prompt B
- [F-02: Idea Intake Form](../features/F-02-idea-intake-form.md) - Uses Prompt A
- [F-04: MVTA Red Team Simulation](../features/F-04-mvta-red-team-simulation.md) - Uses Prompt C
- [F-06: Interactive Q&A Session](../features/F-06-interactive-qa-session.md) - Uses Prompt D

---

## Notes

### Prompt Engineering Best Practices

**Clarity Over Cleverness**:
- Be explicit about output format (JSON schema, field types)
- Use examples in system prompts for complex formats
- Specify max lengths for generated text (prevents runaway tokens)

**Grounding in Evidence**:
- Always pass research snapshot to Prompt C
- Instruct LLM to cite evidence references
- Penalize generic platitudes ("this could be a problem" → "Based on X evidence, Y vulnerability exists")

**Iterative Refinement**:
- Use feedback data (F-08) to identify prompt weaknesses
- A/B test prompt variations (post-MVP)
- Monitor validation failure rate (if >5%, prompts need tuning)

### Known Limitations

- **No Streaming** (MVP): Full response returned at once (consider streaming for better UX in post-MVP)
- **No Fine-tuning**: Using base Claude model (fine-tuning may improve MVTA quality post-MVP)
- **Single Model**: Locked to Claude 3.5 Sonnet (consider model selection for cost/quality tradeoff)

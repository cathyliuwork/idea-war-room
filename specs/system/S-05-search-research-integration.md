# S-05: Search & Research Integration

**Version**: 2.0
**Last Updated**: 2025-12-14
**Status**: ✅ Spec Complete

---

## Quick Reference

**Purpose**: AI Builders Search API integration for web research, competitor discovery, and community listening (Reddit, forums, reviews).

**Dependencies**:
- S-03: Database Schema (stores research snapshots)
- S-04: LLM Integration (uses Prompt B to generate queries)

**Used By**:
- F-03: Research Engine (executes searches, synthesizes results)
- F-04: MVTA Red Team Simulation (consumes research snapshot for grounded analysis)

---

## AI Builders Search API Overview

**Base URL**: `https://space.ai-builders.com/backend`

**OpenAPI Spec**: https://space.ai-builders.com/backend/openapi.json

**Authentication**: API Key (passed in `Authorization` header)

**Key Features**:
- Web search with relevance ranking
- Multi-source aggregation (Reddit, forums, product reviews, competitor websites)
- Snippet extraction and summarization
- Result filtering and deduplication

**Note**: Exact endpoint structure should be verified against the OpenAPI spec. This module assumes a `/v1/search` endpoint with query parameters.

---

## Architecture

### Search Client Wrapper

**File**: `src/lib/search/client.ts`

```typescript
interface SearchRequest {
  query: string;
  maxResults?: number; // Default: 10
  sources?: string[]; // E.g., ['reddit', 'product_hunt', 'web']
  dateFilter?: 'past_day' | 'past_week' | 'past_month' | 'past_year' | 'any'; // Default: 'past_year'
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string; // E.g., 'reddit', 'ycombinator', 'g2.com'
  publishedDate?: string; // ISO 8601
  relevanceScore?: number; // 0-1
}

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  query: string;
}

export async function search(request: SearchRequest): Promise<SearchResponse> {
  const apiKey = process.env.AI_BUILDERS_API_KEY;
  if (!apiKey) {
    throw new Error('AI_BUILDERS_API_KEY not configured');
  }

  const url = new URL('https://space.ai-builders.com/backend/v1/search');
  url.searchParams.set('q', request.query);
  url.searchParams.set('limit', String(request.maxResults || 10));
  if (request.sources) {
    url.searchParams.set('sources', request.sources.join(','));
  }
  if (request.dateFilter) {
    url.searchParams.set('date_filter', request.dateFilter);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Search API error: ${error.message || response.statusText}`);
  }

  return await response.json();
}
```

### Retry Logic

```typescript
export async function searchWithRetry(
  request: SearchRequest,
  maxRetries: number = 3,
  retryDelayMs: number = 1000
): Promise<SearchResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await search(request);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on auth errors
      if (error.message.includes('Invalid API key') ||
          error.message.includes('Unauthorized')) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
      }
    }
  }

  throw new Error(`Search request failed after ${maxRetries} attempts: ${lastError?.message}`);
}
```

---

## Research Workflow

### Step 1: Generate Research Queries

**Input**: Structured idea (MVTA schema from Prompt A)

**Process**: Use LLM (Prompt B from S-04) to generate targeted queries

**Output**: 3 query categories
- `competitor_queries`: Find similar tools and competitors
- `community_queries`: Find user discussions, pain points, unmet needs
- `regulatory_queries`: Compliance and legal context (if applicable)

**Implementation**: See [S-04: LLM Integration](./S-04-llm-integration.md) - Prompt B

---

### Step 2: Execute Searches

**Input**: Generated queries from Step 1

**Process**: For each query, call AI Builders Search API

**File**: `src/lib/search/research-engine.ts`

```typescript
import { search } from './client';
import { generateResearchQueries } from '@/lib/llm/prompts';

// Generic research result type (database-aligned)
interface ResearchResult<T extends string, R> {
  research_type: T;
  queries: string[];
  results: R[];
}

// Type-specific research results
type CompetitorResearch = ResearchResult<'competitor', Competitor>;
type CommunityResearch = ResearchResult<'community', CommunitySignal>;
type RegulatoryResearch = ResearchResult<'regulatory', RegulatorySignal>;

// Union type for all research types
type TypedResearchResult =
  | CompetitorResearch
  | CommunityResearch
  | RegulatoryResearch;

// Function overloads for type safety
export async function conductResearch(
  ideaSchema: StructuredIdea,
  type: 'competitor'
): Promise<CompetitorResearch>;

export async function conductResearch(
  ideaSchema: StructuredIdea,
  type: 'community'
): Promise<CommunityResearch>;

export async function conductResearch(
  ideaSchema: StructuredIdea,
  type: 'regulatory'
): Promise<RegulatoryResearch>;

// Implementation
export async function conductResearch(
  ideaSchema: StructuredIdea,
  type: 'competitor' | 'community' | 'regulatory'
): Promise<TypedResearchResult> {
  // Step 1: Generate queries using LLM (type-specific)
  const queries = await generateResearchQueries(ideaSchema, type);

  // Step 2: Execute searches for selected type only
  let results;
  switch (type) {
    case 'competitor':
      results = await executeCompetitorResearch(queries);
      break;
    case 'community':
      results = await executeCommunityResearch(queries);
      break;
    case 'regulatory':
      results = await executeRegulatoryResearch(queries);
      break;
  }

  // Step 3: Return type-specific research result
  return {
    research_type: type,
    queries: queries,
    results: results
  } as TypedResearchResult;
}
```

---

### Step 3: Synthesize Results

**Purpose**: Convert raw search results into structured data for MVTA analysis

#### Competitor Research

```typescript
interface CompetitorResult {
  name: string;
  url: string;
  summary: string; // 1-2 sentences
  pricing?: string;
  strengths: string[];
  weaknesses: string[];
}

async function executeCompetitorResearch(queries: string[]): Promise<CompetitorResult[]> {
  const allResults: SearchResult[] = [];

  // Execute all queries in parallel
  const searchPromises = queries.map(query =>
    searchWithRetry({
      query,
      maxResults: 5,
      sources: ['web', 'product_hunt', 'capterra'],
      dateFilter: 'past_year'
    })
  );

  const responses = await Promise.all(searchPromises);

  // Flatten and deduplicate results
  responses.forEach(response => {
    allResults.push(...response.results);
  });

  const uniqueResults = deduplicateByURL(allResults);

  // Synthesize into competitor profiles using LLM
  return await synthesizeCompetitors(uniqueResults);
}

function deduplicateByURL(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter(result => {
    const domain = new URL(result.url).hostname;
    if (seen.has(domain)) return false;
    seen.add(domain);
    return true;
  });
}
```

#### Community Listening

```typescript
interface CommunitySignal {
  source: 'reddit' | 'ycombinator' | 'forum' | 'review_site';
  url: string;
  title: string;
  snippet: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  themes: string[]; // E.g., ['pricing', 'usability', 'support']
  publishedDate?: string;
}

async function executeCommunityResearch(queries: string[]): Promise<CommunitySignal[]> {
  const allResults: SearchResult[] = [];

  // Focus on community platforms
  const searchPromises = queries.map(query =>
    searchWithRetry({
      query,
      maxResults: 10,
      sources: ['reddit', 'ycombinator', 'forums'],
      dateFilter: 'past_year'
    })
  );

  const responses = await Promise.all(searchPromises);

  responses.forEach(response => {
    allResults.push(...response.results);
  });

  // Classify sentiment and extract themes using LLM
  return await classifyCommunitySignals(allResults);
}
```

#### Regulatory Research

```typescript
interface RegulatorySignal {
  regulation: string; // E.g., 'GDPR', 'HIPAA', 'COPPA'
  summary: string;
  compliance_requirements: string[];
  penalties: string;
  applicability: string; // When this regulation applies
}

async function executeRegulatoryResearch(queries: string[]): Promise<RegulatorySignal[]> {
  if (queries.length === 0) return [];

  const allResults: SearchResult[] = [];

  const searchPromises = queries.map(query =>
    searchWithRetry({
      query,
      maxResults: 5,
      sources: ['web'],
      dateFilter: 'past_year'
    })
  );

  const responses = await Promise.all(searchPromises);

  responses.forEach(response => {
    allResults.push(...response.results);
  });

  // Extract structured regulatory info using LLM
  return await synthesizeRegulatoryContext(allResults);
}
```

---

## LLM-Powered Synthesis

### Synthesize Competitors

**Purpose**: Convert raw search results into structured competitor profiles

```typescript
const SYSTEM_PROMPT_SYNTHESIZE_COMPETITORS = `You are a startup analyst synthesizing competitor research.

Input: Raw search results (titles, URLs, snippets)

Output: Structured competitor profiles (JSON array)

Rules:
- Each competitor gets a profile (name, URL, summary, pricing, strengths, weaknesses)
- Be concise (summary: 1-2 sentences, strengths/weaknesses: 3-5 items each)
- Only include information explicitly stated in search results (no speculation)
- If pricing info not found, omit field
- Deduplicate (combine multiple results about same competitor)

Output Schema:
[
  {
    "name": "string",
    "url": "string",
    "summary": "string",
    "pricing": "string (optional)",
    "strengths": ["string"],
    "weaknesses": ["string"]
  }
]`;

async function synthesizeCompetitors(searchResults: SearchResult[]): Promise<CompetitorResult[]> {
  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_SYNTHESIZE_COMPETITORS },
      { role: 'user', content: `
Search results:

${searchResults.map(r => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}\n---`).join('\n')}

Synthesize into competitor profiles (JSON array).
      `}
    ],
    temperature: 0.3,
    maxTokens: 3000,
    responseFormat: 'json_object'
  });

  return JSON.parse(response.content);
}
```

### Classify Community Signals

**Purpose**: Extract sentiment and themes from community discussions

```typescript
const SYSTEM_PROMPT_CLASSIFY_COMMUNITY = `You are a user researcher analyzing community discussions.

Input: Raw search results from Reddit, forums, review sites

Output: Classified signals with sentiment and themes (JSON array)

Rules:
- Determine sentiment: positive, negative, or neutral
- Extract themes: pricing, usability, support, features, performance, etc.
- Be specific: don't just say "negative" - explain what users are frustrated about

Output Schema:
[
  {
    "source": "reddit | ycombinator | forum | review_site",
    "url": "string",
    "title": "string",
    "snippet": "string (extract most relevant quote, max 200 chars)",
    "sentiment": "positive | negative | neutral",
    "themes": ["string"],
    "publishedDate": "string (ISO 8601, if available)"
  }
]`;

async function classifyCommunitySignals(searchResults: SearchResult[]): Promise<CommunitySignal[]> {
  // Batch processing (10 results at a time to avoid token limits)
  const batches = chunkArray(searchResults, 10);
  const allSignals: CommunitySignal[] = [];

  for (const batch of batches) {
    const response = await callLLMWithRetry({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_CLASSIFY_COMMUNITY },
        { role: 'user', content: `
Search results:

${batch.map(r => `Source: ${r.source}\nTitle: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}\nDate: ${r.publishedDate || 'Unknown'}\n---`).join('\n')}

Classify these community signals (JSON array).
        `}
      ],
      temperature: 0.4,
      maxTokens: 4000,
      responseFormat: 'json_object'
    });

    allSignals.push(...JSON.parse(response.content));
  }

  return allSignals;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### Synthesize Regulatory Context

**Purpose**: Extract structured compliance requirements

```typescript
const SYSTEM_PROMPT_SYNTHESIZE_REGULATORY = `You are a compliance analyst extracting regulatory requirements.

Input: Raw search results about regulations, compliance, legal requirements

Output: Structured regulatory signals (JSON array)

Rules:
- Identify specific regulations (GDPR, HIPAA, COPPA, SOC 2, etc.)
- Extract: summary, compliance requirements, penalties, applicability
- Be factual (cite regulation names and specifics)
- Only include regulations clearly mentioned in search results

Output Schema:
[
  {
    "regulation": "string (official name)",
    "summary": "string (1-2 sentences)",
    "compliance_requirements": ["string"],
    "penalties": "string (fines, bans, legal consequences)",
    "applicability": "string (when this applies)"
  }
]`;

async function synthesizeRegulatoryContext(searchResults: SearchResult[]): Promise<RegulatorySignal[]> {
  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_SYNTHESIZE_REGULATORY },
      { role: 'user', content: `
Search results:

${searchResults.map(r => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}\n---`).join('\n')}

Extract regulatory requirements (JSON array).
      `}
    ],
    temperature: 0.3,
    maxTokens: 3000,
    responseFormat: 'json_object'
  });

  return JSON.parse(response.content);
}
```

---

## Progress Tracking

### Real-Time Updates

**Purpose**: Show users what research is happening (transparency)

**Implementation**: Use server-sent events (SSE) or polling

```typescript
export enum ResearchStage {
  GENERATING_QUERIES = 'generating_queries',
  SEARCHING_COMPETITORS = 'searching_competitors',
  SEARCHING_COMMUNITY = 'searching_community',
  SEARCHING_REGULATORY = 'searching_regulatory',
  SYNTHESIZING = 'synthesizing',
  COMPLETE = 'complete'
}

interface ResearchProgress {
  stage: ResearchStage;
  message: string;
  progress: number; // 0-100
}

export async function conductResearchWithProgress(
  ideaSchema: StructuredIdea,
  type: 'competitor' | 'community' | 'regulatory',
  onProgress: (progress: ResearchProgress) => void
): Promise<TypedResearchResult> {
  onProgress({
    stage: ResearchStage.GENERATING_QUERIES,
    message: 'Generating research queries...',
    progress: 10
  });

  const queries = await generateResearchQueries(ideaSchema);

  onProgress({
    stage: ResearchStage.SEARCHING_COMPETITORS,
    message: `Analyzing ${queries.competitor_queries.length} competitor queries...`,
    progress: 30
  });

  const competitorResults = await executeCompetitorResearch(queries.competitor_queries);

  onProgress({
    stage: ResearchStage.SEARCHING_COMMUNITY,
    message: `Analyzing ${queries.community_queries.length} community signals...`,
    progress: 50
  });

  const communityResults = await executeCommunityResearch(queries.community_queries);

  onProgress({
    stage: ResearchStage.SEARCHING_REGULATORY,
    message: 'Checking regulatory context...',
    progress: 70
  });

  const regulatoryResults = await executeRegulatoryResearch(queries.regulatory_queries);

  onProgress({
    stage: ResearchStage.SYNTHESIZING,
    message: 'Synthesizing research snapshot...',
    progress: 90
  });

  const snapshot = {
    competitors: competitorResults,
    community_signals: communityResults,
    regulatory_signals: regulatoryResults
  };

  onProgress({
    stage: ResearchStage.COMPLETE,
    message: 'Research complete',
    progress: 100
  });

  return snapshot;
}
```

---

## Error Handling

### Graceful Degradation

**Strategy**: If search API fails, proceed with partial data

```typescript
export async function conductResearchSafe(
  ideaSchema: StructuredIdea,
  type: 'competitor' | 'community' | 'regulatory'
): Promise<TypedResearchResult> {
  let results: any[] = [];

  try {
    const queries = await generateResearchQueries(ideaSchema, type);

    // Try research for selected type
    try {
      switch (type) {
        case 'competitor':
          results = await executeCompetitorResearch(queries);
          break;
        case 'community':
          results = await executeCommunityResearch(queries);
          break;
        case 'regulatory':
          results = await executeRegulatoryResearch(queries);
          break;
      }
    } catch (error) {
      console.error(`${type} research failed:`, error);
      // Continue with empty results
    }
  } catch (error) {
    console.error('Research query generation failed:', error);
    // Proceed with empty results (MVTA analysis will note lack of evidence)
  }

  return {
    research_type: type,
    queries: [],
    results: results
  } as TypedResearchResult;
}
```

---

## Caching Strategy (Future Enhancement)

**Not included in MVP**, but considerations for post-launch:

### Research Result Caching

```typescript
// Cache research snapshots based on idea similarity
// If two ideas are very similar (e.g., both "email marketing SaaS for SMBs"),
// reuse cached research results (max age: 7 days)

interface CachedResearch {
  ideaHash: string; // Hash of structured_idea
  research_type: string; // Type of research cached
  snapshot: TypedResearchResult;
  createdAt: Date;
}

async function getCachedResearch(
  ideaSchema: StructuredIdea,
  type: string
): Promise<TypedResearchResult | null> {
  const hash = hashIdeaSchema(ideaSchema);
  // Check cache (Redis or database table) for matching ideaHash + research_type
  // If found and < 7 days old, return cached snapshot
  return null; // Not implemented in MVP
}
```

---

## Related Documents

- [S-00: Architecture Overview](./S-00-architecture.md)
- [S-03: Database Schema](./S-03-database-schema.md) - research_snapshots table
- [S-04: LLM Integration](./S-04-llm-integration.md) - Prompt B for query generation
- [F-03: Research Engine](../features/F-03-research-engine.md) - Main consumer
- [F-04: MVTA Red Team Simulation](../features/F-04-mvta-red-team-simulation.md) - Uses research snapshot

---

## Notes

### Research Quality Factors

**Good Research**:
- Recent results (past year preferred)
- Multiple sources (not just one competitor review)
- Direct user quotes (Reddit, forums)
- Specific complaints and pain points

**Poor Research** (MVTA will be less grounded):
- Generic marketing content
- Outdated results (>2 years old)
- No user sentiment data
- Missing competitor info

**Mitigation**: MVTA analysis explicitly states when research is weak ("No competitor evidence found, this is speculative")

### API Rate Limits

- Monitor AI Builders Search API rate limits
- Implement backoff if hitting limits
- Consider batch processing for multiple ideas (future)

### Known Limitations

- No real-time web scraping (relies on AI Builders indexed data)
- English-only for MVP (multi-language search in future)
- Limited to public web sources (no paywalled reports or databases)

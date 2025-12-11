import { callLLMWithRetry } from '../client';
import { z } from 'zod';

// Import from search client
interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
}

interface SearchQueryResult {
  keyword: string;
  response: {
    results: SearchResult[];
    answer?: string;
  };
}

/**
 * Synthesis Prompts
 *
 * Convert raw search results into structured profiles for MVTA analysis.
 * Three functions: competitors, community signals, regulatory signals.
 */

// ============================================================================
// COMPETITOR SYNTHESIS
// ============================================================================

const CompetitorSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  summary: z.string().min(1),
  pricing: z.string().optional(),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
});

export type Competitor = z.infer<typeof CompetitorSchema>;

const COMPETITOR_SYSTEM_PROMPT = `You are an analyst synthesizing competitor intelligence from web search results.

Given raw search results about competitors, extract 3-8 distinct competitor profiles. Focus on:
- Direct competitors (same problem, similar solution)
- Adjacent alternatives (different approach, same outcome)
- Established players the startup will displace

For each competitor, provide:
- Name: Company/product name
- URL: Primary website
- Summary: What they do (1-2 sentences)
- Pricing: Pricing model if mentioned (or omit if not found)
- Strengths: 2-4 competitive advantages
- Weaknesses: 2-4 vulnerabilities or gaps

Output ONLY valid JSON array:
[
  {
    "name": "string",
    "url": "string",
    "summary": "string",
    "pricing": "string or omit",
    "strengths": ["string"],
    "weaknesses": ["string"]
  }
]

Rules:
- Extract 3-8 competitors max
- Base analysis ONLY on provided search results
- If insufficient data, reduce number of competitors (don't fabricate)
- Prioritize competitors with detailed information`;

/**
 * Synthesize competitor profiles from search results
 *
 * @param searchResults - Raw search results from competitor queries
 * @returns Array of competitor profiles
 */
export async function synthesizeCompetitors(
  searchResults: SearchQueryResult[]
): Promise<Competitor[]> {
  if (searchResults.length === 0) {
    return [];
  }

  // Aggregate all search results into context
  const context = searchResults
    .map((result) => {
      const snippets = result.response.results
        .slice(0, 10) // Top 10 results per query
        .map((r: SearchResult) => `[${r.title}](${r.url}): ${r.content.substring(0, 300)}...`)
        .join('\n\n');
      return `Query: "${result.keyword}"\n${snippets}`;
    })
    .join('\n\n---\n\n');

  const userPrompt = `Search Results:\n\n${context}\n\nSynthesize competitor profiles. Output ONLY the JSON array.`;

  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: COMPETITOR_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    model: 'gemini-2.5-pro',
    temperature: 0.4,
    maxTokens: 2000,
    responseFormat: 'json_object',
  });

  // Clean markdown code blocks
  let jsonContent = response.content.trim();
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, '');
    jsonContent = jsonContent.replace(/\n?```\s*$/, '');
  }

  const parsed = JSON.parse(jsonContent);

  // Handle both array and object with "competitors" key
  const competitorsArray = Array.isArray(parsed) ? parsed : (parsed.competitors || []);

  return z.array(CompetitorSchema).parse(competitorsArray);
}

// ============================================================================
// COMMUNITY SIGNAL SYNTHESIS
// ============================================================================

const CommunitySignalSchema = z.object({
  source: z.enum(['reddit', 'ycombinator', 'forum', 'review_site']),
  url: z.string().url(),
  title: z.string().min(1),
  snippet: z.string().min(1).max(500),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  themes: z.array(z.string()).min(1),
  publishedDate: z.string().optional(),
});

export type CommunitySignal = z.infer<typeof CommunitySignalSchema>;

const COMMUNITY_SYSTEM_PROMPT = `You are an analyst extracting community sentiment and themes from discussions.

Given raw search results from Reddit, forums, reviews, etc., extract 5-12 distinct community signals. Focus on:
- User pain points and frustrations
- Feature requests and wishlist items
- Competitor reviews (positive/negative)
- Market gaps and unmet needs

For each signal, provide:
- Source: "reddit", "ycombinator", "forum", or "review_site"
- URL: Link to discussion/review
- Title: Discussion title or summary
- Snippet: Key quote (max 200 chars)
- Sentiment: "positive", "negative", or "neutral"
- Themes: 1-3 tags (e.g., "pricing", "usability", "customer_support")

Output ONLY valid JSON array:
[
  {
    "source": "reddit" | "ycombinator" | "forum" | "review_site",
    "url": "string",
    "title": "string",
    "snippet": "string",
    "sentiment": "positive" | "negative" | "neutral",
    "themes": ["string"],
    "publishedDate": "string or omit"
  }
]

Rules:
- Extract 5-12 signals max
- Prioritize signals with clear sentiment
- Identify recurring themes across discussions
- Base analysis ONLY on provided results`;

/**
 * Synthesize community signals from search results
 *
 * @param searchResults - Raw search results from community queries
 * @returns Array of community signals
 */
export async function synthesizeCommunitySignals(
  searchResults: SearchQueryResult[]
): Promise<CommunitySignal[]> {
  if (searchResults.length === 0) {
    return [];
  }

  const context = searchResults
    .map((result) => {
      const snippets = result.response.results
        .slice(0, 10)
        .map((r) => `[${r.title}](${r.url}): ${r.content.substring(0, 300)}...`)
        .join('\n\n');
      return `Query: "${result.keyword}"\n${snippets}`;
    })
    .join('\n\n---\n\n');

  const userPrompt = `Search Results:\n\n${context}\n\nSynthesize community signals. Output ONLY the JSON array.`;

  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: COMMUNITY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    model: 'gemini-2.5-pro',
    temperature: 0.4,
    maxTokens: 2500,
    responseFormat: 'json_object',
  });

  // Clean markdown code blocks
  let jsonContent = response.content.trim();
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, '');
    jsonContent = jsonContent.replace(/\n?```\s*$/, '');
  }

  const parsed = JSON.parse(jsonContent);

  // Handle both array and object with "signals" or "community_signals" key
  const signalsArray = Array.isArray(parsed)
    ? parsed
    : (parsed.signals || parsed.community_signals || []);

  return z.array(CommunitySignalSchema).parse(signalsArray);
}

// ============================================================================
// REGULATORY SIGNAL SYNTHESIS
// ============================================================================

const RegulatorySignalSchema = z.object({
  regulation: z.string().min(1),
  summary: z.string().min(1),
  compliance_requirements: z.array(z.string()).min(1),
  penalties: z.string(),
  applicability: z.string(),
});

export type RegulatorySignal = z.infer<typeof RegulatorySignalSchema>;

const REGULATORY_SYSTEM_PROMPT = `You are a compliance analyst identifying regulatory requirements.

Given search results about regulations, extract 0-3 distinct regulatory signals. Focus on:
- Laws and regulations applicable to this domain
- Compliance requirements and certifications needed
- Penalties for non-compliance
- Geographic applicability (US, EU, global, etc.)

For each signal, provide:
- Regulation: Name (e.g., "GDPR", "HIPAA", "CCPA")
- Summary: What it regulates (1-2 sentences)
- Compliance Requirements: List of requirements
- Penalties: Consequences of non-compliance
- Applicability: Who must comply and where

Output ONLY valid JSON array:
[
  {
    "regulation": "string",
    "summary": "string",
    "compliance_requirements": ["string"],
    "penalties": "string",
    "applicability": "string"
  }
]

Rules:
- Extract 0-3 regulations max
- Only include if DIRECTLY applicable to this startup
- If no relevant regulations found, return empty array
- Be specific about requirements`;

/**
 * Synthesize regulatory signals from search results
 *
 * @param searchResults - Raw search results from regulatory queries
 * @returns Array of regulatory signals
 */
export async function synthesizeRegulatorySignals(
  searchResults: SearchQueryResult[]
): Promise<RegulatorySignal[]> {
  if (searchResults.length === 0) {
    return [];
  }

  const context = searchResults
    .map((result) => {
      const snippets = result.response.results
        .slice(0, 10)
        .map((r) => `[${r.title}](${r.url}): ${r.content.substring(0, 300)}...`)
        .join('\n\n');
      return `Query: "${result.keyword}"\n${snippets}`;
    })
    .join('\n\n---\n\n');

  const userPrompt = `Search Results:\n\n${context}\n\nSynthesize regulatory signals. Output ONLY the JSON array.`;

  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: REGULATORY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    model: 'gemini-2.5-pro',
    temperature: 0.3,
    maxTokens: 1500,
    responseFormat: 'json_object',
  });

  // Clean markdown code blocks
  let jsonContent = response.content.trim();
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, '');
    jsonContent = jsonContent.replace(/\n?```\s*$/, '');
  }

  const parsed = JSON.parse(jsonContent);

  // Handle both array and object with "regulations" or "regulatory_signals" key
  const regulationsArray = Array.isArray(parsed)
    ? parsed
    : (parsed.regulations || parsed.regulatory_signals || []);

  return z.array(RegulatorySignalSchema).parse(regulationsArray);
}

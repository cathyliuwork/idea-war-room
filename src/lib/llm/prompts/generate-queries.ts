import { callLLMWithRetry } from '../client';
import type { StructuredIdea } from '@/lib/validation/schemas';
import type { ResearchType } from '@/lib/constants/research';
import { z } from 'zod';

/**
 * Prompt B: Generate Research Queries
 *
 * Converts structured startup idea into targeted research queries.
 * Supports generating queries for specific research types (competitor, community, regulatory)
 * or all types at once.
 */

// Competitor-focused prompt
const COMPETITOR_SYSTEM_PROMPT = `You are a competitive intelligence researcher helping founders understand their competitive landscape.

Given a structured startup idea, generate 5-10 targeted search queries to identify competitors and alternatives.

Focus on:
- Direct competitors offering similar solutions
- Adjacent products in the same problem space
- Established players the startup will compete against
- Alternative approaches users currently use
- Use specific product categories and keywords

Rules:
- Make queries specific and actionable
- Include year "2025" or "2024" for recent info
- Avoid overly broad queries
- Focus on evidence that would inform MVTA red team analysis

CRITICAL: Return ONLY the JSON object. Do not include any explanatory text, markdown formatting, or commentary.

JSON Schema:
{
  "queries": ["string array with 5-10 queries"]
}`;

// Community-focused prompt
const COMMUNITY_SYSTEM_PROMPT = `You are a social listening researcher helping founders understand user sentiment and pain points.

Given a structured startup idea, generate 5-10 targeted search queries to find community discussions and user feedback.

Focus on:
- Reddit, Hacker News, Product Hunt discussions
- User pain points and frustrations
- Feature requests and wishlist items
- Competitor reviews and user sentiment
- Include "reddit", "hn", "review", "discussion" in queries

Rules:
- Make queries specific to find real user conversations
- Target platforms where technical users discuss problems
- Include year "2025" or "2024" for recent discussions
- Focus on genuine user feedback, not marketing content

CRITICAL: Return ONLY the JSON object. Do not include any explanatory text, markdown formatting, or commentary.

JSON Schema:
{
  "queries": ["string array with 5-10 queries"]
}`;

// Regulatory-focused prompt
const REGULATORY_SYSTEM_PROMPT = `You are a regulatory compliance researcher helping founders understand legal and compliance requirements.

Given a structured startup idea, generate 0-5 targeted search queries for regulatory requirements.

IMPORTANT: Only generate queries if the domain has SIGNIFICANT regulatory concerns.
Regulated domains include: healthcare, finance, education, data privacy, legal services, insurance.

If domain is NOT heavily regulated (e.g., productivity tools, social apps), return empty array.

Focus on:
- Compliance requirements and certifications
- Legal restrictions and penalties
- Industry-specific regulations
- Data protection requirements

Rules:
- Return empty array for non-regulated domains
- Make queries specific to the jurisdiction and industry
- Focus on actionable compliance requirements
- Include year "2025" or "2024" for current regulations

CRITICAL: Return ONLY the JSON object. Do not include any explanatory text, markdown formatting, or commentary.

JSON Schema:
{
  "queries": ["string array with 0-5 queries, or empty if not regulated"]
}`;

// Original combined prompt for generating all types at once
const SYSTEM_PROMPT = `You are a research strategist helping founders understand their competitive landscape and market context.

Given a structured startup idea, generate targeted search queries to gather evidence-backed insights. Focus on:

**Competitor Queries** (5-10 queries):
- Direct competitors offering similar solutions
- Adjacent products in the same problem space
- Established players the startup will compete against
- Alternative approaches users currently use
- Use specific product categories and keywords

**Community Queries** (5-10 queries):
- Reddit, Hacker News, Product Hunt discussions
- User pain points and frustrations
- Feature requests and wishlist items
- Competitor reviews and user sentiment
- Include "reddit", "hn", "review", "discussion" in queries

**Regulatory Queries** (0-5 queries):
- ONLY if the domain has significant regulatory concerns (healthcare, finance, education, data privacy, etc.)
- Compliance requirements and certifications
- Legal restrictions and penalties
- Industry-specific regulations
- Return empty array if domain is not heavily regulated

CRITICAL: Return ONLY the JSON object. Do not include any explanatory text, markdown formatting, or commentary before or after the JSON.

JSON Schema:
{
  "competitor_queries": ["string"],
  "community_queries": ["string"],
  "regulatory_queries": ["string"]
}

Rules:
- Make queries specific and actionable
- Include year "2025" or "2024" for recent info
- Avoid overly broad queries
- Focus on evidence that would inform MVTA red team analysis
- RETURN ONLY THE JSON OBJECT - NO OTHER TEXT`;

// Type-specific schemas
const TypeSpecificQueriesSchema = z.object({
  queries: z.array(z.string()).min(3).max(10),
});

const RegulatoryQueriesSchema = z.object({
  queries: z.array(z.string()).max(5), // No minimum - can be empty
});

// Combined schema for 'all' type (original)
const ResearchQueriesSchema = z.object({
  competitor_queries: z.array(z.string()).min(3).max(10),
  community_queries: z.array(z.string()).min(3).max(10),
  regulatory_queries: z.array(z.string()).max(5),
});

export type ResearchQueries = z.infer<typeof ResearchQueriesSchema>;

// Type-specific result types
export type CompetitorQueries = {
  type: 'competitor';
  queries: string[];
};

export type CommunityQueries = {
  type: 'community';
  queries: string[];
};

export type RegulatoryQueries = {
  type: 'regulatory';
  queries: string[];
};

export type TypeSpecificQueries =
  | CompetitorQueries
  | CommunityQueries
  | RegulatoryQueries;

/**
 * Generate research queries from structured idea
 *
 * @param structuredIdea - Structured idea from Prompt A
 * @param type - Research type to generate queries for (competitor, community, regulatory, or 'all')
 * @returns Type-specific queries or all queries if type is 'all' or undefined
 * @throws Error if LLM fails or output validation fails
 */

// Function overloads for type safety
export async function generateResearchQueries(
  structuredIdea: StructuredIdea,
  type: 'competitor'
): Promise<CompetitorQueries>;

export async function generateResearchQueries(
  structuredIdea: StructuredIdea,
  type: 'community'
): Promise<CommunityQueries>;

export async function generateResearchQueries(
  structuredIdea: StructuredIdea,
  type: 'regulatory'
): Promise<RegulatoryQueries>;

export async function generateResearchQueries(
  structuredIdea: StructuredIdea,
  type?: 'all'
): Promise<ResearchQueries>;

// Main implementation
export async function generateResearchQueries(
  structuredIdea: StructuredIdea,
  type: ResearchType | 'all' = 'all'
): Promise<ResearchQueries | TypeSpecificQueries> {
  // Select prompt and schema based on type
  const getPromptConfig = (researchType: ResearchType | 'all') => {
    switch (researchType) {
      case 'competitor':
        return {
          systemPrompt: COMPETITOR_SYSTEM_PROMPT,
          schema: TypeSpecificQueriesSchema,
          isTypeSpecific: true,
        };
      case 'community':
        return {
          systemPrompt: COMMUNITY_SYSTEM_PROMPT,
          schema: TypeSpecificQueriesSchema,
          isTypeSpecific: true,
        };
      case 'regulatory':
        return {
          systemPrompt: REGULATORY_SYSTEM_PROMPT,
          schema: RegulatoryQueriesSchema,
          isTypeSpecific: true,
        };
      case 'all':
      default:
        return {
          systemPrompt: SYSTEM_PROMPT,
          schema: ResearchQueriesSchema,
          isTypeSpecific: false,
        };
    }
  };

  const config = getPromptConfig(type);

  // Build user prompt based on type
  const userPrompt = config.isTypeSpecific
    ? `Startup Idea:
High Concept: ${structuredIdea.high_concept}
Value Proposition: ${structuredIdea.value_proposition}
Target Users: ${structuredIdea.environment.user_persona}
Success Metric (18mo): ${structuredIdea.success_metric_18m}

Assumptions:
- Market: ${structuredIdea.assumptions.market.join(', ')}
- Technical: ${structuredIdea.assumptions.technical.join(', ')}
- Business Model: ${structuredIdea.assumptions.business_model.join(', ')}

Competitive Landscape: ${structuredIdea.environment.competitive_landscape}
Regulatory Context: ${structuredIdea.environment.regulatory_context || 'None specified'}

Generate research queries to validate/challenge these assumptions. Output ONLY the JSON.`
    : `Startup Idea:
High Concept: ${structuredIdea.high_concept}
Value Proposition: ${structuredIdea.value_proposition}
Target Users: ${structuredIdea.environment.user_persona}
Success Metric (18mo): ${structuredIdea.success_metric_18m}

Assumptions:
- Market: ${structuredIdea.assumptions.market.join(', ')}
- Technical: ${structuredIdea.assumptions.technical.join(', ')}
- Business Model: ${structuredIdea.assumptions.business_model.join(', ')}

Competitive Landscape: ${structuredIdea.environment.competitive_landscape}
Regulatory Context: ${structuredIdea.environment.regulatory_context || 'None specified'}

Generate research queries to validate/challenge these assumptions and understand the competitive landscape. Output ONLY the JSON.`;

  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: config.systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    model: 'grok-4-fast',
    temperature: 0.5,
    maxTokens: 5000, // Increased to 5000 per official docs support
    responseFormat: 'json_object',
  });

  // Debug: Log raw LLM response
  console.log('🔍 LLM Response length:', response.content.length);
  console.log('🔍 LLM Response first 500 chars:', response.content.substring(0, 500));
  console.log('🔍 LLM Response FULL:', response.content);

  // Extract JSON from response (handle various formats)
  let jsonContent = response.content.trim();

  // Check if content is empty
  if (!jsonContent || jsonContent.length === 0) {
    throw new Error(
      `LLM returned empty content. Raw response length: ${response.content.length}`
    );
  }

  // Try to extract JSON from markdown code block first
  const markdownMatch = jsonContent.match(/```json\s*\n([\s\S]*?)\n```/);
  if (markdownMatch) {
    jsonContent = markdownMatch[1].trim();
    console.log('✅ Extracted JSON from markdown code block');
  } else if (!jsonContent.startsWith('{')) {
    // If doesn't start with {, try to find JSON object pattern anywhere in the text
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0].trim();
      console.log('✅ Extracted JSON object from text');
    } else {
      console.warn('⚠️ Could not find JSON pattern, using content as-is');
    }
  }

  console.log('✅ Final JSON content length:', jsonContent.length);
  console.log('✅ First 200 chars:', jsonContent.substring(0, 200));

  let parsed;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (error) {
    console.error('❌ JSON Parse Error:', error);
    console.error('📄 Content that failed to parse:', jsonContent.substring(0, 500));
    throw new Error(
      `Failed to parse LLM response as JSON: ${(error as Error).message}. ` +
      `Content preview: ${jsonContent.substring(0, 200)}`
    );
  }

  // Validate and return based on type
  if (config.isTypeSpecific) {
    // Type-specific query generation
    const validated = config.schema.parse(parsed) as { queries: string[] };
    const result = {
      type: type as ResearchType,
      queries: validated.queries,
    };

    console.log(`✅ Generated ${validated.queries.length} ${type} queries`);

    return result as TypeSpecificQueries;
  } else {
    // All types query generation
    const validated = config.schema.parse(parsed) as {
      competitor_queries: string[];
      community_queries: string[];
      regulatory_queries: string[];
    };

    console.log(`✅ Generated queries:
  - Competitor: ${validated.competitor_queries.length}
  - Community: ${validated.community_queries.length}
  - Regulatory: ${validated.regulatory_queries.length}`);

    return validated;
  }
}

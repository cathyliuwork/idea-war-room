import { callLLMWithRetry } from '../client';
import type { StructuredIdea } from '@/lib/validation/schemas';
import { z } from 'zod';

/**
 * Prompt B: Generate Research Queries
 *
 * Converts structured startup idea into targeted research queries
 * across three categories: competitors, community, and regulatory.
 */

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

Output ONLY valid JSON matching this schema:
{
  "competitor_queries": ["string"],
  "community_queries": ["string"],
  "regulatory_queries": ["string"]
}

Rules:
- Make queries specific and actionable
- Include year "2025" or "2024" for recent info
- Avoid overly broad queries
- Focus on evidence that would inform MVTA red team analysis`;

const ResearchQueriesSchema = z.object({
  competitor_queries: z.array(z.string()).min(3).max(10),
  community_queries: z.array(z.string()).min(3).max(10),
  regulatory_queries: z.array(z.string()).max(5),
});

export type ResearchQueries = z.infer<typeof ResearchQueriesSchema>;

/**
 * Generate research queries from structured idea
 *
 * @param structuredIdea - Structured idea from Prompt A
 * @returns Research queries organized by category
 * @throws Error if LLM fails or output validation fails
 */
export async function generateResearchQueries(
  structuredIdea: StructuredIdea
): Promise<ResearchQueries> {
  const userPrompt = `Startup Idea:
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
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    model: 'gemini-2.5-pro',
    temperature: 0.5, // Creative but structured
    maxTokens: 1000,
    responseFormat: 'json_object',
  });

  // Clean markdown code blocks if present
  let jsonContent = response.content.trim();
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, '');
    jsonContent = jsonContent.replace(/\n?```\s*$/, '');
  }

  const parsed = JSON.parse(jsonContent);
  return ResearchQueriesSchema.parse(parsed);
}

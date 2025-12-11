import { callLLMWithRetry } from '../client';
import { StructuredIdeaSchema, StructuredIdea } from '@/lib/validation/schemas';

/**
 * Prompt A: Structure Raw Idea into MVTA Format
 *
 * Converts founder's raw answers into structured MVTA JSON schema.
 */

const SYSTEM_PROMPT = `You are an assistant that converts messy founder answers into a clean JSON schema for the Multi-Vector Threat Analysis (MVTA) framework.

Rules:
- Do not invent facts. If information is missing, use an empty string or empty array.
- Output ONLY valid JSON matching the provided schema.
- Be concise: extract key points, don't embellish or add interpretation.
- Focus on what the founder explicitly stated.

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

/**
 * Structure raw idea input into MVTA format
 *
 * @param rawInput - Combined string of all founder answers
 * @returns Structured idea matching MVTA schema
 * @throws Error if LLM fails or output validation fails
 */
export async function structureIdea(rawInput: string): Promise<StructuredIdea> {
  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Here are the founder's answers about their startup idea:\n\n${rawInput}\n\nConvert this into the MVTA JSON schema. Output ONLY the JSON, no additional text.`,
      },
    ],
    model: 'gemini-2.5-pro',
    temperature: 0.3, // Lower temperature for structured extraction
    maxTokens: 2000,
    responseFormat: 'json_object',
  });

  // Parse and validate JSON
  // Clean markdown code blocks if present (e.g., ```json ... ```)
  let jsonContent = response.content.trim();
  if (jsonContent.startsWith('```')) {
    // Remove opening ```json or ```
    jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, '');
    // Remove closing ```
    jsonContent = jsonContent.replace(/\n?```\s*$/, '');
  }

  const parsed = JSON.parse(jsonContent);
  return StructuredIdeaSchema.parse(parsed);
}

import { z } from 'zod';

/**
 * Validation Schemas
 *
 * Zod schemas for validating LLM outputs and API requests.
 */

/**
 * Structured Idea Schema (Output from Prompt A)
 *
 * This is the MVTA-formatted idea structure that LLM generates from raw input.
 */
export const StructuredIdeaSchema = z.object({
  high_concept: z.string().min(1, 'High concept is required'),
  value_proposition: z.string().min(1, 'Value proposition is required'),
  success_metric_18m: z.string().min(1, 'Success metric is required'),
  assumptions: z.object({
    market: z.array(z.string()).default([]),
    technical: z.array(z.string()).default([]),
    business_model: z.array(z.string()).default([]),
  }),
  assets: z.object({
    key_assets: z.array(z.string()).default([]),
    brand_narrative: z.array(z.string()).default([]),
  }),
  environment: z.object({
    user_persona: z.string().default(''),
    competitive_landscape: z.string().default(''),
    regulatory_context: z.string().default(''),
  }),
});

export type StructuredIdea = z.infer<typeof StructuredIdeaSchema>;

/**
 * Raw Idea Input Schema (From intake form)
 */
export const RawIdeaInputSchema = z.object({
  question1: z.string().min(10, 'Please provide a more detailed description'),
  question2: z.string().min(10, 'Please explain the problem in more detail'),
  question3: z.string().min(5, 'Please describe what success looks like'),
  question4: z.string().optional(),
  question5: z.string().optional(),
  question6: z.string().min(5, 'Please describe your target users'),
  question7: z.string().optional(),
});

export type RawIdeaInput = z.infer<typeof RawIdeaInputSchema>;

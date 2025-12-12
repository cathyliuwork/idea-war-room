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
  high_concept: z.string().min(10, 'At least 10 characters').max(150, 'Maximum 150 characters'),
  value_proposition: z.string().min(20, 'At least 20 characters').max(300, 'Maximum 300 characters'),
  success_metric_18m: z.string().min(10, 'At least 10 characters').max(150, 'Maximum 150 characters'),

  assumptions: z.object({
    market: z.array(z.string().max(200, 'Each item max 200 characters')).default([]),
    technical: z.array(z.string().max(200, 'Each item max 200 characters')).default([]),
    business_model: z.array(z.string().max(200, 'Each item max 200 characters')).default([]),
  }).default({ market: [], technical: [], business_model: [] }),

  assets: z.object({
    key_assets: z.array(z.string().max(150, 'Each item max 150 characters')).default([]),
    brand_narrative: z.array(z.string().max(150, 'Each item max 150 characters')).default([]),
  }).default({ key_assets: [], brand_narrative: [] }),

  environment: z.object({
    user_persona: z.string().min(20, 'At least 20 characters').max(300, 'Maximum 300 characters'),
    competitive_landscape: z.string().min(20, 'At least 20 characters').max(400, 'Maximum 400 characters'),
    regulatory_context: z.string().max(400, 'Maximum 400 characters').default(''),
  }),
});

export type StructuredIdea = z.infer<typeof StructuredIdeaSchema>;

// Step-by-step validation schemas for 3-step wizard
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

/**
 * Research Snapshot Schemas (Output from F-03 Research Engine)
 */

export const CompetitorSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  summary: z.string().min(1),
  pricing: z.string().optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

export const CommunitySignalSchema = z.object({
  source: z.enum(['reddit', 'ycombinator', 'forum', 'review_site']),
  url: z.string().url(),
  title: z.string().min(1),
  snippet: z.string().min(1),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  themes: z.array(z.string()),
  publishedDate: z.string().optional(),
});

export const RegulatorySignalSchema = z.object({
  regulation: z.string().min(1),
  summary: z.string().min(1),
  compliance_requirements: z.array(z.string()),
  penalties: z.string(),
  applicability: z.string(),
});

export const ResearchSnapshotSchema = z.object({
  competitor_queries: z.array(z.string()),
  community_queries: z.array(z.string()),
  regulatory_queries: z.array(z.string()),
  competitors: z.array(CompetitorSchema),
  community_signals: z.array(CommunitySignalSchema),
  regulatory_signals: z.array(RegulatorySignalSchema),
});

export type Competitor = z.infer<typeof CompetitorSchema>;
export type CommunitySignal = z.infer<typeof CommunitySignalSchema>;
export type RegulatorySignal = z.infer<typeof RegulatorySignalSchema>;
export type ResearchSnapshot = z.infer<typeof ResearchSnapshotSchema>;

/**
 * MVTA Damage Report Schemas (Output from F-04 Red Team Analysis)
 */

export const VulnerabilitySchema = z.object({
  vector: z.enum([
    'technical',
    'market',
    'social',
    'legal',
    'narrative',
  ]),
  attack_name: z.string().min(1),
  severity_score: z.number().min(1).max(5),
  rationale: z.string().min(1),
  evidence_citations: z.array(z.string()).default([]),
  recommendation: z.string().nullish(), // Allow null, undefined, or string
});

export const CascadingFailureSchema = z.object({
  trigger: z.string().min(1),
  chain: z.array(z.string()).min(2),
  final_impact: z.string().min(1),
});

export const VectorSynthesisSchema = z.object({
  vector: z.enum([
    'technical',
    'market',
    'social',
    'legal',
    'narrative',
  ]),
  overall_score: z.number().min(1).max(5),
  summary: z.string().min(1),
  critical_vulnerabilities: z.array(z.string()),
});

export const RecommendationSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']),
  action: z.string().min(1),
  rationale: z.string().min(1),
});

export const MVTAReportSchema = z.object({
  vulnerabilities: z.array(VulnerabilitySchema).min(10),
  cascading_failures: z.array(CascadingFailureSchema).default([]),
  vector_synthesis: z.array(VectorSynthesisSchema).length(5),
  recommendations: z.array(RecommendationSchema).min(3),
});

export type Vulnerability = z.infer<typeof VulnerabilitySchema>;
export type CascadingFailure = z.infer<typeof CascadingFailureSchema>;
export type VectorSynthesis = z.infer<typeof VectorSynthesisSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type MVTAReport = z.infer<typeof MVTAReportSchema>;

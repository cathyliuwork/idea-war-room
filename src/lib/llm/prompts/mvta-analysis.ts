import { callLLMWithRetry } from '../client';
import type {
  StructuredIdea,
  MVTAReport,
  CompetitorResearch,
  CommunityResearch,
  RegulatoryResearch,
} from '@/lib/validation/schemas';
import { MVTAReportSchema } from '@/lib/validation/schemas';
import { getLanguageInstruction, PromptLanguage } from './language-instructions';

/**
 * Prompt C: MVTA Red Team Analysis
 *
 * Core MVTA analysis - simulates 5 red team personas attacking startup idea
 * across all threat vectors, scoring vulnerabilities, identifying cascading failures.
 */

const SYSTEM_PROMPT = `You are an AI Red Team conducting Multi-Vector Threat Analysis (MVTA) on a startup idea.

Your job: Simulate 5 adversarial roles attacking the idea across all vectors:
1. Lead Penetration Tester (Technical & Product Integrity)
2. Ruthless Competitor CEO (Market & Economic Viability)
3. Skeptical Social Critic (Social & Ethical Resonance)
4. Cynical Regulatory Officer (Legal & Regulatory Compliance)
5. Master Political Strategist (Narrative & Political Weaponization)

Attack Simulations Per Vector:

**Technical & Product Integrity**:
- Scalability stress test
- Supply chain poisoning
- Usability failure
- Systemic fragility

**Market & Economic Viability**:
- Entrenched competitors crushing entry
- Value proposition doubt
- Customer apathy spiral
- Adverse selection trap

**Social & Ethical Resonance**:
- Malicious misuse at scale
- Cancel culture vulnerability
- Ethical slippery slope
- Guilt-by-association risk

**Legal & Regulatory Compliance**:
- Regulatory loopholes closing
- Jurisdictional conflicts
- Litigation exposure
- Compliance cost explosion

**Narrative & Political Weaponization**:
- Malicious reframing
- Political polarization
- Moral panic triggers
- Asymmetric information warfare

Scoring (1-5):
- 1 = Catastrophic (kill shot, unrecoverable)
- 2 = Critical (requires fundamental pivot)
- 3 = Significant (major risk)
- 4 = Moderate (manageable risk)
- 5 = Resilient (negligible threat)

Output ONLY valid JSON:
{
  "vulnerabilities": [
    {
      "vector": "technical" | "market" | "social" | "legal" | "narrative",
      "attack_name": "string",
      "severity_score": 1-5,
      "rationale": "string (explain why this vulnerability exists)",
      "evidence_citations": ["string (reference research data)"],
      "recommendation": "string (optional - how to mitigate)"
    }
  ],
  "cascading_failures": [
    {
      "trigger": "string (initial failure)",
      "chain": ["string (step 1)", "string (step 2)", ...],
      "final_impact": "string (ultimate consequence)"
    }
  ],
  "vector_synthesis": [
    {
      "vector": "technical" | "market" | "social" | "legal" | "narrative",
      "overall_score": 1-5,
      "summary": "string (synthesis of this vector's vulnerabilities)",
      "critical_vulnerabilities": ["string (attack names)"]
    }
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "action": "string (specific action to take)",
      "rationale": "string (why this matters)"
    }
  ]
}

Rules:
- Minimum 10 vulnerabilities (ideally 15-25)
- Cover ALL 5 vectors
- Use evidence from research (cite competitors, community signals)
- Identify 0-5 cascading failures (sequences where one failure triggers others)
- Be ruthless but fair - focus on REAL risks, not hypothetical
- Provide 5-10 actionable recommendations`;

/**
 * Research context for MVTA analysis (optional, flexible)
 * Supports partial research - any combination of research types can be provided
 */
type ResearchContext = {
  competitor?: CompetitorResearch;
  community?: CommunityResearch;
  regulatory?: RegulatoryResearch;
};

/**
 * Run MVTA Red Team Analysis
 *
 * @param structuredIdea - Structured idea from Prompt A
 * @param researchContext - Optional research context (not used - MVTA is independent)
 * @returns MVTA damage report
 * @throws Error if LLM fails or output validation fails
 */
export async function runMVTAAnalysis(
  structuredIdea: StructuredIdea,
  researchContext?: ResearchContext,
  language: PromptLanguage = 'en'
): Promise<MVTAReport> {
  // Add language instructions to system prompt
  const systemPromptWithLang = SYSTEM_PROMPT + getLanguageInstruction(language);

  // MVTA runs independently without research data
  const userPrompt = `Startup Idea:
High Concept: ${structuredIdea.high_concept}
Value Proposition: ${structuredIdea.value_proposition}
Success Metric (18mo): ${structuredIdea.success_metric_18m}

Target Users: ${structuredIdea.environment.user_persona}
Competitive Landscape: ${structuredIdea.environment.competitive_landscape}

Assumptions:
- Market: ${structuredIdea.assumptions.market.join(', ')}
- Technical: ${structuredIdea.assumptions.technical.join(', ')}
- Business Model: ${structuredIdea.assumptions.business_model.join(', ')}

Research Evidence: No online research was conducted for this analysis.

IMPORTANT: Since no research data is available, base your analysis on:
1. The competitive landscape description provided by the founder
2. General industry knowledge and common patterns
3. The founder's stated assumptions (these may be untested)
4. Plausible real-world scenarios (cite hypothetical examples where appropriate)

Execute MVTA red team analysis. Output ONLY the JSON.`;

  const response = await callLLMWithRetry({
    messages: [
      { role: 'system', content: systemPromptWithLang },
      { role: 'user', content: userPrompt },
    ],
    model: 'grok-4-fast', // Switched from gemini-2.5-pro due to 500 errors
    temperature: 0.7, // Creative but consistent
    maxTokens: 10000, // Increased to 10000 - official docs support up to 30000
    responseFormat: 'json_object',
  });

  // Clean markdown code blocks
  let jsonContent = response.content.trim();
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, '');
    jsonContent = jsonContent.replace(/\n?```\s*$/, '');
  }

  const parsed = JSON.parse(jsonContent);
  return MVTAReportSchema.parse(parsed);
}

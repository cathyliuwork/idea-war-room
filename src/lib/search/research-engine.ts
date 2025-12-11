import { searchWithRetry, deduplicateResults } from './client';
import { generateResearchQueries } from '../llm/prompts/generate-queries';
import {
  synthesizeCompetitors,
  synthesizeCommunitySignals,
  synthesizeRegulatorySignals,
} from '../llm/prompts/synthesize-research';
import type { StructuredIdea, ResearchSnapshot } from '@/lib/validation/schemas';

/**
 * Research Engine
 *
 * Orchestrates the complete research process:
 * 1. Generate research queries (Prompt B)
 * 2. Execute searches (AI Builders Search API)
 * 3. Synthesize results into structured profiles (LLM)
 * 4. Return research snapshot for MVTA analysis
 */

/**
 * Conduct complete research for a structured idea
 *
 * @param structuredIdea - Structured idea from Prompt A
 * @returns Research snapshot with competitors, community signals, regulatory signals
 * @throws Error if critical steps fail
 */
export async function conductResearch(
  structuredIdea: StructuredIdea
): Promise<ResearchSnapshot> {
  console.log('🔬 Starting research phase...');

  try {
    // Step 1: Generate research queries using Prompt B
    console.log('📝 Generating research queries...');
    const queries = await generateResearchQueries(structuredIdea);

    console.log(`✅ Generated queries:
  - Competitor: ${queries.competitor_queries.length}
  - Community: ${queries.community_queries.length}
  - Regulatory: ${queries.regulatory_queries.length}`);

    // Step 2: Execute competitor research
    console.log('🔍 Searching for competitors...');
    let competitorResults;
    try {
      competitorResults = await searchWithRetry({
        keywords: queries.competitor_queries,
        max_results: 10,
      });
      console.log(`✅ Competitor search complete (${competitorResults.queries.length} queries)`);
    } catch (error) {
      console.error('⚠️ Competitor search failed, continuing with empty results:', error);
      competitorResults = { queries: [], combined_answer: null, errors: [] };
    }

    // Step 3: Execute community research
    console.log('💬 Searching community discussions...');
    let communityResults;
    try {
      communityResults = await searchWithRetry({
        keywords: queries.community_queries,
        max_results: 10,
      });
      console.log(`✅ Community search complete (${communityResults.queries.length} queries)`);
    } catch (error) {
      console.error('⚠️ Community search failed, continuing with empty results:', error);
      communityResults = { queries: [], combined_answer: null, errors: [] };
    }

    // Step 4: Execute regulatory research (if queries exist)
    console.log('⚖️ Checking regulatory context...');
    let regulatoryResults;
    if (queries.regulatory_queries.length > 0) {
      try {
        regulatoryResults = await searchWithRetry({
          keywords: queries.regulatory_queries,
          max_results: 10,
        });
        console.log(`✅ Regulatory search complete (${regulatoryResults.queries.length} queries)`);
      } catch (error) {
        console.error('⚠️ Regulatory search failed, continuing with empty results:', error);
        regulatoryResults = { queries: [], combined_answer: null, errors: [] };
      }
    } else {
      console.log('ℹ️ No regulatory queries needed');
      regulatoryResults = { queries: [], combined_answer: null, errors: [] };
    }

    // Step 5: Synthesize competitors
    console.log('🔬 Synthesizing competitor profiles...');
    let competitors: Awaited<ReturnType<typeof synthesizeCompetitors>> = [];
    try {
      competitors = await synthesizeCompetitors(competitorResults.queries);
      console.log(`✅ Found ${competitors.length} competitors`);
    } catch (error) {
      console.error('⚠️ Competitor synthesis failed:', error);
      competitors = [];
    }

    // Step 6: Synthesize community signals
    console.log('🔬 Analyzing community sentiment...');
    let communitySignals: Awaited<ReturnType<typeof synthesizeCommunitySignals>> = [];
    try {
      communitySignals = await synthesizeCommunitySignals(communityResults.queries);
      console.log(`✅ Found ${communitySignals.length} community signals`);
    } catch (error) {
      console.error('⚠️ Community synthesis failed:', error);
      communitySignals = [];
    }

    // Step 7: Synthesize regulatory signals
    console.log('🔬 Extracting regulatory requirements...');
    let regulatorySignals: Awaited<ReturnType<typeof synthesizeRegulatorySignals>> = [];
    try {
      if (queries.regulatory_queries.length > 0 && regulatoryResults.queries.length > 0) {
        regulatorySignals = await synthesizeRegulatorySignals(regulatoryResults.queries);
        console.log(`✅ Found ${regulatorySignals.length} regulatory signals`);
      } else {
        regulatorySignals = [];
        console.log('ℹ️ No regulatory signals to synthesize');
      }
    } catch (error) {
      console.error('⚠️ Regulatory synthesis failed:', error);
      regulatorySignals = [];
    }

    // Step 8: Return complete research snapshot
    const snapshot: ResearchSnapshot = {
      competitor_queries: queries.competitor_queries,
      community_queries: queries.community_queries,
      regulatory_queries: queries.regulatory_queries,
      competitors,
      community_signals: communitySignals,
      regulatory_signals: regulatorySignals,
    };

    console.log(`🎉 Research complete!
  - Competitors: ${competitors.length}
  - Community Signals: ${communitySignals.length}
  - Regulatory Signals: ${regulatorySignals.length}`);

    return snapshot;
  } catch (error) {
    console.error('❌ Research failed:', error);
    throw new Error(`Research engine failed: ${(error as Error).message}`);
  }
}

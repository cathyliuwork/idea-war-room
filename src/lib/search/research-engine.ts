import { searchWithRetry, deduplicateResults, type SearchResponse } from './client';
import {
  generateResearchQueries,
  type ResearchQueries,
  type TypeSpecificQueries,
} from '../llm/prompts/generate-queries';
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
 * @param type - Optional research type to execute (competitor, community, or regulatory). If not provided, executes all types.
 * @returns Research snapshot with competitors, community signals, regulatory signals
 * @throws Error if critical steps fail
 */
export async function conductResearch(
  structuredIdea: StructuredIdea,
  type?: 'competitor' | 'community' | 'regulatory'
): Promise<ResearchSnapshot> {
  console.log('🔬 Starting research phase...');

  try {
    // Step 1: Generate research queries using Prompt B
    console.log('📝 Generating research queries...');
    // Type assertion needed because TypeScript can't resolve overloads with union types
    const queriesResult: ResearchQueries | TypeSpecificQueries =
      await generateResearchQueries(structuredIdea, (type ?? 'all') as any);

    // Extract queries based on result type
    let competitor_queries: string[] = [];
    let community_queries: string[] = [];
    let regulatory_queries: string[] = [];

    if ('type' in queriesResult) {
      // Type-specific result - explicit cast needed for discriminated union narrowing
      const typedResult = queriesResult as TypeSpecificQueries;
      console.log(`✅ Generated ${typedResult.queries.length} ${typedResult.type} queries`);

      // Map type-specific queries to the corresponding array
      switch (typedResult.type) {
        case 'competitor':
          competitor_queries = typedResult.queries;
          break;
        case 'community':
          community_queries = typedResult.queries;
          break;
        case 'regulatory':
          regulatory_queries = typedResult.queries;
          break;
      }
    } else {
      // All types result (original format) - explicit cast needed
      const allTypesResult = queriesResult as ResearchQueries;
      competitor_queries = allTypesResult.competitor_queries;
      community_queries = allTypesResult.community_queries;
      regulatory_queries = allTypesResult.regulatory_queries;

      console.log(`✅ Generated queries:
  - Competitor: ${competitor_queries.length}
  - Community: ${community_queries.length}
  - Regulatory: ${regulatory_queries.length}`);
    }

    // Determine which research types to execute
    const shouldRunCompetitor = !type || type === 'competitor';
    const shouldRunCommunity = !type || type === 'community';
    const shouldRunRegulatory = !type || type === 'regulatory';

    // Initialize result variables
    let competitorResults: SearchResponse = { queries: [], combined_answer: null, errors: null };
    let communityResults: SearchResponse = { queries: [], combined_answer: null, errors: null };
    let regulatoryResults: SearchResponse = { queries: [], combined_answer: null, errors: null };
    let competitors: Awaited<ReturnType<typeof synthesizeCompetitors>> = [];
    let communitySignals: Awaited<ReturnType<typeof synthesizeCommunitySignals>> = [];
    let regulatorySignals: Awaited<ReturnType<typeof synthesizeRegulatorySignals>> = [];

    // Step 2: Execute competitor research (if requested)
    if (shouldRunCompetitor) {
      console.log('🔍 Searching for competitors...');
      try {
        competitorResults = await searchWithRetry({
          keywords: competitor_queries,
          max_results: 10,
        });
        console.log(`✅ Competitor search complete (${competitorResults.queries.length} queries)`);
      } catch (error) {
        console.error('⚠️ Competitor search failed, continuing with empty results:', error);
        competitorResults = { queries: [], combined_answer: null, errors: null };
      }
    }

    // Step 3: Execute community research (if requested)
    if (shouldRunCommunity) {
      console.log('💬 Searching community discussions...');
      try {
        communityResults = await searchWithRetry({
          keywords: community_queries,
          max_results: 10,
        });
        console.log(`✅ Community search complete (${communityResults.queries.length} queries)`);
      } catch (error) {
        console.error('⚠️ Community search failed, continuing with empty results:', error);
        communityResults = { queries: [], combined_answer: null, errors: null };
      }
    }

    // Step 4: Execute regulatory research (if requested and queries exist)
    if (shouldRunRegulatory && regulatory_queries.length > 0) {
      console.log('⚖️ Checking regulatory context...');
      try {
        regulatoryResults = await searchWithRetry({
          keywords: regulatory_queries,
          max_results: 10,
        });
        console.log(`✅ Regulatory search complete (${regulatoryResults.queries.length} queries)`);
      } catch (error) {
        console.error('⚠️ Regulatory search failed, continuing with empty results:', error);
        regulatoryResults = { queries: [], combined_answer: null, errors: null };
      }
    } else if (shouldRunRegulatory) {
      console.log('ℹ️ No regulatory queries needed');
    }

    // Step 5: Synthesize competitors (if requested)
    if (shouldRunCompetitor) {
      console.log('🔬 Synthesizing competitor profiles...');
      try {
        competitors = await synthesizeCompetitors(competitorResults.queries);
        console.log(`✅ Found ${competitors.length} competitors`);
      } catch (error) {
        console.error('⚠️ Competitor synthesis failed:', error);
        competitors = [];
      }
    }

    // Step 6: Synthesize community signals (if requested)
    if (shouldRunCommunity) {
      console.log('🔬 Analyzing community sentiment...');
      try {
        communitySignals = await synthesizeCommunitySignals(communityResults.queries);
        console.log(`✅ Found ${communitySignals.length} community signals`);
      } catch (error) {
        console.error('⚠️ Community synthesis failed:', error);
        communitySignals = [];
      }
    }

    // Step 7: Synthesize regulatory signals (if requested)
    if (shouldRunRegulatory) {
      console.log('🔬 Extracting regulatory requirements...');
      try {
        if (regulatory_queries.length > 0 && regulatoryResults.queries.length > 0) {
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
    }

    // Step 8: Return complete research snapshot
    const snapshot: ResearchSnapshot = {
      competitor_queries,
      community_queries,
      regulatory_queries,
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

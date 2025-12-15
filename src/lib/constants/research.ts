/**
 * Research Type Constants and Validation
 *
 * This file defines the currently supported research types and provides
 * validation utilities. The design is intentionally flexible to support
 * future expansion without database migrations.
 *
 * To add new research types in the future:
 * 1. Add new type to RESEARCH_TYPE_CONFIGS array
 * 2. Update type definitions accordingly
 * 3. No database changes required (schema is flexible)
 */

// ============================================================================
// SEARCH CONFIGURATION
// ============================================================================

/**
 * Number of search results to fetch per query
 *
 * This constant controls:
 * 1. Search API: max_results parameter (how many results to fetch)
 * 2. Synthesis: Number of results to include in LLM prompt
 *
 * Impact on prompt size:
 * - 5 results: ~5,000 tokens (conservative, may miss info)
 * - 8 results: ~8,000 tokens (balanced, recommended)
 * - 10 results: ~10,000 tokens (comprehensive, may hit limits)
 *
 * Adjust this value to balance between information richness and API stability.
 */
export const SEARCH_RESULTS_PER_QUERY = 8;

// ============================================================================
// RESEARCH TYPE METADATA
// ============================================================================

export interface ResearchTypeConfig {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Short description for UI cards */
  shortDesc?: string;
}

/**
 * Current research types (MVP: 3 types)
 * Future: Can add more types here without DB changes
 */
export const RESEARCH_TYPE_CONFIGS: readonly ResearchTypeConfig[] = [
  {
    id: 'competitor',
    label: 'Competitor Research',
    icon: '🏢',
    description:
      'Analyze existing solutions, pricing strategies, and competitive landscape',
    shortDesc: 'Analyze existing solutions and alternatives',
  },
  {
    id: 'community',
    label: 'Community Voice',
    icon: '👥',
    description:
      'Listen to user discussions on Reddit, forums, and social media',
    shortDesc: 'Listen to user discussions and feedback',
  },
  {
    id: 'regulatory',
    label: 'Regulatory Research',
    icon: '📋',
    description: 'Identify compliance requirements and legal considerations',
    shortDesc: 'Identify compliance and legal requirements',
  },
] as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Extract type IDs as union type */
export type ResearchType = (typeof RESEARCH_TYPE_CONFIGS)[number]['id'];

/** Compile-time check: ensure all IDs are unique */
type CheckUniqueIds<
  T extends readonly { id: string }[],
  Acc = never,
> = T extends readonly [infer First, ...infer Rest]
  ? First extends { id: infer Id }
    ? Id extends Acc
      ? ['Error: Duplicate ID found', Id]
      : Rest extends readonly { id: string }[]
        ? CheckUniqueIds<Rest, Acc | Id>
        : Acc | Id
    : never
  : Acc;

type _UniqueCheck = CheckUniqueIds<typeof RESEARCH_TYPE_CONFIGS>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Type guard: Check if string is valid ResearchType
 * @example
 * const type = req.query.type;
 * if (isValidResearchType(type)) {
 *   // type is now typed as ResearchType
 * }
 */
export function isValidResearchType(type: unknown): type is ResearchType {
  return (
    typeof type === 'string' &&
    RESEARCH_TYPE_CONFIGS.some((config) => config.id === type)
  );
}

/**
 * Assertion: Throw error if type is invalid
 * @throws {Error} If type is not valid
 */
export function assertValidResearchType(
  type: unknown
): asserts type is ResearchType {
  if (!isValidResearchType(type)) {
    throw new Error(
      `Invalid research type: ${type}. Valid types: ${RESEARCH_TYPE_CONFIGS.map((c) => c.id).join(', ')}`
    );
  }
}

/**
 * Get metadata for a research type
 * @returns Config object or undefined if type not found
 */
export function getResearchTypeConfig(
  type: string
): ResearchTypeConfig | undefined {
  return RESEARCH_TYPE_CONFIGS.find((config) => config.id === type);
}

/**
 * Get all available research type IDs
 */
export function getAllResearchTypes(): readonly ResearchType[] {
  return RESEARCH_TYPE_CONFIGS.map((config) => config.id as ResearchType);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get display label for research type
 */
export function getResearchTypeLabel(type: ResearchType): string {
  const config = getResearchTypeConfig(type);
  return config?.label ?? type;
}

/**
 * Get icon for research type
 */
export function getResearchTypeIcon(type: ResearchType): string {
  const config = getResearchTypeConfig(type);
  return config?.icon ?? '📄';
}

/**
 * Format research type for display
 * @example "competitor" => "🏢 Competitor Research"
 */
export function formatResearchType(type: ResearchType): string {
  const config = getResearchTypeConfig(type);
  if (!config) return type;
  return `${config.icon} ${config.label}`;
}

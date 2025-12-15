/**
 * AI Builders Search API Client
 *
 * Wrapper around AI Builders Search API (Tavily backend) with retry logic.
 * Supports multi-keyword searches for competitor, community, and regulatory research.
 */

export interface SearchRequest {
  keywords: string[];
  max_results?: number; // Default: 6, Max: 20
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
}

export interface SearchQueryResult {
  keyword: string;
  response: {
    results: SearchResult[];
    answer?: string;
  };
}

export interface SearchResponse {
  queries: SearchQueryResult[];
  combined_answer?: string | null;
  errors?: Array<{
    keyword: string;
    error: string;
  }> | null;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DEFAULT_MAX_RESULTS = 6;

/**
 * Search using AI Builders Search API
 *
 * @param request - Search request with keywords and options
 * @returns Search results for each keyword
 * @throws Error if API call fails or API key is missing
 */
export async function search(request: SearchRequest): Promise<SearchResponse> {
  const apiKey = process.env.AI_BUILDERS_API_KEY;
  const apiUrl = process.env.AI_BUILDERS_API_URL || 'https://space.ai-builders.com/backend';

  if (!apiKey) {
    throw new Error('AI_BUILDERS_API_KEY not configured');
  }

  // API endpoint: POST /v1/search/ (note trailing slash)
  const response = await fetch(`${apiUrl}/v1/search/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      keywords: request.keywords,
      max_results: request.max_results ?? DEFAULT_MAX_RESULTS,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Search API error: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data as SearchResponse;
}

/**
 * Search with retry logic
 *
 * Automatically retries on transient errors (rate limit, timeout).
 * Does not retry on permanent errors (invalid API key, validation error).
 *
 * @param request - Search request
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Search response
 * @throws Error if all retries fail or permanent error occurs
 */
export async function searchWithRetry(
  request: SearchRequest,
  maxRetries: number = MAX_RETRIES
): Promise<SearchResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await search(request);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on permanent errors
      if (
        error instanceof Error &&
        (error.message.includes('API key') ||
          error.message.includes('Invalid') ||
          error.message.includes('Validation'))
      ) {
        throw error;
      }

      // Retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(`Retrying search (attempt ${attempt + 1}/${maxRetries})...`);
      }
    }
  }

  throw new Error(
    `Search request failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Deduplicate search results by URL
 *
 * Keeps the result with the highest relevance score for each unique URL.
 *
 * @param results - Array of search results
 * @returns Deduplicated results
 */
export function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const urlMap = new Map<string, SearchResult>();

  for (const result of results) {
    const existing = urlMap.get(result.url);
    if (!existing || (result.score ?? 0) > (existing.score ?? 0)) {
      urlMap.set(result.url, result);
    }
  }

  return Array.from(urlMap.values());
}

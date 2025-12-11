/**
 * LLM API Client
 *
 * Wrapper for AI Builders API with retry logic and error handling.
 */

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json_object' | 'text';
}

interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

const DEFAULT_MODEL = 'gemini-2.5-pro';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Call LLM API
 *
 * @param request - LLM request configuration
 * @returns LLM response with content and usage stats
 * @throws Error if API call fails or API key is missing
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.AI_BUILDERS_API_KEY;
  const apiUrl = process.env.AI_BUILDERS_API_URL || 'https://space.ai-builders.com/backend';

  if (!apiKey) {
    throw new Error('AI_BUILDERS_API_KEY not configured');
  }

  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: request.model || DEFAULT_MODEL,
      messages: request.messages,
      temperature: request.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(request.responseFormat === 'json_object' && {
        response_format: { type: 'json_object' },
      }),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`LLM API error: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  const choice = data.choices[0];

  return {
    content: choice.message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
    model: data.model,
  };
}

/**
 * Call LLM API with retry logic
 *
 * Automatically retries on transient errors (rate limit, timeout).
 * Does not retry on permanent errors (invalid API key, validation error).
 *
 * @param request - LLM request configuration
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns LLM response
 * @throws Error if all retries fail or permanent error occurs
 */
export async function callLLMWithRetry(
  request: LLMRequest,
  maxRetries: number = MAX_RETRIES
): Promise<LLMResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callLLM(request);
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
        console.log(`Retrying LLM call (attempt ${attempt + 1}/${maxRetries})...`);
      }
    }
  }

  throw new Error(
    `LLM request failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}

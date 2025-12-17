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
  // Support both AI_BUILDERS_API_KEY (local dev) and AI_BUILDER_TOKEN (platform injected)
  const apiKey = process.env.AI_BUILDERS_API_KEY || process.env.AI_BUILDER_TOKEN;
  const apiUrl = process.env.AI_BUILDERS_API_URL || 'https://space.ai-builders.com/backend';

  if (!apiKey) {
    throw new Error('AI_BUILDERS_API_KEY or AI_BUILDER_TOKEN not configured');
  }

  const model = request.model || DEFAULT_MODEL;
  const isGpt5 = model === 'gpt-5';

  // GPT-5 has special restrictions:
  // - Only supports temperature=1.0
  // - Uses max_completion_tokens instead of max_tokens
  const requestBody: any = {
    model,
    messages: request.messages,
    temperature: isGpt5 ? 1.0 : (request.temperature ?? DEFAULT_TEMPERATURE),
    ...(request.responseFormat === 'json_object' && {
      response_format: { type: 'json_object' },
    }),
  };

  // Use max_completion_tokens for gpt-5, max_tokens for others
  if (isGpt5) {
    requestBody.max_completion_tokens = request.maxTokens ?? DEFAULT_MAX_TOKENS;
  } else {
    requestBody.max_tokens = request.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  // Debug: Log request size
  const promptText = request.messages.map(m => m.content).join(' ');
  const estimatedTokens = Math.ceil(promptText.length / 4); // Rough estimate
  console.log(`🔍 Request - Model: ${model}, Est. prompt tokens: ${estimatedTokens}, Max completion tokens: ${requestBody.max_tokens || requestBody.max_completion_tokens}`);

  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    console.error('❌ LLM API error - Status:', response.status, response.statusText);
    const errorText = await response.text();
    console.error('❌ LLM API error - Response:', errorText);
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { error: errorText || 'Unknown error' };
    }

    const errorMessage = `LLM API error (${response.status}): ${error.error || response.statusText}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Debug: Log raw API response
  console.log('🤖 LLM API Response:', JSON.stringify(data, null, 2));
  console.log('🤖 Choices array length:', data.choices?.length);
  console.log('🤖 First choice:', data.choices?.[0]);

  const choice = data.choices[0];

  if (!choice || !choice.message || choice.message.content === undefined) {
    console.error('❌ LLM API returned invalid response structure');
    console.error('Full response:', JSON.stringify(data));
    throw new Error('LLM API returned invalid response: missing choice or message content');
  }

  return {
    content: choice.message.content || '',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
    model: data.model || 'unknown',
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

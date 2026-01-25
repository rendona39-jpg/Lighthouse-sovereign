// /lib/errorRecovery.ts

interface APICallResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  fallbackUsed?: boolean;
}

export async function callWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    backoffMs?: number;
    fallback?: () => Promise<T>;
    errorContext?: string;
  } = {}
): Promise<APICallResult<T>> {
  const {
    maxRetries = 3,
    backoffMs = 1000,
    fallback,
    errorContext = 'API call'
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      lastError = error as Error;
      console.error(`${errorContext} attempt ${attempt + 1} failed:`, error);

      if (isNonRetryableError(error)) {
        break;
      }

      if (attempt < maxRetries - 1) {
        await sleep(backoffMs * Math.pow(2, attempt));
      }
    }
  }

  // Try fallback
  if (fallback) {
    try {
      const data = await fallback();
      return { success: true, data, fallbackUsed: true };
    } catch (fallbackError) {
      console.error(`${errorContext} fallback failed:`, fallbackError);
    }
  }

  return { success: false, error: lastError };
}

function isNonRetryableError(error: any): boolean {
  const nonRetryable = [
    'invalid_api_key',
    'authentication_error',
    'invalid_request',
    'rate_limit_exceeded'
  ];

  const errorMsg = error?.message?.toLowerCase() || '';
  return nonRetryable.some(msg => errorMsg.includes(msg));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function extractWithGemini(
  base64Image: string,
  prompt: string
): Promise<APICallResult<any>> {
  return callWithRetry(
    async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro-latest',
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]);

      return JSON.parse(result.response.text());
    },
    {
      maxRetries: 3,
      errorContext: 'Gemini extraction',
      fallback: async () => {
        // Use Claude vision as fallback
        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              },
              { type: 'text', text: prompt }
            ]
          }]
        });

        const text = response.content[0].type === 'text'
          ? response.content[0].text
          : '';

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { facts: [] };
      }
    }
  );
}

export async function queryWithClaude(
  systemPrompt: string,
  messages: any[]
): Promise<APICallResult<string>> {
  return callWithRetry(
    async () => {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages
      });

      return response.content[0].type === 'text'
        ? response.content[0].text
        : 'Error: No text response';
    },
    {
      maxRetries: 3,
      errorContext: 'Claude query',
      fallback: async () => {
        const lastUserMsg = messages[messages.length - 1].content.toLowerCase();

        if (lastUserMsg.includes('food cost')) {
          return "I'm having trouble connecting right now. Please try again in a moment.";
        }

        return "Service temporarily unavailable. Your data is safe. Try again in 30 seconds.";
      }
    }
  );
}


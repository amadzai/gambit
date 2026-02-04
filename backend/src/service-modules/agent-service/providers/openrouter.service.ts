import { Injectable, Logger } from '@nestjs/common';
import type { OpenRouterChatCompletionParams } from '../interfaces/openrouter.interface.js';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);

  private readonly apiKey = process.env.OPEN_ROUTER_API_KEY;
  private readonly baseUrl =
    process.env.OPEN_ROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
  private readonly defaultModel =
    process.env.OPEN_ROUTER_MODEL ?? 'z-ai/glm-4.7-flash';

  /**
   * Send a single chat completion request to OpenRouter and return the assistant's text.
   * Intended for small, structured outputs (e.g. JSON containing a selected move).
   */
  async createChatCompletion(
    params: OpenRouterChatCompletionParams,
  ): Promise<string> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('OPEN_ROUTER_API_KEY is not set');
    }

    const controller = new AbortController();
    const timeoutMs = params.timeoutMs ?? 15_000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model ?? this.defaultModel,
          messages: params.messages,
          temperature: params.temperature ?? 0.2,
          max_tokens: params.maxTokens ?? 80,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(
          `OpenRouter error status=${res.status} body="${text.slice(0, 500)}"`,
        );
        throw new Error(`OpenRouter request failed: HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenRouter response missing message content');
      }
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }
}

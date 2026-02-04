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

    const model = params.model ?? this.defaultModel;
    const messageChars = params.messages.reduce(
      (sum, m) => sum + (m.content?.length ?? 0),
      0,
    );
    const reasoning = params.reasoning ?? { effort: 'none' as const };
    const controller = new AbortController();
    const timeoutMs = params.timeoutMs ?? 15_000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      this.logger.log(
        `OpenRouter request start model=${model} messages=${params.messages.length} chars=${messageChars} timeoutMs=${timeoutMs}`,
      );
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: params.messages,
          temperature: params.temperature ?? 0.2,
          max_tokens: params.maxTokens ?? 80,
          reasoning: {
            effort: reasoning.effort,
            exclude: reasoning.exclude,
            enabled: reasoning.enabled,
            max_tokens: reasoning.maxTokens,
          },
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

      const requestId =
        res.headers.get('x-request-id') ??
        res.headers.get('x-openrouter-request-id') ??
        res.headers.get('cf-ray') ??
        '—';

      const data = (await res.json()) as unknown;
      this.logger.log(`OpenRouter request ok requestId=${requestId}`);

      const typed = data as {
        choices?: Array<{ message?: { content?: string | null } }>;
        error?: unknown;
      };
      if (typed?.error) {
        this.logger.warn(
          `OpenRouter response included error requestId=${requestId} error=${JSON.stringify(typed.error).slice(0, 500)}`,
        );
      }
      const content = typed?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.trim() === '') {
        this.logger.warn(
          `OpenRouter missing/empty content requestId=${requestId} choices=${typed?.choices?.length ?? 0} raw=${JSON.stringify(data).slice(0, 800)}`,
        );
        throw new Error('OpenRouter response missing message content');
      }
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }
}

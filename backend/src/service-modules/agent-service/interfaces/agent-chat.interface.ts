export type OpenRouterChatMessage = {
  /** Message author role in OpenRouter chat format. */
  role: 'system' | 'user' | 'assistant';
  /** Plaintext message content. */
  content: string;
};

export type OpenRouterChatCompletionParams = {
  /** OpenRouter model slug (defaults in service). */
  model?: string;
  /** Conversation messages sent to the model. */
  messages: OpenRouterChatMessage[];
  /** Sampling temperature (lower = more deterministic). */
  temperature?: number;
  /** Maximum number of output tokens to generate. */
  maxTokens?: number;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
  /**
   * Reasoning configuration (OpenRouter-normalized).
   */
  reasoning?: {
    /** Reasoning effort (use 'none' to disable reasoning). */
    effort?: 'xhigh' | 'high' | 'medium' | 'low' | 'minimal' | 'none';
    /** If true, exclude reasoning tokens from the response. */
    exclude?: boolean;
    /** Enable reasoning with default parameters. */
    enabled?: boolean;
    /** Max tokens to allocate to reasoning (provider-dependent). */
    maxTokens?: number;
  };
};

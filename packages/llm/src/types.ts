/**
 * Core types for the LLM abstraction layer.
 * Platform-agnostic — safe to import in both browser and Node contexts.
 */

export type LLMProviderType = "webllm" | "ollama";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  /** Maximum tokens to generate (default: 512) */
  maxTokens?: number;
  /** Sampling temperature 0–1 (default: 0.7) */
  temperature?: number;
  /** Stop generation when any of these sequences appear */
  stopSequences?: string[];
}

export interface InitProgress {
  /** 0–1 */
  progress: number;
  /** Human-readable status text (e.g. "Loading model weights 42%") */
  text: string;
}

/**
 * The unified interface both WebLLMProvider and OllamaProvider implement.
 * All session data processed here stays on-device; no raw text is transmitted.
 */
export interface LLMProvider {
  readonly providerType: LLMProviderType;

  /** True once initialize() has completed successfully */
  isReady(): boolean;

  /**
   * Load the model into memory.
   * For WebLLM this downloads and caches weights into IndexedDB.
   * For Ollama this verifies the local server is reachable.
   */
  initialize(onProgress?: (p: InitProgress) => void): Promise<void>;

  /**
   * Generate a full completion (non-streaming).
   * Returns the assistant's reply as a string.
   */
  complete(messages: Message[], options?: CompletionOptions): Promise<string>;

  /**
   * Stream tokens as they are generated.
   * Yields each text delta as soon as it arrives.
   */
  streamComplete(
    messages: Message[],
    options?: CompletionOptions
  ): AsyncGenerator<string>;

  /** Release GPU / memory resources */
  dispose(): Promise<void>;
}

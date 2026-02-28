/**
 * OllamaProvider — dev-only LLM backend.
 * Calls a locally running Ollama server (http://localhost:11434).
 * Mirrors the WebLLM interface so the rest of the codebase is unaffected.
 *
 * To start Ollama locally: `ollama run phi3:mini`
 */

import type { LLMProvider, Message, CompletionOptions, InitProgress } from "./types.js";

const DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_MODEL = "phi3:mini";

interface OllamaChatRequest {
  model: string;
  messages: Message[];
  stream: boolean;
  options?: {
    num_predict?: number;
    temperature?: number;
    stop?: string[];
  };
}

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
}

interface OllamaStreamChunk {
  message: { role: string; content: string };
  done: boolean;
}

export class OllamaProvider implements LLMProvider {
  readonly providerType = "ollama" as const;

  private ready = false;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(baseUrl = DEFAULT_BASE_URL, model = DEFAULT_MODEL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
  }

  isReady(): boolean {
    return this.ready;
  }

  /**
   * Pings the Ollama server to confirm it is reachable and the model is loaded.
   */
  async initialize(onProgress?: (p: InitProgress) => void): Promise<void> {
    if (this.ready) return;

    onProgress?.({ progress: 0, text: "Connecting to Ollama…" });

    const resp = await fetch(`${this.baseUrl}/api/tags`);
    if (!resp.ok) {
      throw new Error(
        `OllamaProvider: server not reachable at ${this.baseUrl} (${resp.status})`
      );
    }

    const data = (await resp.json()) as { models?: Array<{ name: string }> };
    const models = data.models ?? [];
    const available = models.some((m) =>
      m.name.startsWith(this.model.split(":")[0] ?? this.model)
    );

    if (!available) {
      throw new Error(
        `OllamaProvider: model "${this.model}" not found. Run: ollama pull ${this.model}`
      );
    }

    onProgress?.({ progress: 1, text: `Ollama ready (${this.model})` });
    this.ready = true;
  }

  async complete(
    messages: Message[],
    options: CompletionOptions = {}
  ): Promise<string> {
    this.assertReady();

    const body: OllamaChatRequest = {
      model: this.model,
      messages,
      stream: false,
      options: {
        num_predict: options.maxTokens ?? 512,
        temperature: options.temperature ?? 0.7,
        ...(options.stopSequences !== undefined && { stop: options.stopSequences }),
      },
    };

    const resp = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw new Error(`OllamaProvider: request failed (${resp.status})`);
    }

    const data = (await resp.json()) as OllamaChatResponse;
    return data.message.content;
  }

  async *streamComplete(
    messages: Message[],
    options: CompletionOptions = {}
  ): AsyncGenerator<string> {
    this.assertReady();

    const body: OllamaChatRequest = {
      model: this.model,
      messages,
      stream: true,
      options: {
        num_predict: options.maxTokens ?? 512,
        temperature: options.temperature ?? 0.7,
        ...(options.stopSequences !== undefined && { stop: options.stopSequences }),
      },
    };

    const resp = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw new Error(`OllamaProvider: stream request failed (${resp.status})`);
    }

    if (!resp.body) {
      throw new Error("OllamaProvider: response body is null");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        const chunk = JSON.parse(line) as OllamaStreamChunk;
        if (chunk.message.content) yield chunk.message.content;
        if (chunk.done) return;
      }
    }
  }

  async dispose(): Promise<void> {
    this.ready = false;
  }

  private assertReady(): void {
    if (!this.ready) {
      throw new Error(
        "OllamaProvider: call initialize() before generating completions"
      );
    }
  }
}

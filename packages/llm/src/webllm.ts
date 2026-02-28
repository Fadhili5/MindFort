/**
 * WebLLMProvider — runs Phi-3-mini entirely in the browser via WebGPU.
 * Raw student data never leaves the device; all inference is local.
 *
 * Browser-only: do NOT import this module in Node/server contexts.
 */

import type { LLMProvider, Message, CompletionOptions, InitProgress } from "./types.js";

/** Model ID as registered in the MLC model registry */
const DEFAULT_MODEL = "Phi-3.5-mini-instruct-q4f16_1-MLC";

export class WebLLMProvider implements LLMProvider {
  readonly providerType = "webllm" as const;

  private engine: unknown = null;
  private ready = false;
  private readonly modelId: string;

  constructor(modelId = DEFAULT_MODEL) {
    this.modelId = modelId;
  }

  isReady(): boolean {
    return this.ready;
  }

  async initialize(onProgress?: (p: InitProgress) => void): Promise<void> {
    if (this.ready) return;

    // Dynamic import keeps this out of the server bundle
    const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

    this.engine = await CreateMLCEngine(this.modelId, {
      initProgressCallback: (report: { progress: number; text: string }) => {
        onProgress?.({ progress: report.progress, text: report.text });
      },
    });

    this.ready = true;
  }

  async complete(
    messages: Message[],
    options: CompletionOptions = {}
  ): Promise<string> {
    this.assertReady();

    const engine = this.engine as {
      chat: {
        completions: {
          create(opts: unknown): Promise<{ choices: Array<{ message: { content: string | null } }> }>;
        };
      };
    };

    const response = await engine.chat.completions.create({
      messages,
      max_tokens: options.maxTokens ?? 512,
      temperature: options.temperature ?? 0.7,
      stop: options.stopSequences,
      stream: false,
    });

    return response.choices[0]?.message.content ?? "";
  }

  async *streamComplete(
    messages: Message[],
    options: CompletionOptions = {}
  ): AsyncGenerator<string> {
    this.assertReady();

    const engine = this.engine as {
      chat: {
        completions: {
          create(opts: unknown): Promise<AsyncIterable<{ choices: Array<{ delta: { content?: string | null } }> }>>;
        };
      };
    };

    const stream = await engine.chat.completions.create({
      messages,
      max_tokens: options.maxTokens ?? 512,
      temperature: options.temperature ?? 0.7,
      stop: options.stopSequences,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta.content;
      if (delta) yield delta;
    }
  }

  async dispose(): Promise<void> {
    if (this.engine) {
      const engine = this.engine as { unload?: () => Promise<void> };
      await engine.unload?.();
      this.engine = null;
      this.ready = false;
    }
  }

  private assertReady(): void {
    if (!this.ready || !this.engine) {
      throw new Error(
        "WebLLMProvider: call initialize() before generating completions"
      );
    }
  }
}

import { llmRequestSchema, type LlmRequest } from "@mindvault/api-types";

export type LlmProvider = "webllm" | "phi3";

export interface LlmClient {
  generateResponse(prompt: string): Promise<string>;
}

export interface LlmClientOptions {
  provider: LlmProvider;
  backendProxyUrl?: string;
  model?: string;
  temperature?: number;
  seed?: number;
}

class BackendProxyClient implements LlmClient {
  public constructor(
    private readonly endpoint: string,
    private readonly model: string,
    private readonly temperature: number,
    private readonly seed: number
  ) {}

  public async generateResponse(prompt: string): Promise<string> {
    const payload: LlmRequest = llmRequestSchema.parse({
      prompt,
      model: this.model,
      temperature: this.temperature,
      seed: this.seed,
      stream: false
    });

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`LLM proxy request failed with ${response.status}`);
    }

    const data = (await response.json()) as { content?: string };
    if (!data.content) {
      throw new Error("LLM proxy returned empty content.");
    }

    return data.content;
  }
}

class WebLlmClient implements LlmClient {
  private enginePromise: Promise<{ chat: { completions: { create: (input: {
    messages: Array<{ role: "system" | "user"; content: string }>;
    temperature: number;
  }) => Promise<{ choices: Array<{ message: { content?: string } }> }> } } }> | null = null;

  public constructor(private readonly model: string, private readonly temperature: number) {}

  public async generateResponse(prompt: string): Promise<string> {
    const engine = await this.getEngine();
    const completion = await engine.chat.completions.create({
      messages: [
        { role: "system", content: "You are a concise adaptive math tutor." },
        { role: "user", content: prompt }
      ],
      temperature: this.temperature
    });

    const text = completion.choices[0]?.message.content?.trim();
    if (!text) {
      throw new Error("WebLLM returned an empty response.");
    }

    return text;
  }

  private async getEngine(): Promise<{ chat: { completions: { create: (input: {
    messages: Array<{ role: "system" | "user"; content: string }>;
    temperature: number;
  }) => Promise<{ choices: Array<{ message: { content?: string } }> }> } } }> {
    if (!this.enginePromise) {
      this.enginePromise = (async () => {
        const webllm = await import("@mlc-ai/web-llm");
        return webllm.CreateMLCEngine(this.model);
      })();
    }

    const engine = await this.enginePromise;
    if (!engine) {
      throw new Error("Failed to initialize WebLLM engine.");
    }
    return engine;
  }
}

export function createLlmClient(options: LlmClientOptions): LlmClient {
  const model = options.model ?? "phi-3-mini-4k-instruct-q4_k_m.gguf";
  const temperature = options.temperature ?? 0.2;
  const seed = options.seed ?? 42;

  if (options.provider === "phi3") {
    const endpoint = options.backendProxyUrl;
    if (!endpoint) {
      throw new Error("backendProxyUrl is required for phi3 provider.");
    }
    return new BackendProxyClient(endpoint, model, temperature, seed);
  }

  return new WebLlmClient(model, temperature);
}

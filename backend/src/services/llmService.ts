import { z } from "zod";
import { llmRequestSchema, llmResponseSchema, type LlmRequest, type LlmResponse } from "@mindvault/api-types";
import type { AppConfig } from "../config.js";
import { tunneledFetch } from "./lightwayClient.js";

const LLAMA_RESPONSE_SCHEMA = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().optional()
      })
    })
  )
}).strict();

const MAX_RETRIES = 2;

async function withTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Phi-3 request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function proxyToPhi3(config: AppConfig, body: LlmRequest): Promise<LlmResponse> {
  const request = llmRequestSchema.parse(body);
  const maxTokens = Math.min(request.maxTokens, config.LLAMA_MAX_TOKENS);

  let attempts = 0;
  while (attempts <= MAX_RETRIES) {
    attempts += 1;

    try {
      const response = await withTimeout(async () => {
        return tunneledFetch(config, {
          method: "POST",
          url: `${config.LLAMA_CPP_URL}/v1/chat/completions`,
          headers: {
            "content-type": "application/json"
          },
          body: {
            model: request.model || config.LLAMA_MODEL,
            messages: [
              { role: "system", content: "You are a concise adaptive math tutor." },
              { role: "user", content: request.prompt }
            ],
            temperature: request.temperature,
            top_p: request.topP ?? config.LLAMA_TOP_P,
            repeat_penalty: request.repeatPenalty ?? config.LLAMA_REPEAT_PENALTY,
            max_tokens: maxTokens,
            seed: request.seed ?? config.LLAMA_SEED,
            stream: request.stream
          }
        });
      }, config.LLAMA_TIMEOUT_MS);

      if (!response.ok) {
        throw new Error(`Phi-3 request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as unknown;
      const parsed = LLAMA_RESPONSE_SCHEMA.parse(payload);
      const content = parsed.choices[0]?.message.content?.trim() ?? "";
      return llmResponseSchema.parse({ content: content || "I need a moment. Please try again." });
    } catch (error) {
      if (attempts > MAX_RETRIES) {
        throw error;
      }
    }
  }

  throw new Error("Phi-3 proxy failed after retries.");
}

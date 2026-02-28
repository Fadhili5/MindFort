/**
 * Factory: returns the correct LLMProvider based on environment variable.
 *
 * Environment variables (set in .env.local):
 *   NEXT_PUBLIC_LLM_PROVIDER=webllm   → WebLLMProvider (default, production)
 *   NEXT_PUBLIC_LLM_PROVIDER=ollama   → OllamaProvider (development)
 *   NEXT_PUBLIC_OLLAMA_URL            → Ollama base URL (default: http://localhost:11434)
 *   NEXT_PUBLIC_OLLAMA_MODEL          → Ollama model name (default: phi3:mini)
 *   NEXT_PUBLIC_WEBLLM_MODEL          → WebLLM model ID override
 */

import type { LLMProvider, ProviderEnv } from "./types.js";

/**
 * Creates and returns an LLMProvider based on the supplied env config.
 * Implementations are dynamically imported to keep bundle size minimal —
 * only the chosen provider's code is loaded.
 */
export async function createLLMProvider(
  env: ProviderEnv = {}
): Promise<LLMProvider> {
  const providerType = (env.NEXT_PUBLIC_LLM_PROVIDER ?? "webllm").toLowerCase();

  if (providerType === "ollama") {
    const { OllamaProvider } = await import("./ollama.js");
    return new OllamaProvider(
      env.NEXT_PUBLIC_OLLAMA_URL,
      env.NEXT_PUBLIC_OLLAMA_MODEL
    );
  }

  if (providerType === "webllm") {
    const { WebLLMProvider } = await import("./webllm.js");
    return new WebLLMProvider(env.NEXT_PUBLIC_WEBLLM_MODEL);
  }

  throw new Error(
    `createLLMProvider: unknown provider "${providerType}". ` +
      `Set NEXT_PUBLIC_LLM_PROVIDER to "webllm" or "ollama".`
  );
}

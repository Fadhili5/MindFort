import type { LlmProvider } from "@mindvault/llm-client";

export const appConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
  abelianExplorerBaseUrl: process.env.NEXT_PUBLIC_ABELIAN_EXPLORER_BASE_URL ?? "https://explorer.abelian.info",
  llmProvider: (process.env.NEXT_PUBLIC_LLM_PROVIDER ?? "webllm") as LlmProvider,
  llmProxyUrl:
    process.env.NEXT_PUBLIC_LLM_PROXY_URL ?? "http://localhost:4000/api/llm",
  webllmModel:
    process.env.NEXT_PUBLIC_WEBLLM_MODEL ?? "Llama-3.1-8B-Instruct-q4f32_1-MLC",
  demoMode: (process.env.NEXT_PUBLIC_DEMO_MODE ?? "true") === "true"
};

export type { LLMProvider, LLMProviderType, Message, CompletionOptions, InitProgress } from "./types.js";
export { WebLLMProvider } from "./webllm.js";
export { OllamaProvider } from "./ollama.js";
export { createLLMProvider } from "./factory.js";
export type { ProviderEnv } from "./types.js";
export {
  TUTOR_SYSTEM_PROMPT,
  buildFeedbackPrompt,
  buildWorkedExamplePrompt,
  buildReframePrompt,
  buildMasteryMessage,
} from "./prompts.js";

/**
 * Minimal unified LLM abstraction: generateResponse()
 * Usage: await generateResponse([userMsg], options, env)
 */
import { createLLMProvider } from "./factory.js";
import type { Message, CompletionOptions, ProviderEnv } from "./types.js";

export async function generateResponse(
  messages: Message[],
  options?: CompletionOptions,
  env?: ProviderEnv
): Promise<string> {
  const provider = await createLLMProvider(env);
  await provider.initialize();
  return provider.complete(messages, options);
}

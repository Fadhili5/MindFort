"use client";

import { useEffect, useRef } from "react";
import type { LLMProvider } from "@mindvault/llm";
import { useTutorStore } from "@/lib/stores/tutor-store";

/**
 * Initialises the on-device LLM provider on mount and keeps it alive for the
 * component lifetime. Provider type is driven by NEXT_PUBLIC_LLM_PROVIDER:
 *   "webllm"  → Phi-3.5-mini via WebGPU (production default)
 *   "ollama"  → local Ollama server (development)
 *
 * Store flags (llmReady / llmLoading / llmProgress) are updated in real-time
 * so UI components can display an accurate loading bar.
 */
export function useLLM() {
  const providerRef = useRef<LLMProvider | null>(null);
  const setLLMReady    = useTutorStore((s) => s.setLLMReady);
  const setLLMLoading  = useTutorStore((s) => s.setLLMLoading);
  const setLLMProgress = useTutorStore((s) => s.setLLMProgress);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLLMLoading(true);
      try {
        // Dynamic import keeps @mlc-ai/web-llm out of the SSR bundle entirely
        const { createLLMProvider } = await import("@mindvault/llm");

        const provider = await createLLMProvider({
          NEXT_PUBLIC_LLM_PROVIDER: process.env.NEXT_PUBLIC_LLM_PROVIDER,
          NEXT_PUBLIC_OLLAMA_URL:   process.env.NEXT_PUBLIC_OLLAMA_URL,
          NEXT_PUBLIC_OLLAMA_MODEL: process.env.NEXT_PUBLIC_OLLAMA_MODEL,
          NEXT_PUBLIC_WEBLLM_MODEL: process.env.NEXT_PUBLIC_WEBLLM_MODEL,
        });

        await provider.initialize((p) => {
          if (!cancelled) setLLMProgress(p.progress);
        });

        if (!cancelled) {
          providerRef.current = provider;
          setLLMReady(true);
        }
      } catch (err) {
        console.warn("[useLLM] provider initialisation failed:", err);
      } finally {
        if (!cancelled) setLLMLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      providerRef.current?.dispose().catch(() => {});
      providerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return providerRef;
}

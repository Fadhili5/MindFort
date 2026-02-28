"use client";

import { useEffect } from "react";
import { buildFeedbackPrompt } from "@mindvault/llm";
import { QuestionCard } from "@/components/tutor/question-card";
import { MasteryProgress } from "@/components/tutor/mastery-progress";
import { SessionControls } from "@/components/tutor/session-controls";
import { PrivacyPanel } from "@/components/privacy-panel/privacy-panel";
import { useTutorStore } from "@/lib/stores/tutor-store";
import { useLLM } from "@/lib/hooks/use-llm";
import { DEMO_TOPICS } from "@/lib/topics";

export default function TutorPage() {
  const { sessionActive, questionsAnswered } = useTutorStore();
  const providerRef = useLLM();

  /**
   * After each incorrect answer, replace the static scaffolding message with
   * a personalised response from the on-device LLM.
   * Reads all required state imperatively to avoid stale-closure issues.
   * Fires once per submitted answer (questionsAnswered is the trigger).
   */
  useEffect(() => {
    const {
      feedbackType,
      llmReady,
      currentQuestion,
      lastErrorType,
      scaffoldingLevel,
      consecutiveErrors,
      setFeedback,
      addLocalEvent,
    } = useTutorStore.getState();

    if (feedbackType !== "incorrect" || !llmReady || !currentQuestion || !lastErrorType) return;

    const provider = providerRef.current;
    if (!provider) return;

    const topic =
      DEMO_TOPICS.find((t) => t.id === currentQuestion.topicId)?.name ??
      currentQuestion.topicId;

    addLocalEvent("Generating AI feedback…", "llm");

    provider
      .complete(
        buildFeedbackPrompt({ topic, errorType: lastErrorType, scaffoldingLevel, consecutiveErrors })
      )
      .then((text) => {
        setFeedback(text);
        useTutorStore.getState().addLocalEvent("AI feedback ready", "llm");
      })
      .catch(() => {
        // Static fallback already shown — silently keep it
      });
  }, [questionsAnswered]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Adaptive Tutor</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          AI-powered tutoring running entirely on your device
        </p>
      </div>

      {/* Split-screen: Tutor | Privacy Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tutor area */}
        <div className="lg:col-span-2 space-y-4">
          <SessionControls />
          {sessionActive && <QuestionCard />}
          <MasteryProgress />
        </div>

        {/* Right: Privacy panel */}
        <div className="space-y-4">
          <PrivacyPanel />

          {/* Privacy explainer */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--muted)]">
              How It Works
            </h3>
            <ul className="text-xs text-[var(--muted)] space-y-2">
              <li className="flex gap-2">
                <span className="text-[var(--success)]">✓</span>
                Questions generated on-device — zero network traffic
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--success)]">✓</span>
                Error classification runs locally — mistakes never leave
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--success)]">✓</span>
                Only gradients + credentials sent at session end
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--success)]">✓</span>
                All outbound traffic wrapped in Lightway DTLS tunnel
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

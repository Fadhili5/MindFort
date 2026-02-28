"use client";

import { useTutorStore } from "@/lib/stores/tutor-store";

export function SessionControls() {
  const {
    sessionActive,
    startSession,
    endSession,
    nextQuestion,
    feedback,
    llmReady,
    llmLoading,
    llmProgress,
  } = useTutorStore();

  if (!sessionActive) {
    return (
      <div className="space-y-3">
        {/* On-device model loading bar */}
        {llmLoading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Loading on-device AI model…</span>
              <span>{Math.round(llmProgress * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${Math.round(llmProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={startSession}
          className="w-full px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
        >
          {llmLoading ? "Loading AI Model…" : "Start Tutoring Session"}
        </button>

        {llmReady && (
          <p className="text-xs text-center text-[var(--muted)]">
            On-device AI ready — no data leaves your device
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {feedback && (
        <button
          onClick={nextQuestion}
          className="flex-1 px-4 py-2.5 border border-brand-500 text-brand-500 hover:bg-brand-500/10 rounded-lg font-medium transition-colors"
        >
          Next Question →
        </button>
      )}
      <button
        onClick={endSession}
        className="px-4 py-2.5 border border-[var(--border)] hover:border-red-500 hover:text-red-400 rounded-lg text-sm transition-colors"
      >
        End Session
      </button>
    </div>
  );
}

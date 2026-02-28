"use client";

import { useTutorStore } from "@/lib/stores/tutor-store";

export function SessionControls() {
  const { sessionActive, startSession, endSession, nextQuestion, feedback } =
    useTutorStore();

  if (!sessionActive) {
    return (
      <button
        onClick={startSession}
        className="w-full px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
      >
        Start Tutoring Session
      </button>
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

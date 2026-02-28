"use client";

import { useTutorStore } from "@/lib/stores/tutor-store";
import { cn } from "@/lib/utils";

export function QuestionCard() {
  const { currentQuestion, userAnswer, setUserAnswer, submitAnswer, feedback, feedbackType } =
    useTutorStore();

  if (!currentQuestion) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)] uppercase tracking-wider">
        <span className="h-2 w-2 rounded-full bg-brand-500" />
        {currentQuestion.topicId.replace(/_/g, " ")}
      </div>

      <h2 className="text-xl font-semibold">{currentQuestion.question}</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitAnswer();
        }}
        className="flex gap-3"
      >
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-brand-500 focus:outline-none transition-colors"
          autoFocus
        />
        <button
          type="submit"
          disabled={!userAnswer.trim()}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-lg font-medium transition-colors"
        >
          Submit
        </button>
      </form>

      {feedback && (
        <div
          className={cn(
            "p-4 rounded-lg text-sm whitespace-pre-wrap",
            feedbackType === "correct" && "bg-green-500/10 border border-green-500/20 text-green-400",
            feedbackType === "incorrect" && "bg-red-500/10 border border-red-500/20 text-red-400",
            feedbackType === "info" && "bg-blue-500/10 border border-blue-500/20 text-blue-400"
          )}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}

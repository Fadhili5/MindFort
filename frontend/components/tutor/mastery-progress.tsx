"use client";

import { useTutorStore } from "@/lib/stores/tutor-store";

export function MasteryProgress() {
  const { masteryRecords, masteredTopics } = useTutorStore();
  const topics = Object.values(masteryRecords);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--muted)]">
        Mastery Progress
      </h3>

      {topics.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Start a session to track mastery.</p>
      ) : (
        <div className="space-y-3">
          {topics.map((r) => {
            const progress = Math.min(r.repetitions / 3, 1);
            return (
              <div key={r.topicId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{r.topicId.replace(/_/g, " ")}</span>
                  <span className={r.mastered ? "text-[var(--success)]" : "text-[var(--muted)]"}>
                    {r.mastered ? "✓ Mastered" : `${r.repetitions}/3`}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--background)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: r.mastered ? "var(--success)" : "var(--accent)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {masteredTopics.length > 0 && (
        <div className="pt-2 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--success)]">
            🏆 {masteredTopics.length} topic{masteredTopics.length !== 1 ? "s" : ""} mastered — credentials ready to mint
          </p>
        </div>
      )}
    </div>
  );
}

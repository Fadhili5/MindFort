import type { MasteryRecord } from "@mindvault/types";
import { isDue } from "./sm2.js";

/**
 * Selects the next topic for review from a student's mastery records,
 * implementing interleaved practice (topics are mixed, not blocked by subject).
 *
 * Priority order:
 *   1. Overdue items (sorted by how overdue they are — most overdue first)
 *   2. Due items (sorted by ease factor ascending — hardest first)
 *   3. If nothing is due, return the soonest upcoming item
 */
export function selectNextTopic(
  records: MasteryRecord[],
  now = Date.now()
): MasteryRecord | null {
  if (records.length === 0) return null;

  const overdue = records.filter((r) => isDue(r, now) && !r.mastered);

  if (overdue.length > 0) {
    // Sort by most overdue first, breaking ties by lowest ease factor
    overdue.sort((a, b) => {
      const overdueA = now - a.nextReviewAt;
      const overdueB = now - b.nextReviewAt;
      if (overdueB !== overdueA) return overdueB - overdueA;
      return a.easeFactor - b.easeFactor;
    });
    return overdue[0] ?? null;
  }

  // Nothing due — find the soonest upcoming review
  const upcoming = records
    .filter((r) => !r.mastered)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt);

  return upcoming[0] ?? null;
}

/**
 * Interleaves topics from multiple subjects to prevent blocking.
 * Takes up to `count` items, round-robining across subject groups.
 */
export function buildInterleavedQueue(
  recordsBySubject: Record<string, MasteryRecord[]>,
  count: number,
  now = Date.now()
): MasteryRecord[] {
  const subjects = Object.keys(recordsBySubject);
  if (subjects.length === 0) return [];

  // Get due items per subject, sorted by priority
  const queues: MasteryRecord[][] = subjects.map((subject) => {
    const recs = recordsBySubject[subject] ?? [];
    return recs
      .filter((r) => isDue(r, now) && !r.mastered)
      .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
  });

  const result: MasteryRecord[] = [];
  let i = 0;
  while (result.length < count) {
    let added = false;
    for (let s = 0; s < queues.length && result.length < count; s++) {
      const queue = queues[(s + i) % queues.length];
      if (queue && queue.length > 0) {
        result.push(queue.shift()!);
        added = true;
      }
    }
    if (!added) break; // All queues exhausted
    i++;
  }

  return result;
}

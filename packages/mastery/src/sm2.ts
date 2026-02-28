import type { MasteryRecord, QualityScore } from "@mindvault/types";
import { MASTERY_THRESHOLD } from "@mindvault/types";

const MIN_EASE_FACTOR = 1.3;
const INITIAL_EASE_FACTOR = 2.5;
const MS_PER_DAY = 86_400_000;

/**
 * Creates a brand-new mastery record for a (studentId, topicId) pair.
 * Scheduled for immediate review (nextReviewAt = now).
 */
export function createMasteryRecord(
  studentId: string,
  topicId: string,
  now = Date.now()
): MasteryRecord {
  return {
    studentId,
    topicId,
    easeFactor: INITIAL_EASE_FACTOR,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: now,
    lastReviewedAt: 0,
    mastered: false,
  };
}

/**
 * Applies one SM-2 review cycle and returns an updated MasteryRecord.
 *
 * SM-2 rules:
 *   - quality >= 3 → correct response
 *     - repetitions == 0 → interval = 1
 *     - repetitions == 1 → interval = 6
 *     - repetitions >  1 → interval = round(interval * easeFactor)
 *     - easeFactor adjusted by quality delta
 *   - quality <  3 → incorrect response → reset repetitions + interval
 *
 * Mastery is declared once repetitions >= MASTERY_THRESHOLD (3).
 */
export function applyReview(
  record: MasteryRecord,
  quality: QualityScore,
  now = Date.now()
): MasteryRecord {
  const correct = quality >= 3;

  let { easeFactor, intervalDays, repetitions } = record;

  if (correct) {
    // Advance interval
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }

    repetitions += 1;

    // Adjust ease factor — formula from SM-2 spec
    easeFactor =
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < MIN_EASE_FACTOR) {
      easeFactor = MIN_EASE_FACTOR;
    }
  } else {
    // Failed response — reset repetitions, keep ease factor adjusted
    repetitions = 0;
    intervalDays = 1;
    easeFactor =
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < MIN_EASE_FACTOR) {
      easeFactor = MIN_EASE_FACTOR;
    }
  }

  const mastered = repetitions >= MASTERY_THRESHOLD;
  const nextReviewAt = now + intervalDays * MS_PER_DAY;

  return {
    ...record,
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewAt,
    lastReviewedAt: now,
    mastered,
  };
}

/**
 * Returns true if a topic is due for review.
 */
export function isDue(record: MasteryRecord, now = Date.now()): boolean {
  return now >= record.nextReviewAt;
}

/**
 * Returns a normalised mastery score in [0, 1] based on SM-2 state.
 * Used in the MasteryAttestation committed to the Abelian chain.
 */
export function computeMasteryScore(record: MasteryRecord): number {
  if (!record.mastered) {
    return Math.min(record.repetitions / MASTERY_THRESHOLD, 0.99);
  }
  // Mastered: score scales with ease factor (higher EF = more confident)
  const efNorm = (record.easeFactor - MIN_EASE_FACTOR) / (5 - MIN_EASE_FACTOR);
  return Math.min(0.7 + efNorm * 0.3, 1.0);
}

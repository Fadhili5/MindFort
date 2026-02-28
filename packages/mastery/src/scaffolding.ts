import type { ScaffoldingLevel, ErrorType } from "@mindvault/types";
import type { MasteryRecord } from "@mindvault/types";
import { MASTERY_THRESHOLD } from "@mindvault/types";

/**
 * Selects the appropriate scaffolding level for the next question,
 * implementing the expertise-reversal principle:
 * - Novices (low repetitions, recent failures) get full worked examples
 * - Intermediate learners get partial examples or hints
 * - Experts (mastered topics) get no scaffolding
 *
 * Scaffolding levels:
 *   3 = full worked example
 *   2 = partial worked example
 *   1 = hint only
 *   0 = no scaffolding
 */
export function selectScaffolding(
  record: MasteryRecord,
  lastErrorType: ErrorType | null,
  consecutiveErrors: number
): ScaffoldingLevel {
  const { repetitions, mastered } = record;

  // Expert — remove scaffolding entirely (expertise-reversal effect)
  if (mastered) return 0;

  // Struggling — escalate support
  if (consecutiveErrors >= 3) return 3;
  if (consecutiveErrors >= 2) return 3;

  // Error-type adjustments
  if (lastErrorType === "conceptual") {
    // Needs the full mental model re-explained
    return repetitions < 2 ? 3 : 2;
  }

  if (lastErrorType === "procedural") {
    // Knows the concept, needs to see the steps
    return 2;
  }

  if (lastErrorType === "careless") {
    // Attention lapse — a gentle hint is enough
    return 1;
  }

  if (lastErrorType === "incomplete") {
    return repetitions < 2 ? 3 : 2;
  }

  // No recent errors — scale down scaffolding with repetitions
  const progressRatio = repetitions / MASTERY_THRESHOLD;
  if (progressRatio < 0.33) return 3;
  if (progressRatio < 0.66) return 2;
  return 1;
}

/**
 * Determines whether scaffolding should be withdrawn on the next attempt.
 * Used to implement the expertise-reversal fade-out.
 */
export function shouldReduceScaffolding(
  currentLevel: ScaffoldingLevel,
  consecutiveCorrect: number
): boolean {
  if (currentLevel === 0) return false;
  // After two consecutive correct answers at any level, fade one level
  return consecutiveCorrect >= 2;
}

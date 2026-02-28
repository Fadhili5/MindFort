import type { ErrorType, QualityScore } from "@mindvault/types";

export interface ClassifierInput {
  /** The student's answer text */
  answer: string;
  /** The expected correct answer */
  expectedAnswer: string;
  /** Time taken in ms */
  latencyMs: number;
  /** Student's current repetition count for this topic */
  repetitions: number;
  /** Average latency for this student on correct answers (baseline) */
  avgCorrectLatencyMs: number;
}

export interface ClassifierResult {
  correct: boolean;
  quality: QualityScore;
  errorType: ErrorType | null;
}

// Thresholds
const CARELESS_LATENCY_RATIO = 0.4; // < 40% of avg correct latency → rushed
const SLOW_LATENCY_RATIO = 3.0;     // > 300% → struggling
const PARTIAL_MATCH_THRESHOLD = 0.5; // Levenshtein similarity >= 50%

/**
 * Classifies a student's answer into an error type and SM-2 quality score.
 *
 * Quality mapping:
 *   5 — correct, fast response
 *   4 — correct, normal response
 *   3 — correct but slow (needed extra time → partial recall)
 *   2 — incorrect, partial match — incomplete/procedural error
 *   1 — incorrect, poor match — conceptual error
 *   0 — no answer or total blackout — conceptual error
 */
export function classifyAnswer(input: ClassifierInput): ClassifierResult {
  const { answer, expectedAnswer, latencyMs, avgCorrectLatencyMs } = input;

  const normAnswer = answer.trim().toLowerCase();
  const normExpected = expectedAnswer.trim().toLowerCase();
  const exact = normAnswer === normExpected;
  const similarity = levenshteinSimilarity(normAnswer, normExpected);
  const latencyRatio =
    avgCorrectLatencyMs > 0 ? latencyMs / avgCorrectLatencyMs : 1;

  if (exact || similarity >= 0.9) {
    // Correct response — differentiate quality by latency
    if (latencyRatio < CARELESS_LATENCY_RATIO) {
      // Very fast — might be careless on a harder question, but still correct
      return { correct: true, quality: 4, errorType: null };
    } else if (latencyRatio > SLOW_LATENCY_RATIO) {
      // Slow correct — effortful retrieval (lower quality)
      return { correct: true, quality: 3, errorType: null };
    }
    return { correct: true, quality: 5, errorType: null };
  }

  // Incorrect response
  if (normAnswer.length === 0) {
    return { correct: false, quality: 0, errorType: "conceptual" };
  }

  if (similarity >= PARTIAL_MATCH_THRESHOLD) {
    // Close but wrong — procedural slip or incomplete response
    const errorType: ErrorType =
      latencyRatio < CARELESS_LATENCY_RATIO ? "careless" : "procedural";
    return { correct: false, quality: 2, errorType };
  }

  if (similarity > 0.2) {
    // Some overlap — incomplete knowledge
    return { correct: false, quality: 1, errorType: "incomplete" };
  }

  // Low similarity — fundamental conceptual misunderstanding
  return { correct: false, quality: 1, errorType: "conceptual" };
}

/**
 * Normalised Levenshtein similarity in [0, 1].
 * 1.0 = identical strings.
 */
export function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const dist = levenshteinDistance(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // Two-row DP — O(min(m,n)) space
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1,        // deletion
        (curr[j - 1] ?? 0) + 1,   // insertion
        (prev[j - 1] ?? 0) + cost  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n] ?? 0;
}

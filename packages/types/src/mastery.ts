/**
 * Persistent mastery record for one (studentId, topicId) pair.
 * Stored on-device; the privacy boundary strips this before any egress.
 */
export interface MasteryRecord {
  studentId: string;
  topicId: string;
  /** SM-2 ease factor — starts at 2.5, adjusted after each review */
  easeFactor: number;
  /** Current scheduled interval in days */
  intervalDays: number;
  /** Total correct repetitions across distinct sessions */
  repetitions: number;
  /** Unix timestamp (ms) for next scheduled review */
  nextReviewAt: number;
  /** Timestamp of the last review session */
  lastReviewedAt: number;
  /** True once repetitions >= MASTERY_THRESHOLD (3) */
  mastered: boolean;
}

/** Minimum correct retrievals across separate sessions to declare mastery */
export const MASTERY_THRESHOLD = 3;

/**
 * Condensed attestation emitted when a topic is mastered.
 * This — and only this — is signed and minted to the Abelian chain.
 */
export interface MasteryAttestation {
  /** Pseudonymous wallet-derived ID — not linked to real name */
  pseudonymousId: string;
  topicId: string;
  /** Normalised score 0–1 */
  score: number;
  achievedAt: number;
}

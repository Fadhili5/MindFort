/**
 * A single question-answer interaction within a tutoring session.
 */
export interface QuestionAttempt {
  questionId: string;
  topicId: string;
  /** The student's raw answer text (never leaves device) */
  answer: string;
  /** Whether the answer was correct */
  correct: boolean;
  /** Time taken to answer in milliseconds */
  latencyMs: number;
  /** SM-2 quality score 0–5 assigned by the mastery engine */
  qualityScore: QualityScore;
  /** Error type if incorrect */
  errorType: ErrorType | null;
  /** Scaffolding level shown to the student */
  scaffoldingLevel: ScaffoldingLevel;
  timestamp: number;
}

/**
 * An active tutoring session. Lives entirely on-device.
 */
export interface Session {
  sessionId: string;
  /** Pseudonymous — never linked to a real name on the device */
  studentId: string;
  startedAt: number;
  endedAt: number | null;
  attempts: QuestionAttempt[];
}

/**
 * SM-2 quality score: 0 = total blackout, 5 = perfect response.
 * Scores < 3 are treated as failures.
 */
export type QualityScore = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Error taxonomy used by the classifier.
 */
export type ErrorType =
  | "conceptual"   // Wrong model of the underlying concept
  | "procedural"   // Knows concept but made a step error
  | "careless"     // Evidence of knowledge but lost attention
  | "incomplete";  // Partially correct — missing components

/**
 * Scaffolding levels following expertise-reversal principle.
 * Higher level = more support; withdrawn as mastery improves.
 */
export type ScaffoldingLevel = 0 | 1 | 2 | 3;
// 0 = no scaffolding (expert)
// 1 = hint only
// 2 = partial worked example
// 3 = full worked example

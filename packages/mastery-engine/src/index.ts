export type ErrorType =
  | "conceptual_gap"
  | "careless_mistake"
  | "notation_confusion";

export type ScaffoldingStrategy =
  | "rewrite_explanation"
  | "worked_example"
  | "drop_to_prerequisite"
  | "highlight_step"
  | "notation_guide";

export interface Question {
  id: string;
  topic: string;
  prompt: string;
  choices?: readonly string[];
  expectedAnswer: string;
  acceptedAnswers?: readonly string[];
  answerFormat: "free_text" | "numeric" | "multiple_choice";
}

export interface Attempt {
  topic: string;
  answer: string;
  expected: string;
  responseTimeMs: number;
  hintsUsed: number;
  confidence: number;
}

export interface AttemptResult {
  correct: boolean;
  score: number;
  timestamp: string;
}

export interface MasteryState {
  topic: string;
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  sessionScores: number[];
  masteryScore: number;
  stableAcrossSpacedSessions: boolean;
}

export type TopicState = MasteryState;

export interface MasteryEngine {
  getNextQuestion(topic: string): Question;
  getInterleavedSession(topics: TopicState[]): Question[];
  classifyError(attempt: Attempt): ErrorType;
  selectScaffolding(error: ErrorType, attempts: number): ScaffoldingStrategy;
  updateMastery(topic: string, result: AttemptResult): MasteryState;
  shouldAdvance(topic: string): boolean;
}

const MIN_EF = 1.3;
const DEFAULT_EF = 2.5;
const ADVANCE_SCORE = 0.85;
const SESSIONS_REQUIRED = 3;
const WEAK_THRESHOLD = 0.6;

export const SUPPORTED_TOPICS = ["algebra", "geometry", "fractions"] as const;

const QUESTION_BANK: Record<(typeof SUPPORTED_TOPICS)[number], Question[]> = {
  algebra: [
    {
      id: "alg-1",
      topic: "algebra",
      prompt: "Solve for x: 2x + 7 = 19",
      expectedAnswer: "6",
      answerFormat: "numeric"
    },
    {
      id: "alg-2",
      topic: "algebra",
      prompt: "Factor: x^2 + 5x + 6",
      expectedAnswer: "(x+2)(x+3)",
      acceptedAnswers: ["(x+3)(x+2)", "(x + 2)(x + 3)", "(x + 3)(x + 2)"],
      answerFormat: "free_text"
    },
    {
      id: "alg-3",
      topic: "algebra",
      prompt: "Simplify: 3(2x - 4) + 5",
      expectedAnswer: "6x-7",
      acceptedAnswers: ["6x - 7"],
      answerFormat: "free_text"
    },
    {
      id: "alg-4",
      topic: "algebra",
      prompt: "Solve: 4x = 28",
      expectedAnswer: "7",
      answerFormat: "numeric"
    },
    {
      id: "alg-5",
      topic: "algebra",
      prompt: "Which expression is equivalent to 5(x + 2)?",
      expectedAnswer: "5x+10",
      acceptedAnswers: ["5x + 10"],
      choices: ["5x+2", "5x+10", "x+10", "10x+2"],
      answerFormat: "multiple_choice"
    },
    {
      id: "alg-6",
      topic: "algebra",
      prompt: "If y = 3x and x = 4, what is y?",
      expectedAnswer: "12",
      answerFormat: "numeric"
    }
  ],
  geometry: [
    {
      id: "geo-1",
      topic: "geometry",
      prompt: "Find area of a triangle with base 8 and height 5.",
      expectedAnswer: "20",
      answerFormat: "numeric"
    },
    {
      id: "geo-2",
      topic: "geometry",
      prompt: "What is the perimeter of a rectangle with length 9 and width 4?",
      expectedAnswer: "26",
      answerFormat: "numeric"
    },
    {
      id: "geo-3",
      topic: "geometry",
      prompt: "A right triangle has legs 6 and 8. Find the hypotenuse.",
      expectedAnswer: "10",
      answerFormat: "numeric"
    },
    {
      id: "geo-4",
      topic: "geometry",
      prompt: "How many degrees are in the interior angles of a triangle?",
      expectedAnswer: "180",
      answerFormat: "numeric"
    },
    {
      id: "geo-5",
      topic: "geometry",
      prompt: "Choose the correct area formula for a circle with radius r.",
      expectedAnswer: "pi*r^2",
      acceptedAnswers: ["πr^2", "pi r^2"],
      choices: ["2*pi*r", "pi*r^2", "r^2/2", "pi*d"],
      answerFormat: "multiple_choice"
    },
    {
      id: "geo-6",
      topic: "geometry",
      prompt: "A square has side length 7. What is its area?",
      expectedAnswer: "49",
      answerFormat: "numeric"
    }
  ],
  fractions: [
    {
      id: "fra-1",
      topic: "fractions",
      prompt: "Add 1/4 + 1/2",
      expectedAnswer: "3/4",
      acceptedAnswers: ["0.75"],
      answerFormat: "free_text"
    },
    {
      id: "fra-2",
      topic: "fractions",
      prompt: "Simplify 6/8",
      expectedAnswer: "3/4",
      acceptedAnswers: ["0.75"],
      answerFormat: "free_text"
    },
    {
      id: "fra-3",
      topic: "fractions",
      prompt: "Compute 2/3 + 1/6",
      expectedAnswer: "5/6",
      acceptedAnswers: ["0.8333", "0.833"],
      answerFormat: "free_text"
    },
    {
      id: "fra-4",
      topic: "fractions",
      prompt: "Compute 3/5 of 20",
      expectedAnswer: "12",
      answerFormat: "numeric"
    },
    {
      id: "fra-5",
      topic: "fractions",
      prompt: "Which fraction is equivalent to 1/2?",
      expectedAnswer: "4/8",
      choices: ["2/5", "3/7", "4/8", "5/12"],
      answerFormat: "multiple_choice"
    },
    {
      id: "fra-6",
      topic: "fractions",
      prompt: "Subtract 7/8 - 1/4",
      expectedAnswer: "5/8",
      acceptedAnswers: ["0.625"],
      answerFormat: "free_text"
    }
  ]
};

function clampScore(score: number): number {
  if (score < 0) {
    return 0;
  }
  if (score > 1) {
    return 1;
  }
  return score;
}

function scoreToSm2Quality(score: number): number {
  if (score >= 0.95) return 5;
  if (score >= 0.85) return 4;
  if (score >= 0.7) return 3;
  if (score >= 0.5) return 2;
  if (score >= 0.3) return 1;
  return 0;
}

function computeSm2(state: MasteryState, quality: number, reviewedAt: Date): MasteryState {
  let repetitions = state.repetitions;
  let intervalDays = state.intervalDays;
  let easinessFactor = state.easinessFactor;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easinessFactor);
    }
  }

  easinessFactor = Math.max(
    MIN_EF,
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReview = new Date(reviewedAt);
  nextReview.setUTCDate(nextReview.getUTCDate() + intervalDays);

  return {
    ...state,
    repetitions,
    intervalDays,
    easinessFactor,
    lastReviewedAt: reviewedAt.toISOString(),
    nextReviewAt: nextReview.toISOString()
  };
}

function isEligibleReview(topic: TopicState, now: Date): boolean {
  if (!topic.nextReviewAt) {
    return true;
  }

  const dueAt = new Date(topic.nextReviewAt);
  return Number.isFinite(dueAt.getTime()) && dueAt.getTime() <= now.getTime();
}

function pickReviewTopic(topics: TopicState[], predicate: (topic: TopicState) => boolean, now: Date): TopicState | null {
  const candidates = topics.filter(predicate);
  if (candidates.length === 0) {
    return null;
  }

  const eligible = candidates.filter((topic) => isEligibleReview(topic, now));
  const ranked = (eligible.length > 0 ? eligible : candidates)
    .slice()
    .sort((a, b) => {
      const aNext = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
      const bNext = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
      return aNext - bNext;
    });

  return ranked[0] ?? null;
}

function normalizeMathText(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "").replace(/π/g, "pi");
}

function parseMaybeNumber(input: string): number | null {
  const normalized = normalizeMathText(input);
  const direct = Number(normalized);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const fractionParts = normalized.split("/");
  if (fractionParts.length === 2) {
    const numerator = Number(fractionParts[0]);
    const denominator = Number(fractionParts[1]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  return null;
}

export function getSupportedTopics(): readonly string[] {
  return SUPPORTED_TOPICS;
}

export function gradeQuestionAnswer(question: Question, answer: string): { score: number; correct: boolean } {
  const normalizedAnswer = normalizeMathText(answer);
  const normalizedExpected = normalizeMathText(question.expectedAnswer);
  const accepted = new Set(
    [question.expectedAnswer, ...(question.acceptedAnswers ?? [])].map((candidate) => normalizeMathText(candidate))
  );

  if (accepted.has(normalizedAnswer)) {
    return { score: 1, correct: true };
  }

  const answerNumber = parseMaybeNumber(normalizedAnswer);
  const expectedNumber = parseMaybeNumber(normalizedExpected);
  if (answerNumber !== null && expectedNumber !== null) {
    const diff = Math.abs(answerNumber - expectedNumber);
    if (diff <= 0.0001) {
      return { score: 1, correct: true };
    }
    if (diff <= Math.max(0.05, Math.abs(expectedNumber) * 0.02)) {
      return { score: 0.8, correct: false };
    }
  }

  if (normalizedAnswer.length === 0) {
    return { score: 0.2, correct: false };
  }

  const sharedTokens = normalizedExpected
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 1 && normalizedAnswer.includes(token));
  if (sharedTokens.length >= 1) {
    return { score: 0.45, correct: false };
  }

  return { score: 0.3, correct: false };
}

export class InMemoryMasteryEngine implements MasteryEngine {
  private readonly topicState = new Map<string, MasteryState>();
  private readonly questionCursor = new Map<string, number>();

  public getNextQuestion(topic: string): Question {
    const typedTopic = (SUPPORTED_TOPICS.find((knownTopic) => knownTopic === topic) ??
      null) as (typeof SUPPORTED_TOPICS)[number] | null;
    const bank = (typedTopic ? QUESTION_BANK[typedTopic] : [
      {
        id: `${topic}-fallback-1`,
        topic,
        prompt: `Explain one key concept of ${topic} in your own words.`,
        expectedAnswer: "explanation",
        answerFormat: "free_text"
      }
    ]) as [Question, ...Question[]];

    const cursor = this.questionCursor.get(topic) ?? 0;
    const next = bank[cursor % bank.length]!;
    this.questionCursor.set(topic, cursor + 1);
    return next;
  }

  public getInterleavedSession(topics: TopicState[]): Question[] {
    const now = new Date();
    const currentTopic = topics[0]?.topic ?? "algebra";

    const weakTopic = pickReviewTopic(
      topics,
      (topic) => topic.topic !== currentTopic && topic.masteryScore < WEAK_THRESHOLD,
      now
    )?.topic ?? currentTopic;

    const masteredTopic = pickReviewTopic(
      topics,
      (topic) => topic.topic !== currentTopic && topic.masteryScore >= ADVANCE_SCORE,
      now
    )?.topic ?? currentTopic;

    return [
      this.getNextQuestion(currentTopic),
      this.getNextQuestion(weakTopic),
      this.getNextQuestion(masteredTopic)
    ];
  }

  public classifyError(attempt: Attempt): ErrorType {
    const normalizedAnswer = attempt.answer.trim().toLowerCase();
    const normalizedExpected = attempt.expected.trim().toLowerCase();

    if (normalizedAnswer === normalizedExpected) {
      return "careless_mistake";
    }

    const numericAnswer = Number(normalizedAnswer);
    const numericExpected = Number(normalizedExpected);
    const bothNumeric = Number.isFinite(numericAnswer) && Number.isFinite(numericExpected);

    if (bothNumeric && Math.abs(numericAnswer - numericExpected) <= 1) {
      return "careless_mistake";
    }

    const notationPattern = /\^|sqrt|pi|theta|\//i;
    if (notationPattern.test(attempt.expected) && !notationPattern.test(attempt.answer)) {
      return "notation_confusion";
    }

    if (attempt.hintsUsed >= 2 || attempt.confidence < 0.35) {
      return "conceptual_gap";
    }

    return attempt.responseTimeMs < 5000 ? "careless_mistake" : "conceptual_gap";
  }

  public selectScaffolding(error: ErrorType, attempts: number): ScaffoldingStrategy {
    if (attempts >= 3 && error !== "notation_confusion") {
      return "drop_to_prerequisite";
    }

    if (error === "notation_confusion") {
      return attempts > 1 ? "notation_guide" : "highlight_step";
    }

    if (error === "careless_mistake") {
      return attempts > 1 ? "highlight_step" : "worked_example";
    }

    return attempts > 1 ? "worked_example" : "rewrite_explanation";
  }

  public updateMastery(topic: string, result: AttemptResult): MasteryState {
    const previous = this.getOrCreateState(topic);
    const score = clampScore(result.score);
    const quality = scoreToSm2Quality(score);
    const reviewedAt = new Date(result.timestamp);

    const next = computeSm2(previous, quality, reviewedAt);
    const lastSessions = [...next.sessionScores, score].slice(-SESSIONS_REQUIRED);
    const masteryScore = lastSessions.length === 0
      ? 0
      : lastSessions.reduce((acc, value) => acc + value, 0) / lastSessions.length;

    const stableAcrossSpacedSessions =
      lastSessions.length >= SESSIONS_REQUIRED &&
      lastSessions.every((value) => value >= ADVANCE_SCORE);

    const state: MasteryState = {
      ...next,
      sessionScores: lastSessions,
      masteryScore,
      stableAcrossSpacedSessions
    };

    this.topicState.set(topic, state);
    return state;
  }

  public shouldAdvance(topic: string): boolean {
    const state = this.topicState.get(topic);
    if (!state) {
      return false;
    }
    return state.stableAcrossSpacedSessions && state.masteryScore >= ADVANCE_SCORE;
  }

  private getOrCreateState(topic: string): MasteryState {
    const existing = this.topicState.get(topic);
    if (existing) {
      return existing;
    }
    const initial: MasteryState = {
      topic,
      easinessFactor: DEFAULT_EF,
      intervalDays: 1,
      repetitions: 0,
      lastReviewedAt: null,
      nextReviewAt: null,
      sessionScores: [],
      masteryScore: 0,
      stableAcrossSpacedSessions: false
    };
    this.topicState.set(topic, initial);
    return initial;
  }
}

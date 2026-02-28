/**
 * Tutor prompt builders.
 * Converts mastery engine output into structured message arrays for the LLM.
 *
 * Privacy note: these prompts contain topic labels and error types only —
 * never raw student answers or personally identifiable information.
 */

import type { ErrorType, ScaffoldingLevel } from "@mindvault/types";
import type { Message } from "./types.js";

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

export const TUTOR_SYSTEM_PROMPT: Message = {
  role: "system",
  content: `You are MindVault, a patient and encouraging AI tutor. Your job is to help students genuinely understand concepts — not just get the right answer.

Guidelines:
- Be concise: responses must fit in 3–5 sentences unless a worked example is requested.
- Adapt your language to the student's apparent level (inferred from the error type).
- Never reveal the answer directly when providing hints.
- Use concrete, relatable examples wherever possible.
- End every response with a single follow-up question to check understanding.`,
};

// ---------------------------------------------------------------------------
// Feedback after an incorrect answer
// ---------------------------------------------------------------------------

/**
 * Builds a feedback prompt based on the error type and scaffolding level.
 * The student's raw answer is NOT included — only the topic and error class.
 */
export function buildFeedbackPrompt(params: {
  topic: string;
  errorType: ErrorType;
  scaffoldingLevel: ScaffoldingLevel;
  consecutiveErrors: number;
}): Message[] {
  const { topic, errorType, scaffoldingLevel, consecutiveErrors } = params;

  const errorDescriptions: Record<ErrorType, string> = {
    conceptual:
      "the student has a fundamental misunderstanding of the concept",
    procedural:
      "the student understands the concept but made an error in the steps",
    careless:
      "the student likely knows this but made a rushed or inattentive mistake",
    incomplete:
      "the student's answer is partially correct but missing key components",
  };

  const scaffoldingInstructions: Record<ScaffoldingLevel, string> = {
    0: "Provide no scaffolding — ask a Socratic question that guides them to the answer.",
    1: "Provide a single-sentence hint that nudges them in the right direction without revealing the answer.",
    2: "Walk through part of the solution process, leaving the final step for the student.",
    3: "Provide a complete worked example for a similar (but not identical) problem, then ask them to apply the same method.",
  };

  const frustrationNote =
    consecutiveErrors >= 3
      ? " The student has made 3+ consecutive errors — be especially encouraging and break the concept down simply."
      : "";

  return [
    TUTOR_SYSTEM_PROMPT,
    {
      role: "user",
      content:
        `Topic: "${topic}"\n` +
        `Error diagnosis: ${errorDescriptions[errorType]}\n` +
        `Scaffolding level ${scaffoldingLevel}: ${scaffoldingInstructions[scaffoldingLevel]}` +
        frustrationNote,
    },
  ];
}

// ---------------------------------------------------------------------------
// Worked example generation
// ---------------------------------------------------------------------------

/**
 * Asks the tutor to generate a worked example at the right detail level.
 * Used when scaffoldingLevel is 2 or 3.
 */
export function buildWorkedExamplePrompt(params: {
  topic: string;
  scaffoldingLevel: 2 | 3;
}): Message[] {
  const { topic, scaffoldingLevel } = params;

  const detail =
    scaffoldingLevel === 3
      ? "Show every step, explaining the reasoning behind each one."
      : "Show the first half of the solution, then stop and ask the student to complete it.";

  return [
    TUTOR_SYSTEM_PROMPT,
    {
      role: "user",
      content:
        `Create a worked example for the topic: "${topic}".\n` +
        detail +
        "\nUse a concrete, realistic scenario. Do NOT use the exact problem the student was given.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Explanation reframing
// ---------------------------------------------------------------------------

/**
 * Asks the tutor to reframe an explanation after a conceptual error.
 * A different angle on the same concept, not a repetition.
 */
export function buildReframePrompt(params: {
  topic: string;
  previousExplanationSummary?: string;
}): Message[] {
  const { topic, previousExplanationSummary } = params;

  const avoidNote = previousExplanationSummary
    ? `\nThe previous explanation tried: "${previousExplanationSummary}". Use a completely different approach — analogy, diagram description, real-world scenario, etc.`
    : "";

  return [
    TUTOR_SYSTEM_PROMPT,
    {
      role: "user",
      content:
        `The student still doesn't understand: "${topic}".\n` +
        `Explain it from a fresh angle — use an analogy or real-world scenario.` +
        avoidNote,
    },
  ];
}

// ---------------------------------------------------------------------------
// Mastery confirmation
// ---------------------------------------------------------------------------

/**
 * A congratulatory message shown when a topic is mastered.
 * Short, warm, no LLM call needed — just a static template.
 */
export function buildMasteryMessage(topic: string): string {
  return (
    `You've mastered "${topic}"! Your understanding has been verified across multiple sessions. ` +
    `A verifiable credential has been recorded to your wallet.`
  );
}

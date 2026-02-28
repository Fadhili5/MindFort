import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryMasteryEngine, gradeQuestionAnswer, type TopicState } from "./index.js";

function makeState(input: Partial<TopicState> & { topic: string }): TopicState {
  return {
    topic: input.topic,
    easinessFactor: input.easinessFactor ?? 2.5,
    intervalDays: input.intervalDays ?? 6,
    repetitions: input.repetitions ?? 2,
    lastReviewedAt: input.lastReviewedAt ?? new Date("2026-02-20T10:00:00.000Z").toISOString(),
    nextReviewAt: input.nextReviewAt ?? new Date("2026-02-21T10:00:00.000Z").toISOString(),
    sessionScores: input.sessionScores ?? [0.9, 0.86, 0.88],
    masteryScore: input.masteryScore ?? 0.88,
    stableAcrossSpacedSessions: input.stableAcrossSpacedSessions ?? true
  };
}

test("getInterleavedSession returns current, weak, and mastered questions", () => {
  const engine = new InMemoryMasteryEngine();
  const states: TopicState[] = [
    makeState({ topic: "algebra", masteryScore: 0.7 }),
    makeState({ topic: "geometry", masteryScore: 0.4 }),
    makeState({ topic: "fractions", masteryScore: 0.9 })
  ];

  const session = engine.getInterleavedSession(states);

  assert.ok(session[0]);
  assert.ok(session[1]);
  assert.ok(session[2]);
  assert.equal(session.length, 3);
  assert.equal(session[0]?.topic, "algebra");
  assert.equal(session[1]?.topic, "geometry");
  assert.equal(session[2]?.topic, "fractions");
});

test("interleaving prefers eligible review topics by SM-2 schedule", () => {
  const engine = new InMemoryMasteryEngine();
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 7);
  const past = new Date();
  past.setUTCDate(past.getUTCDate() - 1);

  const states: TopicState[] = [
    makeState({ topic: "algebra", masteryScore: 0.7 }),
    makeState({ topic: "geometry", masteryScore: 0.4, nextReviewAt: future.toISOString() }),
    makeState({ topic: "fractions", masteryScore: 0.5, nextReviewAt: past.toISOString() }),
    makeState({ topic: "number-theory", masteryScore: 0.9, nextReviewAt: past.toISOString() })
  ];

  const session = engine.getInterleavedSession(states);

  assert.ok(session[1]);
  assert.ok(session[2]);
  assert.equal(session[1]?.topic, "fractions");
  assert.equal(session[2]?.topic, "number-theory");
});

test("getNextQuestion cycles through multiple questions per topic", () => {
  const engine = new InMemoryMasteryEngine();
  const seenIds = new Set<string>();

  for (let index = 0; index < 6; index += 1) {
    const question = engine.getNextQuestion("geometry");
    seenIds.add(question.id);
  }

  assert.equal(seenIds.size, 6);
});

test("gradeQuestionAnswer supports exact and accepted numeric/fraction answers", () => {
  const question = {
    id: "fra-1",
    topic: "fractions",
    prompt: "Add 1/4 + 1/2",
    expectedAnswer: "3/4",
    acceptedAnswers: ["0.75"],
    answerFormat: "free_text" as const
  };

  const exact = gradeQuestionAnswer(question, "3/4");
  const accepted = gradeQuestionAnswer(question, "0.75");
  const wrong = gradeQuestionAnswer(question, "1/3");

  assert.equal(exact.correct, true);
  assert.equal(accepted.correct, true);
  assert.equal(wrong.correct, false);
});

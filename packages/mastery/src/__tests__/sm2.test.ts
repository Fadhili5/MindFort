import { createMasteryRecord, applyReview, isDue, computeMasteryScore } from "../sm2.js";
import { MASTERY_THRESHOLD } from "@mindvault/types";

const NOW = 1_700_000_000_000; // fixed timestamp for deterministic tests
const DAY = 86_400_000;

describe("createMasteryRecord", () => {
  it("initialises with defaults", () => {
    const r = createMasteryRecord("s1", "algebra", NOW);
    expect(r.easeFactor).toBe(2.5);
    expect(r.repetitions).toBe(0);
    expect(r.intervalDays).toBe(0);
    expect(r.mastered).toBe(false);
    expect(r.nextReviewAt).toBe(NOW);
  });
});

describe("applyReview — correct responses", () => {
  it("first correct: interval = 1 day", () => {
    const r0 = createMasteryRecord("s1", "t1", NOW);
    const r1 = applyReview(r0, 5, NOW);
    expect(r1.repetitions).toBe(1);
    expect(r1.intervalDays).toBe(1);
    expect(r1.nextReviewAt).toBe(NOW + DAY);
  });

  it("second correct: interval = 6 days", () => {
    const r0 = createMasteryRecord("s1", "t1", NOW);
    const r1 = applyReview(r0, 5, NOW);
    const r2 = applyReview(r1, 5, NOW);
    expect(r2.repetitions).toBe(2);
    expect(r2.intervalDays).toBe(6);
  });

  it("third correct: mastery declared", () => {
    const r0 = createMasteryRecord("s1", "t1", NOW);
    const r1 = applyReview(r0, 5, NOW);
    const r2 = applyReview(r1, 5, NOW);
    const r3 = applyReview(r2, 5, NOW);
    expect(r3.repetitions).toBe(MASTERY_THRESHOLD);
    expect(r3.mastered).toBe(true);
    expect(r3.intervalDays).toBeGreaterThan(6);
  });
});

describe("applyReview — incorrect response", () => {
  it("resets repetitions and interval to 1", () => {
    const r0 = createMasteryRecord("s1", "t1", NOW);
    const r1 = applyReview(r0, 5, NOW);
    const r2 = applyReview(r1, 5, NOW);
    // Now fail
    const r3 = applyReview(r2, 1, NOW);
    expect(r3.repetitions).toBe(0);
    expect(r3.intervalDays).toBe(1);
    expect(r3.mastered).toBe(false);
  });
});

describe("isDue", () => {
  it("returns true when nextReviewAt <= now", () => {
    const r = createMasteryRecord("s1", "t1", NOW);
    expect(isDue(r, NOW)).toBe(true);
    expect(isDue(r, NOW + 1)).toBe(true);
  });

  it("returns false when review is in the future", () => {
    const r = createMasteryRecord("s1", "t1", NOW);
    const r1 = applyReview(r, 5, NOW); // nextReviewAt = NOW + 1 day
    expect(isDue(r1, NOW)).toBe(false);
    expect(isDue(r1, NOW + DAY)).toBe(true);
  });
});

describe("computeMasteryScore", () => {
  it("returns < 1 for non-mastered records", () => {
    const r = createMasteryRecord("s1", "t1", NOW);
    expect(computeMasteryScore(r)).toBeLessThan(1);
  });

  it("returns >= 0.7 for mastered records", () => {
    let r = createMasteryRecord("s1", "t1", NOW);
    r = applyReview(r, 5, NOW);
    r = applyReview(r, 5, NOW);
    r = applyReview(r, 5, NOW);
    expect(computeMasteryScore(r)).toBeGreaterThanOrEqual(0.7);
  });
});

import { classifyAnswer } from "../classifier.js";

const BASE = {
  repetitions: 1,
  avgCorrectLatencyMs: 5000,
};

describe("classifyAnswer — correct responses", () => {
  it("exact match at normal speed → quality 5", () => {
    const result = classifyAnswer({
      ...BASE,
      answer: "x = 3",
      expectedAnswer: "x = 3",
      latencyMs: 5000,
    });
    expect(result.correct).toBe(true);
    expect(result.quality).toBe(5);
    expect(result.errorType).toBeNull();
  });

  it("slow correct → quality 3", () => {
    const result = classifyAnswer({
      ...BASE,
      answer: "x = 3",
      expectedAnswer: "x = 3",
      latencyMs: 20000, // 4× average
    });
    expect(result.correct).toBe(true);
    expect(result.quality).toBe(3);
  });

  it("case-insensitive match", () => {
    const result = classifyAnswer({
      ...BASE,
      answer: "Quadratic",
      expectedAnswer: "quadratic",
      latencyMs: 4000,
    });
    expect(result.correct).toBe(true);
  });
});

describe("classifyAnswer — incorrect responses", () => {
  it("empty answer → quality 0, conceptual error", () => {
    const result = classifyAnswer({
      ...BASE,
      answer: "",
      expectedAnswer: "x = 3",
      latencyMs: 1000,
    });
    expect(result.correct).toBe(false);
    expect(result.quality).toBe(0);
    expect(result.errorType).toBe("conceptual");
  });

  it("close answer → procedural error, quality 2", () => {
    const result = classifyAnswer({
      ...BASE,
      answer: "x = 4",         // one digit off
      expectedAnswer: "x = 3",
      latencyMs: 5000,
    });
    expect(result.correct).toBe(false);
    expect(result.quality).toBe(2);
    expect(result.errorType).toBe("procedural");
  });

  it("rushed close answer → careless error", () => {
    const result = classifyAnswer({
      ...BASE,
      answer: "x = 4",
      expectedAnswer: "x = 3",
      latencyMs: 500, // very fast — under 40% of 5000ms avg
    });
    expect(result.correct).toBe(false);
    expect(result.errorType).toBe("careless");
  });

  it("completely wrong answer → conceptual error", () => {
    const result = classifyAnswer({
      ...BASE,
      answer: "differentiation",
      expectedAnswer: "x = 3",
      latencyMs: 5000,
    });
    expect(result.correct).toBe(false);
    expect(result.errorType).toBe("conceptual");
  });
});

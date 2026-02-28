export interface DemoController {
  getDeterministicAnswers(expectedAnswer: string): [string, string, string];
  forceMasteryScore(score: number): number;
  shouldAutoMint(attempts: number): boolean;
}

class DeterministicDemoController implements DemoController {
  public getDeterministicAnswers(expectedAnswer: string): [string, string, string] {
    return ["incorrect-step", "still-wrong", expectedAnswer];
  }

  public forceMasteryScore(score: number): number {
    return Math.max(score, 0.9);
  }

  public shouldAutoMint(attempts: number): boolean {
    return attempts >= 3;
  }
}

export function createDemoController(enabled: boolean): DemoController | null {
  if (!enabled) {
    return null;
  }
  return new DeterministicDemoController();
}

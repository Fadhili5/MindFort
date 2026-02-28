"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createDemoController } from "@mindvault/demo-controller";
import { createLlmClient } from "@mindvault/llm-client";
import {
  InMemoryMasteryEngine,
  type Attempt,
  type AttemptResult,
  type ErrorType,
  type Question,
  type ScaffoldingStrategy,
  type TopicState,
  getSupportedTopics,
  gradeQuestionAnswer
} from "@mindvault/mastery-engine";
import type { FederatedGradient } from "@mindvault/api-types";
import { appConfig } from "@/lib/config";
import { fetchModelVersion, loginPseudoUser, mintCredential, submitGradients } from "@/lib/api-client";
import { useOfflineSync } from "@/lib/offlineQueue";
import { useTutorStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PrivacyPanel } from "@/components/privacy-panel";

const engine = new InMemoryMasteryEngine();

const scaffoldingCopy: Record<ScaffoldingStrategy, string> = {
  rewrite_explanation: "Let me explain this using a different conceptual path.",
  worked_example: "Here is a worked example with each step spelled out.",
  drop_to_prerequisite: "We are stepping back to a prerequisite skill for stability.",
  highlight_step: "Focus on this exact step where arithmetic drift happened.",
  notation_guide: "You have the idea; now align with the expected notation format."
};

function buildAttempt(topic: string, answer: string, expected: string, deterministic: boolean): Attempt {
  if (deterministic) {
    return {
      topic,
      answer,
      expected,
      responseTimeMs: 4500,
      hintsUsed: 1,
      confidence: 0.4
    };
  }

  return {
    topic,
    answer,
    expected,
    responseTimeMs: Math.floor(3000 + Math.random() * 8000),
    hintsUsed: Math.floor(Math.random() * 2),
    confidence: Math.random()
  };
}

function buildGradientPayload(pseudoId: string, round: number, score: number): FederatedGradient {
  return {
    pseudoId,
    round,
    sampleCount: 1,
    gradients: [
      {
        layer: "dense_0",
        values: [score - 0.5, score * 0.12, (1 - score) * -0.08]
      }
    ]
  };
}

function relativeMinutes(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return "Never";
  }
  const elapsedMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(0, Math.floor(elapsedMs / 60_000));
  return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
}

export function TutorWorkspace() {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question>(() => engine.getNextQuestion("algebra"));
  const {
    pseudoId,
    token,
    topic,
    attempts,
    scaffolding,
    masteryState,
    adaptiveFeedback,
    topicStates,
    modelVersion,
    wallet,
    setAuth,
    setTopic,
    setSessionSignal,
    addCredential,
    setModelVersion
  } = useTutorStore();

  const offlineSync = useOfflineSync();
  const demoController = useMemo(() => createDemoController(appConfig.demoMode), []);
  const availableTopics = useMemo(() => getSupportedTopics(), []);

  const llmClient = useMemo(
    () =>
      createLlmClient({
        provider: appConfig.llmProvider,
        backendProxyUrl: appConfig.llmProxyUrl,
        model: appConfig.webllmModel,
        temperature: 0.2
      }),
    []
  );

  const interleavedTopics = useMemo(() => {
    const states = Object.values(topicStates) as TopicState[];
    const currentState = states.find((state) => state.topic === topic) ?? {
      topic,
      easinessFactor: 2.5,
      intervalDays: 1,
      repetitions: 0,
      lastReviewedAt: null,
      nextReviewAt: null,
      sessionScores: [],
      masteryScore: 0,
      stableAcrossSpacedSessions: false
    };
    const withCurrent = [currentState, ...states.filter((state) => state.topic !== topic)];
    return engine.getInterleavedSession(withCurrent).map((entry) => entry.topic);
  }, [topic, topicStates]);

  useEffect(() => {
    setQuestion(engine.getNextQuestion(topic));
  }, [topic]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    async function syncVersion(): Promise<void> {
      try {
        const version = await fetchModelVersion(token);
        if (active) {
          setModelVersion(version);
        }
      } catch {
        // Keep tutor flow resilient when model metadata endpoint is unavailable.
      }
    }

    void syncVersion();
    const timer = window.setInterval(() => {
      void syncVersion();
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [setModelVersion, token]);

  async function ensureAuth(): Promise<{ pseudoId: string; token: string }> {
    if (pseudoId && token) {
      return { pseudoId, token };
    }

    const generatedPseudoId = wallet?.pseudoId ?? `stu_${crypto.randomUUID().slice(0, 10)}`;
    const auth = await loginPseudoUser(generatedPseudoId);
    setAuth(auth.pseudoId, auth.token);
    return auth;
  }

  async function submitGradientWithOfflineFallback(authToken: string, payload: FederatedGradient): Promise<void> {
    if (offlineSync.isOffline) {
      await offlineSync.queueGradient(authToken, payload);
      return;
    }

    try {
      await submitGradients(authToken, payload);
    } catch {
      await offlineSync.queueGradient(authToken, payload);
    }
  }

  async function mintCredentialWithOfflineFallback(
    authToken: string,
    request: {
      pseudoId: string;
      walletAddress: string;
      topic: string;
      masteryScore: number;
      timestamp: string;
      attestationVersion: "dilithium-v1";
    }
  ): Promise<string | null> {
    if (offlineSync.isOffline) {
      await offlineSync.queueCredential(authToken, request);
      return null;
    }

    try {
      const minted = await mintCredential(authToken, request);
      return minted.txHash;
    } catch {
      await offlineSync.queueCredential(authToken, request);
      return null;
    }
  }

  async function handleSubmit(overrideAnswer?: string): Promise<void> {
    const currentAnswer = (overrideAnswer ?? answer).trim();
    if (currentAnswer.length === 0) {
      return;
    }

    setLoading(true);
    setSubmissionError(null);
    try {
      const auth = await ensureAuth();
      const latestAttempts = useTutorStore.getState().attempts;
      const expected = question.expectedAnswer;
      const deterministic = Boolean(demoController);
      const attempt = buildAttempt(topic, currentAnswer, expected, deterministic);
      const error: ErrorType = engine.classifyError(attempt);
      const strategy: ScaffoldingStrategy = engine.selectScaffolding(error, latestAttempts + 1);
      const graded = gradeQuestionAnswer(question, currentAnswer);
      const score = graded.score;

      const result: AttemptResult = {
        correct: graded.correct,
        score,
        timestamp: new Date().toISOString()
      };

      const state = engine.updateMastery(topic, result);
      const masteryScore = demoController ? demoController.forceMasteryScore(state.masteryScore) : state.masteryScore;

      let tutorReply = "Great effort. Keep iterating with the scaffolding guidance.";
      try {
        tutorReply = await llmClient.generateResponse(
          `Topic: ${topic}. Student answer: ${currentAnswer}. Expected: ${expected}. Give concise feedback strategy: ${strategy}.`
        );
      } catch {
        tutorReply = "Model feedback is temporarily unavailable; continuing with local adaptive scaffolding.";
      }

      setSessionSignal({
        topic,
        attempts: latestAttempts + 1,
        lastErrorType: error,
        scaffolding: strategy,
        masteryState: {
          ...state,
          masteryScore
        },
        adaptiveFeedback: `${scaffoldingCopy[strategy]} ${tutorReply}`
      });

      await submitGradientWithOfflineFallback(
        auth.token,
        buildGradientPayload(auth.pseudoId, latestAttempts + 1, score)
      );

      const shouldAutoMint = demoController
        ? demoController.shouldAutoMint(latestAttempts + 1)
        : engine.shouldAdvance(topic);

      if (shouldAutoMint) {
        const walletAddress = wallet?.address ?? `abel1${auth.pseudoId.padEnd(24, "0").slice(0, 24)}`;
        const request = {
          pseudoId: auth.pseudoId,
          walletAddress,
          topic,
          masteryScore,
          timestamp: new Date().toISOString(),
          attestationVersion: "dilithium-v1" as const
        };

        const txHash = await mintCredentialWithOfflineFallback(auth.token, request);

        if (txHash) {
          addCredential({
            txHash,
            topic,
            masteryScore,
            mintedAt: new Date().toISOString()
          });

          setBadgePulse(true);
          window.setTimeout(() => setBadgePulse(false), 1200);
        }
      }

      setAnswer("");
      setQuestion(engine.getNextQuestion(topic));
    } catch {
      setSubmissionError("Tutor submission failed. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  async function runFakeStudentDemo(): Promise<void> {
    if (!demoController || loading) {
      return;
    }

    const scriptedAnswers = demoController.getDeterministicAnswers(question.expectedAnswer);
    for (const scriptedAnswer of scriptedAnswers) {
      setAnswer(scriptedAnswer);
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      await handleSubmit(scriptedAnswer);
    }
  }

  return (
    <div className="min-h-screen bg-background font-nunito">
      {/* Header image section */}
      <header className="bg-header relative overflow-hidden rounded-b-2xl shadow-lg mb-8">
        <img
          src="/styles/headerimg.png"
          alt="Tutor Workspace Header"
          className="absolute inset-0 w-full h-48 object-cover opacity-40"
        />
        <div className="relative z-10 flex items-center justify-between px-8 py-6">
          <h1 className="font-fredoka text-2xl text-header-foreground tracking-wide drop-shadow-lg">Tutor Workspace</h1>
          {/* You can add nav or user info here if needed */}
        </div>
      </header>
      <main className="grid gap-8 lg:grid-cols-2 px-6">
        <Card className="bg-card border border-goal-card-border rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-header-foreground">
            <span className="font-bold text-lg">Adaptive Tutor</span>
            <div className="flex items-center gap-2">
              {offlineSync.isOffline ? <Badge className="bg-progress-orange text-secondary-foreground">Offline Mode Active</Badge> : null}
              {modelVersion ? (
                <Badge className="bg-progress-blue text-header-foreground">
                  {modelVersion.modelVersion} | Updated {relativeMinutes(modelVersion.lastAggregatedAt)}
                </Badge>
              ) : null}
              <motion.div
                animate={badgePulse ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <Badge className="bg-progress-green text-header-foreground">On-Device Inference</Badge>
              </motion.div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border border-border p-4 bg-muted">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Question</p>
            <p className="mt-2 text-lg font-bold text-foreground">{question.prompt}</p>
          </div>

          <div className="rounded-xl border border-border bg-reflection p-3 text-xs text-muted-foreground">
            <p className="font-semibold uppercase tracking-wide">Interleaved Session Mix</p>
            <p className="mt-1">{interleavedTopics.join(" -> ")}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground" htmlFor="answer-input">
              Your Answer
            </label>
            <Input
              id="answer-input"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Enter your reasoning or final answer"
              className="bg-card border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </div>

          <Button disabled={loading || answer.trim().length === 0} onClick={() => void handleSubmit(undefined)} className="bg-primary text-primary-foreground font-bold rounded-lg px-6 py-2 mt-2">
            {loading ? "Evaluating..." : "Submit Attempt"}
          </Button>
          {appConfig.demoMode ? (
            <Button variant="outline" disabled={loading} onClick={() => void runFakeStudentDemo()} className="border border-primary text-primary font-bold rounded-lg px-6 py-2 mt-2">
              Run Fake Student Mode
            </Button>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Mastery Progress</p>
            <Progress value={(masteryState?.masteryScore ?? 0) * 100} />
            <p className="text-sm text-muted-foreground">
              Score: <span className="font-bold text-foreground">{Math.round((masteryState?.masteryScore ?? 0) * 100)}%</span> | Sessions: <span className="font-bold text-foreground">{masteryState?.sessionScores.length ?? 0}/3</span>
            </p>
          </div>

          {submissionError ? <p className="text-sm text-red-600">{submissionError}</p> : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={scaffolding ?? "idle"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-border bg-reflection p-4"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Adaptive Feedback</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {adaptiveFeedback || "Submit your first response to unlock adaptive scaffolding."}
              </p>
            </motion.div>
          </AnimatePresence>
        </CardContent>
        </Card>
        <PrivacyPanel sessionActive={attempts > 0} demoMode={appConfig.demoMode} />
      </main>
    </div>
  );
}

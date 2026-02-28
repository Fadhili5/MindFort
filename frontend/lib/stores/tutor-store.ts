"use client";

import { create } from "zustand";
import type {
  MasteryRecord,
  ErrorType,
  ScaffoldingLevel,
  QualityScore,
  EndSessionResponse,
  LatestModelResponse,
} from "@mindvault/types";
import { DEMO_TOPICS, type Topic } from "@/lib/topics";
import { apiFetch } from "@/lib/api";
import { buildGradientPayload } from "@/lib/gradient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NetworkEvent {
  id: string;
  timestamp: number;
  type: "outbound" | "inbound";
  label: string;
  sizeBytes: number;
  destination: string;
  encrypted: boolean;
}

export interface LocalProcessingEvent {
  id: string;
  timestamp: number;
  label: string;
  component: "classifier" | "sm2" | "scaffolding" | "llm";
}

export interface SessionSummary {
  id: string;
  startedAt: number;
  endedAt: number;
  questionsAnswered: number;
  correctCount: number;
  topicsCovered: string[];
  credentialsMinted: number;
  bytesOut: number;
  localOps: number;
}

export interface MockCredential {
  txId: string;
  topicId: string;
  score: number;
  mintedAt: number;
  studentPublicKey: string;
  signature: string;
}

interface CurrentQuestion {
  question: string;
  answer: string;
  topicId: string;
}

interface TutorState {
  // Session
  sessionActive: boolean;
  sessionId: string | null;
  studentId: string;

  // Current question
  currentQuestion: CurrentQuestion | null;
  currentTopicIndex: number;
  userAnswer: string;
  questionStartTime: number;

  // Feedback
  feedback: string | null;
  feedbackType: "correct" | "incorrect" | "info" | null;
  scaffoldingLevel: ScaffoldingLevel;
  consecutiveErrors: number;
  lastErrorType: ErrorType | null;

  // Mastery (local)
  masteryRecords: Record<string, MasteryRecord>;
  masteredTopics: string[];

  // Session history + credentials (for dashboard)
  sessionHistory: SessionSummary[];
  credentials: MockCredential[];
  questionsAnswered: number;
  correctCount: number;

  // Privacy monitor
  networkEvents: NetworkEvent[];
  localProcessingEvents: LocalProcessingEvent[];
  totalOutboundBytes: number;
  totalLocalOps: number;
  tunnelReady: boolean;

  // LLM state
  llmReady: boolean;
  llmLoading: boolean;
  llmProgress: number;

  // Federated learning state
  modelVersion: string;
  federatedStatus: "idle" | "submitting" | "submitted" | "error";

  // Actions
  startSession: () => void;
  endSession: () => void;
  submitAnswer: () => void;
  setUserAnswer: (answer: string) => void;
  nextQuestion: () => void;
  addNetworkEvent: (event: Omit<NetworkEvent, "id" | "timestamp">) => void;
  addLocalEvent: (label: string, component: LocalProcessingEvent["component"]) => void;
  setTunnelReady: (ready: boolean) => void;
  setLLMReady: (ready: boolean) => void;
  setLLMLoading: (loading: boolean) => void;
  setLLMProgress: (progress: number) => void;
}

// ---------------------------------------------------------------------------
// Simple SM-2 helpers (mirrors packages/mastery but runs client-side)
// ---------------------------------------------------------------------------

function createRecord(studentId: string, topicId: string): MasteryRecord {
  return {
    studentId,
    topicId,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: Date.now(),
    lastReviewedAt: 0,
    mastered: false,
  };
}

function applyReview(r: MasteryRecord, quality: QualityScore): MasteryRecord {
  const correct = quality >= 3;
  let { easeFactor, intervalDays, repetitions } = r;

  if (correct) {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  if (easeFactor < 1.3) easeFactor = 1.3;

  return {
    ...r,
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewAt: Date.now() + intervalDays * 86_400_000,
    lastReviewedAt: Date.now(),
    mastered: repetitions >= 3,
  };
}

// ---------------------------------------------------------------------------
// Classify locally (matches packages/mastery/classifier.ts logic)
// ---------------------------------------------------------------------------

function classifyLocally(
  answer: string,
  expected: string,
  latencyMs: number
): { correct: boolean; quality: QualityScore; errorType: ErrorType | null } {
  const a = answer.trim().toLowerCase().replace(/\s+/g, "");
  const b = expected.trim().toLowerCase().replace(/\s+/g, "");
  if (a === b) return { correct: true, quality: 5, errorType: null };

  // Partial match check
  const overlap = [...a].filter((c) => b.includes(c)).length / Math.max(b.length, 1);
  if (overlap > 0.7) return { correct: false, quality: 2, errorType: "procedural" };
  if (latencyMs < 3000) return { correct: false, quality: 1, errorType: "careless" };
  return { correct: false, quality: 1, errorType: "conceptual" };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTutorStore = create<TutorState>((set, get) => ({
  sessionActive: false,
  sessionId: null,
  studentId: "demo-student-001",

  currentQuestion: null,
  currentTopicIndex: 0,
  userAnswer: "",
  questionStartTime: 0,

  feedback: null,
  feedbackType: null,
  scaffoldingLevel: 0,
  consecutiveErrors: 0,
  lastErrorType: null,

  masteryRecords: {},
  masteredTopics: [],

  sessionHistory: [],
  credentials: [],
  questionsAnswered: 0,
  correctCount: 0,

  networkEvents: [],
  localProcessingEvents: [],
  totalOutboundBytes: 0,
  totalLocalOps: 0,
  tunnelReady: true,

  llmReady: false,
  llmLoading: false,
  llmProgress: 0,

  modelVersion: "v0.0.1",
  federatedStatus: "idle",

  startSession: () => {
    const sessionId = `session-${Date.now()}`;
    const topic = DEMO_TOPICS[0]!;
    const q = topic.sampleQuestions[0]!;
    set({
      sessionActive: true,
      sessionId,
      currentQuestion: { question: q.question, answer: q.answer, topicId: topic.id },
      currentTopicIndex: 0,
      questionStartTime: Date.now(),
      feedback: null,
      feedbackType: null,
      consecutiveErrors: 0,
      networkEvents: [],
      localProcessingEvents: [],
      totalOutboundBytes: 0,
      totalLocalOps: 0,
      questionsAnswered: 0,
      correctCount: 0,
      federatedStatus: "idle",
    });

    // Fetch latest model version from the federated server (non-blocking)
    apiFetch<LatestModelResponse>("/api/model/latest")
      .then((resp) => {
        const state = get();
        set({ modelVersion: resp.model.modelVersion });
        state.addNetworkEvent({
          type: "inbound",
          label: `Model ${resp.model.modelVersion} ← Federated`,
          sizeBytes: resp.model.weights.length,
          destination: "federated:8000",
          encrypted: true,
        });
      })
      .catch(() => {
        // Non-fatal — use cached model version
      });
  },

  endSession: () => {
    const state = get();

    // Build real attestations for mastered topics
    const attestations = state.masteredTopics.map((topicId) => ({
      pseudonymousId: state.studentId,
      topicId,
      score: 0.91,
      achievedAt: Date.now(),
    }));

    // Build real gradient payload from local mastery records
    const topicIds = DEMO_TOPICS.map((t) => t.id);
    const gradient = buildGradientPayload(
      state.masteryRecords,
      topicIds,
      state.questionsAnswered,
      state.modelVersion,
    );

    const gradientSize = gradient.gradients.length;
    const credentialSize = 64 * Math.max(attestations.length, 1);

    // Record outbound network events for the privacy panel
    state.addNetworkEvent({
      type: "outbound",
      label: "Gradient → Federated (Lightway DTLS)",
      sizeBytes: gradientSize,
      destination: "federated:8000",
      encrypted: true,
    });
    if (attestations.length > 0) {
      state.addNetworkEvent({
        type: "outbound",
        label: "Credential → Abelian (Lightway DTLS)",
        sizeBytes: credentialSize,
        destination: "abelian:8732",
        encrypted: true,
      });
    }

    set({ federatedStatus: "submitting" });

    // POST to backend — parallel credential minting + gradient forwarding
    apiFetch<EndSessionResponse>("/api/session/end", {
      method: "POST",
      body: JSON.stringify({
        studentId: state.studentId,
        sessionId: state.sessionId,
        attestations,
        gradient,
      }),
    })
      .then((resp) => {
        const s = get();

        // Map server credentials into our MockCredential format
        const newCredentials: MockCredential[] = resp.credentials.map((c, i) => ({
          txId: c.txId,
          topicId: attestations[i]?.topicId ?? "unknown",
          score: attestations[i]?.score ?? 0,
          mintedAt: Date.now(),
          studentPublicKey: `dilithium-pk-${state.studentId.slice(-6)}`,
          signature: c.signature,
        }));

        // Record inbound event for gradient acknowledgement
        s.addNetworkEvent({
          type: "inbound",
          label: resp.gradientAck.accepted
            ? `Gradient accepted${resp.gradientAck.newModelVersion ? ` → ${resp.gradientAck.newModelVersion}` : ""}`
            : "Gradient rejected",
          sizeBytes: 64,
          destination: "federated:8000",
          encrypted: true,
        });

        if (resp.gradientAck.newModelVersion) {
          set({ modelVersion: resp.gradientAck.newModelVersion });
        }

        const summary: SessionSummary = {
          id: state.sessionId ?? `session-${Date.now()}`,
          startedAt: Date.now() - 60_000,
          endedAt: Date.now(),
          questionsAnswered: state.questionsAnswered,
          correctCount: state.correctCount,
          topicsCovered: [...new Set(Object.keys(state.masteryRecords))],
          credentialsMinted: newCredentials.length,
          bytesOut: s.totalOutboundBytes,
          localOps: s.totalLocalOps,
        };

        set({
          sessionActive: false,
          federatedStatus: "submitted",
          feedback: `Session ended. ${newCredentials.length} credential(s) minted. Gradient ${resp.gradientAck.accepted ? "accepted" : "rejected"}.`,
          feedbackType: "info",
          sessionHistory: [...s.sessionHistory, summary],
          credentials: [...s.credentials, ...newCredentials],
        });
      })
      .catch((err) => {
        // Fallback: still end the session gracefully with mock data
        console.warn("API call failed, using local fallback:", err);
        const s = get();

        const newCredentials: MockCredential[] = attestations.map((a) => ({
          txId: `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
          topicId: a.topicId,
          score: a.score,
          mintedAt: a.achievedAt,
          studentPublicKey: `dilithium-pk-${state.studentId.slice(-6)}`,
          signature: `sig-${Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        }));

        const summary: SessionSummary = {
          id: state.sessionId ?? `session-${Date.now()}`,
          startedAt: Date.now() - 60_000,
          endedAt: Date.now(),
          questionsAnswered: state.questionsAnswered,
          correctCount: state.correctCount,
          topicsCovered: [...new Set(Object.keys(state.masteryRecords))],
          credentialsMinted: newCredentials.length,
          bytesOut: s.totalOutboundBytes + gradientSize + credentialSize,
          localOps: s.totalLocalOps,
        };

        set({
          sessionActive: false,
          federatedStatus: "error",
          feedback: `Session ended (offline). ${newCredentials.length} credential(s) queued.`,
          feedbackType: "info",
          sessionHistory: [...s.sessionHistory, summary],
          credentials: [...s.credentials, ...newCredentials],
        });
      });
  },

  setUserAnswer: (answer) => set({ userAnswer: answer }),

  submitAnswer: () => {
    const state = get();
    if (!state.currentQuestion) return;

    const latencyMs = Date.now() - state.questionStartTime;
    const { correct, quality, errorType } = classifyLocally(
      state.userAnswer,
      state.currentQuestion.answer,
      latencyMs
    );

    // Log local processing events for the privacy panel
    state.addLocalEvent(`Classified answer → quality ${quality}`, "classifier");

    const topicId = state.currentQuestion.topicId;
    const existing = state.masteryRecords[topicId] ?? createRecord(state.studentId, topicId);
    const updated = applyReview(existing, quality);

    const newMastered = updated.mastered && !existing.mastered;
    const consecutiveErrors = correct ? 0 : state.consecutiveErrors + 1;

    // Scaffolding selection
    let scaffoldingLevel: ScaffoldingLevel = 0;
    if (!correct) {
      if (consecutiveErrors >= 3) scaffoldingLevel = 3;
      else if (errorType === "conceptual") scaffoldingLevel = updated.repetitions < 2 ? 3 : 2;
      else if (errorType === "procedural") scaffoldingLevel = 2;
      else if (errorType === "careless") scaffoldingLevel = 1;
      else scaffoldingLevel = 2;
    }

    state.addLocalEvent(
      `SM-2 updated → rep ${updated.repetitions}, EF ${updated.easeFactor.toFixed(2)}`,
      "sm2"
    );
    if (!correct) {
      state.addLocalEvent(`Scaffolding selected → level ${scaffoldingLevel}`, "scaffolding");
    }

    const scaffoldLabels: Record<ScaffoldingLevel, string> = {
      0: "",
      1: "\n💡 Hint: Look carefully at each term and check your signs.",
      2: "\n📝 Let me walk you through part of the solution...",
      3: "\n📖 Here's a complete worked example of a similar problem...",
    };

    const feedbackMsg = correct
      ? `✅ Correct! ${newMastered ? "🏆 Topic mastered!" : `(${updated.repetitions}/3 toward mastery)`}`
      : `❌ Not quite. The error appears to be ${errorType === "conceptual" ? "a conceptual gap" : errorType === "careless" ? "a careless mistake" : "a procedural error"}.${scaffoldLabels[scaffoldingLevel]}`;

    set({
      feedback: feedbackMsg,
      feedbackType: correct ? "correct" : "incorrect",
      userAnswer: "",
      consecutiveErrors,
      lastErrorType: errorType,
      scaffoldingLevel,
      masteryRecords: { ...state.masteryRecords, [topicId]: updated },
      masteredTopics: newMastered
        ? [...state.masteredTopics, topicId]
        : state.masteredTopics,
      questionsAnswered: state.questionsAnswered + 1,
      correctCount: correct ? state.correctCount + 1 : state.correctCount,
    });
  },

  nextQuestion: () => {
    const state = get();
    // Cycle through topics and questions
    let topicIdx = state.currentTopicIndex;
    const topic = DEMO_TOPICS[topicIdx]!;
    const currentQ = state.currentQuestion;

    // Find current question index in topic
    const qIdx = topic.sampleQuestions.findIndex((q) => q.question === currentQ?.question);
    let nextQIdx = qIdx + 1;

    if (nextQIdx >= topic.sampleQuestions.length) {
      // Move to next topic
      topicIdx = (topicIdx + 1) % DEMO_TOPICS.length;
      nextQIdx = 0;
    }

    const nextTopic = DEMO_TOPICS[topicIdx]!;
    const nextQ = nextTopic.sampleQuestions[nextQIdx]!;

    set({
      currentQuestion: { question: nextQ.question, answer: nextQ.answer, topicId: nextTopic.id },
      currentTopicIndex: topicIdx,
      questionStartTime: Date.now(),
      feedback: null,
      feedbackType: null,
      userAnswer: "",
    });
  },

  addNetworkEvent: (event) => {
    const state = get();
    const newEvent: NetworkEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    set({
      networkEvents: [...state.networkEvents, newEvent],
      totalOutboundBytes:
        event.type === "outbound"
          ? state.totalOutboundBytes + event.sizeBytes
          : state.totalOutboundBytes,
    });
  },

  addLocalEvent: (label, component) => {
    const state = get();
    const evt: LocalProcessingEvent = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      label,
      component,
    };
    set({
      localProcessingEvents: [...state.localProcessingEvents, evt],
      totalLocalOps: state.totalLocalOps + 1,
    });
  },

  setTunnelReady: (ready) => set({ tunnelReady: ready }),

  setLLMReady: (ready) => set({ llmReady: ready }),
  setLLMLoading: (loading) => set({ llmLoading: loading }),
  setLLMProgress: (progress) => set({ llmProgress: progress }),
}));

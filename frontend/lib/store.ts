import { create } from "zustand";
import type { ModelVersion } from "@mindvault/api-types";
import type { ErrorType, MasteryState, ScaffoldingStrategy } from "@mindvault/mastery-engine";

export interface CredentialItem {
  txHash: string;
  topic: string;
  masteryScore: number;
  mintedAt: string;
}

export interface WalletState {
  mnemonic: string;
  pseudoId: string;
  address: string;
  dilithiumPublicKey: string;
}

interface TutorStore {
  pseudoId: string;
  token: string;
  topic: string;
  attempts: number;
  lastErrorType: ErrorType | null;
  scaffolding: ScaffoldingStrategy | null;
  masteryState: MasteryState | null;
  topicStates: Record<string, MasteryState>;
  adaptiveFeedback: string;
  credentials: CredentialItem[];
  modelVersion: ModelVersion | null;
  wallet: WalletState | null;
  setAuth: (pseudoId: string, token: string) => void;
  setTopic: (topic: string) => void;
  setModelVersion: (version: ModelVersion) => void;
  setWallet: (wallet: WalletState) => void;
  setSessionSignal: (update: {
    topic?: string;
    attempts?: number;
    lastErrorType?: ErrorType | null;
    scaffolding?: ScaffoldingStrategy | null;
    masteryState?: MasteryState | null;
    adaptiveFeedback?: string;
  }) => void;
  addCredential: (credential: CredentialItem) => void;
}

export const useTutorStore = create<TutorStore>((set) => ({
  pseudoId: "",
  token: "",
  topic: "algebra",
  attempts: 0,
  lastErrorType: null,
  scaffolding: null,
  masteryState: null,
  topicStates: {},
  adaptiveFeedback: "",
  credentials: [],
  modelVersion: null,
  wallet: null,
  setAuth: (pseudoId, token) => set({ pseudoId, token }),
  setTopic: (topic) => set({ topic }),
  setModelVersion: (modelVersion) => set({ modelVersion }),
  setWallet: (wallet) => set({ wallet }),
  setSessionSignal: (update) =>
    set((state) => {
      const nextTopic = update.topic ?? state.topic;
      const nextMastery = update.masteryState ?? state.masteryState;
      const topicStates = nextMastery
        ? {
            ...state.topicStates,
            [nextTopic]: nextMastery
          }
        : state.topicStates;

      return {
        attempts: update.attempts ?? state.attempts,
        lastErrorType: update.lastErrorType ?? state.lastErrorType,
        scaffolding: update.scaffolding ?? state.scaffolding,
        masteryState: nextMastery,
        topicStates,
        adaptiveFeedback: update.adaptiveFeedback ?? state.adaptiveFeedback
      };
    }),
  addCredential: (credential) =>
    set((state) => ({
      credentials: [credential, ...state.credentials].slice(0, 20)
    }))
}));

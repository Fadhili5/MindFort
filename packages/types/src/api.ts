import type { GradientPayload, GradientAckResponse, GlobalModelUpdate } from "./gradient.js";
import type { MintCredentialRequest, MintCredentialResponse } from "./credential.js";
import type { MasteryAttestation } from "./mastery.js";

// ---------------------------------------------------------------------------
// Tutor API — Fastify backend
// ---------------------------------------------------------------------------

/** POST /api/session/end — called when a session ends on-device */
export interface EndSessionRequest {
  /** Pseudonymous student ID */
  studentId: string;
  sessionId: string;
  /** Attestations for any topics mastered this session */
  attestations: MasteryAttestation[];
  gradient: GradientPayload;
}

export interface EndSessionResponse {
  /** Credential minted for each attestation */
  credentials: MintCredentialResponse[];
  gradientAck: GradientAckResponse;
}

/** GET /api/model/latest — returns the current global model version */
export interface LatestModelResponse {
  model: GlobalModelUpdate;
}

/** POST /api/credential/mint — internal route, proxies to Abelian node */
export interface CredentialMintRequest extends MintCredentialRequest {}
export interface CredentialMintResponse extends MintCredentialResponse {}

// ---------------------------------------------------------------------------
// Federated Learning API — Python FastAPI service
// ---------------------------------------------------------------------------

/** POST /gradients — submit a gradient update */
export interface FedGradientRequest extends GradientPayload {}
export interface FedGradientResponse extends GradientAckResponse {}

/** GET /model — fetch the latest global model */
export interface FedModelResponse extends GlobalModelUpdate {}

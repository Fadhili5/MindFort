/**
 * Gradient payload sent to the federated learning server.
 * Contains aggregated model updates — never recoverable to individuals.
 */
export interface GradientPayload {
  /** Opaque gradient data — Float32Array serialised to base64 */
  gradients: string;
  /** Number of local samples contributing to this update */
  sampleCount: number;
  /** Model version this update was computed against */
  modelVersion: string;
  /** Unix timestamp (ms) */
  timestamp: number;
}

/**
 * Response from the federated server after accepting a gradient update.
 */
export interface GradientAckResponse {
  accepted: boolean;
  /** Updated global model version after aggregation, if available */
  newModelVersion: string | null;
  /** Current number of gradients in the aggregation buffer */
  bufferSize?: number;
  /** Number of gradients required before aggregation triggers */
  bufferThreshold?: number;
}

/**
 * Global model weights broadcast from the federated server.
 * Downloaded by clients to update their local model.
 */
export interface GlobalModelUpdate {
  modelVersion: string;
  /** Serialised weights — base64 encoded */
  weights: string;
  publishedAt: number;
}

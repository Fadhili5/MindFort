/**
 * Local gradient generation.
 *
 * Converts client-side mastery deltas into an opaque gradient payload
 * suitable for federated aggregation. The gradient is a Float32Array
 * of differential privacy–compatible values — one per topic slot.
 *
 * No raw answers, timing data, or identifying information leaves the device.
 */

import type { GradientPayload } from "@mindvault/types";
import type { MasteryRecord } from "@mindvault/types";

/** Fixed number of topic slots for gradient vector alignment */
const GRADIENT_VECTOR_SIZE = 16;

/**
 * Derive a gradient vector from local mastery changes observed this session.
 *
 * Each slot represents a topic dimension. For topics the student practised,
 * the gradient value encodes the smoothed ease-factor delta scaled by
 * repetition count (a proxy for local model improvement). Unvisited slots
 * remain zero — they contribute nothing during FedAvg aggregation.
 */
function deriveGradientVector(
  records: Record<string, MasteryRecord>,
  topicIds: string[],
): Float32Array {
  const vec = new Float32Array(GRADIENT_VECTOR_SIZE);

  topicIds.forEach((topicId, idx) => {
    const r = records[topicId];
    if (!r || idx >= GRADIENT_VECTOR_SIZE) return;

    // Signal = ease-factor delta from baseline (2.5) weighted by repetitions
    const efDelta = r.easeFactor - 2.5;
    const repWeight = Math.min(r.repetitions, 5) / 5;
    vec[idx] = efDelta * repWeight;
  });

  return vec;
}

/**
 * Build a full GradientPayload ready for submission to the backend.
 */
export function buildGradientPayload(
  records: Record<string, MasteryRecord>,
  topicIds: string[],
  questionsAnswered: number,
  modelVersion: string = "v0.0.1",
): GradientPayload {
  const vec = deriveGradientVector(records, topicIds);

  // Encode Float32Array → base64
  const bytes = new Uint8Array(vec.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const gradients = btoa(binary);

  return {
    gradients,
    sampleCount: questionsAnswered,
    modelVersion,
    timestamp: Date.now(),
  };
}

/**
 * Federated learning server client.
 *
 * Forwards gradient updates from devices to the Python FastAPI aggregation
 * server. Also fetches the latest global model weights for devices to download.
 *
 * Gradient payloads are aggregated server-side via FedAvg before any weights
 * are broadcast — individual contributions are not recoverable.
 */

import type {
  GradientPayload,
  GradientAckResponse,
  GlobalModelUpdate,
} from "@mindvault/types";

export class FederatedClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Submit a gradient update from one device.
   * The payload is forwarded as-is; the federated server handles aggregation.
   */
  async submitGradient(
    payload: GradientPayload
  ): Promise<GradientAckResponse> {
    const resp = await fetch(`${this.baseUrl}/gradients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      // Non-fatal — log and return a rejected ack rather than crashing the
      // session-end flow. The student's credential still gets minted.
      console.error(
        `FederatedClient: gradient submission failed (${resp.status})`
      );
      return { accepted: false, newModelVersion: null };
    }

    return resp.json() as Promise<GradientAckResponse>;
  }

  /**
   * Fetch the current global model version from the aggregation server.
   */
  async getLatestModel(): Promise<GlobalModelUpdate> {
    const resp = await fetch(`${this.baseUrl}/model`);

    if (!resp.ok) {
      throw new Error(
        `FederatedClient: could not fetch model (${resp.status})`
      );
    }

    return resp.json() as Promise<GlobalModelUpdate>;
  }
}

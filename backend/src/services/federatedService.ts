import {
  federatedGradientSchema,
  modelVersionSchema,
  weightsSchema,
  type FederatedGradient,
  type GlobalWeights,
  type ModelVersion
} from "@mindvault/api-types";
import type { AppConfig } from "../config.js";
import { tunneledFetch } from "./lightwayClient.js";

export async function forwardGradient(config: AppConfig, gradient: FederatedGradient): Promise<{ accepted: boolean; round: number }> {
  const parsed = federatedGradientSchema.parse(gradient);
  const response = await tunneledFetch(config, {
    method: "POST",
    url: `${config.FEDERATED_URL}/aggregate`,
    headers: {
      "content-type": "application/json"
    },
    body: parsed
  });

  if (!response.ok) {
    throw new Error(`Federated aggregate failed with ${response.status}`);
  }

  return (await response.json()) as { accepted: boolean; round: number };
}

export async function getGlobalWeights(config: AppConfig): Promise<GlobalWeights> {
  const response = await tunneledFetch(config, {
    method: "GET",
    url: `${config.FEDERATED_URL}/weights`
  });

  if (!response.ok) {
    throw new Error(`Federated weight fetch failed with ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return weightsSchema.parse(payload);
}

export async function getModelVersion(config: AppConfig): Promise<ModelVersion> {
  const response = await tunneledFetch(config, {
    method: "GET",
    url: `${config.FEDERATED_URL}/model/version`
  });

  if (!response.ok) {
    throw new Error(`Federated model version fetch failed with ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return modelVersionSchema.parse(payload);
}

import {
  credentialMintSchema,
  llmResponseSchema,
  modelVersionSchema,
  type CredentialMintRequest,
  type FederatedGradient,
  type GlobalWeights,
  type LlmRequest,
  type ModelVersion
} from "@mindvault/api-types";
import { appConfig } from "./config";

interface AuthResponse {
  token: string;
  pseudoId: string;
}

function getAuthHeaders(token: string): HeadersInit {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${token}`
  };
}

export async function loginPseudoUser(pseudoId: string): Promise<AuthResponse> {
  const response = await fetch(`${appConfig.apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pseudoId })
  });
  if (!response.ok) {
    throw new Error("Failed to login pseudonymous user.");
  }
  return (await response.json()) as AuthResponse;
}

export async function proxyGenerateLlm(token: string, payload: LlmRequest): Promise<string> {
  const response = await fetch(`${appConfig.apiBaseUrl}/api/llm`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Proxy LLM call failed with ${response.status}`);
  }

  const parsed = llmResponseSchema.parse(await response.json());
  return parsed.content;
}

export async function submitGradients(token: string, gradient: FederatedGradient): Promise<void> {
  const response = await fetch(`${appConfig.apiBaseUrl}/api/gradients`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(gradient)
  });

  if (!response.ok) {
    throw new Error("Failed to submit gradients.");
  }
}

export async function fetchWeights(token: string): Promise<GlobalWeights> {
  const response = await fetch(`${appConfig.apiBaseUrl}/api/weights`, {
    method: "GET",
    headers: getAuthHeaders(token)
  });

  if (!response.ok) {
    throw new Error("Failed to fetch global weights.");
  }

  return (await response.json()) as GlobalWeights;
}

export async function mintCredential(token: string, request: CredentialMintRequest): Promise<{ txHash: string; idempotent?: boolean }> {
  const parsed = credentialMintSchema.parse(request);
  const response = await fetch(`${appConfig.apiBaseUrl}/api/credential/mint`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(parsed)
  });

  if (!response.ok) {
    throw new Error("Credential mint failed.");
  }

  return (await response.json()) as { txHash: string; idempotent?: boolean };
}

export async function fetchModelVersion(token: string): Promise<ModelVersion> {
  const response = await fetch(`${appConfig.apiBaseUrl}/api/model/version`, {
    method: "GET",
    headers: getAuthHeaders(token)
  });

  if (!response.ok) {
    throw new Error("Failed to fetch model version.");
  }

  const payload = (await response.json()) as unknown;
  return modelVersionSchema.parse(payload);
}

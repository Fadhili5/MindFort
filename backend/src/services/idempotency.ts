import { createHash } from "node:crypto";
import type { CredentialMintRequest } from "@mindvault/api-types";

interface MintCacheEntry {
  txHash: string;
  createdAt: number;
  signedPayload: {
    signatureAlgorithm: "CRYSTALS-Dilithium-Variant";
    publicKeyHint: string;
  };
}

const mintCache = new Map<string, MintCacheEntry>();
const TTL_MS = 24 * 60 * 60 * 1000;

export interface CachedMintResult {
  txHash: string;
  signedPayload: {
    signatureAlgorithm: "CRYSTALS-Dilithium-Variant";
    publicKeyHint: string;
  };
}

function keyOf(payload: CredentialMintRequest): string {
  const keyMaterial = `${payload.pseudoId}|${payload.walletAddress}|${payload.topic}|${payload.timestamp}|${payload.masteryScore}|${payload.attestationVersion}`;
  return createHash("sha256").update(keyMaterial).digest("hex");
}

function sweep(): void {
  const now = Date.now();
  for (const [key, value] of mintCache.entries()) {
    if (now - value.createdAt > TTL_MS) {
      mintCache.delete(key);
    }
  }
}

export function getCachedMint(payload: CredentialMintRequest): CachedMintResult | null {
  sweep();
  const cached = mintCache.get(keyOf(payload));
  if (!cached) {
    return null;
  }
  return {
    txHash: cached.txHash,
    signedPayload: cached.signedPayload
  };
}

export function cacheMint(payload: CredentialMintRequest, result: Omit<MintCacheEntry, "createdAt">): void {
  sweep();
  mintCache.set(keyOf(payload), {
    ...result,
    createdAt: Date.now()
  });
}

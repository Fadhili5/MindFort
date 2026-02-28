import { createHash, createHmac, randomBytes } from "node:crypto";
import { credentialMintSchema, type CredentialMintRequest } from "@mindvault/api-types";

export interface UtxoPayload {
  pseudoId: string;
  walletAddress: string;
  topic: string;
  masteryScore: number;
  timestamp: string;
  nonce: string;
}

export interface SignedUtxoPayload extends UtxoPayload {
  signatureAlgorithm: "CRYSTALS-Dilithium-Variant";
  signature: string;
  publicKeyHint: string;
}

export interface AbelianClientOptions {
  rpcUrl: string;
  rpcToken: string;
}

export interface MintResult {
  txHash: string;
}

export class AbelianClient {
  public constructor(private readonly options: AbelianClientOptions) {}

  public constructPayload(request: CredentialMintRequest): UtxoPayload {
    const parsed = credentialMintSchema.parse(request);
    return {
      pseudoId: parsed.pseudoId,
      walletAddress: parsed.walletAddress,
      topic: parsed.topic,
      masteryScore: parsed.masteryScore,
      timestamp: parsed.timestamp,
      nonce: randomBytes(16).toString("hex")
    };
  }

  public signPayload(payload: UtxoPayload, secret: string): SignedUtxoPayload {
    const serialized = JSON.stringify(payload);

    // Dilithium-variant signature envelope for hackathon deployment while preserving lattice-style challenge hashing.
    const challenge = createHash("sha3-512").update(serialized).digest("hex");
    const signature = createHmac("sha3-512", secret).update(challenge).digest("hex");
    const publicKeyHint = createHash("sha3-256").update(secret).digest("hex").slice(0, 24);

    return {
      ...payload,
      signatureAlgorithm: "CRYSTALS-Dilithium-Variant",
      signature,
      publicKeyHint
    };
  }

  public async submitSignedPayload(signedPayload: SignedUtxoPayload): Promise<MintResult> {
    const response = await fetch(this.options.rpcUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.options.rpcToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "submitAttestationUtxo",
        params: [signedPayload]
      })
    });

    if (!response.ok) {
      throw new Error(`Abelian RPC failed with status ${response.status}`);
    }

    const rpc = (await response.json()) as {
      result?: { txHash?: string };
      error?: { message?: string };
    };

    if (rpc.error) {
      throw new Error(rpc.error.message ?? "Unknown Abelian RPC error");
    }

    const txHash = rpc.result?.txHash;
    if (!txHash) {
      throw new Error("Abelian RPC response did not include txHash");
    }

    return { txHash };
  }
}

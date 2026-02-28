import { AbelianClient } from "@mindvault/abelian-client";
import { credentialMintSchema, type CredentialMintRequest } from "@mindvault/api-types";
import type { AppConfig } from "../config.js";

export interface MintCredentialResult {
  txHash: string;
  signedPayload: {
    signatureAlgorithm: "CRYSTALS-Dilithium-Variant";
    publicKeyHint: string;
  };
  idempotent?: boolean;
}

export async function mintCredential(config: AppConfig, payload: CredentialMintRequest): Promise<MintCredentialResult> {
  const parsed = credentialMintSchema.parse(payload);
  const client = new AbelianClient({
    rpcUrl: config.ABELIAN_RPC_URL,
    rpcToken: config.ABELIAN_RPC_TOKEN
  });

  const utxoPayload = client.constructPayload(parsed);
  const signed = client.signPayload(utxoPayload, config.ABELIAN_RPC_TOKEN);
  const { txHash } = await client.submitSignedPayload(signed);

  return {
    txHash,
    signedPayload: {
      signatureAlgorithm: signed.signatureAlgorithm,
      publicKeyHint: signed.publicKeyHint
    }
  };
}

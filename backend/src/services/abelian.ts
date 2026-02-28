/**
 * Abelian node client.
 *
 * Mints quantum-resistant UTXO credentials on the Abelian QDay chain.
 * Each credential is a Dilithium-signed attestation owned by the student's wallet.
 *
 * NOTE: This is a typed stub — the full HTTP integration is wired in Step 11
 * (Abelian integration). The interface is stable so all callers compile now.
 */

import type {
  MintCredentialRequest,
  MintCredentialResponse,
} from "@mindvault/types";
import type { LightwayTunnel } from "@mindvault/lightway";

const PASSTHROUGH_TUNNEL: LightwayTunnel = {
  isReady: true,
  send: (url, init) => fetch(url, init),
  close: () => {},
};

export class AbelianClient {
  private readonly baseUrl: string;
  private readonly privateKey: string;
  private readonly tunnel: LightwayTunnel;

  constructor(baseUrl: string, dilithiumPrivateKey: string, tunnel: LightwayTunnel = PASSTHROUGH_TUNNEL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.privateKey = dilithiumPrivateKey;
    this.tunnel = tunnel;
  }

  /**
   * Mint a single mastery attestation as a UTXO on the Abelian chain.
   *
   * Production flow (Step 11):
   *   1. Sign the attestation payload with the backend Dilithium key
   *   2. POST to the Abelian node's credential-mint RPC endpoint
   *   3. Return the transaction ID and signature
   *
   * Returns a stub response until Step 11 wires up the real node.
   */
  async mintCredential(
    req: MintCredentialRequest
  ): Promise<MintCredentialResponse> {
    if (this.privateKey === "stub") {
      // Dev stub — returns a deterministic fake txId
      return {
        txId: `stub-tx-${req.attestation.topicId}-${req.attestation.achievedAt}`,
        signature: "stub-dilithium-signature",
      };
    }

    const resp = await this.tunnel.send(`${this.baseUrl}/api/credential/mint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!resp.ok) {
      throw new Error(
        `AbelianClient: mint failed (${resp.status}) — ${await resp.text()}`
      );
    }

    return resp.json() as Promise<MintCredentialResponse>;
  }

  /**
   * Mint credentials for multiple attestations in parallel.
   */
  async mintAll(
    requests: MintCredentialRequest[]
  ): Promise<MintCredentialResponse[]> {
    return Promise.all(requests.map((r) => this.mintCredential(r)));
  }
}

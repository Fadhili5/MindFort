/**
 * POST /api/credential/mint
 *
 * Internal route — mints a single credential directly.
 * Primarily used for testing the Abelian integration without a full session.
 * Should not be publicly exposed in production.
 */

import type { FastifyInstance } from "fastify";
import type { CredentialMintRequest, CredentialMintResponse } from "@mindvault/types";
import type { AbelianClient } from "../services/abelian.js";

export function registerCredentialRoutes(
  app: FastifyInstance,
  deps: { abelian: AbelianClient }
): void {
  app.post<{ Body: CredentialMintRequest; Reply: CredentialMintResponse }>(
    "/api/credential/mint",
    {
      schema: {
        body: {
          type: "object",
          required: ["studentPublicKey", "attestation"],
          properties: {
            studentPublicKey: { type: "string" },
            attestation: { type: "object" },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await deps.abelian.mintCredential(request.body);
      return reply.send(result);
    }
  );
}

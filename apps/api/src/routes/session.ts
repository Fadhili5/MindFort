/**
 * POST /api/session/end
 *
 * Called by the client when a tutoring session ends on-device.
 * The server:
 *   1. Mints an Abelian UTXO credential for each mastered topic
 *   2. Forwards the gradient payload to the federated learning server
 *   3. Returns minted credentials + gradient acknowledgement
 *
 * No raw session data (answers, hesitations) is accepted or stored here.
 */

import type { FastifyInstance } from "fastify";
import type { EndSessionRequest, EndSessionResponse } from "@mindvault/types";
import type { AbelianClient } from "../services/abelian.js";
import type { FederatedClient } from "../services/federated.js";

export function registerSessionRoutes(
  app: FastifyInstance,
  deps: { abelian: AbelianClient; federated: FederatedClient }
): void {
  app.post<{ Body: EndSessionRequest; Reply: EndSessionResponse }>(
    "/api/session/end",
    {
      schema: {
        body: {
          type: "object",
          required: ["studentId", "sessionId", "attestations", "gradient"],
          properties: {
            studentId: { type: "string" },
            sessionId: { type: "string" },
            attestations: { type: "array" },
            gradient: { type: "object" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              credentials: { type: "array" },
              gradientAck: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { studentId, attestations, gradient } = request.body;

      // Run credential minting and gradient forwarding in parallel.
      // Gradient failure is non-fatal (student still gets credentials).
      const [credentials, gradientAck] = await Promise.all([
        deps.abelian.mintAll(
          attestations.map((a) => ({
            studentPublicKey: studentId, // pseudonymous; real pubkey in Step 11
            attestation: {
              pseudonymousId: studentId,
              topicId: a.topicId,
              score: a.score,
              achievedAt: a.achievedAt,
            },
          }))
        ),
        deps.federated.submitGradient(gradient).catch((err: unknown) => {
          app.log.warn({ err }, "Gradient submission failed — non-fatal");
          return { accepted: false, newModelVersion: null } as const;
        }),
      ]);

      return reply.send({ credentials, gradientAck });
    }
  );
}

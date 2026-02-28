/**
 * GET /api/model/latest
 *
 * Returns the current global model version from the federated server.
 * Clients download this after a session to update their local Phi-3 weights.
 */

import type { FastifyInstance } from "fastify";
import type { LatestModelResponse } from "@mindvault/types";
import type { FederatedClient } from "../services/federated.js";

export function registerModelRoutes(
  app: FastifyInstance,
  deps: { federated: FederatedClient }
): void {
  app.get<{ Reply: LatestModelResponse }>(
    "/api/model/latest",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              model: { type: "object" },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        const model = await deps.federated.getLatestModel();
        return reply.send({ model });
      } catch (err) {
        // Federated server not yet running — return a stub so the API stays usable
        app.log.warn({ err }, "Federated server unavailable — returning stub model");
        return reply.send({
          model: {
            modelVersion: "unavailable",
            weights: "",
            publishedAt: 0,
          },
        });
      }
    }
  );
}

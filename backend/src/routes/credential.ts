import type { FastifyInstance } from "fastify";
import { credentialMintSchema } from "@mindvault/api-types";
import type { AppConfig } from "../config.js";
import { mintCredential } from "../services/credentialService.js";
import { cacheMint, getCachedMint } from "../services/idempotency.js";

export async function registerCredentialRoutes(app: FastifyInstance, config: AppConfig): Promise<void> {
  app.post("/api/credential/mint", { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = credentialMintSchema.parse(request.body);

    if (body.pseudoId !== request.auth.pseudoId) {
      return reply.status(403).send({ message: "Pseudo ID mismatch." });
    }

    const cached = getCachedMint(body);
    if (cached) {
      return reply.status(200).send({ ...cached, idempotent: true });
    }

    const result = await mintCredential(config, body);
    cacheMint(body, result);
    return reply.status(201).send(result);
  });
}

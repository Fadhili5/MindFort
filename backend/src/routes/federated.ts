import type { FastifyInstance } from "fastify";
import { federatedGradientSchema } from "@mindvault/api-types";
import type { AppConfig } from "../config.js";
import { forwardGradient, getGlobalWeights } from "../services/federatedService.js";
import { gradientGuard } from "../middleware/gradientGuard.js";

export async function registerFederatedRoutes(app: FastifyInstance, config: AppConfig): Promise<void> {
  app.post("/api/gradients", { preHandler: [app.authenticate, gradientGuard] }, async (request, reply) => {
    if (request.gradientDuplicate) {
      return reply.status(200).send({ accepted: true, duplicate: true });
    }

    const gradient = federatedGradientSchema.parse(request.body);

    if (gradient.pseudoId !== request.auth.pseudoId) {
      return reply.status(403).send({ message: "Pseudo ID mismatch." });
    }

    const response = await forwardGradient(config, gradient);
    return reply.status(202).send(response);
  });

  app.get("/api/weights", { preHandler: [app.authenticate] }, async (_request, reply) => {
    const weights = await getGlobalWeights(config);
    return reply.send(weights);
  });
}

import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";
import { getModelVersion } from "../services/federatedService.js";

export async function registerModelRoutes(app: FastifyInstance, config: AppConfig): Promise<void> {
  app.get("/api/model/version", { preHandler: [app.authenticate] }, async (_request, reply) => {
    const modelVersion = await getModelVersion(config);
    return reply.send(modelVersion);
  });
}

import type { FastifyInstance } from "fastify";
import { llmRequestSchema } from "@mindvault/api-types";
import type { AppConfig } from "../config.js";
import { proxyToPhi3 } from "../services/llmService.js";

export async function registerLlmRoutes(app: FastifyInstance, config: AppConfig): Promise<void> {
  app.post("/api/llm", { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = llmRequestSchema.parse(request.body);
    const result = await proxyToPhi3(config, body);
    return reply.send(result);
  });
}

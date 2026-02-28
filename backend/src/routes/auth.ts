import type { FastifyInstance } from "fastify";
import { pseudoIdSchema } from "@mindvault/api-types";
import { z } from "zod";

const loginBodySchema = z.object({
  pseudoId: pseudoIdSchema
});

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/auth/login", async (request, reply) => {
    const body = loginBodySchema.parse(request.body);
    const token = await reply.jwtSign({ pseudoId: body.pseudoId });

    return {
      token,
      pseudoId: body.pseudoId
    };
  });
}

import type { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import { jwtPayloadSchema } from "@mindvault/api-types";
import type { AppConfig } from "../config.js";

export async function registerAuthPlugin(app: FastifyInstance, config: AppConfig): Promise<void> {
  await app.register(fastifyJwt, {
    secret: config.JWT_SECRET
  });

  app.decorate("authenticate", async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
      const parsed = jwtPayloadSchema.parse(request.user);
      request.auth = { pseudoId: parsed.pseudoId };
    } catch {
      return reply.status(401).send({ message: "Unauthorized" });
    }
  });
}

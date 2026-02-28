import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { AppConfig } from "../config.js";

export async function registerSecurityPlugins(app: FastifyInstance, config: AppConfig): Promise<void> {
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false
  });

  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    keyGenerator: (request) => request.ip
  });
}

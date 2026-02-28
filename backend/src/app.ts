import Fastify, { type FastifyInstance } from "fastify";
import { loadConfig, type AppConfig } from "./config.js";
import { registerSecurityPlugins } from "./plugins/security.js";
import { registerAuthPlugin } from "./plugins/auth.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerLlmRoutes } from "./routes/llm.js";
import { registerCredentialRoutes } from "./routes/credential.js";
import { registerFederatedRoutes } from "./routes/federated.js";
import { registerModelRoutes } from "./routes/model.js";

export interface AppContext {
  app: FastifyInstance;
  config: AppConfig;
}

export async function buildApp(): Promise<AppContext> {
  const config = loadConfig(process.env);
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  await registerSecurityPlugins(app, config);
  await registerAuthPlugin(app, config);
  await registerHealthRoute(app);
  await registerAuthRoutes(app);
  await registerLlmRoutes(app, config);
  await registerCredentialRoutes(app, config);
  await registerFederatedRoutes(app, config);
  await registerModelRoutes(app, config);

  app.setErrorHandler((error, _request, reply) => {
    app.log.error({ err: error }, "Unhandled application error");
    const message = error instanceof Error ? error.message : "Unhandled application error";
    return reply.status(400).send({ message });
  });

  return { app, config };
}

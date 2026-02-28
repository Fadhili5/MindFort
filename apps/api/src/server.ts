import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";

import type { Config } from "./config.js";
import { AbelianClient } from "./services/abelian.js";
import { FederatedClient } from "./services/federated.js";
import { registerSessionRoutes } from "./routes/session.js";
import { registerModelRoutes } from "./routes/model.js";
import { registerCredentialRoutes } from "./routes/credential.js";

export async function buildServer(config: Config) {
  const app = Fastify({
    logger:
      config.NODE_ENV === "development"
        ? { level: "info", transport: { target: "pino-pretty" } }
        : { level: "warn" },
  });

  // ---------------------------------------------------------------------------
  // Plugins
  // ---------------------------------------------------------------------------
  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(",").map((o) => o.trim()),
    methods: ["GET", "POST"],
  });

  await app.register(sensible);

  // ---------------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------------
  const abelian = new AbelianClient(
    config.ABELIAN_NODE_URL,
    config.BACKEND_DILITHIUM_PRIVATE_KEY
  );

  const federated = new FederatedClient(config.FED_SERVER_URL);

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------
  registerSessionRoutes(app, { abelian, federated });
  registerModelRoutes(app, { federated });
  registerCredentialRoutes(app, { abelian });

  // Health check
  app.get("/health", async () => ({ status: "ok", ts: Date.now() }));

  // API index — shown when opening in browser
  app.get("/", async () => ({
    name: "MindVault API",
    version: "0.1.0",
    endpoints: [
      { method: "GET",  path: "/health",               description: "Health check" },
      { method: "GET",  path: "/api/model/latest",     description: "Latest global model from federated server" },
      { method: "POST", path: "/api/session/end",      description: "End session: mint credentials + submit gradient" },
      { method: "POST", path: "/api/credential/mint",  description: "Mint a single Abelian UTXO credential" },
    ],
  }));

  return app;
}

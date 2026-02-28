import Fastify from "fastify";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { loadNativeBridge } from "./native.js";

const proxySchema = z.object({
  method: z.enum(["GET", "POST"]),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional()
});

async function start(): Promise<void> {
  const config = loadConfig(process.env);
  const app = Fastify({ logger: true });

  let tunnelReady = false;
  try {
    const native = loadNativeBridge();
    tunnelReady = native.initialize(
      config.LIGHTWAY_TOKEN,
      config.LIGHTWAY_REMOTE_HOST,
      config.LIGHTWAY_REMOTE_PORT,
      config.LIGHTWAY_ENABLE_MLKEM
    );
    tunnelReady = tunnelReady && native.isReady();
  } catch (error) {
    app.log.warn({ err: error }, "Lightway native bridge failed. Falling back when enabled.");
    tunnelReady = false;
  }

  app.get("/health", async () => ({ ok: true, tunnelReady }));

  app.post("/proxy", async (request, reply) => {
    const token = request.headers["x-lightway-token"];
    if (token !== config.LIGHTWAY_TOKEN) {
      return reply.status(401).send({ message: "Invalid Lightway token" });
    }

    const payload = proxySchema.parse(request.body);

    if (!tunnelReady && !config.LIGHTWAY_FALLBACK_DIRECT) {
      return reply.status(503).send({ message: "Lightway tunnel unavailable" });
    }

    const outbound = await fetch(payload.url, {
      method: payload.method,
      headers: payload.headers,
      body: payload.body ? JSON.stringify(payload.body) : undefined
    });

    const text = await outbound.text();
    let parsedBody: unknown = text;
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = text;
    }

    const responseHeaders: Record<string, string> = {};
    outbound.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return reply.send({
      status: outbound.status,
      headers: responseHeaders,
      body: parsedBody,
      tunnelMode: tunnelReady ? "dtls12-mlkem" : "fallback-direct"
    });
  });

  await app.listen({ port: config.LIGHTWAY_PORT, host: "0.0.0.0" });
}

start().catch((error: unknown) => {
  console.error("Failed to start Lightway service", error);
  process.exit(1);
});

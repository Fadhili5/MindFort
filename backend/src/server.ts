import { buildApp } from "./app.js";

async function start(): Promise<void> {
  const { app, config } = await buildApp();
  await app.listen({
    port: config.PORT,
    host: config.HOST
  });
}

start().catch((error: unknown) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});

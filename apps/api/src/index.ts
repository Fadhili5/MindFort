import { loadConfig } from "./config.js";
import { buildServer } from "./server.js";

const config = loadConfig();
const app = await buildServer(config);

try {
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(`MindVault API → http://localhost:${config.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

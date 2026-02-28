import { z } from "zod";

const schema = z.object({
  LIGHTWAY_PORT: z.coerce.number().int().positive().default(8090),
  LIGHTWAY_TOKEN: z.string().min(8),
  LIGHTWAY_REMOTE_HOST: z.string().min(1),
  LIGHTWAY_REMOTE_PORT: z.coerce.number().int().positive().default(443),
  LIGHTWAY_ENABLE_MLKEM: z.coerce.boolean().default(true),
  LIGHTWAY_FALLBACK_DIRECT: z.coerce.boolean().default(true)
});

export type LightwayConfig = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv): LightwayConfig {
  return schema.parse(env);
}

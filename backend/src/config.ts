import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  JWT_SECRET: z.string().min(16),
  ABELIAN_RPC_URL: z.string().url(),
  ABELIAN_RPC_TOKEN: z.string().min(8),
  FEDERATED_URL: z.string().url(),
  LLAMA_CPP_URL: z.string().url(),
  LLAMA_MODEL: z.string().default("phi-3-mini-4k-instruct-q4_k_m.gguf"),
  LLAMA_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  LLAMA_MAX_TOKENS: z.coerce.number().int().positive().default(300),
  LLAMA_TOP_P: z.coerce.number().min(0).max(1).default(0.9),
  LLAMA_REPEAT_PENALTY: z.coerce.number().min(1).max(2).default(1.1),
  LLAMA_SEED: z.coerce.number().int().nonnegative().default(42),
  LIGHTWAY_PROXY_URL: z.string().url(),
  LIGHTWAY_TOKEN: z.string().min(8).optional(),
  DEMO_MODE: z.coerce.boolean().default(false),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW: z.string().default("1 minute")
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  return envSchema.parse(env);
}

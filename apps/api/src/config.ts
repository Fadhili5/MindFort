import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),

  /** URL of the locally running Abelian QDay node */
  ABELIAN_NODE_URL: z
    .string()
    .url()
    .default("http://localhost:8732"),

  /** URL of the Python federated learning server */
  FED_SERVER_URL: z
    .string()
    .url()
    .default("http://localhost:8000"),

  /**
   * Backend's Dilithium private key (hex-encoded).
   * Used to sign mastery attestations before minting to Abelian.
   * Populated in Step 11 (Abelian integration).
   */
  BACKEND_DILITHIUM_PRIVATE_KEY: z.string().default("stub"),

  /** Lightway DTLS tunnel settings */
  LIGHTWAY_SERVER_IP: z.string().default("127.0.0.1"),
  LIGHTWAY_PORT:      z.coerce.number().default(443),
  LIGHTWAY_PSK:       z.string().default("stub-psk"),
  LIGHTWAY_MODE:      z.enum(["stub", "wasm"]).default("stub"),

  /** Comma-separated allowed CORS origins */
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = schema.safeParse(env);
  if (!result.success) {
    console.error("Invalid environment configuration:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

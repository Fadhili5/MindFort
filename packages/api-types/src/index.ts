import { z } from "zod";

export const pseudoIdSchema = z.string().min(6).max(64).regex(/^[a-zA-Z0-9_-]+$/);

export const attemptSchema = z.object({
  topic: z.string().min(1),
  promptId: z.string().min(1),
  answer: z.string().min(1),
  expected: z.string().min(1),
  responseTimeMs: z.number().int().nonnegative(),
  hintsUsed: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1)
});

export const attemptResultSchema = z.object({
  correct: z.boolean(),
  score: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  errorNotes: z.string().optional()
});

export const credentialMintSchema = z.object({
  pseudoId: pseudoIdSchema,
  walletAddress: z.string().min(16).max(128),
  topic: z.string().min(1),
  masteryScore: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  attestationVersion: z.literal("dilithium-v1")
}).strict();

export const gradientVectorSchema = z.object({
  layer: z.string().min(1),
  values: z.array(z.number().finite())
});

export const federatedGradientSchema = z.object({
  pseudoId: pseudoIdSchema,
  round: z.number().int().positive(),
  sampleCount: z.number().int().positive(),
  gradients: z.array(gradientVectorSchema).min(1)
}).strict().superRefine(({ gradients }, ctx) => {
  const includesRawSignal = gradients.some((g) => /answer|prompt|session|raw|text/i.test(g.layer));
  if (includesRawSignal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Gradient payload must not include raw session signals."
    });
  }
});

export const weightsSchema = z.object({
  round: z.number().int().nonnegative(),
  weights: z.array(gradientVectorSchema)
});

export const llmRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().min(1).default("phi-3-mini-4k-instruct-q4_k_m.gguf"),
  temperature: z.number().min(0).max(2).default(0.2),
  topP: z.number().min(0).max(1).default(0.9),
  repeatPenalty: z.number().min(1).max(2).default(1.1),
  maxTokens: z.number().int().positive().max(1024).default(300),
  seed: z.number().int().nonnegative().default(42),
  stream: z.boolean().default(false)
}).strict();

export const llmResponseSchema = z.object({
  content: z.string().min(1)
});

export const jwtPayloadSchema = z.object({
  pseudoId: pseudoIdSchema,
  iat: z.number().optional(),
  exp: z.number().optional()
});

export const modelVersionSchema = z.object({
  modelVersion: z.string().min(1),
  lastAggregatedAt: z.string().datetime().nullable(),
  totalClients: z.number().int().nonnegative()
}).strict();

export type Attempt = z.infer<typeof attemptSchema>;
export type AttemptResult = z.infer<typeof attemptResultSchema>;
export type CredentialMintRequest = z.infer<typeof credentialMintSchema>;
export type FederatedGradient = z.infer<typeof federatedGradientSchema>;
export type GlobalWeights = z.infer<typeof weightsSchema>;
export type LlmRequest = z.infer<typeof llmRequestSchema>;
export type LlmResponse = z.infer<typeof llmResponseSchema>;
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
export type ModelVersion = z.infer<typeof modelVersionSchema>;

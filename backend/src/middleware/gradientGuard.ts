import { createHash } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { federatedGradientSchema, type FederatedGradient } from "@mindvault/api-types";

const MAX_GRADIENTS = 10_000;
const MAX_PAYLOAD_BYTES = 200 * 1024;
const duplicateGradientHashes = new Set<string>();

function gradientHash(payload: FederatedGradient): string {
  const canonical = JSON.stringify(payload);
  return createHash("sha256").update(canonical).digest("hex");
}

export async function gradientGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const contentLengthHeader = request.headers["content-length"];
  const contentLength = typeof contentLengthHeader === "string"
    ? Number(contentLengthHeader)
    : Number.NaN;

  if (Number.isFinite(contentLength) && contentLength > MAX_PAYLOAD_BYTES) {
    request.log.warn({ contentLength }, "Gradient anomaly: payload too large");
    void reply.status(413).send({ message: "Gradient payload exceeds 200KB" });
    return;
  }

  const parsedResult = federatedGradientSchema.safeParse(request.body);
  if (!parsedResult.success) {
    request.log.warn({ issues: parsedResult.error.issues }, "Gradient anomaly: schema validation failed");
    void reply.status(400).send({
      message: "Invalid gradient payload",
      issues: parsedResult.error.issues
    });
    return;
  }
  const parsed = parsedResult.data;

  if (parsed.gradients.length > MAX_GRADIENTS) {
    request.log.warn({ gradients: parsed.gradients.length }, "Gradient anomaly: vector count exceeded");
    void reply.status(413).send({ message: "Gradient vector count exceeds limit" });
    return;
  }

  const payloadBytes = Buffer.byteLength(JSON.stringify(parsed), "utf8");
  if (payloadBytes > MAX_PAYLOAD_BYTES) {
    request.log.warn({ payloadBytes }, "Gradient anomaly: serialized payload too large");
    void reply.status(413).send({ message: "Gradient payload exceeds 200KB" });
    return;
  }

  const hash = gradientHash(parsed);
  if (duplicateGradientHashes.has(hash)) {
    request.log.info({ hash }, "Duplicate gradient payload detected");
    (request as FastifyRequest & { gradientDuplicate?: boolean }).gradientDuplicate = true;
  } else {
    duplicateGradientHashes.add(hash);
  }

  request.body = parsed;
}

import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    auth: {
      pseudoId: string;
    };
    gradientDuplicate?: boolean;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

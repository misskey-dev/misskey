import FastifyReply from "fastify";

declare module 'fastify' {
  interface FastifyReply {
    cspNonce: {
        script: string
    }
  }
}

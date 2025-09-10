import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { Stripe } from "stripe";

interface Options {
  stripeSecretKey: string;
}

export default fastifyPlugin(
  async function stripePlugin(fastify: FastifyInstance, opts: Options) {
    const stripeInstance = new Stripe(opts.stripeSecretKey);
    fastify.decorate("stripe", stripeInstance);
  },
  {
    name: "stripe",
  },
);

declare module "fastify" {
  export interface FastifyInstance {
    stripe: Stripe;
  }
}

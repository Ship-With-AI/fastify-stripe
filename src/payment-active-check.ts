import type {
  FastifyReply,
  FastifyRequest,
  RouteGenericInterface,
  onRequestHookHandler,
} from "fastify";
import fp from "fastify-plugin";
import { Stripe } from 'stripe'

export default fp(
  async (fastify) => {
    fastify.addHook<RouteGenericInterface, { paymentRequired?: boolean }>(
      "onRoute",
      async (routeOptions) => {
        if (!routeOptions.config?.paymentRequired) {
          return;
        }
        async function onRequest(req: FastifyRequest, reply: FastifyReply) {
          const subscription = await fastify.getSubscription(req);
          if (
            !subscription ||
            (subscription.status !== "active" &&
              subscription.status !== "trialing")
          ) {
            reply.statusCode = 402;
            throw new Error("Subscription required");
          }
        }
        routeOptions.onRequest = [
          ...((routeOptions.onRequest as onRequestHookHandler[] | undefined) ||
            []),
          onRequest,
        ];
      },
    );
  },
  {
    dependencies: ["stripe"],
    decorators: { fastify: ["getSubscription"] },
    name: "payment-required-check"
  },
);

declare module "fastify" {
  export interface FastifyInstance {
    getSubscription: (req: FastifyRequest) => Promise<Stripe.Subscription>
  }
}

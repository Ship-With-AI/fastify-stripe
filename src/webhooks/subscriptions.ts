import type { FastifyReply, FastifyRequest } from "fastify";
import type { Stripe } from "stripe";
import fastifyPlugin from "fastify-plugin";

export interface StripeWebhooksSubscriptionsOptions {
  stripeEndpointSecret: string
}

export default fastifyPlugin<StripeWebhooksSubscriptionsOptions>(async function (fastify, opts) {
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_req, body, done) => done(null, body),
  );

  fastify.post(
    "/webhooks/subscriptions",
    async (req: FastifyRequest, reply: FastifyReply) => {
      let event: Stripe.Event | undefined;
      const endpointSecret = opts.stripeEndpointSecret;
      if (endpointSecret) {
        const signature = req.headers["stripe-signature"] as string;
        try {
          event = await fastify.stripe.webhooks.constructEventAsync(
            req.body as string,
            signature,
            endpointSecret,
          );
        } catch (err) {
          req.log.warn(
            err,
            "⚠️  Webhook signature verification failed.",
          );
          reply.status(400)
          return
        }
      }
      switch (event?.type) {
        case "customer.subscription.trial_will_end":
        case "customer.subscription.deleted":
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const savedSubscription = await fastify.getSubscription(req);
          if (!savedSubscription) {
            req.log.warn(`Subscription with id ${subscription.id} not found`);
            break;
          }
          await fastify.onSubscriptionChanged(subscription)

          break;
        }
      }
      return
    },
  );
}, { decorators: { fastify: ['onSubscriptionChanged'] } })

declare module 'fastify' {
  export interface FastifyInstance {
    onSubscriptionChanged: (subscription: Stripe.Subscription) => Promise<void>
  }
}

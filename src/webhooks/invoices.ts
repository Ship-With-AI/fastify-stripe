import type { FastifyReply, FastifyRequest } from "fastify";
import type { Stripe } from "stripe";
import fastifyPlugin from "fastify-plugin";

export interface StripeWebhooksInvoicesOptions {
  stripeEndpointSecret: string
}

export default fastifyPlugin<StripeWebhooksInvoicesOptions>(async function (fastify, opts) {
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_req, body, done) => done(null, body),
  );

  fastify.post(
    "/webhooks/invoices",
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
        case "invoice.updated": {
          const invoice = event.data.object;
          const savedSubscription = await fastify.getSubscription(req);
          if (savedSubscription) {
            await fastify.onInvoiceUpdated(invoice)
            break;
          }
          break;
        }
      }
      return
    },
  );
}, { decorators: { fastify: ['onInvoiceUpdated'] } })

declare module 'fastify' {
  export interface FastifyInstance {
    onInvoiceUpdated: (invoice: Stripe.Invoice) => Promise<void>
  }
}

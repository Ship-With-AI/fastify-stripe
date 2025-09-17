import fastifyPlugin from "fastify-plugin";
import { default as stripe, type StripePluginOptions } from "./src/stripe.js";
import paymentActiveCheck from "./src/payment-active-check.js";
import webhooksSubscriptions, { type StripeWebhooksSubscriptionsOptions } from './src/webhooks/subscriptions.js'

type Options = StripePluginOptions & StripeWebhooksSubscriptionsOptions

export default fastifyPlugin<Options>(async function (fastify, opts) {
  fastify.register(stripe, { stripeSecretKey: opts.stripeSecretKey })
  fastify.register(paymentActiveCheck)
  fastify.register(webhooksSubscriptions, { stripeEndpointSecret: opts.stripeEndpointSecret })
})

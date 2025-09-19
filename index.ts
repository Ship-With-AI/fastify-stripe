import fastifyPlugin from "fastify-plugin";
import { default as stripe, type StripePluginOptions } from "./src/stripe.js";
import paymentActiveCheck from "./src/payment-active-check.js";
import webhooksSubscriptions, { type StripeWebhooksSubscriptionsOptions } from './src/webhooks/subscriptions.js'
import webhookInvoices, { type StripeWebhooksInvoicesOptions } from './src/webhooks/invoices.js'

type Options = StripePluginOptions & StripeWebhooksSubscriptionsOptions & StripeWebhooksInvoicesOptions

export default fastifyPlugin<Options>(async function (fastify, opts) {
  fastify.register(stripe, { stripeSecretKey: opts.stripeSecretKey })
  fastify.register(paymentActiveCheck)
  fastify.register(webhooksSubscriptions, { stripeEndpointSecret: opts.stripeEndpointSecret })
  fastify.register(webhookInvoices, { stripeEndpointSecret: opts.stripeEndpointSecret })
})

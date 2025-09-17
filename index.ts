import fastifyPlugin from "fastify-plugin";
import { default as stripe, type StripePluginOptions } from "./src/stripe.js";
import paymentActiveCheck from "./src/payment-active-check.js";

type Options = StripePluginOptions

export default fastifyPlugin<Options>(async function (fastify, opts) {
  fastify.register(stripe, { stripeSecretKey: opts.stripeSecretKey })
  fastify.register(paymentActiveCheck)
})

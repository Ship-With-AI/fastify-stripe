import assert from "node:assert";
import { test } from "node:test";
import Fastify from "fastify";
import stripePlugin from "../src/stripe.ts";

test("should add the stripe decorator to the fastify instance", async () => {
  const fastify = Fastify();

  await fastify.register(stripePlugin, { stripeSecretKey: "sk_test" });
  assert.strictEqual(fastify.hasDecorator("stripe"), true);
});

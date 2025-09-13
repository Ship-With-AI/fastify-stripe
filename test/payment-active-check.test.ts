import assert from "node:assert";
import { test } from "node:test";
import Fastify from "fastify";
import paymentActiveCheckPlugin from "../src/payment-active-check.ts";
import stripePlugin from "../src/stripe.ts";

test("should register the plugin without errors", async () => {
  const fastify = Fastify();

  // Register stripe plugin first as a dependency
  await fastify.register(stripePlugin, { stripeSecretKey: "sk_test" });
  
  // Mock the getSubscription decorator that the plugin expects
  fastify.decorate("getSubscription", async () => ({
    status: "active",
  } as any));
  
  // Should register without errors
  await fastify.register(paymentActiveCheckPlugin);
  
  assert.ok(true); // If we get here, registration worked
});

test("should not add onRequest hook when paymentRequired is not set", async () => {
  const fastify = Fastify();

  // Register dependencies
  await fastify.register(stripePlugin, { stripeSecretKey: "sk_test" });
  fastify.decorate("getSubscription", async () => ({
    status: "active",
  } as any));
  await fastify.register(paymentActiveCheckPlugin);

  // Define a route without paymentRequired
  fastify.get("/free-route", async () => {
    return { message: "This route is free" };
  });

  const response = await fastify.inject({
    method: "GET",
    url: "/free-route",
  });

  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(response.json(), { message: "This route is free" });
});

test("should add onRequest hook when paymentRequired is true", async () => {
  const fastify = Fastify();

  // Register dependencies
  await fastify.register(stripePlugin, { stripeSecretKey: "sk_test" });
  fastify.decorate("getSubscription", async () => ({
    status: "active",
  } as any));
  await fastify.register(paymentActiveCheckPlugin);

  // Define a route with paymentRequired
  fastify.get("/paid-route", { config: { paymentRequired: true } }, async () => {
    return { message: "This route requires payment" };
  });

  const response = await fastify.inject({
    method: "GET",
    url: "/paid-route",
  });

  // Should succeed because subscription is active
  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(response.json(), { message: "This route requires payment" });
});

test("should return 402 when subscription is not active", async () => {
  const fastify = Fastify();

  // Register dependencies
  await fastify.register(stripePlugin, { stripeSecretKey: "sk_test" });
  // Mock getSubscription decorator to return inactive subscription
  fastify.decorate("getSubscription", async () => ({
    status: "inactive",
  } as any));
  await fastify.register(paymentActiveCheckPlugin);

  // Define a route with paymentRequired
  fastify.get("/paid-route", { config: { paymentRequired: true } }, async () => {
    return { message: "This route requires payment" };
  });

  const response = await fastify.inject({
    method: "GET",
    url: "/paid-route",
  });

  // Should return 402 Payment Required
  assert.strictEqual(response.statusCode, 402);
});

test("should allow access when subscription is active", async () => {
  const fastify = Fastify();

  // Register dependencies
  await fastify.register(stripePlugin, { stripeSecretKey: "sk_test" });
  // Mock getSubscription decorator to return active subscription
  fastify.decorate("getSubscription", async () => ({
    status: "active",
  } as any));
  await fastify.register(paymentActiveCheckPlugin);

  // Define a route with paymentRequired
  fastify.get("/paid-route", { config: { paymentRequired: true } }, async () => {
    return { message: "This route requires payment" };
  });

  const response = await fastify.inject({
    method: "GET",
    url: "/paid-route",
  });

  // Should succeed because subscription is active
  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(response.json(), { message: "This route requires payment" });
});

test("should allow access when subscription is in trial", async () => {
  const fastify = Fastify();

  // Register dependencies
  await fastify.register(stripePlugin, { stripeSecretKey: "sk_test" });
  // Mock getSubscription decorator to return trialing subscription
  fastify.decorate("getSubscription", async () => ({
    status: "trialing",
  } as any));
  await fastify.register(paymentActiveCheckPlugin);

  // Define a route with paymentRequired
  fastify.get("/paid-route", { config: { paymentRequired: true } }, async () => {
    return { message: "This route requires payment" };
  });

  const response = await fastify.inject({
    method: "GET",
    url: "/paid-route",
  });

  // Should succeed because subscription is in trial period
  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(response.json(), { message: "This route requires payment" });
});


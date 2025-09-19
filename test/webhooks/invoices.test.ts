import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import type { Stripe } from "stripe";
import plugin from "../../src/webhooks/invoices";

const endpointSecret = "whsec_test";

const mockInvoice = { id: "in_123", object: "invoice" } as unknown as Stripe.Invoice;
const mockEvent = {
  id: "evt_123",
  type: "invoice.updated",
  data: { object: mockInvoice },
} as unknown as Stripe.Event;

async function createTestFastify() {
  const fastify = Fastify();

  // Mock stripe + helpers
  fastify.decorate("stripe", {
    webhooks: {
      constructEventAsync: async (body: string, sig: string, secret: string) => {
        if (sig === "bad_sig") {
          throw new Error("Invalid signature");
        }
        assert.equal(secret, endpointSecret); // sanity check
        return mockEvent;
      },
    },
  });



  return fastify;
}

test("calls onInvoiceUpdated for invoice.updated event", async () => {
  const fastify = await createTestFastify();
  // Add the tracking decorator for testing
  fastify.decorate("onInvoiceUpdated", async (_invoice: Stripe.Invoice) => {
    (fastify as any)._invoiceCalled = true;
  });
  fastify.decorate("getSubscription", async () => ({ id: "sub_123" }));
  await fastify.register(plugin, { stripeEndpointSecret: endpointSecret });

  const res = await fastify.inject({
    method: "POST",
    url: "/webhooks/invoices",
    headers: {
      "stripe-signature": "good_sig",
      "content-type": "application/json",
    },
    payload: JSON.stringify({ some: "payload" }),
  });

  assert.equal(res.statusCode, 200);
  assert.equal((fastify as any)._invoiceCalled, true);
});

test("returns 400 when signature verification fails", async () => {
  const fastify = await createTestFastify();
  // Add the tracking decorator for testing
  fastify.decorate("onInvoiceUpdated", async (_invoice: Stripe.Invoice) => {
    (fastify as any)._invoiceCalled = true;
  });
  await fastify.register(plugin, { stripeEndpointSecret: endpointSecret });

  const res = await fastify.inject({
    method: "POST",
    url: "/webhooks/invoices",
    headers: {
      "stripe-signature": "bad_sig",
      "content-type": "application/json",
    },
    payload: JSON.stringify({ some: "payload" }),
  });

  assert.equal(res.statusCode, 400);
  assert.equal((fastify as any)._invoiceCalled, undefined);
});

test("skips onInvoiceUpdated if no subscription found", async () => {
  const fastify = await createTestFastify();
  fastify.decorate("getSubscription", async () => null);
  // Add the tracking decorator for testing
  fastify.decorate("onInvoiceUpdated", async (_invoice: Stripe.Invoice) => {
    (fastify as any)._invoiceCalled = true;
  });
  await fastify.register(plugin, { stripeEndpointSecret: endpointSecret });

  const res = await fastify.inject({
    method: "POST",
    url: "/webhooks/invoices",
    headers: {
      "stripe-signature": "good_sig",
      "content-type": "application/json",
    },
    payload: JSON.stringify({ some: "payload" }),
  });

  assert.equal(res.statusCode, 200);
  assert.equal((fastify as any)._invoiceCalled, undefined);
});


import assert from "node:assert";
import { test } from "node:test";
import Fastify from "fastify";
import subscriptionsPlugin from "../../src/webhooks/subscriptions.ts";
import stripePlugin from "../../src/stripe.ts";

test("should register the subscriptions webhook plugin without errors", async () => {
  const fastify = Fastify();

  try {
    await fastify.register(stripePlugin, { stripeSecretKey: "sk_test_12345" });
    fastify.decorate("getSubscription", async () => null);
    fastify.decorate("onSubscriptionChanged", async () => { });

    await fastify.register(subscriptionsPlugin, { stripeEndpointSecret: "whsec_12345" });

    assert.ok(true);
  } finally {
    await fastify.close();
  }
});

test("should return 400 when stripe signature is missing", async () => {
  const fastify = Fastify();

  try {
    await fastify.register(stripePlugin, { stripeSecretKey: "sk_test_12345" });
    fastify.decorate("getSubscription", async () => null);
    fastify.decorate("onSubscriptionChanged", async () => { });

    await fastify.register(subscriptionsPlugin, { stripeEndpointSecret: "whsec_12345" });

    const response = await fastify.inject({
      method: "POST",
      url: "/webhooks/subscriptions",
      headers: {
        "content-type": "application/json",
      },
      payload: JSON.stringify({ type: "customer.subscription.updated" }),
    });

    assert.strictEqual(response.statusCode, 400);
  } finally {
    await fastify.close();
  }
});

test("should handle customer.subscription.updated event", async () => {
  let onSubscriptionChangedCalled = false;
  let subscriptionData: any = null;

  const fastify = Fastify();

  try {
    await fastify.register(stripePlugin, { stripeSecretKey: "sk_test_12345" });
    fastify.decorate("getSubscription", async () => ({ id: "sub_123" } as any));
    fastify.decorate("onSubscriptionChanged", async (subscription: any) => {
      onSubscriptionChangedCalled = true;
      subscriptionData = subscription;
    });

    await fastify.register(subscriptionsPlugin, { stripeEndpointSecret: "whsec_12345" });

    // Mock the constructEventAsync method to return our mock event
    const mockEvent = {
      id: "evt_123",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "active",
        },
      },
    };

    fastify.stripe.webhooks.constructEventAsync = async () => mockEvent as any;

    const response = await fastify.inject({
      method: "POST",
      url: "/webhooks/subscriptions",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=hmac",
      },
      payload: JSON.stringify({ type: "customer.subscription.updated" }),
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(onSubscriptionChangedCalled, true);
    assert.strictEqual(subscriptionData.id, "sub_123");
  } finally {
    await fastify.close();
  }
});

test("should handle customer.subscription.created event", async () => {
  let onSubscriptionChangedCalled = false;

  const fastify = Fastify();

  try {
    await fastify.register(stripePlugin, { stripeSecretKey: "sk_test_12345" });
    fastify.decorate("getSubscription", async () => ({ id: "sub_123" } as any));
    fastify.decorate("onSubscriptionChanged", async () => {
      onSubscriptionChangedCalled = true;
    });

    await fastify.register(subscriptionsPlugin, { stripeEndpointSecret: "whsec_12345" });

    // Mock the constructEventAsync method to return our mock event
    const mockEvent = {
      id: "evt_123",
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_123",
          status: "active",
        },
      },
    };

    fastify.stripe.webhooks.constructEventAsync = async () => mockEvent as any;

    const response = await fastify.inject({
      method: "POST",
      url: "/webhooks/subscriptions",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=hmac",
      },
      payload: JSON.stringify({ type: "customer.subscription.created" }),
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(onSubscriptionChangedCalled, true);
  } finally {
    await fastify.close();
  }
});

test("should handle customer.subscription.deleted event", async () => {
  let onSubscriptionChangedCalled = false;

  const fastify = Fastify();

  try {
    await fastify.register(stripePlugin, { stripeSecretKey: "sk_test_12345" });
    fastify.decorate("getSubscription", async () => ({ id: "sub_123" } as any));
    fastify.decorate("onSubscriptionChanged", async () => {
      onSubscriptionChangedCalled = true;
    });

    await fastify.register(subscriptionsPlugin, { stripeEndpointSecret: "whsec_12345" });

    // Mock the constructEventAsync method to return our mock event
    const mockEvent = {
      id: "evt_123",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_123",
          status: "canceled",
        },
      },
    };

    fastify.stripe.webhooks.constructEventAsync = async () => mockEvent as any;

    const response = await fastify.inject({
      method: "POST",
      url: "/webhooks/subscriptions",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=hmac",
      },
      payload: JSON.stringify({ type: "customer.subscription.deleted" }),
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(onSubscriptionChangedCalled, true);
  } finally {
    await fastify.close();
  }
});

test("should handle customer.subscription.trial_will_end event", async () => {
  let onSubscriptionChangedCalled = false;

  const fastify = Fastify();

  try {
    await fastify.register(stripePlugin, { stripeSecretKey: "sk_test_12345" });
    fastify.decorate("getSubscription", async () => ({ id: "sub_123" } as any));
    fastify.decorate("onSubscriptionChanged", async () => {
      onSubscriptionChangedCalled = true;
    });

    await fastify.register(subscriptionsPlugin, { stripeEndpointSecret: "whsec_12345" });

    // Mock the constructEventAsync method to return our mock event
    const mockEvent = {
      id: "evt_123",
      type: "customer.subscription.trial_will_end",
      data: {
        object: {
          id: "sub_123",
          status: "trialing",
        },
      },
    };

    fastify.stripe.webhooks.constructEventAsync = async () => mockEvent as any;

    const response = await fastify.inject({
      method: "POST",
      url: "/webhooks/subscriptions",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=hmac",
      },
      payload: JSON.stringify({ type: "customer.subscription.trial_will_end" }),
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(onSubscriptionChangedCalled, true);
  } finally {
    await fastify.close();
  }
});

test("should not call onSubscriptionChanged when subscription is not found", async () => {
  let onSubscriptionChangedCalled = false;

  const fastify = Fastify();

  try {
    await fastify.register(stripePlugin, { stripeSecretKey: "sk_test_12345" });
    fastify.decorate("getSubscription", async () => null);
    fastify.decorate("onSubscriptionChanged", async () => {
      onSubscriptionChangedCalled = true;
    });

    await fastify.register(subscriptionsPlugin, { stripeEndpointSecret: "whsec_12345" });

    // Mock the constructEventAsync method to return our mock event
    const mockEvent = {
      id: "evt_123",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "active",
        },
      },
    };

    fastify.stripe.webhooks.constructEventAsync = async () => mockEvent as any;

    const response = await fastify.inject({
      method: "POST",
      url: "/webhooks/subscriptions",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=hmac",
      },
      payload: JSON.stringify({ type: "customer.subscription.updated" }),
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(onSubscriptionChangedCalled, false);
  } finally {
    await fastify.close();
  }
});
//

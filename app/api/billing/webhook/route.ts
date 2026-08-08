import type Stripe from "stripe";

import {
  saveSubscription,
  userIdForCustomer,
  type SubscriptionRecord,
} from "@/lib/creator-cloud";
import { stripe } from "@/lib/stripe";
import { stripeCredentialsConfigured } from "@/lib/provider-environment";
import { readTextLimited, RequestBodyTooLargeError } from "@/lib/request-body";

function objectId(value: string | { id: string } | null): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

function renewalDate(subscription: Stripe.Subscription): string | null {
  const ends = subscription.items.data.map((item) => item.current_period_end);
  const latest = ends.length > 0 ? Math.max(...ends) : null;
  return latest ? new Date(latest * 1000).toISOString() : null;
}

async function persistSubscription(
  subscription: Stripe.Subscription,
  eventCreated: number,
  fallbackUserId?: string | null
) {
  const customerId = objectId(subscription.customer);
  if (!customerId) return;
  const userId =
    subscription.metadata.sketchcastUserId ||
    fallbackUserId ||
    (await userIdForCustomer(customerId));
  if (!userId) {
    console.error(`Stripe subscription ${subscription.id} has no Sketchcast user`);
    return;
  }
  const record: SubscriptionRecord = {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id ?? null,
    renewsAt: renewalDate(subscription),
    stripeEventCreated: eventCreated,
    updatedAt: new Date().toISOString(),
  };
  await saveSubscription(record);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !stripeCredentialsConfigured()) {
    return Response.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await readTextLimited(request, 256 * 1024);
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: error.message }, { status: 413 });
    }
    console.error("Rejected Stripe webhook", error);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const subscriptionId = objectId(session.subscription);
    if (subscriptionId) {
      const subscription = await stripe().subscriptions.retrieve(subscriptionId);
      await persistSubscription(
        subscription,
        event.created,
        session.metadata?.sketchcastUserId ?? session.client_reference_id
      );
    }
  } else if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await persistSubscription(event.data.object, event.created);
  }

  return Response.json({ received: true });
}

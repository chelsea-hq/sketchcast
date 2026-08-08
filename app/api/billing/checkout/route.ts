import { billingConfigured, cloudStoreConfigured, getSubscription } from "@/lib/creator-cloud";
import { hostedUserEmail, hostedUserId } from "@/lib/hosted-auth";
import { appUrl, priceForInterval, stripe } from "@/lib/stripe";
import type { BillingInterval } from "@/lib/creator-cloud-types";
import { isActiveSubscription } from "@/lib/entitlements";
import { guardApiRequest } from "@/lib/api-guard";
import { readJsonLimited, RequestBodyTooLargeError } from "@/lib/request-body";
import { matchesCreatorOffer } from "@/lib/creator-pricing";

const INTERVALS = new Set<BillingInterval>(["monthly", "annual"]);

export async function POST(request: Request) {
  const guard = guardApiRequest(request, { maxBodyBytes: 8 * 1024 });
  if (guard) return guard;
  if (!billingConfigured() || !cloudStoreConfigured()) {
    return Response.json(
      { error: "Creator Cloud checkout is not open yet" },
      { status: 503 }
    );
  }
  const userId = await hostedUserId();
  if (!userId) {
    return Response.json({ error: "Sign in before subscribing" }, { status: 401 });
  }

  let interval: BillingInterval = "monthly";
  try {
    const body = await readJsonLimited<{ interval?: string }>(request, 8 * 1024);
    if (body.interval && INTERVALS.has(body.interval as BillingInterval)) {
      interval = body.interval as BillingInterval;
    }
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: error.message }, { status: 413 });
    }
    return Response.json({ error: "Invalid checkout request" }, { status: 400 });
  }
  const price = priceForInterval(interval);
  if (!price) {
    return Response.json({ error: "That billing option is unavailable" }, { status: 503 });
  }

  const existing = await getSubscription(userId);
  if (isActiveSubscription(existing?.status)) {
    return Response.json(
      { error: "This account already has Creator Cloud. Manage it from Account." },
      { status: 409 }
    );
  }
  const email = await hostedUserEmail();
  const client = stripe();
  try {
    const configuredPrice = await client.prices.retrieve(price);
    if (!matchesCreatorOffer(configuredPrice, interval)) {
      return Response.json(
        { error: "Creator Cloud billing price needs an operator update" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Could not verify the configured Creator Cloud Price", error);
    return Response.json(
      { error: "Creator Cloud billing price could not be verified" },
      { status: 503 }
    );
  }
  const session = await client.checkout.sessions.create({
    mode: "subscription",
    customer: existing?.stripeCustomerId || undefined,
    customer_email: existing?.stripeCustomerId ? undefined : email ?? undefined,
    client_reference_id: userId,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appUrl(request)}/account?checkout=success`,
    cancel_url: `${appUrl(request)}/#pricing`,
    metadata: { sketchcastUserId: userId },
    subscription_data: { metadata: { sketchcastUserId: userId } },
  });
  if (!session.url) {
    return Response.json({ error: "Stripe did not create a checkout URL" }, { status: 502 });
  }
  return Response.json({ url: session.url });
}

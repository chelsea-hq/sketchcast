import "server-only";

import Stripe from "stripe";

import type { BillingInterval } from "./creator-cloud-types";
import { configuredAppUrl } from "./app-url";
import { stripeCredentialsConfigured } from "./provider-environment";

let stripeClient: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !stripeCredentialsConfigured()) {
    throw new Error("Stripe is not configured for this environment");
  }
  stripeClient ??= new Stripe(key);
  return stripeClient;
}

export function priceForInterval(interval: BillingInterval): string | null {
  if (interval === "monthly") return process.env.STRIPE_PRICE_CREATOR_MONTHLY ?? null;
  return process.env.STRIPE_PRICE_CREATOR_ANNUAL ?? null;
}

export function appUrl(request?: Request): string {
  const configured = configuredAppUrl();
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production" && request) {
    return new URL(request.url).origin;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL must be a valid HTTPS origin");
  }
  return "http://localhost:3000";
}

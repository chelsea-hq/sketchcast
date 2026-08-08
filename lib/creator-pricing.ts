import type { BillingInterval } from "./creator-cloud-types";

interface CreatorOffer {
  interval: BillingInterval;
  amountCents: number;
  stripeInterval: "month" | "year";
  displayPrice: string;
  cadence: string;
  billingNote: string;
}

export const CREATOR_OFFERS: Record<BillingInterval, CreatorOffer> = {
  monthly: {
    interval: "monthly",
    amountCents: 500,
    stripeInterval: "month",
    displayPrice: "$5",
    cadence: "/ month",
    billingNote: "Billed monthly. Cancel anytime.",
  },
  annual: {
    interval: "annual",
    amountCents: 3_900,
    stripeInterval: "year",
    displayPrice: "$3.25",
    cadence: "/ month",
    billingNote: "$39 billed yearly · save $21",
  },
};

export function creatorOffer(interval: BillingInterval): CreatorOffer {
  return CREATOR_OFFERS[interval];
}

export interface StripePriceSummary {
  active: boolean;
  currency: string;
  unit_amount: number | null;
  recurring: {
    interval: string;
    interval_count: number;
  } | null;
}

export function matchesCreatorOffer(
  price: StripePriceSummary,
  interval: BillingInterval
): boolean {
  const offer = creatorOffer(interval);
  return (
    price.active &&
    price.currency.toLowerCase() === "usd" &&
    price.unit_amount === offer.amountCents &&
    price.recurring?.interval === offer.stripeInterval &&
    price.recurring.interval_count === 1
  );
}

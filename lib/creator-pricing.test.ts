import { describe, expect, it } from "vitest";

import { CREATOR_OFFERS, matchesCreatorOffer } from "./creator-pricing";
import { CREATOR_LIMITS } from "./creator-cloud-types";

describe("low-barrier Creator Cloud offer", () => {
  it("presents the monthly plan as the $5 entry point", () => {
    expect(CREATOR_OFFERS.monthly).toMatchObject({
      amountCents: 500,
      displayPrice: "$5",
      cadence: "/ month",
      billingNote: "Billed monthly. Cancel anytime.",
    });
  });

  it("presents annual billing as a monthly equivalent with the full charge", () => {
    expect(CREATOR_OFFERS.annual).toMatchObject({
      amountCents: 3_900,
      displayPrice: "$3.25",
      cadence: "/ month",
      billingNote: "$39 billed yearly · save $21",
    });
  });

  it("keeps the hosted allowance lean while BYOK remains unmetered", () => {
    expect(CREATOR_LIMITS).toEqual({
      aiGenerations: 30,
      transcriptionSeconds: 60 * 60,
      templates: null,
    });
  });

  it.each([
    ["monthly", 500, "month"],
    ["annual", 3_900, "year"],
  ] as const)("accepts the exact %s recurring Stripe Price", (interval, unitAmount, stripeInterval) => {
    expect(
      matchesCreatorOffer(
        {
          active: true,
          currency: "usd",
          unit_amount: unitAmount,
          recurring: { interval: stripeInterval, interval_count: 1 },
        },
        interval
      )
    ).toBe(true);
  });

  it.each([
    { active: false, currency: "usd", unit_amount: 500, recurring: { interval: "month", interval_count: 1 } },
    { active: true, currency: "eur", unit_amount: 500, recurring: { interval: "month", interval_count: 1 } },
    { active: true, currency: "usd", unit_amount: 900, recurring: { interval: "month", interval_count: 1 } },
    { active: true, currency: "usd", unit_amount: 500, recurring: { interval: "year", interval_count: 1 } },
    { active: true, currency: "usd", unit_amount: 500, recurring: null },
  ])("rejects a mismatched monthly Stripe Price", (price) => {
    expect(matchesCreatorOffer(price, "monthly")).toBe(false);
  });
});

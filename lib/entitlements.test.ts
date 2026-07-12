import { describe, expect, it } from "vitest";

import { isActiveSubscription, planForSubscription } from "./entitlements";

describe("Creator Cloud entitlement", () => {
  it.each(["active", "trialing"])("grants Creator for %s", (status) => {
    expect(isActiveSubscription(status)).toBe(true);
    expect(planForSubscription(status)).toBe("creator");
  });

  it.each([null, undefined, "canceled", "past_due", "unpaid", "incomplete"])(
    "fails closed for %s",
    (status) => {
      expect(isActiveSubscription(status)).toBe(false);
      expect(planForSubscription(status)).toBe("community");
    }
  );
});

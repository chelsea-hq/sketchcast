import { describe, expect, it } from "vitest";

import {
  clerkCredentialsConfigured,
  stripeCredentialsConfigured,
} from "./provider-environment";

describe("production provider credential safety", () => {
  it("rejects missing or incomplete Clerk credentials", () => {
    expect(clerkCredentialsConfigured({ NODE_ENV: "production" })).toBe(false);
    expect(
      clerkCredentialsConfigured({
        NODE_ENV: "production",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_public",
      })
    ).toBe(false);
  });

  it("rejects Clerk development credentials in production", () => {
    expect(
      clerkCredentialsConfigured({
        NODE_ENV: "production",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_public",
        CLERK_SECRET_KEY: "sk_test_secret",
      })
    ).toBe(false);
  });

  it("accepts only paired live Clerk credentials in production", () => {
    expect(
      clerkCredentialsConfigured({
        NODE_ENV: "production",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_public",
        CLERK_SECRET_KEY: "sk_live_secret",
      })
    ).toBe(true);
  });

  it("allows Clerk development credentials outside production", () => {
    expect(
      clerkCredentialsConfigured({
        NODE_ENV: "development",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_public",
        CLERK_SECRET_KEY: "sk_test_secret",
      })
    ).toBe(true);
  });

  it("rejects Stripe test credentials in production", () => {
    expect(
      stripeCredentialsConfigured({
        NODE_ENV: "production",
        STRIPE_SECRET_KEY: "sk_test_secret",
      })
    ).toBe(false);
  });

  it("accepts live Stripe credentials in production and test keys elsewhere", () => {
    expect(
      stripeCredentialsConfigured({
        NODE_ENV: "production",
        STRIPE_SECRET_KEY: "sk_live_secret",
      })
    ).toBe(true);
    expect(
      stripeCredentialsConfigured({
        NODE_ENV: "test",
        STRIPE_SECRET_KEY: "sk_test_secret",
      })
    ).toBe(true);
  });
});

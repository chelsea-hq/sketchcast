import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, clerkFrontendOrigin } from "./content-security-policy";

describe("content security policy", () => {
  it("builds an enforced nonce policy for the Community app", () => {
    const policy = buildContentSecurityPolicy({ nonce: "nonce123", production: true });
    expect(policy).toContain("script-src 'self' 'nonce-nonce123' 'strict-dynamic' https:");
    expect(policy).toContain("worker-src 'self' blob:");
    expect(policy).toContain("media-src 'self' blob:");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("allows development evaluation without weakening production", () => {
    const policy = buildContentSecurityPolicy({ nonce: "dev", production: false });
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  it("derives and pins the Clerk frontend origin from a publishable key", () => {
    const encoded = Buffer.from("brief-fox-12.clerk.accounts.dev$").toString("base64");
    const origin = clerkFrontendOrigin(`pk_test_${encoded}`);
    expect(origin).toBe("https://brief-fox-12.clerk.accounts.dev");
    const policy = buildContentSecurityPolicy({ nonce: "n", production: true, clerkOrigin: origin });
    expect(policy).toContain(`connect-src 'self' ${origin}`);
  });

  it("rejects malformed Clerk public keys and non-HTTPS origins", () => {
    expect(clerkFrontendOrigin("not-a-key")).toBeNull();
    expect(buildContentSecurityPolicy({ nonce: "n", production: true, clerkOrigin: "javascript:alert(1)" })).not.toContain("javascript:");
  });
});

import { afterEach, describe, expect, it } from "vitest";

import { generateStructured, managedAiConfig, serverKeysEnabled } from "./ai";

describe("server-funded AI keys", () => {
  const original = process.env.SKETCHCAST_ALLOW_SERVER_KEYS;
  const originalAnthropic = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    if (original === undefined) delete process.env.SKETCHCAST_ALLOW_SERVER_KEYS;
    else process.env.SKETCHCAST_ALLOW_SERVER_KEYS = original;
    if (originalAnthropic === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalAnthropic;
  });

  it("requires an exact explicit opt-in", () => {
    delete process.env.SKETCHCAST_ALLOW_SERVER_KEYS;
    expect(serverKeysEnabled()).toBe(false);
    process.env.SKETCHCAST_ALLOW_SERVER_KEYS = "false";
    expect(serverKeysEnabled()).toBe(false);
    process.env.SKETCHCAST_ALLOW_SERVER_KEYS = "true";
    expect(serverKeysEnabled()).toBe(true);
  });

  it("exposes a managed key only to a route that explicitly requests it", () => {
    process.env.SKETCHCAST_ALLOW_SERVER_KEYS = "true";
    process.env.ANTHROPIC_API_KEY = "test-managed-key";
    expect(managedAiConfig({ provider: "anthropic" })?.apiKey).toBe("test-managed-key");
  });

  it("never falls back to a server key inside the provider call", async () => {
    process.env.SKETCHCAST_ALLOW_SERVER_KEYS = "true";
    process.env.ANTHROPIC_API_KEY = "test-managed-key";
    await expect(
      generateStructured({
        provider: "anthropic",
        system: "test",
        user: "test",
        schema: { type: "object" },
        maxTokens: 10,
      })
    ).rejects.toThrow("No browser API key configured");
  });
});

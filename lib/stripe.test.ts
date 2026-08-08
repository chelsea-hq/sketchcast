import { afterEach, describe, expect, it, vi } from "vitest";

import { configuredAppUrl } from "./app-url";

describe("hosted application URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts only a canonical HTTPS origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sketchcast.example");
    expect(configuredAppUrl()).toBe("https://sketchcast.example");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sketchcast.example/account");
    expect(configuredAppUrl()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://sketchcast.example");
    expect(configuredAppUrl()).toBeNull();
  });

  it("allows localhost HTTP only outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(configuredAppUrl()).toBe("http://localhost:3000");
  });
});

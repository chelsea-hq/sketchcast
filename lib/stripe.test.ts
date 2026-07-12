import { afterEach, describe, expect, it } from "vitest";

import { configuredAppUrl } from "./app-url";

describe("hosted application URL", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = original;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  it("accepts only a canonical HTTPS origin in production", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "https://sketchcast.example";
    expect(configuredAppUrl()).toBe("https://sketchcast.example");
    process.env.NEXT_PUBLIC_APP_URL = "https://sketchcast.example/account";
    expect(configuredAppUrl()).toBeNull();
    process.env.NEXT_PUBLIC_APP_URL = "http://sketchcast.example";
    expect(configuredAppUrl()).toBeNull();
  });

  it("allows localhost HTTP only outside production", () => {
    process.env.NODE_ENV = "test";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(configuredAppUrl()).toBe("http://localhost:3000");
  });
});

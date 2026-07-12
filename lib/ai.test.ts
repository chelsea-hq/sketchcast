import { afterEach, describe, expect, it } from "vitest";

import { serverKeysEnabled } from "./ai";

describe("server-funded AI keys", () => {
  const original = process.env.SKETCHCAST_ALLOW_SERVER_KEYS;

  afterEach(() => {
    if (original === undefined) delete process.env.SKETCHCAST_ALLOW_SERVER_KEYS;
    else process.env.SKETCHCAST_ALLOW_SERVER_KEYS = original;
  });

  it("requires an exact explicit opt-in", () => {
    delete process.env.SKETCHCAST_ALLOW_SERVER_KEYS;
    expect(serverKeysEnabled()).toBe(false);
    process.env.SKETCHCAST_ALLOW_SERVER_KEYS = "false";
    expect(serverKeysEnabled()).toBe(false);
    process.env.SKETCHCAST_ALLOW_SERVER_KEYS = "true";
    expect(serverKeysEnabled()).toBe(true);
  });
});

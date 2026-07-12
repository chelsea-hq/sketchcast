import { describe, expect, it } from "vitest";

import { guardApiRequest } from "./api-guard";

describe("API request guard", () => {
  it("allows bodyless same-origin reads when content type is disabled", () => {
    const request = new Request("https://sketchcast.test/api/sync?id=abc", {
      headers: {
        Origin: "https://sketchcast.test",
        Host: "sketchcast.test",
        "Sec-Fetch-Site": "same-origin",
      },
    });
    expect(guardApiRequest(request, { requireContentType: false })).toBeNull();
  });

  it("rejects cross-origin sync reads", () => {
    const request = new Request("https://sketchcast.test/api/sync?id=abc", {
      headers: {
        Origin: "https://attacker.test",
        Host: "sketchcast.test",
      },
    });
    expect(guardApiRequest(request, { requireContentType: false })?.status).toBe(403);
  });

  it("keeps JSON content type mandatory for writes", () => {
    const request = new Request("https://sketchcast.test/api/sync", {
      method: "PUT",
      headers: { Host: "sketchcast.test", "Content-Type": "text/plain" },
      body: "not json",
    });
    expect(guardApiRequest(request)?.status).toBe(415);
  });
});

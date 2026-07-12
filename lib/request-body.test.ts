import { describe, expect, it } from "vitest";

import {
  RequestBodyTooLargeError,
  readArrayBufferLimited,
  readJsonLimited,
} from "./request-body";

describe("bounded request body reader", () => {
  it("reads valid JSON below the byte limit", async () => {
    const request = new Request("https://sketchcast.test/api", {
      method: "POST",
      body: JSON.stringify({ concept: "bounded" }),
    });
    await expect(readJsonLimited<{ concept: string }>(request, 100)).resolves.toEqual({
      concept: "bounded",
    });
  });

  it("stops streamed bodies even when Content-Length is absent", async () => {
    const encoder = new TextEncoder();
    const request = new Request("https://sketchcast.test/api", {
      method: "POST",
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode("12345"));
          controller.enqueue(encoder.encode("67890"));
          controller.close();
        },
      }),
      // Required by Node's fetch implementation for a streamed request body.
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    await expect(readArrayBufferLimited(request, 8)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });
});

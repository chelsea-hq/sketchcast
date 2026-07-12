import { afterEach, describe, expect, it, vi } from "vitest";

import { defaultWebcamLayout, webcamRect } from "./formats";
import { SessionRecorder } from "./recorder";

describe("recording and export support", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("prefers MP4 and falls back to WebM based on browser support", () => {
    const supported = new Set(["video/mp4", "video/webm"]);
    vi.stubGlobal("MediaRecorder", {
      isTypeSupported: (type: string) => supported.has(type),
    });
    expect(SessionRecorder.pickMimeType()).toBe("video/mp4");

    supported.delete("video/mp4");
    expect(SessionRecorder.pickMimeType()).toBe("video/webm");
  });

  it("reports no recorder when the browser lacks MediaRecorder", () => {
    vi.stubGlobal("MediaRecorder", undefined);
    expect(SessionRecorder.pickMimeType()).toBe("");
  });

  it("keeps webcam layouts inside every export frame", () => {
    for (const [width, height] of [
      [1920, 1080],
      [1080, 1920],
      [1080, 1080],
    ]) {
      for (const corner of ["br", "bl", "tr", "tl"] as const) {
        const rect = webcamRect({ ...defaultWebcamLayout("16:9"), corner }, width, height);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.d).toBeLessThanOrEqual(width);
        expect(rect.y + rect.d).toBeLessThanOrEqual(height);
      }
    }
  });
});

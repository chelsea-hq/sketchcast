import { afterEach, describe, expect, it, vi } from "vitest";

import { defaultWebcamLayout } from "./formats";
import { SessionRecorder } from "./recorder";

function captureHarness(failure?: "construct" | "start") {
  const micTrack = { stop: vi.fn() };
  const captures: Array<{ videoTrack: { stop: ReturnType<typeof vi.fn> }; addTrack: ReturnType<typeof vi.fn> }> = [];
  const instances: FakeRecorder[] = [];

  class FakeRecorder {
    static isTypeSupported = (type: string) => type === "video/webm";
    state = "inactive";
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    constructor() {
      if (failure === "construct") throw new Error("Recorder construction failed");
      instances.push(this);
    }
    start() {
      if (failure === "start") throw new Error("Recorder start failed");
      this.state = "recording";
    }
    pause() { this.state = "paused"; }
    resume() { this.state = "recording"; }
    stop() {
      this.state = "inactive";
      // MediaRecorder delivers the final chunk before its asynchronous stop event.
      this.ondataavailable?.({ data: new Blob(["final video chunk"]) });
      this.onstop?.();
    }
  }

  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ fillRect: vi.fn() }),
    captureStream: vi.fn(() => {
      const videoTrack = { stop: vi.fn() };
      const tracks = [videoTrack];
      const capture = {
        videoTrack,
        addTrack: vi.fn((track: typeof micTrack) => tracks.push(track)),
        getVideoTracks: () => [videoTrack],
        getTracks: () => tracks,
      };
      captures.push(capture);
      return capture;
    }),
  };
  vi.stubGlobal("document", { createElement: () => canvas });
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 17));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const onStop = vi.fn();
  const recorder = new SessionRecorder({
    boardEl: { clientWidth: 800, querySelectorAll: () => [] } as unknown as HTMLElement,
    getCrop: () => ({ x: 0, y: 0, w: 800, h: 450 }),
    getVideo: () => null,
    micStream: { getAudioTracks: () => [micTrack] } as unknown as MediaStream,
    format: "16:9",
    getWebcam: () => defaultWebcamLayout("16:9"),
    onStop,
  });
  return { recorder, micTrack, captures, instances, onStop, canvas };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("recorder capture lifecycle", () => {
  it("releases the canvas track after stopping and keeps the final video chunk", async () => {
    const { recorder, captures, micTrack, onStop } = captureHarness();
    recorder.start();
    recorder.stop();

    expect(captures[0].videoTrack.stop).toHaveBeenCalledOnce();
    expect(micTrack.stop).not.toHaveBeenCalled();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
    expect(onStop).toHaveBeenCalledOnce();
    expect(await onStop.mock.calls[0][0].blob.text()).toBe("final video chunk");
    expect(onStop.mock.calls[0][0]).toMatchObject({ mimeType: "video/webm", extension: "webm", format: "16:9" });
  });

  it.each(["construct", "start"] as const)("releases canvas capture if recorder %s fails", (failure) => {
    const { recorder, captures, micTrack, onStop } = captureHarness(failure);
    expect(() => recorder.start()).toThrow();
    expect(captures[0].videoTrack.stop).toHaveBeenCalledOnce();
    expect(micTrack.stop).not.toHaveBeenCalled();
    expect(onStop).not.toHaveBeenCalled();
    expect(() => recorder.stop()).not.toThrow();
  });

  it("rejects a duplicate start without allocating another capture stream", () => {
    const { recorder, canvas, captures } = captureHarness();
    recorder.start();
    expect(() => recorder.start()).toThrow(/already/i);
    expect(canvas.captureStream).toHaveBeenCalledOnce();
    recorder.stop();
    expect(captures[0].videoTrack.stop).toHaveBeenCalledOnce();
  });

  it("can record another take with the still-live session microphone", () => {
    const { recorder, captures, micTrack, onStop } = captureHarness();
    recorder.start();
    recorder.stop();
    recorder.start();
    recorder.stop();

    expect(captures).toHaveLength(2);
    for (const capture of captures) {
      expect(capture.videoTrack.stop).toHaveBeenCalledOnce();
      expect(capture.addTrack).toHaveBeenCalledWith(micTrack);
    }
    expect(micTrack.stop).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledTimes(2);
  });

  it("releases capture when stopped during a pause and excludes paused time", () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const { recorder, captures, onStop } = captureHarness();
    recorder.start();
    now = 2_000;
    recorder.pause();
    now = 8_000;
    recorder.stop();
    expect(captures[0].videoTrack.stop).toHaveBeenCalledOnce();
    expect(onStop.mock.calls[0][0].durationMs).toBe(2_000);
  });
});

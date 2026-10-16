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
    onerror: ((event: { error?: Error }) => void) | null = null;
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
  const onError = vi.fn();
  const recorder = new SessionRecorder({
    boardEl: { clientWidth: 800, querySelectorAll: () => [] } as unknown as HTMLElement,
    getCrop: () => ({ x: 0, y: 0, w: 800, h: 450 }),
    getVideo: () => null,
    micStream: { getAudioTracks: () => [micTrack] } as unknown as MediaStream,
    format: "16:9",
    getWebcam: () => defaultWebcamLayout("16:9"),
    onStop,
    onError,
  });
  return { recorder, micTrack, captures, instances, onStop, onError, canvas };
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

  it("reports an asynchronous error once and discards partial and final chunks", () => {
    const { recorder, captures, instances, micTrack, onStop, onError } = captureHarness();
    recorder.start();
    const failed = instances[0];
    const lateData = failed.ondataavailable;
    const lateStop = failed.onstop;
    const lateError = failed.onerror;
    const error = new Error("Encoder failed");
    lateData?.({ data: new Blob(["partial video"]) });

    // The browser inactivates recording, then emits error, dataavailable, stop.
    failed.state = "inactive";
    lateError?.({ error });
    lateData?.({ data: new Blob(["final partial video"]) });
    lateStop?.();
    lateError?.({ error });
    recorder.stop();
    lateStop?.();

    expect(onStop).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledExactlyOnceWith(error);
    expect(captures[0].videoTrack.stop).toHaveBeenCalledOnce();
    expect(micTrack.stop).not.toHaveBeenCalled();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
  });

  it("keeps late failed-take events out of the next successful take", async () => {
    const { recorder, captures, instances, micTrack, onStop, onError } = captureHarness();
    recorder.start();
    const failed = instances[0];
    const lateData = failed.ondataavailable;
    const lateStop = failed.onstop;
    const lateError = failed.onerror;
    failed.state = "inactive";
    lateError?.({ error: new Error("Encoder failed") });

    expect(() => recorder.start()).not.toThrow();
    lateData?.({ data: new Blob(["stale failed take"]) });
    lateStop?.();
    lateError?.({ error: new Error("Stale error") });
    expect(onStop).not.toHaveBeenCalled();
    expect(captures[1].videoTrack.stop).not.toHaveBeenCalled();
    recorder.stop();

    expect(onError).toHaveBeenCalledOnce();
    expect(onStop).toHaveBeenCalledOnce();
    expect(await onStop.mock.calls[0][0].blob.text()).toBe("final video chunk");
    expect(captures[1].videoTrack.stop).toHaveBeenCalledOnce();
    expect(captures[1].addTrack).toHaveBeenCalledWith(micTrack);
    expect(micTrack.stop).not.toHaveBeenCalled();
  });

  it("stops an unexpectedly active encoder after error without stopping the microphone", () => {
    const { recorder, instances, captures, micTrack, onError, onStop } = captureHarness();
    recorder.start();
    instances[0].onerror?.({ error: new Error("Encoder failed while active") });

    expect(instances[0].state).toBe("inactive");
    expect(onError).toHaveBeenCalledOnce();
    expect(onStop).not.toHaveBeenCalled();
    expect(captures[0].videoTrack.stop).toHaveBeenCalledOnce();
    expect(micTrack.stop).not.toHaveBeenCalled();
  });

  it("provides a usable error when the browser omits an error detail", () => {
    const { recorder, instances, onError, onStop } = captureHarness();
    recorder.start();
    instances[0].state = "inactive";
    instances[0].onerror?.({});
    instances[0].onstop?.();

    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toMatch(/recording failed/i);
    expect(onStop).not.toHaveBeenCalled();
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

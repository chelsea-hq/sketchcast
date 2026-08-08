import { describe, expect, it, vi } from "vitest";

import { createCanvasApiReadyGate } from "./canvas-api-ready";

function createScheduler() {
  let nextId = 1;
  const callbacks = new Map<number, () => void>();

  return {
    scheduler: {
      schedule: vi.fn((callback: () => void) => {
        const id = nextId++;
        callbacks.set(id, callback);
        return id;
      }),
      cancel: vi.fn((id: number) => callbacks.delete(id)),
    },
    flush() {
      for (const [id, callback] of [...callbacks]) {
        callbacks.delete(id);
        callback();
      }
    },
  };
}

describe("canvas API ready gate", () => {
  it("waits for the scheduled frame before delivering the API", () => {
    const delivered = vi.fn();
    const { scheduler, flush } = createScheduler();
    const gate = createCanvasApiReadyGate(delivered, scheduler);

    gate.publish("api");
    expect(delivered).not.toHaveBeenCalled();

    flush();
    expect(delivered).toHaveBeenCalledOnce();
    expect(delivered).toHaveBeenCalledWith("api");
  });

  it("delivers only the latest API when Excalidraw publishes repeatedly", () => {
    const delivered = vi.fn();
    const { scheduler, flush } = createScheduler();
    const gate = createCanvasApiReadyGate(delivered, scheduler);

    gate.publish("stale-api");
    gate.publish("current-api");
    flush();

    expect(scheduler.cancel).toHaveBeenCalledOnce();
    expect(delivered).toHaveBeenCalledOnce();
    expect(delivered).toHaveBeenCalledWith("current-api");
  });

  it("cancels pending delivery when the canvas unmounts", () => {
    const delivered = vi.fn();
    const { scheduler, flush } = createScheduler();
    const gate = createCanvasApiReadyGate(delivered, scheduler);

    gate.publish("api");
    gate.dispose();
    flush();

    expect(scheduler.cancel).toHaveBeenCalledOnce();
    expect(delivered).not.toHaveBeenCalled();
  });
});

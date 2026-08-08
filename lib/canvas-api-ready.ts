export interface FrameScheduler {
  schedule: (callback: () => void) => number;
  cancel: (frameId: number) => void;
}
/**
 * Coalesces imperative canvas API callbacks and delivers only the latest API
 * on a mounted browser frame. Excalidraw can expose its API before its
 * internal React app is ready to accept updateScene calls.
 */
export function createCanvasApiReadyGate<T>(
  deliver: (value: T) => void,
  scheduler: FrameScheduler
) {
  let disposed = false;
  let pendingFrame: number | null = null;
  let pendingValue: T | null = null;

  return {
    publish(value: T) {
      if (disposed) return;

      pendingValue = value;
      if (pendingFrame !== null) scheduler.cancel(pendingFrame);
      pendingFrame = scheduler.schedule(() => {
        pendingFrame = null;
        const valueToDeliver = pendingValue;
        pendingValue = null;
        if (!disposed && valueToDeliver !== null) deliver(valueToDeliver);
      });
    },
    dispose() {
      disposed = true;
      pendingValue = null;
      if (pendingFrame !== null) scheduler.cancel(pendingFrame);
      pendingFrame = null;
    },
  };
}

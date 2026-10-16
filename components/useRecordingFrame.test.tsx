// @vitest-environment jsdom
import { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecordingFrame } from "./useRecordingFrame";

let root: Root;
let container: HTMLDivElement;
let width = 1064;
let height = 854;
const observers: Array<{ update: () => void; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];

function Harness({ active, format = "16:9" }: { active: boolean; format?: "16:9" | "9:16" }) {
  const stage = useRef<HTMLDivElement>(null);
  const crop = useRecordingFrame(stage, format, active);
  return <>{active && <div ref={stage} />}<output>{JSON.stringify(crop)}</output></>;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  width = 1064; height = 854; observers.length = 0;
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => height);
  vi.stubGlobal("ResizeObserver", class {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(public update: () => void) { observers.push(this); }
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const frame = () => JSON.parse(container.querySelector("output")!.textContent!);

describe("recording frame lifecycle", () => {
  it("measures the canvas after leaving project home without changing format", async () => {
    await act(() => root.render(<Harness active={false} />));
    expect(observers).toHaveLength(0);
    await act(() => root.render(<Harness active />));
    expect(observers).toHaveLength(1);
    expect(frame()).toEqual({ x: 16, y: 151, w: 1032, h: 580 });
  });

  it("tracks stage resizing and disconnects when returning to project home", async () => {
    await act(() => root.render(<Harness active />));
    width = 1400;
    await act(() => observers[0].update());
    const crop = frame();
    expect(crop.x).toBeGreaterThan(0);
    expect(crop.y).toBeGreaterThanOrEqual(84);
    expect(crop.x + crop.w).toBeLessThanOrEqual(width);
    expect(crop.y + crop.h).toBeLessThanOrEqual(height - 56);
    await act(() => root.render(<Harness active={false} />));
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
  });

  it("remeasures portrait format and cleans up its previous observer", async () => {
    await act(() => root.render(<Harness active />));
    await act(() => root.render(<Harness active format="9:16" />));
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    expect(frame().h / frame().w).toBeCloseTo(16 / 9, 2);
  });
});

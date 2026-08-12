import { describe, expect, it } from "vitest";

import {
  canBeginRecording,
  filterProjects,
  formatProjectActivity,
  getRecordingReadiness,
} from "./creator-flow";
import type { SketchProject } from "./recovery-vault";

const project = (id: string, name: string): SketchProject => ({
  id,
  name,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-11T12:00:00.000Z",
  format: "16:9",
  script: "",
  webcam: { visible: true, corner: "br", sizeFrac: 0.24 },
  scene: { elements: [], files: {}, viewBackgroundColor: "#fff" },
});

describe("guided creator flow", () => {
  it("searches local projects without changing their order", () => {
    const projects = [project("one", "Launch story"), project("two", "Weekly lesson")];
    expect(filterProjects(projects, "LESS")).toEqual([projects[1]]);
    expect(filterProjects(projects, "  ")).toEqual(projects);
  });

  it("formats recent activity into useful creator-facing labels", () => {
    const now = new Date("2026-08-12T12:00:00.000Z").getTime();
    expect(formatProjectActivity("2026-08-12T11:59:30.000Z", now)).toBe("Just now");
    expect(formatProjectActivity("2026-08-12T10:00:00.000Z", now)).toBe("2h ago");
    expect(formatProjectActivity("2026-08-09T12:00:00.000Z", now)).toBe("3d ago");
  });

  it("keeps device and prompter setup optional while waiting for the local board", () => {
    const waiting = getRecordingReadiness({
      recoveryReady: true,
      boardReady: false,
      hasSession: false,
      camOn: false,
      micOn: false,
      hasScript: false,
      format: "9:16",
    });
    expect(canBeginRecording(waiting)).toBe(false);
    expect(waiting.find((item) => item.id === "devices")?.tone).toBe("optional");

    const ready = waiting.map((item) =>
      item.id === "board" ? { ...item, tone: "ready" as const } : item
    );
    expect(canBeginRecording(ready)).toBe(true);
  });
});

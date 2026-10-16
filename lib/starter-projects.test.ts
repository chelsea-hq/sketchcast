import { describe, expect, it } from "vitest";
import { parseProjectFile, serializeProjectFile } from "./project-file";
import { STARTER_PROJECTS } from "./starter-projects";

describe("original teaching starters", () => {
  it("offers three distinct, complete teaching examples", () => {
    expect(STARTER_PROJECTS.map((starter) => starter.id)).toEqual(["explain-a-process", "compare-two-ideas", "teach-a-concept"]);
    expect(new Set(STARTER_PROJECTS.map((starter) => starter.snapshot.script)).size).toBe(3);
  });

  it.each(STARTER_PROJECTS)("$name satisfies the portable project schema", (starter) => {
    const serialized = serializeProjectFile({ name: starter.name, ...starter.snapshot });
    const imported = parseProjectFile(serialized);
    expect(imported).toEqual({ name: starter.name, snapshot: starter.snapshot });
    expect(imported.snapshot.script.length).toBeGreaterThan(400);
    expect(imported.snapshot.scene.elements.length).toBeGreaterThan(10);
    expect(imported.snapshot.scene.files).toEqual({});
    expect(starter.description.length).toBeGreaterThan(30);
    expect(serialized).not.toMatch(/https?:\/\/|data:/);
  });

  it.each(STARTER_PROJECTS)("$name has editable shapes, arrows, and corresponding script text", (starter) => {
    const elements = starter.snapshot.scene.elements as Array<Record<string, unknown>>;
    expect(elements.some((element) => element.type === "rectangle")).toBe(true);
    expect(elements.some((element) => element.type === "arrow")).toBe(true);
    expect(elements.filter((element) => element.type === "text").length).toBeGreaterThan(5);
    expect(elements.every((element) => element.locked === false && element.isDeleted === false)).toBe(true);
    expect(new Set(elements.map((element) => element.id)).size).toBe(elements.length);
    const text = elements.filter((element) => element.type === "text").map((element) => element.text).join(" ").toLowerCase();
    const topic = starter.id === "explain-a-process" ? "question" : starter.id === "compare-two-ideas" ? "practice" : "temperature";
    expect(text).toContain(topic);
    expect(starter.snapshot.script.toLowerCase()).toContain(topic);
  });

  it("returns independent scene objects each time a starter file is opened", () => {
    const starter = STARTER_PROJECTS[0];
    const serialized = serializeProjectFile({ name: starter.name, ...starter.snapshot });
    const first = parseProjectFile(serialized);
    const second = parseProjectFile(serialized);
    first.snapshot.scene.elements.length = 0;
    expect(second.snapshot.scene.elements.length).toBeGreaterThan(10);
    expect(starter.snapshot.scene.elements.length).toBeGreaterThan(10);
  });
});

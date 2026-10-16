import { afterEach, describe, expect, it, vi } from "vitest";
import { parseProjectFile, PROJECT_FILE_MAX_BYTES, projectFileName, serializeProjectFile } from "./project-file";
import type { SketchProject } from "./recovery-vault";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1cAAAAASUVORK5CYII=";
// Synthetic 2 x 2 green images generated locally; no user images or metadata.
const RASTER_FIXTURES = [
  ["image/jpeg", "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAb/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCDAE6//9k="],
  ["image/gif", "R0lGODlhAgACAIAAAExpcSlpVCH5BAUAAAAALAAAAAACAAIAAAICjFMAOw=="],
  ["image/webp", "UklGRi4AAABXRUJQVlA4ICIAAAAwAQCdASoCAAIAAUAmJZgAA3AA/vD6C//+Fa/rQ/t5ydAA"],
];

function shape(id: string, type = "rectangle") {
  return {
    id, type, x: 120, y: 180, width: 240, height: 120, angle: 0,
    strokeColor: "#1e1e1e", backgroundColor: "#d3f9d8", fillStyle: "solid",
    strokeWidth: 2, strokeStyle: "solid", roughness: 1, opacity: 100,
    roundness: { type: 3 }, seed: 1319, version: 2, versionNonce: 1205,
    index: "a0", isDeleted: false, groupIds: ["lesson"], frameId: null,
    boundElements: null, updated: 1_700_000_000_000, link: null, locked: false,
  };
}

function project(): SketchProject {
  return {
    id: "project_local", name: "A lesson about systems", createdAt: "2026-10-15", updatedAt: "2026-10-15",
    syncCode: "private-recovery-code", lastSyncedAt: "2026-10-15",
    format: "9:16", script: "Start with one question.\nThen draw the relationship.",
    webcam: { visible: true, corner: "tl", sizeFrac: 0.32 },
    scene: {
      elements: [
        { ...shape("box"), boundElements: [{ id: "label", type: "text" }, { id: "arrow", type: "arrow" }] },
        { ...shape("label", "text"), x: 145, y: 210, width: 180, height: 30,
          text: "A useful system", originalText: "A useful system", fontSize: 24, fontFamily: 5,
          textAlign: "center", verticalAlign: "middle", containerId: "box", autoResize: false, lineHeight: 1.25 },
        { ...shape("arrow", "arrow"), width: 140, height: 40, points: [[0, 0], [70, -10], [140, 30]],
          startBinding: { elementId: "box", focus: 0.2, gap: 8 }, endBinding: null,
          startArrowhead: null, endArrowhead: "arrow", lastCommittedPoint: null, elbowed: false },
        { ...shape("pen", "freedraw"), points: [[0, 0], [15, 20], [30, 10]],
          pressures: [0.2, 0.5, 0.4], simulatePressure: false, lastCommittedPoint: null },
        { ...shape("photo", "image"), width: 100, height: 100, fileId: "image_one", status: "saved", scale: [-1, 1],
          crop: { x: 10, y: 10, width: 80, height: 80, naturalWidth: 100, naturalHeight: 100 } },
      ],
      files: { image_one: { id: "image_one", dataURL: PNG, mimeType: "image/png", created: 1_700_000_000_000 } },
      viewBackgroundColor: "#fffdf7",
    },
  };
}

function envelope() {
  const value = project();
  return { type: "sketchcast", version: 1, name: value.name, snapshot: { format: value.format, script: value.script, webcam: value.webcam, scene: value.scene } };
}

function imageScene(files: Array<{ id: string; width: number; height: number; byteLength?: number }>) {
  const input = envelope();
  input.snapshot.scene.elements = files.map(({ id }) => ({
    ...shape(`element_${id}`, "image"), fileId: id, status: "saved", scale: [1, 1], crop: null,
  }));
  input.snapshot.scene.files = Object.fromEntries(files.map(({ id, width, height, byteLength }) => {
    const original = Buffer.from(PNG.split(",")[1], "base64");
    const png = byteLength ? Buffer.concat([original, Buffer.alloc(byteLength - original.length)]) : original;
    png.writeUInt32BE(width, 16);
    png.writeUInt32BE(height, 20);
    return [id, { id, mimeType: "image/png", dataURL: `data:image/png;base64,${png.toString("base64")}`, created: 0 }];
  }));
  return input;
}

afterEach(() => vi.unstubAllGlobals());

describe("portable Sketchcast files", () => {
  it("round-trips drawing, bound text, arrows, pen strokes, images, script, and layout", () => {
    const source = project();
    const imported = parseProjectFile(serializeProjectFile(source));
    expect(imported.name).toBe(source.name);
    expect(imported.snapshot.format).toBe("9:16");
    expect(imported.snapshot.script).toBe(source.script);
    expect(imported.snapshot.webcam).toEqual({ visible: true, corner: "tl", sizeFrac: 0.32 });
    expect(imported.snapshot.scene.viewBackgroundColor).toBe("#fffdf7");
    expect(imported.snapshot.scene.elements).toHaveLength(5);
    expect(imported.snapshot.scene.elements[0]).toMatchObject({ type: "rectangle", width: 240, height: 120, boundElements: [{ id: "label", type: "text" }, { id: "arrow", type: "arrow" }] });
    expect(imported.snapshot.scene.elements[1]).toMatchObject({ type: "text", text: "A useful system", fontFamily: 5, containerId: "box", autoResize: false });
    expect(imported.snapshot.scene.elements[2]).toMatchObject({ type: "arrow", points: [[0, 0], [70, -10], [140, 30]], startBinding: { elementId: "box", focus: 0.2, gap: 8 }, endArrowhead: "arrow" });
    expect(imported.snapshot.scene.elements[3]).toMatchObject({ type: "freedraw", pressures: [0.2, 0.5, 0.4], simulatePressure: false });
    expect(imported.snapshot.scene.elements[4]).toMatchObject({ type: "image", scale: [-1, 1], crop: { x: 10, y: 10, width: 80, height: 80 } });
    expect(imported.snapshot.scene.files).toEqual(source.scene.files);
    expect(imported).not.toHaveProperty("id");
    expect(imported).not.toHaveProperty("syncCode");
  });

  it("does not mutate the source and accepts shared arrays in a live scene", () => {
    const source = project();
    const groups = ["same-group"];
    source.scene.elements = [{ ...shape("one"), groupIds: groups }, { ...shape("two"), groupIds: groups }];
    source.scene.files = {};
    const before = structuredClone(source);
    serializeProjectFile(source);
    expect(source).toEqual(before);
  });

  it("excludes sync, account, provider, take, customData, links, and arbitrary nested metadata", () => {
    const source = project();
    Object.assign(source, { account: { key: "account-secret" }, providerKey: "provider-secret", takes: ["take-secret"] });
    Object.assign(source.scene, { collaborators: { user: "collaborator-secret" }, apiKey: "scene-secret" });
    Object.assign(source.webcam, { token: "webcam-secret" });
    Object.assign(source.scene.elements[0] as object, { customData: { recoveryCode: "element-secret" }, link: "https://example.com/?key=link-secret", apiKey: "shape-secret" });
    Object.assign(source.scene.files.image_one as object, { customData: "file-secret", account: "file-account-secret" });
    const exported = serializeProjectFile(source);
    for (const secret of ["private-recovery-code", "account-secret", "provider-secret", "take-secret", "collaborator-secret", "scene-secret", "webcam-secret", "element-secret", "link-secret", "shape-secret", "file-secret", "file-account-secret"]) expect(exported).not.toContain(secret);
    expect(Object.keys(JSON.parse(exported))).toEqual(["type", "version", "name", "snapshot"]);
  });

  it("also sanitizes metadata supplied inside an imported file", () => {
    const input = envelope();
    Object.assign(input, { syncCode: "remote-recovery-code", account: "private-account" });
    Object.assign(input.snapshot.scene.elements[0] as object, { customData: { token: "hidden-token" } });
    const result = JSON.stringify(parseProjectFile(JSON.stringify(input)));
    expect(result).not.toContain("remote-recovery-code");
    expect(result).not.toContain("private-account");
    expect(result).not.toContain("hidden-token");
  });

  it("leaves unused embedded images and deleted elements out of exports", () => {
    const source = project();
    source.scene.files.unused = { id: "unused", dataURL: PNG, mimeType: "image/png", created: 0 };
    source.scene.elements.push({ ...shape("deleted"), isDeleted: true });
    const result = parseProjectFile(serializeProjectFile(source));
    expect(Object.keys(result.snapshot.scene.files)).toEqual(["image_one"]);
    expect(result.snapshot.scene.elements).toHaveLength(5);
  });

  it("preserves elbow arrows, fixed segments, and frame membership", () => {
    const source = project();
    source.scene.elements.push({ ...shape("frame", "frame"), name: "Lesson" });
    Object.assign(source.scene.elements[0] as object, { frameId: "frame" });
    Object.assign(source.scene.elements[2] as object, {
      elbowed: true, points: [[0, 0], [70, 0], [70, 30]],
      startBinding: { elementId: "box", focus: 0, gap: 4, fixedPoint: [1, 0.5] },
      fixedSegments: [{ start: [0, 0], end: [70, 0], index: 1 }], startIsSpecial: false, endIsSpecial: null,
    });
    const result = parseProjectFile(serializeProjectFile(source));
    expect(result.snapshot.scene.elements[0]).toHaveProperty("frameId", "frame");
    expect(result.snapshot.scene.elements[2]).toMatchObject({ elbowed: true, fixedSegments: [{ start: [0, 0], end: [70, 0], index: 1 }], startBinding: { fixedPoint: [1, 0.5] } });
  });

  it.each(RASTER_FIXTURES)("preserves real embedded %s bytes", (mimeType, encoded) => {
    const source = project();
    const file = { id: "image_one", mimeType, dataURL: `data:${mimeType};base64,${encoded}`, created: 0 };
    source.scene.files.image_one = file;
    expect(parseProjectFile(serializeProjectFile(source)).snapshot.scene.files.image_one).toEqual(file);
  });

  it("rejects small compressed payloads claiming enormous raster dimensions", () => {
    const input = envelope();
    const png = Buffer.from(PNG.split(",")[1], "base64");
    png.writeUInt32BE(16_000, 16);
    png.writeUInt32BE(16_000, 20);
    Object.assign(input.snapshot.scene.files.image_one as object, { dataURL: `data:image/png;base64,${png.toString("base64")}` });
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("40 megapixels");
    png.writeUInt32BE(100_000, 16);
    Object.assign(input.snapshot.scene.files.image_one as object, { dataURL: `data:image/png;base64,${png.toString("base64")}` });
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("image pixel width");
  });

  it("rejects aggregate raster pixels before any persistence or image decoding", () => {
    const input = imageScene([{ id: "one", width: 5_000, height: 5_000 }, { id: "two", width: 5_000, height: 5_000 }]);
    const sideEffect = vi.fn(() => { throw new Error("Unexpected browser operation"); });
    vi.stubGlobal("indexedDB", { open: sideEffect });
    vi.stubGlobal("Image", sideEffect);
    vi.stubGlobal("createImageBitmap", sideEffect);
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("total image pixel budget");
    expect(sideEffect).not.toHaveBeenCalled();
  });

  it("enforces the same aggregate pixel limit during export", () => {
    const input = imageScene([{ id: "one", width: 5_000, height: 5_000 }, { id: "two", width: 5_000, height: 5_000 }]);
    expect(() => serializeProjectFile({ name: input.name, ...input.snapshot })).toThrow("total image pixel budget");
  });

  it("counts each referenced image file once and accepts the exact 40 MP limit", () => {
    const input = imageScene([{ id: "one", width: 5_000, height: 4_000 }, { id: "two", width: 5_000, height: 4_000 }]);
    input.snapshot.scene.elements.push({ ...shape("reused", "image"), fileId: "one", status: "saved", scale: [1, 1], crop: null });
    expect(Object.keys(parseProjectFile(JSON.stringify(input)).snapshot.scene.files)).toEqual(["one", "two"]);
  });

  it("does not charge excluded unused attachments to the rendering budget", () => {
    const input = imageScene([{ id: "one", width: 5_000, height: 5_000 }, { id: "unused", width: 5_000, height: 5_000 }]);
    input.snapshot.scene.elements.pop();
    expect(Object.keys(parseProjectFile(JSON.stringify(input)).snapshot.scene.files)).toEqual(["one"]);
  });

  it("rejects more than 6 MiB of aggregate base64-decoded image bytes", () => {
    const byteLength = 3 * 1024 * 1024 + 1;
    const input = imageScene([{ id: "one", width: 1, height: 1, byteLength }, { id: "two", width: 1, height: 1, byteLength }]);
    const text = JSON.stringify(input);
    expect(new TextEncoder().encode(text).byteLength).toBeLessThan(PROJECT_FILE_MAX_BYTES);
    expect(() => parseProjectFile(text)).toThrow("total image byte budget");
  });

  it("never calls the network or touches browser storage", () => {
    const forbidden = vi.fn(() => { throw new Error("Unexpected side effect"); });
    vi.stubGlobal("fetch", forbidden);
    vi.stubGlobal("indexedDB", { open: forbidden });
    vi.stubGlobal("localStorage", { setItem: forbidden });
    parseProjectFile(serializeProjectFile(project()));
    expect(forbidden).not.toHaveBeenCalled();
  });

  it.each(["not json", "null", "[]", "{}", '{"type":"excalidraw","version":1}'])("rejects malformed or unrelated content: %s", (text) => {
    expect(() => parseProjectFile(text)).toThrow();
  });

  it.each([0, 2, "1", null])("rejects unsupported version %s", (version) => {
    expect(() => parseProjectFile(JSON.stringify({ ...envelope(), version }))).toThrow("version is not supported");
  });

  it("enforces the UTF-8 byte cap, including multibyte input", () => {
    expect(PROJECT_FILE_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(() => parseProjectFile(" ".repeat(PROJECT_FILE_MAX_BYTES + 1))).toThrow("exceeds 10 MiB");
    const multibyte = `{"note":"${"🖊".repeat(Math.floor(PROJECT_FILE_MAX_BYTES / 4) + 1)}"}`;
    expect(multibyte.length).toBeLessThan(PROJECT_FILE_MAX_BYTES);
    expect(() => parseProjectFile(multibyte)).toThrow("exceeds 10 MiB");
  });

  it.each(["__proto__", "prototype", "constructor"])("rejects nested prototype property %s", (key) => {
    const input = JSON.stringify(envelope()).replace('"version":1', `"version":1,"extra":{"${key}":{"polluted":true}}`);
    expect(() => parseProjectFile(input)).toThrow("unsafe object property");
    expect(Object.prototype).not.toHaveProperty("polluted");
  });

  it("rejects deeply nested payloads before traversing recursively", () => {
    const input = JSON.stringify(envelope()).replace('"version":1', `"version":1,"extra":${"[".repeat(100)}0${"]".repeat(100)}`);
    expect(() => parseProjectFile(input)).toThrow("too complex");
  });

  it("rejects a broad nested array before allocating a stack for every entry", () => {
    const input = { ...envelope(), extra: new Array(250_001).fill(0) };
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("too complex");
  });

  it("rejects cyclic scene metadata during export", () => {
    const source = project();
    Object.assign(source.scene, { extra: source.scene });
    expect(() => serializeProjectFile(source)).toThrow("too complex");
  });

  it("rejects giant filled shapes before invoking the drawing renderer", () => {
    const input = envelope();
    input.snapshot.scene.elements = [{ ...shape("giant"), width: 1_000_000, height: 1_000_000, fillStyle: "cross-hatch", strokeWidth: 1 }];
    const renderer = vi.fn();
    expect(() => renderer(parseProjectFile(JSON.stringify(input)))).toThrow("element width");
    expect(renderer).not.toHaveBeenCalled();
  });

  it("rejects very dense fills even when stroke width is zero", () => {
    const input = envelope();
    input.snapshot.scene.elements = [{ ...shape("dense"), width: 10_000, height: 10_000, fillStyle: "cross-hatch", strokeWidth: 0 }];
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("hatch rendering budget");
  });

  it("applies a shared hatch budget across otherwise acceptable shapes", () => {
    const input = envelope();
    input.snapshot.scene.elements = Array.from({ length: 140 }, (_, i) => ({ ...shape(`hatched_${i}`), width: 400, height: 200, fillStyle: "cross-hatch", strokeWidth: 2 }));
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("hatch rendering budget");
    expect(() => serializeProjectFile({ name: input.name, ...input.snapshot })).toThrow("hatch rendering budget");
  });

  it("preserves ordinary hatched teaching diagrams without clamping", () => {
    const input = envelope();
    input.snapshot.scene.elements = Array.from({ length: 12 }, (_, i) => ({ ...shape(`hatched_${i}`), width: 400, height: 200, fillStyle: "cross-hatch", strokeWidth: 2 }));
    const result = parseProjectFile(JSON.stringify(input));
    expect(result.snapshot.scene.elements).toHaveLength(12);
    expect(result.snapshot.scene.elements[0]).toMatchObject({ width: 400, height: 200, fillStyle: "cross-hatch", strokeWidth: 2 });
  });

  it("validates actual point extents instead of trusting a path's declared size", () => {
    const input = envelope();
    input.snapshot.scene.elements = [{ ...shape("wide_path", "line"), width: 1, height: 1, points: [[-16_000, 0], [16_000, 0]] }];
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("drawing point extent");
  });

  it("charges complex filled paths for potential repeated hatch intersections", () => {
    const input = envelope();
    const points = Array.from({ length: 100 }, (_, i) => [i % 2 === 0 ? 0 : 1_000, i * 10]);
    points.push([0, 0]);
    input.snapshot.scene.elements = [{ ...shape("complex_path", "line"), width: 1_000, height: 1_000, fillStyle: "cross-hatch", strokeWidth: 2, points }];
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("hatch rendering budget");
  });

  it.each([
    { type: "iframe" }, { type: "embeddable" }, { type: "unknown" },
    { x: "100" }, { y: null }, { width: -1 }, { height: 1_000_001 },
    { opacity: 101 }, { roughness: -1 }, { strokeWidth: "thin" },
    { id: "__proto__" }, { groupIds: "group" }, { roundness: { type: 9 } },
    { boundElements: [{ id: "label", type: "iframe" }] },
  ])("rejects invalid drawing fields %j", (patch) => {
    const input = envelope();
    Object.assign(input.snapshot.scene.elements[0] as object, patch);
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow();
  });

  it.each([NaN, Infinity, -Infinity])("rejects nonfinite dimensions on export: %s", (width) => {
    const input = project();
    Object.assign(input.scene.elements[0] as object, { width });
    expect(() => serializeProjectFile(input)).toThrow("element width");
  });

  it.each([
    { points: [[0, 0], ["5", 2]] }, { points: [[0, 0]] },
    { points: [[0, 0], [10, 20, 30]] },
    { startBinding: { elementId: "box", focus: 8, gap: 1 } },
  ])("rejects invalid line geometry %j", (patch) => {
    const input = envelope();
    Object.assign(input.snapshot.scene.elements[2] as object, patch);
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow();
  });

  it.each([
    { format: "4:3" }, { script: 8 }, { script: "a".repeat(100_001) },
    { webcam: { visible: "yes", corner: "br", sizeFrac: 0.2 } },
    { webcam: { visible: true, corner: "center", sizeFrac: 0.2 } },
    { webcam: { visible: true, corner: "br", sizeFrac: 0.9 } },
  ])("rejects invalid project layout or script", (patch) => {
    const input = envelope();
    Object.assign(input.snapshot, patch);
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow();
  });

  it.each(["", " ", "x".repeat(81), "line\nbreak"])("rejects invalid project names", (name) => {
    expect(() => parseProjectFile(JSON.stringify({ ...envelope(), name }))).toThrow("project name");
  });

  it.each([
    { dataURL: "https://example.com/tracker.png" },
    { dataURL: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", mimeType: "image/svg+xml" },
    { dataURL: "data:image/png;base64,PHN2Zz48L3N2Zz4=" },
    { dataURL: "data:image/png;base64,not base64!!!!" },
    { dataURL: PNG, mimeType: "image/jpeg" }, { id: "different_image" },
  ])("rejects unsafe or mismatched image data", (patch) => {
    const input = envelope();
    Object.assign(input.snapshot.scene.files.image_one as object, patch);
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow();
  });

  it("rejects missing image data, duplicate IDs, and excessive element count", () => {
    const input = envelope();
    input.snapshot.scene.files = {};
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("image file is missing");
    input.snapshot.scene.elements = [shape("same"), shape("same")];
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("duplicate element IDs");
    input.snapshot.scene.elements = Array.from({ length: 5_001 }, (_, i) => shape(`id_${i}`));
    expect(() => parseProjectFile(JSON.stringify(input))).toThrow("board elements");
  });

  it("produces a path-free filename with a safe fallback and bounded length", () => {
    expect(projectFileName("../My Lesson: Start / Finish")).toBe("sketchcast-My-Lesson-Start-Finish.sketchcast");
    expect(projectFileName("Crème brûlée")).toBe("sketchcast-Creme-brulee.sketchcast");
    expect(projectFileName("🖊")).toBe("sketchcast-project.sketchcast");
    expect(projectFileName("x".repeat(500)).length).toBeLessThan(100);
    expect(projectFileName("CON")).toBe("sketchcast-CON.sketchcast");
  });
});

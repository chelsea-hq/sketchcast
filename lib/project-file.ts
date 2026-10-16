import type { ProjectSnapshot, SketchProject } from "./recovery-vault";

export const PROJECT_FILE_MAX_BYTES = 10 * 1024 * 1024;
const MAX_ELEMENTS = 5_000;
const MAX_POINTS = 20_000;
const MAX_SCRIPT_LENGTH = 100_000;
const MAX_COORDINATE = 100_000;
const MAX_ELEMENT_DIMENSION = 16_384;
const MAX_HATCH_WORK = 20_000;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const ELEMENT_TYPES = ["rectangle", "diamond", "ellipse", "text", "line", "arrow", "freedraw", "image", "frame"] as const;
const ARROWHEADS = ["arrow", "bar", "dot", "circle", "circle_outline", "triangle", "triangle_outline", "diamond", "diamond_outline", "crowfoot_one", "crowfoot_many", "crowfoot_one_or_many"] as const;
type JsonObject = Record<string, unknown>;
type PortableProject = Pick<SketchProject, "name" | "format" | "script" | "webcam" | "scene">;

function invalid(field: string): never {
  // Only caller-owned field names belong in errors, never untrusted values.
  throw new Error(`Invalid Sketchcast file: ${field}.`);
}

function object(value: unknown, field: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(field);
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) invalid(field);
  return value as JsonObject;
}

/** Bound nesting/work even for fields that will be excluded from the file. */
function inspectStructure(value: unknown): void {
  const stack = [{ value, depth: 0 }];
  let remainingNodes = 250_000;
  let textLength = 0;
  while (stack.length) {
    const entry = stack.pop();
    if (!entry) break;
    if (--remainingNodes < 0 || entry.depth > 32) invalid("the project is too complex");
    if (typeof entry.value === "string") {
      textLength += entry.value.length;
      if (textLength > PROJECT_FILE_MAX_BYTES) invalid("the project exceeds 10 MiB");
    }
    if (entry.value === null || entry.value === undefined || typeof entry.value !== "object") continue;
    if (!Array.isArray(entry.value)) object(entry.value, "object structure");
    // Reject broad payloads before allocating a traversal stack for every item.
    if (Array.isArray(entry.value) && entry.value.length > remainingNodes - stack.length) invalid("the project is too complex");
    const keys = Object.keys(entry.value);
    if (keys.length > remainingNodes - stack.length) invalid("the project is too complex");
    for (const key of keys) {
      if (FORBIDDEN_KEYS.has(key)) invalid("unsafe object property");
      const child: unknown = (entry.value as JsonObject)[key];
      stack.push({ value: child, depth: entry.depth + 1 });
    }
  }
}

function string(value: unknown, field: string, maximum = 128): string {
  if (typeof value !== "string" || value.length > maximum) invalid(field);
  return value;
}

function identifier(value: unknown, field: string): string {
  const result = string(value, field);
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(result) || FORBIDDEN_KEYS.has(result)) invalid(field);
  return result;
}

function nullableId(value: unknown, field: string): string | null {
  return value === null || value === undefined ? null : identifier(value, field);
}

function number(value: unknown, field: string, minimum: number, maximum: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum || (integer && !Number.isInteger(value))) invalid(field);
  return value;
}

function boolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") invalid(field);
  return value;
}

function choice<T extends string>(value: unknown, values: readonly T[], field: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) invalid(field);
  return value as T;
}

function array(value: unknown, field: string, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length > maximum) invalid(field);
  return value;
}

function color(value: unknown, field: string): string {
  const result = string(value, field, 80);
  if (!/^(?:#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|[a-z]{1,24}|(?:rgb|hsl)a?\([\d.,%\s+-]+\))$/i.test(result)) invalid(field);
  return result;
}

function point(value: unknown): [number, number] {
  const pair = array(value, "drawing point", 2);
  if (pair.length !== 2) invalid("drawing point");
  return [number(pair[0], "point x", -MAX_ELEMENT_DIMENSION, MAX_ELEMENT_DIMENSION), number(pair[1], "point y", -MAX_ELEMENT_DIMENSION, MAX_ELEMENT_DIMENSION)];
}

function binding(value: unknown): JsonObject | null {
  if (value === null || value === undefined) return null;
  const source = object(value, "arrow binding");
  const result: JsonObject = {
    elementId: identifier(source.elementId, "binding element ID"),
    focus: number(source.focus, "binding focus", -1, 1),
    gap: number(source.gap, "binding gap", 0, MAX_COORDINATE),
  };
  if (source.fixedPoint !== undefined) {
    const pair = point(source.fixedPoint);
    result.fixedPoint = pair.map((part) => number(part, "binding fixed point", 0, 1));
  }
  return result;
}

function roundness(value: unknown): JsonObject | null {
  if (value === null || value === undefined) return null;
  const source = object(value, "roundness");
  const result: JsonObject = { type: number(source.type, "roundness type", 1, 3, true) };
  if (source.value !== undefined) result.value = number(source.value, "roundness value", 0, MAX_COORDINATE);
  return result;
}

function crop(value: unknown): JsonObject | null {
  if (value === null || value === undefined) return null;
  const source = object(value, "image crop");
  const result = {
    x: number(source.x, "crop x", 0, MAX_COORDINATE),
    y: number(source.y, "crop y", 0, MAX_COORDINATE),
    width: number(source.width, "crop width", 0.001, MAX_COORDINATE),
    height: number(source.height, "crop height", 0.001, MAX_COORDINATE),
    naturalWidth: number(source.naturalWidth, "image natural width", 0.001, MAX_COORDINATE),
    naturalHeight: number(source.naturalHeight, "image natural height", 0.001, MAX_COORDINATE),
  };
  if (result.x + result.width > result.naturalWidth + 0.01 || result.y + result.height > result.naturalHeight + 0.01) invalid("image crop bounds");
  return result;
}

/**
 * Excalidraw 0.18 fields, rebuilt from an allowlist. Its restoreElements helper
 * preserves unknown properties, so it cannot serve as a file security boundary.
 * No package runtime import: these helpers also run in Node without a DOM.
 */
function element(value: unknown): JsonObject {
  const source = object(value, "drawing element");
  const type = choice(source.type, ELEMENT_TYPES, "unsupported drawing type (use shapes, text, or raster images)");
  const result: JsonObject = {
    id: identifier(source.id, "element ID"), type,
    x: number(source.x, "element x", -MAX_COORDINATE, MAX_COORDINATE),
    y: number(source.y, "element y", -MAX_COORDINATE, MAX_COORDINATE),
    width: number(source.width, "element width", 0, MAX_ELEMENT_DIMENSION),
    height: number(source.height, "element height", 0, MAX_ELEMENT_DIMENSION),
    angle: number(source.angle ?? 0, "element angle", -MAX_COORDINATE, MAX_COORDINATE),
    strokeColor: color(source.strokeColor ?? "#1e1e1e", "stroke color"),
    backgroundColor: color(source.backgroundColor ?? "transparent", "fill color"),
    fillStyle: choice(source.fillStyle ?? "solid", ["solid", "hachure", "cross-hatch", "zigzag"], "fill style"),
    strokeWidth: number(source.strokeWidth ?? 1, "stroke width", 0, 100),
    strokeStyle: choice(source.strokeStyle ?? "solid", ["solid", "dashed", "dotted"], "stroke style"),
    roughness: number(source.roughness ?? 1, "roughness", 0, 10),
    opacity: number(source.opacity ?? 100, "opacity", 0, 100),
    roundness: roundness(source.roundness),
    seed: number(source.seed ?? 1, "element seed", 0, 2 ** 32 - 1, true),
    version: number(source.version ?? 1, "element version", 1, Number.MAX_SAFE_INTEGER, true),
    versionNonce: number(source.versionNonce ?? 0, "version nonce", 0, 2 ** 32 - 1, true),
    // Scene order is the portable ordering authority. Excalidraw normalizes indices.
    index: null,
    isDeleted: boolean(source.isDeleted ?? false, "deleted state"),
    groupIds: array(source.groupIds ?? [], "element groups", 100).map((id) => identifier(id, "group ID")),
    frameId: nullableId(source.frameId, "frame ID"),
    boundElements: source.boundElements == null ? null : array(source.boundElements, "bound elements", MAX_ELEMENTS).map((value) => {
      const bound = object(value, "bound element");
      return { id: identifier(bound.id, "bound element ID"), type: choice(bound.type, ["text", "arrow"], "bound element type") };
    }),
    updated: number(source.updated ?? 0, "element timestamp", 0, Number.MAX_SAFE_INTEGER, true),
    link: null,
    locked: boolean(source.locked ?? false, "locked state"),
  };
  if (type === "text") {
    const text = string(source.text, "drawing text", MAX_SCRIPT_LENGTH);
    const fontFamily = number(source.fontFamily, "font family", 1, 9, true);
    if (fontFamily === 4) invalid("unsupported font family");
    Object.assign(result, {
      text, originalText: string(source.originalText ?? text, "original drawing text", MAX_SCRIPT_LENGTH),
      fontSize: number(source.fontSize, "font size", 1, 1_000),
      fontFamily,
      textAlign: choice(source.textAlign ?? "left", ["left", "center", "right"], "text alignment"),
      verticalAlign: choice(source.verticalAlign ?? "top", ["top", "middle", "bottom"], "vertical alignment"),
      containerId: nullableId(source.containerId, "text container ID"),
      autoResize: boolean(source.autoResize ?? true, "text resizing"),
      lineHeight: number(source.lineHeight ?? 1.25, "line height", 0.1, 10),
    });
  }
  if (type === "line" || type === "arrow" || type === "freedraw") {
    const points = array(source.points, "drawing points", MAX_POINTS).map(point);
    if (points.length < (type === "freedraw" ? 1 : 2)) invalid("not enough drawing points");
    Object.assign(result, { points, lastCommittedPoint: null });
    if (type === "freedraw") {
      const pressures = array(source.pressures ?? [], "drawing pressures", MAX_POINTS).map((value) => number(value, "drawing pressure", 0, 1));
      if (pressures.length !== 0 && pressures.length !== points.length) invalid("drawing pressure count");
      Object.assign(result, { pressures, simulatePressure: boolean(source.simulatePressure ?? true, "simulated pressure") });
    } else {
      Object.assign(result, {
        startBinding: binding(source.startBinding), endBinding: binding(source.endBinding),
        startArrowhead: source.startArrowhead == null ? null : choice(source.startArrowhead, ARROWHEADS, "start arrowhead"),
        endArrowhead: source.endArrowhead == null ? null : choice(source.endArrowhead, ARROWHEADS, "end arrowhead"),
      });
      if (type === "arrow") {
        result.elbowed = boolean(source.elbowed ?? false, "elbow arrow");
        if (result.elbowed) {
          result.fixedSegments = source.fixedSegments == null ? null : array(source.fixedSegments, "fixed arrow segments", MAX_POINTS).map((value) => {
            const segment = object(value, "fixed arrow segment");
            return { start: point(segment.start), end: point(segment.end), index: number(segment.index, "segment index", 1, points.length - 1, true) };
          });
          result.startIsSpecial = source.startIsSpecial == null ? null : boolean(source.startIsSpecial, "arrow start");
          result.endIsSpecial = source.endIsSpecial == null ? null : boolean(source.endIsSpecial, "arrow end");
        }
      }
    }
  }
  if (type === "image") {
    const scale = point(source.scale ?? [1, 1]);
    if (!scale.every((value) => value === -1 || value === 1)) invalid("image scale");
    Object.assign(result, { fileId: identifier(source.fileId, "image file ID"), status: "saved", scale, crop: crop(source.crop) });
  }
  if (type === "frame") result.name = source.name == null ? null : string(source.name, "frame name", 200);
  return result;
}

/**
 * Conservative work proxy for the installed Excalidraw/roughjs renderer, not a
 * runtime memory guarantee. Excalidraw sets hachureGap=strokeWidth*4; roughjs
 * floors that gap at 0.1 and draws a second pass for cross-hatch/zigzag fills.
 * Filled paths can intersect a scanline repeatedly, so their point count adds
 * an intersection factor. Check before restore/preview; never clamp artwork.
 */
function checkGeometryBudget(elements: JsonObject[]): void {
  let hatchWork = 0;
  for (const current of elements) {
    let width = number(current.width, "element width", 0, MAX_ELEMENT_DIMENSION);
    let height = number(current.height, "element height", 0, MAX_ELEMENT_DIMENSION);
    let intersections = 1;
    if (Array.isArray(current.points)) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      // element() already validates every tuple and bounds the array length.
      for (const [x, y] of current.points as [number, number][]) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
      const spanX = number(maxX - minX, "drawing point extent", 0, MAX_ELEMENT_DIMENSION);
      const spanY = number(maxY - minY, "drawing point extent", 0, MAX_ELEMENT_DIMENSION);
      width = Math.max(width, spanX);
      height = Math.max(height, spanY);
      intersections = Math.max(1, Math.ceil(current.points.length / 2));
    }
    if (current.backgroundColor === "transparent" || current.fillStyle === "solid") continue;
    if (!["rectangle", "diamond", "ellipse", "line", "freedraw"].includes(String(current.type))) continue;
    const gap = Math.max(number(current.strokeWidth, "stroke width", 0, 100) * 4, 0.1);
    const passes = current.fillStyle === "cross-hatch" || current.fillStyle === "zigzag" ? 2 : 1;
    hatchWork += Math.ceil((width + height) / gap) * passes * intersections;
    if (hatchWork > MAX_HATCH_WORK) invalid("the board exceeds the hatch rendering budget; use fewer, smaller, or solid-filled shapes");
  }
}

/** Read raster dimensions without creating an Image, canvas, URL, or request. */
function imageDimensions(bytes: string, mimeType: string): [number, number] {
  const byte = (offset: number) => bytes.charCodeAt(offset);
  const u16 = (offset: number) => byte(offset) * 256 + byte(offset + 1);
  const little24 = (offset: number) => byte(offset) + byte(offset + 1) * 256 + byte(offset + 2) * 65_536;
  if (mimeType === "image/png" && bytes.startsWith("\x89PNG\r\n\x1a\n") && bytes.slice(12, 16) === "IHDR") {
    const u32 = (offset: number) => u16(offset) * 65_536 + u16(offset + 2);
    return [u32(16), u32(20)];
  }
  if (mimeType === "image/gif" && /^GIF8[79]a/.test(bytes)) {
    return [byte(6) + byte(7) * 256, byte(8) + byte(9) * 256];
  }
  if (mimeType === "image/webp" && bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP") {
    const chunk = bytes.slice(12, 16);
    if (chunk === "VP8X" && bytes.length >= 30) return [little24(24) + 1, little24(27) + 1];
    if (chunk === "VP8L" && bytes.length >= 25 && byte(20) === 0x2f) {
      return [1 + byte(21) + ((byte(22) & 0x3f) << 8), 1 + (byte(22) >> 6) + (byte(23) << 2) + ((byte(24) & 0x0f) << 10)];
    }
    if (chunk === "VP8 " && bytes.length >= 30 && bytes.slice(23, 26) === "\x9d\x01\x2a") {
      return [(byte(26) + byte(27) * 256) & 0x3fff, (byte(28) + byte(29) * 256) & 0x3fff];
    }
  }
  if (mimeType === "image/jpeg" && bytes.startsWith("\xff\xd8\xff")) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (byte(offset++) !== 0xff) break;
      while (byte(offset) === 0xff) offset++;
      const marker = byte(offset++);
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
      const length = u16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 8) {
        return [u16(offset + 5), u16(offset + 3)];
      }
      offset += length;
    }
  }
  return invalid("image content does not match its raster format");
}

function imageFile(value: unknown, id: string): { file: JsonObject; pixels: number; bytes: number } {
  const source = object(value, "embedded image");
  if (identifier(source.id, "image ID") !== id) invalid("image ID mismatch");
  const mimeType = choice(source.mimeType, ["image/png", "image/jpeg", "image/webp", "image/gif"], "only embedded PNG, JPEG, WebP, and GIF images are supported");
  const dataURL = string(source.dataURL, "image data", PROJECT_FILE_MAX_BYTES);
  const prefix = `data:${mimeType};base64,`;
  if (!dataURL.startsWith(prefix)) invalid("image must use embedded raster data, not a remote URL");
  const encoded = dataURL.slice(prefix.length);
  if (encoded.length < 16 || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) invalid("image base64 data");
  // Check the signature rather than trusting a renamed data URL or MIME field.
  const bytes = atob(encoded);
  const [width, height] = imageDimensions(bytes, mimeType);
  number(width, "image pixel width", 1, 16_384, true);
  number(height, "image pixel height", 1, 16_384, true);
  const pixels = width * height;
  if (pixels > MAX_IMAGE_PIXELS) invalid("images must be no larger than 40 megapixels");
  return {
    file: { id, mimeType, dataURL, created: number(source.created ?? 0, "image timestamp", 0, Number.MAX_SAFE_INTEGER, true) },
    pixels,
    bytes: bytes.length,
  };
}

function snapshot(value: unknown): ProjectSnapshot {
  const source = object(value, "project snapshot");
  const webcam = object(source.webcam, "webcam layout");
  const scene = object(source.scene, "board scene");
  const elements = array(scene.elements, "board elements", MAX_ELEMENTS).map(element).filter((value) => !value.isDeleted);
  checkGeometryBudget(elements);
  const ids = new Set(elements.map((value) => value.id));
  if (ids.size !== elements.length) invalid("duplicate element IDs");
  const sourceFiles = object(scene.files, "image files");
  const files: Record<string, unknown> = {};
  const usedFiles = new Set(elements.filter((value) => value.type === "image").map((value) => value.fileId));
  let imagePixels = 0;
  let imageBytes = 0;
  if (Object.keys(sourceFiles).length > 500) invalid("too many embedded images");
  for (const [key, value] of Object.entries(sourceFiles)) {
    const id = identifier(key, "image file key");
    const image = imageFile(value, id);
    if (usedFiles.has(id)) {
      // Count unique file entries, not image elements. This budget is checked
      // before the caller can persist the scene or create browser image decoders.
      imagePixels += image.pixels;
      imageBytes += image.bytes;
      if (imagePixels > MAX_IMAGE_PIXELS) invalid("total image pixel budget exceeds 40 megapixels");
      if (imageBytes > MAX_IMAGE_BYTES) invalid("total image byte budget exceeds 6 MiB");
      files[id] = image.file;
    }
  }
  for (const current of elements) {
    if (current.type === "image" && !Object.hasOwn(files, String(current.fileId))) invalid("an image file is missing");
    // Deleted shapes can leave stale references in otherwise valid saved scenes.
    if (current.frameId && !ids.has(current.frameId)) current.frameId = null;
    if (current.containerId && !ids.has(current.containerId)) current.containerId = null;
    if (Array.isArray(current.boundElements)) current.boundElements = current.boundElements.filter((bound: { id: string }) => ids.has(bound.id));
    for (const key of ["startBinding", "endBinding"]) {
      const bound = current[key];
      if (bound && !ids.has(object(bound, "binding").elementId)) current[key] = null;
    }
  }
  return {
    format: choice(source.format, ["16:9", "9:16", "1:1"], "output format"),
    script: string(source.script, "script (maximum 100,000 characters)", MAX_SCRIPT_LENGTH),
    webcam: {
      visible: boolean(webcam.visible, "webcam visibility"),
      corner: choice(webcam.corner, ["br", "bl", "tr", "tl"], "webcam corner"),
      sizeFrac: number(webcam.sizeFrac, "webcam size", 0.12, 0.45),
    },
    scene: { elements, files, viewBackgroundColor: color(scene.viewBackgroundColor, "board background") },
  };
}

function projectName(value: unknown): string {
  const result = string(value, "project name (maximum 80 characters)", 80).trim();
  if (!result || /[\u0000-\u001f\u007f]/.test(result)) invalid("project name");
  return result;
}

/** Creates an unencrypted content file. Takes, credentials and sync state stay out. */
export function serializeProjectFile(project: PortableProject): string {
  // Do not traverse unrelated project/account/take fields, even when a caller
  // supplies a larger vault object. Only approved content crosses this boundary.
  const content = { name: project.name, snapshot: { format: project.format, script: project.script, webcam: project.webcam, scene: project.scene } };
  inspectStructure(content);
  const result = JSON.stringify({ type: "sketchcast", version: 1, name: projectName(content.name), snapshot: snapshot(content.snapshot) }, null, 2);
  if (new TextEncoder().encode(result).byteLength > PROJECT_FILE_MAX_BYTES) invalid("the project exceeds 10 MiB");
  return result;
}

/** Validates before the caller creates a new independent local project. */
export function parseProjectFile(text: string): { name: string; snapshot: ProjectSnapshot } {
  if (typeof text !== "string" || text.length > PROJECT_FILE_MAX_BYTES || new TextEncoder().encode(text).byteLength > PROJECT_FILE_MAX_BYTES) invalid("the file exceeds 10 MiB");
  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch {
    throw new Error("This is not a valid Sketchcast JSON file.");
  }
  inspectStructure(decoded);
  const content = object(decoded, "file structure");
  if (content.type !== "sketchcast") invalid("this is not a Sketchcast project");
  if (content.version !== 1) throw new Error("This Sketchcast file version is not supported. Update Sketchcast or use a version 1 file.");
  return { name: projectName(content.name), snapshot: snapshot(content.snapshot) };
}

/** A path-free, cross-platform filename; the original name stays inside the file. */
export function projectFileName(name: string): string {
  const safe = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
  return `sketchcast-${safe || "project"}.sketchcast`;
}

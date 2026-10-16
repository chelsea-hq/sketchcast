import { afterEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it("configures board font requests to use the same origin", async () => {
  const browser: { EXCALIDRAW_ASSET_PATH?: string } = {};
  vi.stubGlobal("window", browser);
  await import("./excalidraw-assets");
  expect(browser.EXCALIDRAW_ASSET_PATH).toBe("/excalidraw/");
});

it("prepares the installed font bytes in a fresh public asset directory", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "sketchcast-fonts-"));
  try {
    execFileSync(process.execPath, ["scripts/prepare-board-assets.mjs", directory]);
    const font = "fonts/Excalifont/Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2";
    const installed = await readFile(path.join("node_modules/@excalidraw/excalidraw/dist/prod", font));
    expect(await readFile(path.join(directory, font))).toEqual(installed);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

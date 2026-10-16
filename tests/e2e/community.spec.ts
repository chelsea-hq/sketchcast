import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function home(page: Page) {
  await page.goto("/studio");
  await expect(page.getByText("Recovery Vault ready on this device")).toBeVisible();
}

async function projects(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("sketchcast-recovery");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<Array<{ id: string; name: string; script: string; scene: { elements: unknown[]; files: Record<string, unknown> } }>>((resolve, reject) => {
        const request = db.transaction("drafts").objectStore("drafts").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  });
}

test.beforeEach(async ({ context }) => {
  // Browser fixtures are synthetic. Prevent any provider, auth, billing or
  // third-party request even if a developer has configured hosted services.
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.hostname === "127.0.0.1" || url.protocol === "blob:" || url.protocol === "data:"
      ? route.continue() : route.abort();
  });
});

test("starters, live previews, duplicate, and reload-to-create preserve the board", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await home(page);
  await expect(page.getByRole("button", { name: /Explain a process/ }).locator("img")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("project-home-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: /Explain a process/ }).click();
  await expect(page.getByPlaceholder(/Write or paste your script/)).toHaveValue(/A first draft starts/);
  await expect(page.locator(".excalidraw canvas").first()).toBeVisible();
  const untouched = (await projects(page)).find((project) => project.name === "Explain a process")!;
  const editedScript = `${untouched.script}\n\nMy own closing example.`;
  await page.getByPlaceholder(/Write or paste your script/).fill(editedScript);
  const rectangleTool = page.getByRole("radio", { name: "Rectangle", exact: true });
  // Excalidraw's visible label/icon covers its native radio input.
  await page.locator("label").filter({ has: rectangleTool }).click();
  await expect(rectangleTool).toBeChecked();
  const canvas = (await page.locator(".excalidraw canvas").first().boundingBox())!;
  const start = { x: canvas.x + canvas.width * 0.65, y: canvas.y + 100 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 120, start.y + 80, { steps: 5 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Back to projects" }).click();
  await expect(page.getByRole("article", { name: "Explain a process", exact: true }).locator("img")).toBeVisible();
  const original = (await projects(page)).find((project) => project.name === "Explain a process")!;
  expect(original.scene.elements).toHaveLength(untouched.scene.elements.length + 1);
  expect(original.script).toBe(editedScript);
  await page.reload();
  await expect(page.getByText("Recovery Vault ready on this device")).toBeVisible();
  await page.getByRole("button", { name: /Start from scratch/ }).click();
  await page.getByLabel("Project name").fill("A new blank lesson");
  await page.getByRole("button", { name: "Create and prepare" }).click();
  await expect(page.getByRole("combobox", { name: "Active project" })).toHaveValue(/project_/);
  await expect.poll(async () => (await projects(page)).length).toBe(3);
  const preserved = (await projects(page)).find((project) => project.id === original.id)!;
  expect(preserved.scene).toEqual(original.scene);
  expect(preserved.script).toBe(original.script);
  await page.getByRole("button", { name: "Back to projects" }).click();
  await page.getByRole("button", { name: "Duplicate Explain a process", exact: true }).click();
  await expect(page.getByPlaceholder(/Write or paste your script/)).toHaveValue(original.script);
  const copy = (await projects(page)).find((project) => project.name === "Explain a process (copy)")!;
  expect(copy.id).not.toBe(original.id);
  expect(copy.scene.elements).toHaveLength(original.scene.elements.length);
  await page.getByRole("button", { name: "Back to projects" }).click();
  const existingIds = new Set((await projects(page)).map((project) => project.id));
  await page.getByRole("button", { name: /^Explain a process/ }).click();
  await expect(page.getByPlaceholder(/Write or paste your script/)).toHaveValue(untouched.script);
  const reused = (await projects(page)).find((project) => !existingIds.has(project.id))!;
  expect(reused.scene.elements).toHaveLength(untouched.scene.elements.length);
  expect(errors).toEqual([]);
});

test("project file roundtrip works in a fresh browser and rejects malformed input", async ({ page, browser }, testInfo) => {
  await home(page);
  await page.getByRole("button", { name: /Compare two ideas/ }).click();
  await expect(page.getByPlaceholder(/Write or paste your script/)).toHaveValue(/Practice and performance/);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download project", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.sketchcast$/);
  const content = await readFile((await download.path())!, "utf8");
  const file = JSON.parse(content);
  expect(Object.keys(file).sort()).toEqual(["name", "snapshot", "type", "version"]);
  expect(content).not.toMatch(/syncCode|lastSyncedAt|apiKey/);
  // Add a real browser-encoded raster fixture to exercise image restoration.
  const dataURL = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 40; canvas.height = 30;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#7657ff"; ctx.fillRect(0, 0, 40, 30);
    return canvas.toDataURL("image/png");
  });
  file.snapshot.scene.files.fixture = { id: "fixture", dataURL, mimeType: "image/png", created: 1 };
  file.snapshot.scene.elements.push({
    ...file.snapshot.scene.elements.find((element: { type: string }) => element.type === "rectangle"),
    id: "fixture-image", type: "image", x: 100, y: 650, width: 120, height: 90,
    fileId: "fixture", scale: [1, 1], status: "saved", crop: null,
  });
  const withImage = JSON.stringify(file);

  const fresh = await browser.newContext();
  try {
    await fresh.route("**/*", (route) => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
    const other = await fresh.newPage();
    await home(other);
    await other.getByRole("button", { name: "Import project", exact: true }).click();
    await expect(other.getByRole("dialog")).toBeVisible();
    await other.getByLabel("Project file · up to 10 MiB").setInputFiles({ name: "broken.sketchcast", mimeType: "application/json", buffer: Buffer.from('{"type":"wrong"}') });
    await expect(other.getByRole("dialog").getByRole("alert")).toBeVisible();
    await expect(other.getByRole("button", { name: "Import as new project" })).toBeDisabled();
    expect(await projects(other)).toHaveLength(1);
    await other.getByLabel("Project file · up to 10 MiB").setInputFiles({ name: "lesson.sketchcast", mimeType: "application/json", buffer: Buffer.from(withImage) });
    await expect(other.getByRole("button", { name: "Import as new project" })).toBeEnabled();
    await other.screenshot({ path: testInfo.outputPath("project-import.png") });
    const mutations: string[] = [];
    other.on("request", (request) => { if (request.method() === "POST" && request.url().includes("/api/")) mutations.push(request.url()); });
    await other.getByRole("button", { name: "Import as new project" }).click();
    await expect(other.getByPlaceholder(/Write or paste your script/)).toHaveValue(file.snapshot.script);
    const imported = (await projects(other)).find((project) => project.name === file.name)!;
    expect(imported.scene.elements).toHaveLength(file.snapshot.scene.elements.length);
    expect(imported.scene.files.fixture).toEqual(file.snapshot.scene.files.fixture);
    expect(mutations).toEqual([]);
    await other.reload();
    await expect(other.getByRole("button", { name: `Open ${file.name}`, exact: true })).toBeVisible();
  } finally { await fresh.close(); }
});

test("mobile preparation, modal keyboard behavior, search and sort", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await home(page);
  await page.getByRole("button", { name: "Import project", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Import project", exact: true })).toBeFocused();
  await page.getByLabel("Search projects").fill("no matching lesson");
  await expect(page.getByText(/No projects match/)).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByLabel("Sort projects").selectOption("name");
  await page.locator("main").evaluate((element) => { element.scrollTop = 0; });
  await page.screenshot({ path: testInfo.outputPath("project-home-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: /Teach a concept/ }).click();
  await expect(page.getByPlaceholder(/Write or paste your script/)).toHaveValue(/feedback loop/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const downloadBounds = await page.getByRole("button", { name: "Download project", exact: true }).boundingBox();
  const projectBounds = await page.getByRole("combobox", { name: "Active project" }).boundingBox();
  expect(downloadBounds!.width).toBeGreaterThanOrEqual(40);
  expect(projectBounds!.width).toBeGreaterThanOrEqual(60);
});

test("starter records a board-only take that can be downloaded", async ({ page }, testInfo) => {
  await home(page);
  await page.getByRole("button", { name: /Explain a process/ }).click();
  await expect(page.locator(".excalidraw canvas").first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("starter-studio.png") });
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await expect(page.getByRole("button", { name: /Stop/ })).toBeVisible();
  await expect(page.getByText("00:02", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Stop/ }).click();
  await expect(page.getByText("Saved to the Recovery Vault on this device.", { exact: true })).toBeVisible();
  const playback = page.locator("video[controls]").last();
  await expect(playback).toBeVisible();
  await expect.poll(() => playback.evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(2);
  expect(await playback.evaluate((video: HTMLVideoElement) => ({ width: video.videoWidth, height: video.videoHeight })))
    .toEqual({ width: 1920, height: 1080 });
  await playback.evaluate(async (video: HTMLVideoElement) => {
    video.currentTime = 0;
    await video.play();
  });
  await expect.poll(() => playback.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(0.25);
  expect(await playback.evaluate((video: HTMLVideoElement) => video.error)).toBeNull();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download original" }).click();
  const download = await downloadEvent;
  const data = await readFile((await download.path())!);
  expect(data.byteLength).toBeGreaterThan(1000);
  await download.saveAs(testInfo.outputPath(download.suggestedFilename()));
  await page.screenshot({ path: testInfo.outputPath("recorded-take.png") });
});

test("a browser recording error returns to idle without saving a partial take", async ({ page }) => {
  await page.addInitScript(() => {
    const start = MediaRecorder.prototype.start;
    MediaRecorder.prototype.start = function (timeslice?: number) {
      start.call(this, timeslice);
      setTimeout(() => this.dispatchEvent(new Event("error")), 300);
    };
  });
  await home(page);
  await page.getByRole("button", { name: /Explain a process/ }).click();
  await expect(page.locator(".excalidraw canvas").first()).toBeVisible();
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await expect(page.getByText("Recording failed. This take was not saved. Please try again.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record", exact: true })).toBeEnabled();
  await expect(page.getByRole("link", { name: "Download original" })).toHaveCount(0);
  const storedTakes = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("sketchcast-recovery");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<number>((resolve, reject) => {
        const request = db.transaction("takes").objectStore("takes").count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  });
  expect(storedTakes).toBe(0);
});

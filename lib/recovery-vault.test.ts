import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __testing,
  countStoredTakes,
  createProject,
  deleteProject,
  initializeProjectVault,
  listProjects,
  listStoredTakes,
  renameProject,
  setActiveProjectId,
  storeProjectSnapshot,
  storeTake,
} from "./recovery-vault";

async function deleteDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(__testing.DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Database deletion blocked"));
  });
}

describe("named project Recovery Vault", () => {
  beforeEach(async () => {
    vi.stubGlobal("indexedDB", indexedDB);
    vi.stubGlobal("IDBKeyRange", IDBKeyRange);
    await deleteDatabase();
  });

  afterEach(async () => {
    await deleteDatabase();
    vi.unstubAllGlobals();
  });

  it("creates, renames, and restores the active project", async () => {
    const initial = await initializeProjectVault();
    expect(initial.projects).toHaveLength(1);
    expect(initial.activeProject.name).toBe("My first sketchcast");

    const second = await createProject("Product walkthrough");
    await storeProjectSnapshot(second.id, {
      format: "1:1",
      script: "Saved independently",
      webcam: { visible: false, corner: "tl", sizeFrac: 0.2 },
      scene: { elements: [{ id: "one" }], files: {}, viewBackgroundColor: "#fff" },
    });
    await renameProject(second.id, "Product launch");
    await setActiveProjectId(second.id);

    const restored = await initializeProjectVault();
    expect(restored.activeProject.name).toBe("Product launch");
    expect(restored.activeProject.script).toBe("Saved independently");
    expect(await listProjects()).toHaveLength(2);
  });

  it("is idempotent when the app initializes twice concurrently", async () => {
    await Promise.all([initializeProjectVault(), initializeProjectVault()]);
    const projects = await listProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe("project_default");
  });

  it("isolates takes by project and removes them with a deleted project", async () => {
    const initial = await initializeProjectVault();
    const second = await createProject("Second");
    await storeTake({
      id: "take_one",
      projectId: initial.activeProject.id,
      blob: new Blob(["one"]),
      filename: "one.webm",
      sizeMB: 0.001,
      seconds: 1,
      format: "16:9",
      createdAt: "2026-07-11T00:00:00.000Z",
    });
    await storeTake({
      id: "take_two",
      projectId: second.id,
      blob: new Blob(["two"]),
      filename: "two.webm",
      sizeMB: 0.001,
      seconds: 2,
      format: "9:16",
      createdAt: "2026-07-11T00:00:01.000Z",
    });

    expect(await listStoredTakes(initial.activeProject.id)).toHaveLength(1);
    expect(await listStoredTakes(second.id)).toHaveLength(1);
    expect(await countStoredTakes(initial.activeProject.id)).toBe(1);
    expect(await countStoredTakes(second.id)).toBe(1);
    await deleteProject(second.id);
    expect(await listStoredTakes(second.id)).toHaveLength(0);
    expect(await countStoredTakes(second.id)).toBe(0);
  });
});

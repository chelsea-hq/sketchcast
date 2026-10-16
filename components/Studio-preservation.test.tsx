// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const project = {
    id: "existing", name: "Keep this board", createdAt: "2026-10-15", updatedAt: "2026-10-15",
    format: "1:1", script: "A saved lesson", webcam: { visible: false, corner: "tl", sizeFrac: 0.2 },
    scene: { elements: [{ id: "important-shape", type: "rectangle" }], files: {}, viewBackgroundColor: "#ffffff" },
  };
  return { project, save: vi.fn(), create: vi.fn(), listTakes: vi.fn() };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/useCreatorCloud", () => ({ useCreatorCloud: () => ({ account: { plan: "community", limits: { templates: 3 } } }) }));
vi.mock("./useRecordingFrame", () => ({ useRecordingFrame: () => ({ x: 0, y: 0, w: 960, h: 540 }) }));
vi.mock("@/lib/board-actions", () => ({ applyTemplateScene: vi.fn() }));
vi.mock("./Board", () => ({ default: ({ onSceneChange }: { onSceneChange: (elements: unknown[], appState: { viewBackgroundColor: string }, files: Record<string, unknown>) => void }) => <button onClick={() => onSceneChange([], { viewBackgroundColor: "#ffffff" }, {})}>Emit initial empty board</button> }));
vi.mock("./RecordBar", () => ({ default: () => null }));
vi.mock("./SidePanel", () => ({ default: () => null, TAB_LABELS: {}, ToolIcon: () => null }));
vi.mock("./CreatorHome", () => ({ default: ({ onCreate, onOpen, recoveryReady }: { onCreate: (name: string) => void; onOpen: (project: unknown) => void; recoveryReady: boolean }) => <><span>{recoveryReady ? "Projects ready" : "Projects opening"}</span><button onClick={() => onCreate("New lesson")}>Create test project</button><button onClick={() => onOpen(mocks.project)}>Open test project</button></> }));
vi.mock("@/lib/recovery-vault", () => ({
  initializeProjectVault: async () => ({ projects: [mocks.project], activeProject: mocks.project, takes: [] }),
  countStoredTakes: async () => 0,
  requestDurableBrowserStorage: async () => false,
  storeProjectSnapshot: mocks.save,
  listProjects: async () => [mocks.project],
  createProject: mocks.create,
  setActiveProjectId: async () => {},
  listStoredTakes: mocks.listTakes,
}));
import Studio from "./Studio";

describe("project preservation before the board mounts", () => {
  let root: Root;
  let container: HTMLDivElement;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.save.mockReset().mockResolvedValue(mocks.project);
    mocks.create.mockReset().mockResolvedValue({ ...mocks.project, id: "new" });
    mocks.listTakes.mockReset().mockResolvedValue([]);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  it("preserves the restored board when creating from home immediately after reload", async () => {
    await act(async () => root.render(<Studio />));
    const create = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Create test project")!;
    await act(async () => create.click());
    expect(mocks.save).toHaveBeenCalledWith("existing", {
      format: mocks.project.format, script: mocks.project.script,
      webcam: mocks.project.webcam, scene: mocks.project.scene,
    });
    expect(mocks.create).toHaveBeenCalledWith("New lesson");
  });

  it("keeps a failed save visible and lets the creator retry without losing the project", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.save.mockRejectedValueOnce(new Error("Synthetic quota failure"));
    await act(async () => root.render(<Studio />));
    const create = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Create test project")!;
    await act(async () => create.click());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Your latest changes could not be saved");
    expect(mocks.create).not.toHaveBeenCalled();
    const retry = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Retry save")!;
    await act(async () => retry.click());
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(mocks.save).toHaveBeenLastCalledWith("existing", expect.objectContaining({ scene: mocks.project.scene }));
  });

  it("keeps projects usable when returning home before the board API is ready", async () => {
    await act(async () => root.render(<Studio />));
    const create = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Create test project")!;
    await act(async () => create.click());
    // Board deliberately never delivers onApiReady. A quick return must not
    // rely on the callback from a canvas that is about to unmount.
    const back = container.querySelector<HTMLButtonElement>('[aria-label="Back to projects"]')!;
    await act(async () => back.click());
    expect(container.textContent).toContain("Projects ready");
    expect(container.textContent).not.toContain("Opening vault");
    expect(mocks.save).toHaveBeenLastCalledWith("new", expect.objectContaining({ scene: mocks.project.scene }));
  });

  it("does not report projects ready when returning home fails to save", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => root.render(<Studio />));
    const create = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Create test project")!;
    await act(async () => create.click());
    mocks.save.mockRejectedValueOnce(new Error("Synthetic quota failure"));
    const back = container.querySelector<HTMLButtonElement>('[aria-label="Back to projects"]')!;
    await act(async () => back.click());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Your latest changes could not be saved");
    expect(container.textContent).not.toContain("Projects ready");
    expect(container.querySelector('[aria-label="Back to projects"]')).not.toBeNull();
  });

  it("preserves a pending project when the board emits its initial empty scene", async () => {
    await act(async () => root.render(<Studio />));
    const open = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Open test project")!;
    await act(async () => open.click());
    const initialChange = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Emit initial empty board")!;
    await act(async () => initialChange.click());
    const back = container.querySelector<HTMLButtonElement>('[aria-label="Back to projects"]')!;
    await act(async () => back.click());
    expect(mocks.save).toHaveBeenLastCalledWith("existing", expect.objectContaining({ scene: mocks.project.scene }));
    expect(container.textContent).toContain("Projects ready");
  });

  it("blocks creation while a home project is still opening", async () => {
    let finishOpen!: (value: never[]) => void;
    const pending = new Promise<never[]>((resolve) => { finishOpen = resolve; });
    mocks.listTakes.mockReturnValue(pending);
    await act(async () => root.render(<Studio />));
    const buttons = Array.from(container.querySelectorAll("button"));
    await act(async () => {
      buttons.find((button) => button.textContent === "Open test project")!.click();
      buttons.find((button) => button.textContent === "Create test project")!.click();
    });
    const createdDuringOpen = mocks.create.mock.calls.length;
    await act(async () => finishOpen([]));
    expect(createdDuringOpen).toBe(0);
    expect(mocks.save).not.toHaveBeenCalled();
  });
});

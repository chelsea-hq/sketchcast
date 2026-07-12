import type { FormatKey, WebcamLayout } from "./formats";
import type { SketchTemplate } from "./templates";

const DB_NAME = "sketchcast-recovery";
const DB_VERSION = 2;
const TAKES_STORE = "takes";
const PROJECTS_STORE = "drafts";
const SETTINGS_STORE = "settings";
const ACTIVE_PROJECT_KEY = "activeProjectId";

export interface StoredTake {
  id: string;
  projectId: string;
  blob: Blob;
  filename: string;
  sizeMB: number;
  seconds: number;
  format: string;
  createdAt: string;
}

export interface ProjectSnapshot {
  format: FormatKey;
  script: string;
  webcam: WebcamLayout;
  scene: SketchTemplate["scene"];
}

export interface SketchProject extends ProjectSnapshot {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  syncCode?: string;
  lastSyncedAt?: string;
}

interface SettingRecord {
  key: string;
  value: string;
}

export interface ProjectVaultState {
  projects: SketchProject[];
  activeProject: SketchProject;
  takes: StoredTake[];
}

function emptySnapshot(): ProjectSnapshot {
  return {
    format: "16:9",
    script: "",
    webcam: {
      visible: true,
      corner: "br",
      sizeFrac: 0.2,
    },
    scene: {
      elements: [],
      files: {},
      viewBackgroundColor: "#ffffff",
    },
  };
}

function makeProject(
  name: string,
  snapshot = emptySnapshot(),
  id = `project_${crypto.randomUUID()}`
): SketchProject {
  const now = new Date().toISOString();
  return {
    ...snapshot,
    id,
    name: name.trim().slice(0, 80) || "Untitled sketchcast",
    createdAt: now,
    updatedAt: now,
  };
}

function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TAKES_STORE)) {
        db.createObjectStore(TAKES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open Recovery Vault"));
  });
}

async function runRequest<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openVault();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const request = operation(transaction.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Recovery Vault request failed"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Recovery Vault transaction aborted"));
    });
  } finally {
    db.close();
  }
}

function normalizeProject(record: Partial<SketchProject> & { id: string }): SketchProject {
  const now = new Date().toISOString();
  const fallback = emptySnapshot();
  return {
    id: record.id === "active" ? "project_default" : record.id,
    name: record.name?.trim() || "My first sketchcast",
    createdAt: record.createdAt ?? record.updatedAt ?? now,
    updatedAt: record.updatedAt ?? now,
    format: record.format ?? fallback.format,
    script: record.script ?? fallback.script,
    webcam: record.webcam ?? fallback.webcam,
    scene: record.scene ?? fallback.scene,
    syncCode: record.syncCode,
    lastSyncedAt: record.lastSyncedAt,
  };
}

export async function initializeProjectVault(): Promise<ProjectVaultState> {
  let projects = await runRequest<SketchProject[]>(PROJECTS_STORE, "readonly", (store) =>
    store.getAll()
  );

  if (projects.length === 0) {
    // A deterministic ID makes first-run initialization idempotent under
    // React Strict Mode's intentional double effect execution.
    const first = makeProject("My first sketchcast", emptySnapshot(), "project_default");
    await runRequest<IDBValidKey>(PROJECTS_STORE, "readwrite", (store) => store.put(first));
    projects = [first];
  } else {
    const normalized = projects.map(normalizeProject);
    const needsMigration = normalized.some((project, index) => project.id !== projects[index]?.id);
    if (needsMigration) {
      await Promise.all(
        normalized.map((project, index) =>
          runRequest<IDBValidKey>(PROJECTS_STORE, "readwrite", (store) => {
            if (projects[index]?.id === "active") store.delete("active");
            return store.put(project);
          })
        )
      );
    }
    projects = normalized;
  }

  projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const setting = await runRequest<SettingRecord | undefined>(
    SETTINGS_STORE,
    "readonly",
    (store) => store.get(ACTIVE_PROJECT_KEY)
  );
  const activeProject =
    projects.find((project) => project.id === setting?.value) ?? projects[0];
  await setActiveProjectId(activeProject.id);

  const allTakes = await runRequest<Array<StoredTake & { projectId?: string }>>(
    TAKES_STORE,
    "readonly",
    (store) => store.getAll()
  );
  const migratedTakes = await Promise.all(
    allTakes.map(async (take) => {
      if (take.projectId) return take as StoredTake;
      const migrated = { ...take, projectId: activeProject.id } as StoredTake;
      await storeTake(migrated);
      return migrated;
    })
  );

  return {
    projects,
    activeProject,
    takes: migratedTakes
      .filter((take) => take.projectId === activeProject.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export async function listProjects(): Promise<SketchProject[]> {
  const projects = await runRequest<SketchProject[]>(PROJECTS_STORE, "readonly", (store) =>
    store.getAll()
  );
  return projects.map(normalizeProject).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createProject(
  name: string,
  snapshot?: ProjectSnapshot
): Promise<SketchProject> {
  const project = makeProject(name, snapshot);
  await runRequest<IDBValidKey>(PROJECTS_STORE, "readwrite", (store) => store.put(project));
  return project;
}

export async function storeProject(
  project: SketchProject
): Promise<SketchProject> {
  const saved = { ...project, updatedAt: new Date().toISOString() };
  await runRequest<IDBValidKey>(PROJECTS_STORE, "readwrite", (store) => store.put(saved));
  return saved;
}

export async function storeProjectSnapshot(
  projectId: string,
  snapshot: ProjectSnapshot
): Promise<SketchProject> {
  const existing = await runRequest<SketchProject | undefined>(
    PROJECTS_STORE,
    "readonly",
    (store) => store.get(projectId)
  );
  if (!existing) throw new Error("Project not found");
  return storeProject({ ...existing, ...snapshot });
}

export async function renameProject(projectId: string, name: string): Promise<SketchProject> {
  const projects = await listProjects();
  const existing = projects.find((project) => project.id === projectId);
  if (!existing) throw new Error("Project not found");
  return storeProject({
    ...existing,
    name: name.trim().slice(0, 80) || existing.name,
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  const projects = await listProjects();
  if (projects.length <= 1) throw new Error("Keep at least one project");
  await runRequest<undefined>(PROJECTS_STORE, "readwrite", (store) => store.delete(projectId));
  const takes = await listStoredTakes(projectId);
  await Promise.all(takes.map((take) => removeStoredTake(take.id)));
}

export async function setActiveProjectId(projectId: string): Promise<void> {
  await runRequest<IDBValidKey>(SETTINGS_STORE, "readwrite", (store) =>
    store.put({ key: ACTIVE_PROJECT_KEY, value: projectId } satisfies SettingRecord)
  );
}

export async function listStoredTakes(projectId: string): Promise<StoredTake[]> {
  const records = await runRequest<StoredTake[]>(TAKES_STORE, "readonly", (store) =>
    store.getAll()
  );
  return records
    .filter((record) => record.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function storeTake(take: StoredTake): Promise<void> {
  await runRequest<IDBValidKey>(TAKES_STORE, "readwrite", (store) => store.put(take));
}

export async function removeStoredTake(id: string): Promise<void> {
  await runRequest<undefined>(TAKES_STORE, "readwrite", (store) => store.delete(id));
}

export async function requestDurableBrowserStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

export const __testing = { DB_NAME };

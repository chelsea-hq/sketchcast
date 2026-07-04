import type { FormatKey, WebcamLayout } from "./formats";

const STORAGE_KEY = "sketchcast.templates.v1";

export interface SketchTemplate {
  id: string;
  name: string;
  savedAt: string;
  format: FormatKey;
  script: string;
  webcam: WebcamLayout;
  scene: {
    // Excalidraw element and file shapes are versioned by the library;
    // stored as-is and handed back to the same API on load.
    elements: unknown[];
    files: Record<string, unknown>;
    viewBackgroundColor: string;
  };
}

export function listTemplates(): SketchTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SketchTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTemplate(
  template: Omit<SketchTemplate, "id" | "savedAt">
): SketchTemplate {
  const record: SketchTemplate = {
    ...template,
    id: `tpl_${Math.random().toString(36).slice(2, 10)}`,
    savedAt: new Date().toISOString(),
  };
  const all = [record, ...listTemplates()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return record;
}

export function deleteTemplate(id: string): void {
  const remaining = listTemplates().filter((t) => t.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
}

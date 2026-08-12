import { FORMATS, type FormatKey } from "./formats";
import type { SketchProject } from "./recovery-vault";

export type CreatorStartMode = "blank" | "diagram" | "script";
export type ReadinessTone = "ready" | "optional" | "waiting";

export interface ReadinessItem {
  id: "vault" | "board" | "format" | "devices" | "prompter";
  label: string;
  detail: string;
  tone: ReadinessTone;
}

export function filterProjects(
  projects: SketchProject[],
  query: string
): SketchProject[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return projects;
  return projects.filter((project) =>
    project.name.toLocaleLowerCase().includes(normalized)
  );
}

export function formatProjectActivity(updatedAt: string, now = Date.now()): string {
  const elapsed = Math.max(0, now - new Date(updatedAt).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: new Date(updatedAt).getFullYear() === new Date(now).getFullYear()
      ? undefined
      : "numeric",
  }).format(new Date(updatedAt));
}

export function getRecordingReadiness(input: {
  recoveryReady: boolean;
  boardReady: boolean;
  hasSession: boolean;
  camOn: boolean;
  micOn: boolean;
  hasScript: boolean;
  format: FormatKey;
}): ReadinessItem[] {
  return [
    {
      id: "vault",
      label: "Local recovery",
      detail: input.recoveryReady
        ? "Board and takes recover on this device"
        : "Opening the Recovery Vault",
      tone: input.recoveryReady ? "ready" : "waiting",
    },
    {
      id: "board",
      label: "Recorded area",
      detail: input.boardReady ? "Canvas is ready to capture" : "Canvas is still loading",
      tone: input.boardReady ? "ready" : "waiting",
    },
    {
      id: "format",
      label: "Output",
      detail: `${FORMATS[input.format].label} for ${FORMATS[input.format].hint}`,
      tone: "ready",
    },
    {
      id: "devices",
      label: "Camera and microphone",
      detail: input.hasSession
        ? `${input.camOn ? "Camera on" : "Camera off"} · ${input.micOn ? "Mic on" : "Mic off"}`
        : "Optional · record the board without devices",
      tone: input.hasSession ? "ready" : "optional",
    },
    {
      id: "prompter",
      label: "Teleprompter",
      detail: input.hasScript ? "Script is ready" : "Optional · add a script when needed",
      tone: input.hasScript ? "ready" : "optional",
    },
  ];
}

export function canBeginRecording(items: ReadinessItem[]): boolean {
  return items.every(
    (item) => !(["vault", "board"] as ReadinessItem["id"][]).includes(item.id) || item.tone === "ready"
  );
}

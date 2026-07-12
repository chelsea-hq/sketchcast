"use client";

import { useState } from "react";

import type { SketchProject } from "@/lib/recovery-vault";

interface ProjectSwitcherProps {
  projects: SketchProject[];
  activeProjectId: string;
  disabled?: boolean;
  onSwitch: (projectId: string) => void;
  onCreate: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onOpenSync: () => void;
}

export default function ProjectSwitcher({
  projects,
  activeProjectId,
  disabled,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
  onOpenSync,
}: ProjectSwitcherProps) {
  const active = projects.find((project) => project.id === activeProjectId);
  const [dialog, setDialog] = useState<"new" | "rename" | "delete" | null>(null);
  const [name, setName] = useState("");

  const openNameDialog = (mode: "new" | "rename") => {
    setName(mode === "rename" ? active?.name ?? "" : "");
    setDialog(mode);
  };

  const submitName = () => {
    if (!name.trim()) return;
    if (dialog === "new") onCreate(name.trim());
    if (dialog === "rename") onRename(name.trim());
    setDialog(null);
  };

  return (
    <>
      <div className="flex min-w-0 items-center gap-1.5">
        <select
          aria-label="Active project"
          value={activeProjectId}
          disabled={disabled}
          onChange={(event) => onSwitch(event.target.value)}
          className="min-w-0 max-w-[190px] rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs font-semibold text-zinc-100 outline-none hover:border-zinc-600 disabled:opacity-50"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => openNameDialog("new")}
          disabled={disabled}
          title="New project"
          className="rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => openNameDialog("rename")}
          disabled={disabled || !active}
          title="Rename project"
          className="hidden rounded-md bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 sm:block disabled:opacity-50"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={onOpenSync}
          disabled={disabled || !active}
          title="Encrypted cloud sync"
          className="rounded-md bg-indigo-600/20 px-2 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 disabled:opacity-50"
        >
          ☁ Sync
        </button>
        <button
          type="button"
          onClick={() => setDialog("delete")}
          disabled={disabled || projects.length <= 1}
          title="Delete project"
          className="hidden rounded-md px-2 py-1.5 text-xs text-zinc-500 hover:bg-red-950/50 hover:text-red-300 lg:block disabled:opacity-30"
        >
          Delete
        </button>
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-dialog-title"
            className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl"
          >
            {dialog === "delete" ? (
              <>
                <h2 id="project-dialog-title" className="text-base font-semibold text-white">Delete this project?</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  “{active?.name}” and its locally stored takes will be removed from this
                  device. A previously synced encrypted copy is not deleted.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => setDialog(null)} className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete();
                      setDialog(null);
                    }}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Delete locally
                  </button>
                </div>
              </>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitName();
                }}
              >
                <h2 id="project-dialog-title" className="text-base font-semibold text-white">
                  {dialog === "new" ? "New sketchcast project" : "Rename project"}
                </h2>
                <label htmlFor="project-name" className="sr-only">Project name</label>
                <input
                  id="project-name"
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  placeholder="Project name"
                  className="mt-4 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setDialog(null)} className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={!name.trim()} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                    {dialog === "new" ? "Create project" : "Save name"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

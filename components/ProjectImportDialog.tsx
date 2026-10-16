"use client";

import { useState } from "react";
import { parseProjectFile, PROJECT_FILE_MAX_BYTES } from "@/lib/project-file";
import LocalDialog from "./LocalDialog";

export type ImportedProject = ReturnType<typeof parseProjectFile>;

export default function ProjectImportDialog({ onImport, onClose }: {
  onImport: (project: ImportedProject) => Promise<void>;
  onClose: () => void;
}) {
  const [project, setProject] = useState<ImportedProject | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const read = async (file: File) => {
    setProject(null); setError(""); setBusy(true);
    try {
      if (file.size > PROJECT_FILE_MAX_BYTES) throw new Error("Choose a project file no larger than 10 MiB.");
      setProject(parseProjectFile(await file.text()));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This project file could not be read."); }
    finally { setBusy(false); }
  };
  return <LocalDialog titleId="import-project-title" onClose={() => { if (!busy) onClose(); }}>
    <h2 id="import-project-title" className="text-2xl font-semibold">Bring a project with you</h2>
    <p className="mt-3 text-sm leading-6 text-zinc-300">Open a .sketchcast file from another browser or device. It creates a new project and leaves your existing work intact.</p>
    <label className="mt-5 block text-sm font-medium" htmlFor="project-file">Project file · up to 10 MiB</label>
    <input id="project-file" type="file" accept=".sketchcast,.json,application/json" disabled={busy}
      className="mt-2 block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-3 file:text-zinc-100 focus-visible:outline-2 focus-visible:outline-[#a995ff]"
      onChange={(event) => { const file = event.target.files?.[0]; if (file) void read(file); }} />
    {project && <div className="mt-5 border-y border-white/10 py-4">
      <p className="break-words font-semibold">{project.name}</p>
      <p className="mt-1 text-sm text-zinc-300">{project.snapshot.format} · {project.snapshot.scene.elements.length} board elements · {project.snapshot.script.length.toLocaleString()} script characters</p>
    </div>}
    <p className="mt-4 text-sm leading-6 text-zinc-400">Files contain your board, images, script, and layout. Recordings, provider keys, and cloud recovery codes are excluded. Everything is read on this device.</p>
    {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-300">{error}</p>}
    <div className="mt-6 flex justify-end gap-2">
      <button type="button" disabled={busy} onClick={onClose} className="min-h-11 rounded-lg px-4 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-40">Cancel</button>
      <button type="button" disabled={!project || busy} className="min-h-11 rounded-lg bg-[#7657ff] px-4 text-sm font-semibold text-white hover:bg-[#876dff] disabled:opacity-40"
        onClick={async () => {
          if (!project || busy) return;
          setBusy(true); setError("");
          try { await onImport(project); onClose(); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this project. Check browser storage and try again."); }
          finally { setBusy(false); }
        }}>{busy ? "Opening…" : "Import as new project"}</button>
    </div>
  </LocalDialog>;
}

"use client";

import { useMemo, useState } from "react";
import { filterProjects, formatProjectActivity, type CreatorStartMode } from "@/lib/creator-flow";
import type { SketchProject } from "@/lib/recovery-vault";
import { STARTER_PROJECTS } from "@/lib/starter-projects";
import LocalDialog from "./LocalDialog";
import ProjectPreview from "./ProjectPreview";
import ProjectImportDialog, { type ImportedProject } from "./ProjectImportDialog";

interface CreatorHomeProps {
  projects: SketchProject[];
  activeProjectId: string;
  takeCounts: Record<string, number>;
  recoveryReady: boolean;
  recoveryFailed: boolean;
  busy?: boolean;
  onRetryRecovery: () => void;
  onOpen: (project: SketchProject) => void;
  onCreate: (name: string, mode: CreatorStartMode) => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onImport?: (project: ImportedProject) => Promise<void>;
  onDownload?: (project: SketchProject) => void;
  onDuplicate?: (project: SketchProject) => void;
  onStarter?: (starterId: string) => void;
}

const STARTS: { mode: CreatorStartMode; title: string; description: string }[] = [
  { mode: "diagram", title: "Build a diagram", description: "Make the idea visual" },
  { mode: "script", title: "Write an explainer", description: "Start with the words" },
  { mode: "blank", title: "Start from scratch", description: "An open canvas" },
];
const control = "min-h-11 rounded-lg border border-white/15 px-4 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8aaff] disabled:opacity-40";

export default function CreatorHome({
  projects, activeProjectId, takeCounts, recoveryReady, recoveryFailed, busy = false,
  onRetryRecovery, onOpen, onCreate, onOpenSync, onOpenSettings,
  onImport, onDownload, onDuplicate, onStarter,
}: CreatorHomeProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [creating, setCreating] = useState<CreatorStartMode | null>(null);
  const [importing, setImporting] = useState(false);
  const [name, setName] = useState("");
  const filtered = useMemo(() => [...filterProjects(projects, query)].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt)), [projects, query, sort]);
  const disabled = !recoveryReady || busy;

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#090a0f]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400" role="status">
              <span aria-hidden className={`h-2 w-2 rounded-full ${recoveryFailed ? "bg-red-400" : recoveryReady ? "bg-emerald-400" : "bg-amber-300"}`} />
              {recoveryFailed ? "Local storage is unavailable" : recoveryReady ? "Recovery Vault ready on this device" : "Opening your local projects"}
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">Make your next idea clear.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300">Sketch it, talk it through, make it yours. Your own whiteboard-to-video studio, with no account required.</p>
          </div>
          {onImport && <button type="button" disabled={disabled} onClick={() => setImporting(true)} className={`${control} shrink-0`}>Import project</button>}
        </div>

        {recoveryFailed && <div role="alert" className="mt-8 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] p-5">
          <h2 className="font-semibold text-amber-100">Your projects could not be opened</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">Sketchcast needs browser storage to save projects and recordings. Allow site storage in your browser settings or try a regular browser window, then retry. Existing data has not been cleared. Use the same browser and address to access your saved projects.</p>
          <button type="button" onClick={onRetryRecovery} className="mt-4 min-h-11 rounded-lg bg-amber-200 px-5 text-sm font-semibold text-zinc-950 hover:bg-amber-100">Retry local storage</button>
        </div>}

        <section aria-label="Start something new" className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-8">
          {STARTS.map((start) => <button key={start.mode} type="button" disabled={disabled}
            onClick={() => { setName(""); setCreating(start.mode); }} className={`${control} flex-1 basis-52 px-5 py-4 text-left`}>
            <span className="block font-semibold text-white">{start.title} <span aria-hidden className="ml-1 text-[#b8aaff]">↗</span></span>
            <span className="mt-1 block text-sm font-normal text-zinc-400">{start.description}</span>
          </button>)}
        </section>

        {onStarter && <section aria-labelledby="starters-title" className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="starters-title" className="text-xl font-semibold text-white">Skip the blank canvas</h2>
            <p className="text-sm text-zinc-400">Editable boards + sample scripts. No AI key needed.</p>
          </div>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {STARTER_PROJECTS.map((starter) => <button type="button" key={starter.id} disabled={disabled}
              onClick={() => onStarter(starter.id)} className="group flex min-w-0 flex-col items-stretch text-left focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b8aaff] disabled:opacity-40">
              <ProjectPreview scene={starter.snapshot.scene} />
              <span className="mt-3 flex items-center justify-between gap-3 font-semibold text-white">{starter.name}<span aria-hidden className="text-[#b8aaff] transition-transform motion-safe:group-hover:translate-x-1">→</span></span>
              <span className="mt-1 block text-sm leading-6 text-zinc-400">{starter.description}</span>
            </button>)}
          </div>
        </section>}

        <section aria-labelledby="projects-title" className="mt-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 id="projects-title" className="text-xl font-semibold text-white">Your projects</h2><p className="mt-1 text-sm text-zinc-400">Saved in this browser. Download a project file to keep a copy.</p></div>
            <div className="flex flex-wrap gap-2">
              <label className="flex-1"><span className="sr-only">Search projects</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" className="min-h-11 w-full min-w-40 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-base text-white outline-none placeholder:text-zinc-400 focus:border-[#b8aaff]" />
              </label>
              <label><span className="sr-only">Sort projects</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 rounded-lg border border-white/15 bg-[#111218] px-3 text-sm text-zinc-200 focus-visible:outline-2 focus-visible:outline-[#b8aaff]"><option value="recent">Recently edited</option><option value="name">Name A–Z</option></select>
              </label>
            </div>
          </div>
          {filtered.length > 0 ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => <article key={project.id} aria-label={project.name} className="min-w-0 rounded-xl border border-white/10 bg-[#111218] p-3">
              <button type="button" disabled={disabled} onClick={() => onOpen(project)} aria-label={`Open ${project.name}`} className="block w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b8aaff] disabled:opacity-40">
                <ProjectPreview scene={project.scene} />
                <div className="mt-4 flex items-center gap-2"><h3 className="min-w-0 truncate font-semibold text-white">{project.name}</h3>{project.id === activeProjectId && <span className="shrink-0 text-xs text-[#b8aaff]">Current</span>}</div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400"><span>{formatProjectActivity(project.updatedAt)}</span><span>{project.format}</span><span>{takeCounts[project.id] ?? 0} {(takeCounts[project.id] ?? 0) === 1 ? "take" : "takes"}</span></div>
              </button>
              {(onDownload || onDuplicate) && <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                {onDownload && <button type="button" onClick={() => onDownload(project)} disabled={busy} aria-label={`Download ${project.name}`} className="min-h-10 rounded-md px-2 text-sm font-medium text-[#b8aaff] hover:bg-white/5 focus-visible:outline-2 disabled:opacity-40">Download project</button>}
                {onDuplicate && <button type="button" onClick={() => onDuplicate(project)} disabled={disabled} aria-label={`Duplicate ${project.name}`} className="min-h-10 rounded-md px-2 text-sm text-zinc-300 hover:bg-white/5 focus-visible:outline-2 disabled:opacity-40">Duplicate</button>}
              </div>}
            </article>)}
          </div> : <div className="mt-5 border-y border-white/10 py-10 text-center">
            <p className="break-words text-zinc-300">{query ? `No projects match “${query}”.` : "Your next explanation starts here."}</p>
            {query && <button type="button" onClick={() => setQuery("")} className="mt-3 min-h-11 px-4 text-sm text-[#b8aaff]">Clear search</button>}
          </div>}
        </section>

        <footer className="mt-10 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-zinc-400">Project files contain your board, images, script, and layout. They are unencrypted. Download recordings separately from Takes. Keep private content in a safe place.</p>
          <div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={onOpenSettings} className={control}>Provider keys</button><button type="button" onClick={onOpenSync} className={control}>Encrypted sync</button></div>
        </footer>
      </div>

      {creating && <LocalDialog titleId="create-project-title" onClose={() => setCreating(null)}>
        <form onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; onCreate(name.trim(), creating); setCreating(null); }}>
          <h2 id="create-project-title" className="text-2xl font-semibold">Give this idea a name</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">You can change it later. It will be saved in this browser.</p>
          <label htmlFor="creator-project-name" className="mt-5 block text-sm font-medium">Project name</label>
          <input id="creator-project-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="e.g. How a good idea grows" className="mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-black/20 px-4 text-base outline-none placeholder:text-zinc-400 focus:border-[#b8aaff]" />
          <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCreating(null)} className={control}>Cancel</button><button type="submit" disabled={!name.trim() || disabled} className="min-h-11 rounded-lg bg-[#7657ff] px-5 text-sm font-semibold text-white hover:bg-[#876dff] disabled:opacity-40">Create and prepare</button></div>
        </form>
      </LocalDialog>}
      {importing && onImport && <ProjectImportDialog onImport={onImport} onClose={() => setImporting(false)} />}
    </main>
  );
}

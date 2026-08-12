"use client";

import { useMemo, useState } from "react";

import {
  filterProjects,
  formatProjectActivity,
  type CreatorStartMode,
} from "@/lib/creator-flow";
import type { SketchProject } from "@/lib/recovery-vault";

interface CreatorHomeProps {
  projects: SketchProject[];
  activeProjectId: string;
  takeCounts: Record<string, number>;
  recoveryReady: boolean;
  onOpen: (project: SketchProject) => void;
  onCreate: (name: string, mode: CreatorStartMode) => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
}

const STARTS: Array<{
  mode: CreatorStartMode;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
}> = [
  {
    mode: "diagram",
    eyebrow: "Visual first",
    title: "Build a diagram",
    description: "Turn one idea into a clear teaching visual, then talk it through.",
    accent: "from-[#7657ff]/25 to-[#7657ff]/5 text-[#b8aaff]",
    icon: <path d="M4 5h6v4H4zM14 5h6v4h-6zM9 15h6v4H9zM7 9v2h5v4M17 9v2h-5" />,
  },
  {
    mode: "script",
    eyebrow: "Words first",
    title: "Write an explainer",
    description: "Shape a tight script and let the teleprompter carry the delivery.",
    accent: "from-[#d8ff6f]/18 to-[#d8ff6f]/[0.03] text-[#d8ff6f]",
    icon: <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />,
  },
  {
    mode: "blank",
    eyebrow: "Open canvas",
    title: "Start from scratch",
    description: "Open a clean recorded area and sketch freely.",
    accent: "from-sky-400/15 to-sky-400/[0.03] text-sky-300",
    icon: <path d="m5 18 1-4L16 4l4 4-10 10-5 1zM14 6l4 4" />,
  },
];

export default function CreatorHome({
  projects,
  activeProjectId,
  takeCounts,
  recoveryReady,
  onOpen,
  onCreate,
  onOpenSync,
  onOpenSettings,
}: CreatorHomeProps) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState<CreatorStartMode | null>(null);
  const [name, setName] = useState("");
  const filtered = useMemo(() => filterProjects(projects, query), [projects, query]);

  const beginCreate = (mode: CreatorStartMode) => {
    setName("");
    setCreating(mode);
  };

  return (
    <main className="relative min-h-0 flex-1 overflow-y-auto bg-[#090a0f]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] overflow-hidden" aria-hidden>
        <div className="absolute -left-24 -top-52 h-[520px] w-[520px] rounded-full bg-[#7657ff]/12 blur-3xl" />
        <div className="absolute right-[-10%] top-[-12rem] h-[460px] w-[460px] rounded-full bg-[#d8ff6f]/[0.045] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-16 pt-8 sm:px-7 sm:pt-12 lg:px-10 lg:pt-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex min-h-8 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-3 text-[11px] font-semibold text-white/48">
              <span className={`h-2 w-2 rounded-full ${recoveryReady ? "bg-emerald-400" : "animate-pulse bg-amber-300"}`} />
              {recoveryReady ? "Recovery Vault ready on this device" : "Opening your local projects"}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9d88ff]">Your creator workspace</p>
            <h1 className="mt-3 max-w-2xl text-balance text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-[62px] lg:leading-[0.98]">
              What will you explain today?
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/48 sm:text-lg">
              Build the idea, record the walkthrough, clean the take, and export it. No account required.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-white/34 sm:min-w-[380px]">
            {[
              ["01", "Prepare"],
              ["02", "Record"],
              ["03", "Edit"],
              ["04", "Export"],
            ].map(([step, label]) => (
              <div key={step} className="rounded-xl px-2 py-3">
                <span className="block text-[9px] text-[#9d88ff]">{step}</span>
                <span className="mt-1 block text-white/58">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <section aria-labelledby="start-title" className="mt-10 sm:mt-12">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="start-title" className="text-sm font-semibold text-white">Start something new</h2>
            <span className="hidden text-xs text-white/30 sm:inline">Everything stays in this browser unless you choose encrypted sync.</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {STARTS.map((start) => (
              <button
                key={start.mode}
                type="button"
                onClick={() => beginCreate(start.mode)}
                disabled={!recoveryReady}
                className={`group min-h-[190px] rounded-[22px] border border-white/[0.08] bg-gradient-to-br ${start.accent} p-5 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_24px_60px_rgba(0,0,0,0.28)] disabled:opacity-45 sm:p-6`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-current/15 bg-black/15">
                  <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{start.icon}</svg>
                </span>
                <span className="mt-6 block text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">{start.eyebrow}</span>
                <span className="mt-1.5 block text-xl font-semibold tracking-[-0.025em] text-white">{start.title}</span>
                <span className="mt-2 block max-w-sm text-sm leading-6 text-white/44">{start.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="projects-title" className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="projects-title" className="text-xl font-semibold tracking-[-0.02em] text-white">Recent projects</h2>
              <p className="mt-1 text-sm text-white/34">Stored locally on this device.</p>
            </div>
            <label className="relative block w-full sm:w-72">
              <span className="sr-only">Search projects</span>
              <svg aria-hidden viewBox="0 0 20 20" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-white/30" strokeWidth="1.7"><circle cx="8.5" cy="8.5" r="5.25"/><path d="m12.5 12.5 4 4"/></svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects"
                className="min-h-11 w-full rounded-full border border-white/[0.08] bg-white/[0.045] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7657ff]/70"
              />
            </label>
          </div>

          {filtered.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => {
                const active = project.id === activeProjectId;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onOpen(project)}
                    disabled={!recoveryReady}
                    className="group rounded-[20px] border border-white/[0.075] bg-[#111218] p-4 text-left transition hover:border-[#7657ff]/45 hover:bg-[#15161d] disabled:opacity-50 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid aspect-video w-24 place-items-center overflow-hidden rounded-xl border border-white/[0.07] bg-white text-[#17171b] shadow-inner">
                        <svg aria-hidden viewBox="0 0 64 36" className="h-full w-full fill-none stroke-zinc-300" strokeWidth="1.2"><path d="M9 26 20 11l8 12 7-9 19 14"/><path d="M10 30h44"/><circle cx="46" cy="9" r="3" fill="#7657ff" stroke="none"/></svg>
                      </div>
                      <span className="inline-flex min-h-7 items-center rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 text-[10px] font-semibold text-white/38">
                        {project.format}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <h3 className="min-w-0 truncate text-base font-semibold text-white">{project.name}</h3>
                      {active && <span className="rounded-full bg-[#7657ff]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#a995ff]">Open</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-white/32">
                      <span>{formatProjectActivity(project.updatedAt)}</span>
                      <span>{takeCounts[project.id] ?? 0} {(takeCounts[project.id] ?? 0) === 1 ? "take" : "takes"}</span>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#a995ff] transition group-hover:text-white">
                      Resume project <span aria-hidden>→</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-[20px] border border-dashed border-white/10 px-5 py-10 text-center text-sm text-white/38">
              No local projects match “{query}”.
            </div>
          )}
        </section>

        <div className="mt-10 flex flex-col gap-3 rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-sm font-semibold text-white/72">Want the same project on another device?</p>
            <p className="mt-1 text-xs leading-5 text-white/32">Encrypted sync is optional. Recordings always stay local.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onOpenSettings} className="min-h-10 rounded-full border border-white/[0.08] px-4 text-xs font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white">Provider keys</button>
            <button type="button" onClick={onOpenSync} className="min-h-10 rounded-full bg-[#7657ff] px-4 text-xs font-semibold text-white hover:bg-[#876dff]">Encrypted sync</button>
          </div>
        </div>
      </div>

      {creating && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              onCreate(name.trim(), creating);
              setCreating(null);
            }}
            className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#111218] p-5 shadow-2xl sm:p-6"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9d88ff]">New project</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Give this idea a name</h2>
            <p className="mt-2 text-sm leading-6 text-white/40">You can change it later. It will be saved only in this browser.</p>
            <label htmlFor="creator-project-name" className="sr-only">Project name</label>
            <input
              id="creator-project-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              placeholder="e.g. Why Bitcoin has a fixed supply"
              className="mt-5 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/22 focus:border-[#7657ff]"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(null)} className="min-h-11 rounded-full px-4 text-sm font-semibold text-white/48 hover:bg-white/[0.05] hover:text-white">Cancel</button>
              <button type="submit" disabled={!name.trim()} className="min-h-11 rounded-full bg-[#7657ff] px-5 text-sm font-semibold text-white hover:bg-[#876dff] disabled:opacity-40">Create and prepare</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

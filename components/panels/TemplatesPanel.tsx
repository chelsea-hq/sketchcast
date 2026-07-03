"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { SketchTemplate } from "@/lib/templates";

interface TemplatesPanelProps {
  templates: SketchTemplate[];
  onSave: (name: string) => void;
  onLoad: (template: SketchTemplate) => void;
  onDelete: (id: string) => void;
}

export default function TemplatesPanel({
  templates,
  onSave,
  onLoad,
  onDelete,
}: TemplatesPanelProps) {
  const [name, setName] = useState("");

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give the template a name first");
      return;
    }
    onSave(trimmed);
    setName("");
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Save the current setup
        </label>
        <div className="flex gap-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="e.g. Tutorial intro layout"
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Save
          </button>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-zinc-500">
          Captures the board, script, format, and webcam layout so you can
          reuse the same setup for a new topic.
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {templates.length === 0 && (
          <p className="text-xs text-zinc-500">No templates saved yet.</p>
        )}
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-zinc-200">
                {tpl.name}
              </p>
              <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                {tpl.format}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Saved {new Date(tpl.savedAt).toLocaleDateString()}
            </p>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => onLoad(tpl)}
                className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500"
              >
                Load
              </button>
              <button
                type="button"
                onClick={() => onDelete(tpl.id)}
                className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:bg-red-900/40 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
